"use strict";

const MODEL_PROFILES = Object.freeze([
  Object.freeze({ id: "auto", label: "Automatisk", model: "gpt-5.6-luna", cost: "Lav", description: "Trygt standardvalg for vanlig coach-chat." }),
  Object.freeze({ id: "fast", label: "GPT-5.6 Luna", model: "gpt-5.6-luna", cost: "Lav", description: "Raske og kostnadseffektive svar." }),
  Object.freeze({ id: "balanced", label: "GPT-5.6 Terra", model: "gpt-5.6-terra", cost: "Middels", description: "Mer kapasitet for sammensatte vurderinger." }),
  Object.freeze({ id: "deep", label: "GPT-5.6 Sol", model: "gpt-5.6-sol", cost: "Høy", description: "Grundigst, men tregere og dyrere." }),
  Object.freeze({ id: "legacy_gpt55", label: "GPT-5.5", model: "gpt-5.5", cost: "Middels", description: "Tidligere frontier-modell for sammenligning." })
]);

const REASONING_PROFILES = Object.freeze([
  Object.freeze({ id: "low", label: "Lav", effort: "low", description: "Korte og raske svar." }),
  Object.freeze({ id: "medium", label: "Medium", effort: "medium", description: "Anbefalt for vanlige treningsspørsmål." }),
  Object.freeze({ id: "high", label: "Høy", effort: "high", description: "For mer krevende analyse og planlegging." })
]);

const DEFAULT_PREFERENCES = Object.freeze({ modelProfileId: "auto", reasoningProfileId: "low" });

function findProfile(values, id) {
  return values.find(profile => profile.id === id) || null;
}

function validateAiPreferences(value = {}) {
  const modelProfileId = String(value.modelProfileId || DEFAULT_PREFERENCES.modelProfileId);
  const reasoningProfileId = String(value.reasoningProfileId || DEFAULT_PREFERENCES.reasoningProfileId);
  const modelProfile = findProfile(MODEL_PROFILES, modelProfileId);
  const reasoningProfile = findProfile(REASONING_PROFILES, reasoningProfileId);
  if (!modelProfile || !reasoningProfile) {
    return { ok: false, code: "PREFERENCES_INVALID", message: "Valgt modell eller svarnivå er ikke tilgjengelig." };
  }
  return { ok: true, modelProfileId, reasoningProfileId, modelProfile, reasoningProfile };
}

function resolveAiResponseProfile(value = {}) {
  const validated = validateAiPreferences(value);
  if (!validated.ok) return validated;
  return {
    ok: true,
    modelProfileId: validated.modelProfileId,
    reasoningProfileId: validated.reasoningProfileId,
    model: validated.modelProfile.model,
    modelLabel: validated.modelProfile.label,
    reasoningEffort: validated.reasoningProfile.effort,
    reasoningLabel: validated.reasoningProfile.label,
    costLabel: validated.modelProfile.cost
  };
}

function publicAiProfileCatalog() {
  return {
    models: MODEL_PROFILES.map(({ id, label, cost, description }) => ({ id, label, cost, description })),
    reasoning: REASONING_PROFILES.map(({ id, label, description }) => ({ id, label, description }))
  };
}

module.exports = {
  DEFAULT_PREFERENCES,
  MODEL_PROFILES,
  REASONING_PROFILES,
  publicAiProfileCatalog,
  resolveAiResponseProfile,
  validateAiPreferences
};
