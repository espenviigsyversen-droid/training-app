"use strict";

const crypto = require("crypto");

const ENCRYPTION_VERSION = 1;
const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const ENCRYPTION_AAD = Buffer.from("treningsapp:openai-key:v1", "utf8");

function encryptionKey(secret) {
  const value = String(secret || "");
  if (value.length < 32) {
    const error = new Error("AI key encryption secret is missing or too short.");
    error.code = "AI_KEY_ENCRYPTION_NOT_CONFIGURED";
    throw error;
  }
  return crypto.createHash("sha256").update(value, "utf8").digest();
}

function encryptOpenAiKey(apiKey, secret) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, encryptionKey(secret), iv);
  cipher.setAAD(ENCRYPTION_AAD);
  const ciphertext = Buffer.concat([cipher.update(String(apiKey), "utf8"), cipher.final()]);
  return {
    version: ENCRYPTION_VERSION,
    algorithm: ENCRYPTION_ALGORITHM,
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64")
  };
}

function decryptOpenAiKey(payload, secret) {
  try {
    if (!payload || Number(payload.version) !== ENCRYPTION_VERSION || payload.algorithm !== ENCRYPTION_ALGORITHM) {
      throw new Error("Unsupported encrypted key format.");
    }
    const decipher = crypto.createDecipheriv(
      ENCRYPTION_ALGORITHM,
      encryptionKey(secret),
      Buffer.from(String(payload.iv || ""), "base64")
    );
    decipher.setAAD(ENCRYPTION_AAD);
    decipher.setAuthTag(Buffer.from(String(payload.authTag || ""), "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(String(payload.ciphertext || ""), "base64")),
      decipher.final()
    ]).toString("utf8");
  } catch (cause) {
    const error = new Error("Stored OpenAI key could not be decrypted.");
    error.code = "AI_KEY_DECRYPT_FAILED";
    error.cause = cause;
    throw error;
  }
}

function maskKey(key) {
  const value = String(key || "").trim();
  if (value.length < 10) return "••••";
  return value.slice(0, 4) + "…" + value.slice(-4);
}

async function validateOpenAiKey(apiKey, fetchImpl = fetch) {
  const response = await fetchImpl("https://api.openai.com/v1/models", {
    method: "GET",
    headers: { authorization: "Bearer " + apiKey }
  });
  if (response.status === 401 || response.status === 403) {
    return { valid: false, code: "INVALID_API_KEY", status: response.status };
  }
  if (!response.ok && response.status !== 429) {
    return { valid: false, code: "PROVIDER_UNAVAILABLE", status: response.status };
  }
  return { valid: true, status: response.status };
}

async function resolveOpenAiKey(db, uid, secret) {
  const ref = db.doc("apiKeys/" + uid);
  const snap = await ref.get();
  if (!snap.exists) return "";
  const data = snap.data() || {};
  if (data.openaiEncrypted) return decryptOpenAiKey(data.openaiEncrypted, secret).trim();

  const legacyKey = String(data.openai || "").trim();
  if (!legacyKey) return "";
  await ref.set({
    openaiEncrypted: encryptOpenAiKey(legacyKey, secret),
    openai: null,
    openaiUpdatedAt: new Date(),
    encryptionMigratedAt: new Date()
  }, { merge: true });
  return legacyKey;
}

async function openAiKeyStatus(db, uid) {
  const snap = await db.doc("users/" + uid + "/settings/openai").get();
  if (!snap.exists || snap.data()?.configured !== true) {
    return { configured: false, maskedKey: "", status: "not_configured", updatedAt: null };
  }
  const data = snap.data() || {};
  return {
    configured: true,
    maskedKey: String(data.maskedKey || "••••"),
    status: String(data.status || "connected"),
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || null,
    lastTestedAt: data.lastTestedAt?.toDate?.()?.toISOString?.() || null
  };
}

