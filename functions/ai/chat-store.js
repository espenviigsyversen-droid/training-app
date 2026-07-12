"use strict";

const { DEFAULT_PROJECT_ID, LIMITS, cleanText, requireResourceId } = require("./chat-persistence");

const MAX_LIST_CONVERSATIONS = 40;
const MAX_LOADED_MESSAGES = 100;

function rootPath(uid) {
  return "aiChatUsers/" + requireResourceId(uid, "uid");
}

function projectRef(db, uid, projectId = DEFAULT_PROJECT_ID) {
  return db.doc(rootPath(uid) + "/projects/" + requireResourceId(projectId, "projectId"));
}

function conversationRef(db, uid, projectId, conversationId) {
  return db.doc(projectRef(db, uid, projectId).path + "/conversations/" + requireResourceId(conversationId, "conversationId"));
}

function conversationSummary(snapshot) {
  const data = snapshot.data() || {};
  return {
    id: snapshot.id,
    title: cleanText(data.title, LIMITS.conversationTitle) || "Samtale",
    status: data.status === "archived" ? "archived" : "active",
    messageCount: Math.max(0, Number(data.messageCount) || 0),
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt?.toISOString?.() || null,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || data.updatedAt?.toISOString?.() || null,
    lastMessageAt: data.lastMessageAt?.toDate?.()?.toISOString?.() || data.lastMessageAt?.toISOString?.() || null
  };
}

async function ensureDefaultProject(db, uid) {
  const ref = projectRef(db, uid, DEFAULT_PROJECT_ID);
  const now = new Date();
  const snapshot = await ref.get();
  if (!snapshot.exists) {
    await ref.set({
      schemaVersion: 1,
      title: "Generell trening",
      instructions: "",
      status: "active",
      createdAt: now,
      updatedAt: now,
      lastConversationAt: null
    });
  }
  return ref;
}

async function createConversation(db, uid, value = {}) {
  const projectId = requireResourceId(value.projectId || DEFAULT_PROJECT_ID, "projectId");
  if (projectId !== DEFAULT_PROJECT_ID) throw new Error("project is not available in v156");
  const project = await ensureDefaultProject(db, uid);
  const ref = project.collection("conversations").doc();
  const now = new Date();
  const title = cleanText(value.title, LIMITS.conversationTitle) || "Ny samtale";
  await ref.set({
    schemaVersion: 1,
    title,
    status: "active",
    summary: "",
    messageCount: 0,
    createdAt: now,
    updatedAt: now,
    lastMessageAt: null
  });
  await project.set({ updatedAt: now, lastConversationAt: now }, { merge: true });
  return { ok: true, projectId, conversation: { id: ref.id, title, status: "active", messageCount: 0 } };
}

async function listConversations(db, uid, value = {}) {
  const projectId = requireResourceId(value.projectId || DEFAULT_PROJECT_ID, "projectId");
  if (projectId !== DEFAULT_PROJECT_ID) throw new Error("project is not available in v156");
  const project = await ensureDefaultProject(db, uid);
  const snapshot = await project.collection("conversations")
    .orderBy("updatedAt", "desc")
    .limit(MAX_LIST_CONVERSATIONS)
    .get();
  return { ok: true, projectId, conversations: snapshot.docs.map(conversationSummary) };
}

async function getConversation(db, uid, value = {}) {
  const projectId = requireResourceId(value.projectId || DEFAULT_PROJECT_ID, "projectId");
  const ref = conversationRef(db, uid, projectId, value.conversationId);
  const conversationSnapshot = await ref.get();
  if (!conversationSnapshot.exists) return { ok: false, code: "CONVERSATION_NOT_FOUND", message: "Samtalen finnes ikke lenger." };
  const messageSnapshot = await ref.collection("messages")
    .orderBy("createdAt", "asc")
    .limit(MAX_LOADED_MESSAGES)
    .get();
  const messages = messageSnapshot.docs.map(snapshot => {
    const data = snapshot.data() || {};
    return {
      id: snapshot.id,
      role: data.role === "assistant" ? "assistant" : "user",
      content: cleanText(data.content, LIMITS.messageContent),
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt?.toISOString?.() || null
    };
  }).filter(message => message.content);
  return { ok: true, projectId, conversation: conversationSummary(conversationSnapshot), messages };
}

