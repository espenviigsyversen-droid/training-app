"use strict";

const CHAT_SCHEMA_VERSION = 1;
const DEFAULT_PROJECT_ID = "general-training";
const ID_PATTERN = /^[A-Za-z0-9_-]{1,96}$/;
const PROJECT_STATUSES = new Set(["active", "archived"]);
const CONVERSATION_STATUSES = new Set(["active", "archived"]);
const MESSAGE_ROLES = new Set(["user", "assistant"]);
const LIMITS = Object.freeze({
  projectTitle: 80,
  projectInstructions: 2000,
  conversationTitle: 120,
  conversationSummary: 4000,
  messageContent: 6000,
  recentMessagesForModel: 10,
  archiveRetentionDays: 365,
  deleteBatchSize: 200
});

function cleanText(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function requireResourceId(value, fieldName) {
  const id = cleanText(value, 96);
  if (!ID_PATTERN.test(id)) throw new Error((fieldName || "id") + " is invalid");
  return id;
}

function normalizeStatus(value, allowed, fallback = "active") {
  return allowed.has(value) ? value : fallback;
}

function normalizeProjectInput(value = {}) {
  const title = cleanText(value.title, LIMITS.projectTitle);
  if (!title) throw new Error("project title is required");
  return {
    schemaVersion: CHAT_SCHEMA_VERSION,
    title,
    instructions: cleanText(value.instructions, LIMITS.projectInstructions),
    status: normalizeStatus(value.status, PROJECT_STATUSES)
  };
}

function normalizeConversationInput(value = {}) {
  return {
    schemaVersion: CHAT_SCHEMA_VERSION,
    title: cleanText(value.title, LIMITS.conversationTitle) || "Ny samtale",
    status: normalizeStatus(value.status, CONVERSATION_STATUSES)
  };
}

function normalizeMessageInput(value = {}) {
  const role = MESSAGE_ROLES.has(value.role) ? value.role : "";
  const content = cleanText(value.content, LIMITS.messageContent);
  if (!role) throw new Error("message role is invalid");
  if (!content) throw new Error("message content is required");
  return { schemaVersion: CHAT_SCHEMA_VERSION, role, content };
}

function validateConversationRequest(value = {}) {
  return {
    projectId: requireResourceId(value.projectId || DEFAULT_PROJECT_ID, "projectId"),
    conversationId: value.conversationId ? requireResourceId(value.conversationId, "conversationId") : null,
    conversation: normalizeConversationInput(value.conversation || {})
  };
}

function validateDeleteRequest(value = {}) {
  const resource = value.resource === "project" ? "project" : value.resource === "conversation" ? "conversation" : "";
  if (!resource) throw new Error("delete resource is invalid");
  return {
    resource,
    projectId: requireResourceId(value.projectId, "projectId"),
    conversationId: resource === "conversation" ? requireResourceId(value.conversationId, "conversationId") : null,
    confirmed: value.confirmed === true
  };
}

function chatPersistencePolicy() {
  return {
    schemaVersion: CHAT_SCHEMA_VERSION,
    defaultProjectId: DEFAULT_PROJECT_ID,
    clientWritesAllowed: false,
    trainingBackupIncludesChat: false,
    archivedRetentionDays: LIMITS.archiveRetentionDays,
    deleteMode: "recursive-backend-only",
    modelContext: {
      fullHistory: false,
      recentMessages: LIMITS.recentMessagesForModel,
      summaryRequiredAfterWindow: true
    }
  };
}

module.exports = {
  CHAT_SCHEMA_VERSION,
  DEFAULT_PROJECT_ID,
  ID_PATTERN,
  LIMITS,
  chatPersistencePolicy,
  cleanText,
  normalizeConversationInput,
  normalizeMessageInput,
  normalizeProjectInput,
  requireResourceId,
  validateConversationRequest,
  validateDeleteRequest
};

