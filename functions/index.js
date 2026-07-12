"use strict";

const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const { handleAiCoachChat } = require("./ai/ai-chat");
const {
  deleteOpenAiKey,
  openAiKeyStatus,
  saveOpenAiKey,
  testOpenAiKey
} = require("./ai/keys");

initializeApp();
const db = getFirestore();
const aiKeyEncryptionSecret = defineSecret("AI_KEY_ENCRYPTION_SECRET");
const CALL_OPTIONS = {
  region: "europe-west1",
  timeoutSeconds: 70,
  memory: "256MiB",
  enforceAppCheck: false
};
const SECRET_CALL_OPTIONS = {
  ...CALL_OPTIONS,
  secrets: [aiKeyEncryptionSecret]
};

function requireUid(request) {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Logg inn for å bruke AI-coachen.", { code: "AUTH_REQUIRED" });
  return uid;
}

function internalFailure(error, operation) {
  logger.error("AI coach backend failure", {
    operation,
    name: error?.name || "Error",
    code: error?.code || "INTERNAL_ERROR"
  });
  throw new HttpsError("internal", "AI-tjenesten kunne ikke fullføre forespørselen. Ingen appdata ble endret.", {
    code: "INTERNAL_ERROR",
    message: "AI-backend fikk en intern feil. Prøv igjen etter at backend er kontrollert."
  });
}

exports.aiCoachStatus = onCall(CALL_OPTIONS, async request => {
  const uid = requireUid(request);
  try {
    return { ok: true, ...(await openAiKeyStatus(db, uid)) };
  } catch (error) {
    return internalFailure(error, "status");
  }
});

exports.aiCoachSaveOpenAiKey = onCall(SECRET_CALL_OPTIONS, async request => {
  const uid = requireUid(request);
  try {
    return await saveOpenAiKey(db, uid, request.data?.key, aiKeyEncryptionSecret.value());
  } catch (error) {
    return internalFailure(error, "save_key");
  }
});

exports.aiCoachTestOpenAiKey = onCall(SECRET_CALL_OPTIONS, async request => {
  const uid = requireUid(request);
  try {
    return await testOpenAiKey(db, uid, aiKeyEncryptionSecret.value());
  } catch (error) {
    return internalFailure(error, "test_key");
  }
});

exports.aiCoachDeleteOpenAiKey = onCall(CALL_OPTIONS, async request => {
  const uid = requireUid(request);
  try {
    return await deleteOpenAiKey(db, uid);
  } catch (error) {
    return internalFailure(error, "delete_key");
  }
});

exports.aiCoachChat = onCall(SECRET_CALL_OPTIONS, async request => {
  const uid = requireUid(request);
  try {
    return await handleAiCoachChat({
      db,
      uid,
      data: request.data || {},
      logger,
      encryptionSecret: aiKeyEncryptionSecret.value()
    });
  } catch (error) {
    return internalFailure(error, "chat");
  }
});
