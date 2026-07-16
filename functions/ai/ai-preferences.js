"use strict";

const {
  DEFAULT_PREFERENCES,
  publicAiProfileCatalog,
  resolveAiResponseProfile,
  validateAiPreferences
} = require("./model-profiles");

function preferencesRef(db, uid) {
  return db.doc("aiChatUsers/" + String(uid) + "/settings/responseProfile");
}

async function getAiPreferences(db, uid) {
  const snapshot = await preferencesRef(db, uid).get();
  const stored = snapshot.exists ? snapshot.data() || {} : DEFAULT_PREFERENCES;
  const resolved = resolveAiResponseProfile(stored);
  const preferences = resolved.ok
    ? { modelProfileId: resolved.modelProfileId, reasoningProfileId: resolved.reasoningProfileId }
    : { ...DEFAULT_PREFERENCES };
  return { ok: true, preferences, catalog: publicAiProfileCatalog() };
}

async function saveAiPreferences(db, uid, value = {}) {
  const validated = validateAiPreferences(value);
  if (!validated.ok) return validated;
  const preferences = {
    schemaVersion: 1,
    modelProfileId: validated.modelProfileId,
    reasoningProfileId: validated.reasoningProfileId,
    updatedAt: new Date()
  };
  await preferencesRef(db, uid).set(preferences, { merge: true });
  return {
    ok: true,
    preferences: {
      modelProfileId: preferences.modelProfileId,
      reasoningProfileId: preferences.reasoningProfileId
    },
    catalog: publicAiProfileCatalog()
  };
}

module.exports = { getAiPreferences, preferencesRef, saveAiPreferences };