async function archiveConversation(db, uid, value = {}) {
  const projectId = requireResourceId(value.projectId || DEFAULT_PROJECT_ID, "projectId");
  const ref = conversationRef(db, uid, projectId, value.conversationId);
  const snapshot = await ref.get();
  if (!snapshot.exists) return { ok: false, code: "CONVERSATION_NOT_FOUND", message: "Samtalen finnes ikke lenger." };
  const archived = value.archived !== false;
  await ref.set({ status: archived ? "archived" : "active", updatedAt: new Date() }, { merge: true });
  return { ok: true, conversationId: ref.id, status: archived ? "archived" : "active" };
}

async function deleteConversation(db, uid, value = {}) {
  if (value.confirmed !== true) return { ok: false, code: "CONFIRMATION_REQUIRED", message: "Bekreft sletting av samtalen." };
  const projectId = requireResourceId(value.projectId || DEFAULT_PROJECT_ID, "projectId");
  const ref = conversationRef(db, uid, projectId, value.conversationId);
  const snapshot = await ref.get();
  if (!snapshot.exists) return { ok: true, conversationId: ref.id, alreadyDeleted: true };
  await db.recursiveDelete(ref);
  return { ok: true, conversationId: ref.id };
}

async function persistConversationExchange(db, uid, value = {}) {
  const projectId = requireResourceId(value.projectId || DEFAULT_PROJECT_ID, "projectId");
  const ref = conversationRef(db, uid, projectId, value.conversationId);
  const snapshot = await ref.get();
  if (!snapshot.exists || snapshot.data()?.status === "archived") {
    return { ok: false, code: "CONVERSATION_NOT_AVAILABLE", message: "Samtalen kan ikke oppdateres." };
  }
  const userText = cleanText(value.userContent, LIMITS.messageContent);
  const assistantText = cleanText(value.assistantContent, LIMITS.messageContent);
  if (!userText || !assistantText) throw new Error("conversation exchange is incomplete");
  const messages = ref.collection("messages");
  const userRef = messages.doc();
  const assistantRef = messages.doc();
  const now = new Date();
  const previousCount = Math.max(0, Number(snapshot.data()?.messageCount) || 0);
  const batch = db.batch();
  batch.set(userRef, { schemaVersion: 1, role: "user", content: userText, createdAt: now, requestId: cleanText(value.requestId, 96) });
  batch.set(assistantRef, {
    schemaVersion: 1,
    role: "assistant",
    content: assistantText,
    createdAt: now,
    requestId: cleanText(value.requestId, 96),
    modelLabel: cleanText(value.modelLabel, 80),
    usage: {
      inputTokens: Math.max(0, Number(value.usage?.inputTokens) || 0),
      outputTokens: Math.max(0, Number(value.usage?.outputTokens) || 0),
      totalTokens: Math.max(0, Number(value.usage?.totalTokens) || 0)
    }
  });
  batch.set(ref, { messageCount: previousCount + 2, updatedAt: now, lastMessageAt: now }, { merge: true });
  batch.set(projectRef(db, uid, projectId), { updatedAt: now, lastConversationAt: now }, { merge: true });
  await batch.commit();
  return { ok: true, conversationId: ref.id, messageCount: previousCount + 2 };
}

module.exports = {
  MAX_LIST_CONVERSATIONS,
  MAX_LOADED_MESSAGES,
  archiveConversation,
  conversationRef,
  createConversation,
  deleteConversation,
  ensureDefaultProject,
  getConversation,
  listConversations,
  persistConversationExchange,
  projectRef,
  rootPath
};

