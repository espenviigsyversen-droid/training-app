"use strict";

const MAX_CONTEXT_BYTES = 24 * 1024;
const ALLOWED_TOP_LEVEL = new Set([
  "schemaVersion",
  "generatedAt",
  "locale",
  "coachDecision",
  "today",
  "trainingSummary",
  "profile",
  "goals",
  "continuity",
  "recentHighlights",
  "dataQuality"
]);

function serializedBytes(value) {
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function validateAiCoachContext(value) {
  const errors = [];
  if (!isPlainObject(value)) return { valid: false, errors: ["Context must be an object"], bytes: 0 };

  const unknown = Object.keys(value).filter(key => !ALLOWED_TOP_LEVEL.has(key));
  if (unknown.length) errors.push("Unknown context fields: " + unknown.join(", "));
  if (value.schemaVersion !== 1) errors.push("Unsupported context schema version");
  if (!isPlainObject(value.coachDecision)) errors.push("coachDecision is required");
  if (!isPlainObject(value.today)) errors.push("today is required");
  if (!isPlainObject(value.trainingSummary)) errors.push("trainingSummary is required");

  const decision = isPlainObject(value.coachDecision) ? value.coachDecision : {};
  if (typeof decision.primarySignal !== "string" || !decision.primarySignal.trim()) {
    errors.push("coachDecision.primarySignal is required");
  }
  if (!Array.isArray(decision.blockedActions)) errors.push("coachDecision.blockedActions must be an array");
  if (!Array.isArray(decision.guardrails)) errors.push("coachDecision.guardrails must be an array");
  if (value.continuity?.freezeIsTraining !== false) errors.push("continuity.freezeIsTraining must be false");

  let bytes = 0;
  try {
    bytes = serializedBytes(value);
    if (bytes > MAX_CONTEXT_BYTES) errors.push("Context exceeds " + MAX_CONTEXT_BYTES + " bytes");
  } catch {
    errors.push("Context is not JSON serializable");
  }
  return { valid: errors.length === 0, errors, bytes };
}

module.exports = { ALLOWED_TOP_LEVEL, MAX_CONTEXT_BYTES, serializedBytes, validateAiCoachContext };