async function saveOpenAiKey(db, uid, key, secret, fetchImpl = fetch) {
  const value = String(key || "").trim();
  if (!value) return { ok: false, code: "EMPTY_KEY", message: "Nøkkelen er tom." };
  if (value.length > 512) return { ok: false, code: "INVALID_API_KEY", message: "Nøkkelen er for lang." };

  let validation;
  try {
    validation = await validateOpenAiKey(value, fetchImpl);
  } catch {
    return { ok: false, code: "PROVIDER_UNAVAILABLE", message: "Kunne ikke nå OpenAI for validering." };
  }
  if (!validation.valid) {
    const invalid = validation.code === "INVALID_API_KEY";
    return {
      ok: false,
      code: validation.code,
      message: invalid ? "Nøkkelen ble avvist av OpenAI." : "OpenAI er midlertidig utilgjengelig. Prøv igjen senere."
    };
  }

  const maskedKey = maskKey(value);
  const now = new Date();
  const batch = db.batch();
  batch.set(db.doc("apiKeys/" + uid), {
    openaiEncrypted: encryptOpenAiKey(value, secret),
    openai: null,
    openaiUpdatedAt: now
  }, { merge: true });
  batch.set(db.doc("users/" + uid + "/settings/openai"), {
    configured: true,
    maskedKey,
    status: "connected",
    lastTestedAt: now,
    updatedAt: now
  }, { merge: true });
  await batch.commit();
  return { ok: true, configured: true, maskedKey, status: "connected" };
}

async function deleteOpenAiKey(db, uid) {
  const now = new Date();
  const keyRef = db.doc("apiKeys/" + uid);
  const keySnap = await keyRef.get();
  const nextKeyData = { ...(keySnap.exists ? keySnap.data() : {}) };
  delete nextKeyData.openai;
  delete nextKeyData.openaiEncrypted;
  delete nextKeyData.openaiUpdatedAt;
  delete nextKeyData.encryptionMigratedAt;

  const batch = db.batch();
  if (Object.keys(nextKeyData).length) batch.set(keyRef, nextKeyData);
  else batch.delete(keyRef);
  batch.set(db.doc("users/" + uid + "/settings/openai"), {
    configured: false,
    maskedKey: "",
    status: "not_configured",
    updatedAt: now
  }, { merge: true });
  await batch.commit();
  return { ok: true, configured: false, maskedKey: "", status: "not_configured" };
}

async function testOpenAiKey(db, uid, secret, fetchImpl = fetch) {
  const key = await resolveOpenAiKey(db, uid, secret);
  const statusRef = db.doc("users/" + uid + "/settings/openai");
  if (!key) {
    await statusRef.set({ configured: false, maskedKey: "", status: "not_configured", lastTestedAt: new Date(), updatedAt: new Date() }, { merge: true });
    return { ok: false, configured: false, status: "not_configured", code: "AI_NOT_CONFIGURED", message: "Ingen OpenAI-nøkkel er konfigurert." };
  }
  try {
    const validation = await validateOpenAiKey(key, fetchImpl);
    if (!validation.valid) {
      const status = validation.code === "INVALID_API_KEY" ? "invalid" : "unavailable";
      await statusRef.set({ configured: true, maskedKey: maskKey(key), status, lastTestedAt: new Date(), updatedAt: new Date() }, { merge: true });
      return { ok: false, configured: true, status, code: validation.code, message: validation.code === "INVALID_API_KEY" ? "Nøkkelen ble avvist av OpenAI." : "OpenAI er midlertidig utilgjengelig." };
    }
    await statusRef.set({ configured: true, maskedKey: maskKey(key), status: "connected", lastTestedAt: new Date(), updatedAt: new Date() }, { merge: true });
    return { ok: true, configured: true, maskedKey: maskKey(key), status: "connected" };
  } catch {
    await statusRef.set({ configured: true, maskedKey: maskKey(key), status: "unavailable", lastTestedAt: new Date(), updatedAt: new Date() }, { merge: true });
    return { ok: false, configured: true, status: "unavailable", code: "PROVIDER_UNAVAILABLE", message: "Kunne ikke nå OpenAI." };
  }
}

module.exports = {
  decryptOpenAiKey,
  deleteOpenAiKey,
  encryptOpenAiKey,
  maskKey,
  openAiKeyStatus,
  resolveOpenAiKey,
  saveOpenAiKey,
  testOpenAiKey,
  validateOpenAiKey
};
