"use strict";

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

async function resolveOpenAiKey(db, uid) {
  const snap = await db.doc("apiKeys/" + uid).get();
  return snap.exists ? String(snap.data()?.openai || "").trim() : "";
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

async function saveOpenAiKey(db, uid, key, fetchImpl = fetch) {
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
  batch.set(db.doc("apiKeys/" + uid), { openai: value, openaiUpdatedAt: now }, { merge: true });
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
  delete nextKeyData.openaiUpdatedAt;

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

async function testOpenAiKey(db, uid, fetchImpl = fetch) {
  const key = await resolveOpenAiKey(db, uid);
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
  deleteOpenAiKey,
  maskKey,
  openAiKeyStatus,
  resolveOpenAiKey,
  saveOpenAiKey,
  testOpenAiKey,
  validateOpenAiKey
};
