"use strict";

const { DEFAULT_PROJECT_ID, LIMITS, cleanText, normalizeProjectInput, requireResourceId } = require("./chat-persistence");

const MAX_LIST_PROJECTS = 30;
const MAX_LIST_CONVERSATIONS = 40;
const MAX_LOADED_MESSAGES = 100;
const MAX_MESSAGE_SOURCES = 8;

function normalizeMessageSources(values) {
  const seen = new Set();
  return (Array.isArray(values) ? values : []).flatMap(value => {
    try {
      const url = new URL(String(value?.url || ""));
      if (!["http:", "https:"].includes(url.protocol) || seen.has(url.href)) return [];
      seen.add(url.href);
      return [{ url: url.href.slice(0, 1600), title: cleanText(value?.title, 180) || url.hostname }];
    } catch {
      return [];
    }
  }).slice(0, MAX_MESSAGE_SOURCES);
}

function normalizeMessageCitations(values) {
  return (Array.isArray(values) ? values : []).flatMap(value => {
    const source = normalizeMessageSources([value])[0];
    if (!source) return [];
    return [{
      ...source,
      startIndex: Math.max(0, Number(value?.startIndex) || 0),
      endIndex: Math.max(0, Number(value?.endIndex) || 0)
    }];
  }).slice(0, MAX_MESSAGE_SOURCES);
}

function rootPath(uid) {
  return "aiChatUsers/" + requireResourceId(uid, "uid");
}

function rootRef(db, uid) {
  return db.doc(rootPath(uid));
}

function projectRef(db, uid, projectId = DEFAULT_PROJECT_ID) {
  return db.doc(rootPath(uid) + "/projects/" + requireResourceId(projectId, "projectId"));
}

function conversationRef(db, uid, projectId, conversationId) {
  return db.doc(projectRef(db, uid, projectId).path + "/conversations/" + requireResourceId(conversationId, "conversationId"));
}

function isoDate(value) {
  return value?.toDate?.()?.toISOString?.() || value?.toISOString?.() || null;
}

function projectSummary(snapshot) {
  const data = snapshot.data() || {};
  return {
    id: snapshot.id,
    title: cleanText(data.title, LIMITS.projectTitle) || "Prosjekt",
    instructions: cleanText(data.instructions, LIMITS.projectInstructions),
    status: data.status === "archived" ? "archived" : "active",
    summaryEnabled: data.summaryEnabled !== false,
    totalTokens: Math.max(0, Number(data.totalTokens) || 0),
    createdAt: isoDate(data.createdAt),
    updatedAt: isoDate(data.updatedAt),
    lastConversationAt: isoDate(data.lastConversationAt)
  };
}

function conversationSummary(snapshot) {
  const data = snapshot.data() || {};
  return {
    id: snapshot.id,
    title: cleanText(data.title, LIMITS.conversationTitle) || "Samtale",
    status: data.status === "archived" ? "archived" : "active",
    messageCount: Math.max(0, Number(data.messageCount) || 0),
    totalTokens: Math.max(0, Number(data.totalTokens) || 0),
    hasSummary: Boolean(cleanText(data.summary, LIMITS.conversationSummary)),
    createdAt: isoDate(data.createdAt),
    updatedAt: isoDate(data.updatedAt),
    lastMessageAt: isoDate(data.lastMessageAt)
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
      summaryEnabled: true,
      totalTokens: 0,
      createdAt: now,
      updatedAt: now,
      lastConversationAt: null
    });
  }
  return ref;
}

async function requireProject(db, uid, projectId, options = {}) {
  if (projectId === DEFAULT_PROJECT_ID) await ensureDefaultProject(db, uid);
  const ref = projectRef(db, uid, projectId);
  const snapshot = await ref.get();
  if (!snapshot.exists || (!options.allowArchived && snapshot.data()?.status === "archived")) {
    return { ok: false, ref, snapshot, code: "PROJECT_NOT_AVAILABLE", message: "Prosjektet finnes ikke eller er arkivert." };
  }
  return { ok: true, ref, snapshot };
}

async function listProjects(db, uid) {
  await ensureDefaultProject(db, uid);
  const snapshot = await rootRef(db, uid).collection("projects")
    .orderBy("updatedAt", "desc")
    .limit(MAX_LIST_PROJECTS)
    .get();
  return { ok: true, defaultProjectId: DEFAULT_PROJECT_ID, projects: snapshot.docs.map(projectSummary) };
}

async function createProject(db, uid, value = {}) {
  const normalized = normalizeProjectInput(value);
  const ref = rootRef(db, uid).collection("projects").doc();
  const now = new Date();
  const data = {
    ...normalized,
    status: "active",
    summaryEnabled: value.summaryEnabled !== false,
    totalTokens: 0,
    createdAt: now,
    updatedAt: now,
    lastConversationAt: null
  };
  await ref.set(data);
  return { ok: true, project: projectSummary({ id: ref.id, data: () => data }) };
}

async function updateProject(db, uid, value = {}) {
  const projectId = requireResourceId(value.projectId || DEFAULT_PROJECT_ID, "projectId");
  const existing = await requireProject(db, uid, projectId, { allowArchived: true });
  if (!existing.ok) return existing;
  const normalized = normalizeProjectInput({
    title: value.title || existing.snapshot.data()?.title,
    instructions: value.instructions,
    status: existing.snapshot.data()?.status
  });
  const update = {
    title: normalized.title,
    instructions: normalized.instructions,
    summaryEnabled: value.summaryEnabled !== false,
    updatedAt: new Date()
  };
  await existing.ref.set(update, { merge: true });
  return { ok: true, projectId, project: { ...projectSummary(existing.snapshot), ...update, updatedAt: update.updatedAt.toISOString() } };
}

async function archiveProject(db, uid, value = {}) {
  const projectId = requireResourceId(value.projectId, "projectId");
  if (projectId === DEFAULT_PROJECT_ID) return { ok: false, code: "DEFAULT_PROJECT_REQUIRED", message: "Standardprosjektet kan ikke arkiveres." };
  const existing = await requireProject(db, uid, projectId, { allowArchived: true });
  if (!existing.ok) return existing;
  const archived = value.archived !== false;
  await existing.ref.set({ status: archived ? "archived" : "active", updatedAt: new Date() }, { merge: true });
  return { ok: true, projectId, status: archived ? "archived" : "active" };
}

async function deleteProject(db, uid, value = {}) {
  if (value.confirmed !== true) return { ok: false, code: "CONFIRMATION_REQUIRED", message: "Bekreft sletting av prosjektet." };
  const projectId = requireResourceId(value.projectId, "projectId");
  if (projectId === DEFAULT_PROJECT_ID) return { ok: false, code: "DEFAULT_PROJECT_REQUIRED", message: "Standardprosjektet kan ikke slettes." };
  const ref = projectRef(db, uid, projectId);
  const snapshot = await ref.get();
  if (!snapshot.exists) return { ok: true, projectId, alreadyDeleted: true };
  await db.recursiveDelete(ref);
  return { ok: true, projectId };
}

async function createConversation(db, uid, value = {}) {
  const projectId = requireResourceId(value.projectId || DEFAULT_PROJECT_ID, "projectId");
  const project = await requireProject(db, uid, projectId);
  if (!project.ok) return project;
  const ref = project.ref.collection("conversations").doc();
  const now = new Date();
  const title = cleanText(value.title, LIMITS.conversationTitle) || "Ny samtale";
  const data = { schemaVersion: 1, title, status: "active", summary: "", messageCount: 0, totalTokens: 0, createdAt: now, updatedAt: now, lastMessageAt: null };
  await ref.set(data);
  await project.ref.set({ updatedAt: now, lastConversationAt: now }, { merge: true });
  return { ok: true, projectId, conversation: conversationSummary({ id: ref.id, data: () => data }) };
}

async function listConversations(db, uid, value = {}) {
  const projectId = requireResourceId(value.projectId || DEFAULT_PROJECT_ID, "projectId");
  const project = await requireProject(db, uid, projectId, { allowArchived: true });
  if (!project.ok) return project;
  const snapshot = await project.ref.collection("conversations").orderBy("updatedAt", "desc").limit(MAX_LIST_CONVERSATIONS).get();
  return { ok: true, projectId, conversations: snapshot.docs.map(conversationSummary) };
}

async function getConversation(db, uid, value = {}) {
  const projectId = requireResourceId(value.projectId || DEFAULT_PROJECT_ID, "projectId");
  const ref = conversationRef(db, uid, projectId, value.conversationId);
  const conversationSnapshot = await ref.get();
  if (!conversationSnapshot.exists) return { ok: false, code: "CONVERSATION_NOT_FOUND", message: "Samtalen finnes ikke lenger." };
  const messageSnapshot = await ref.collection("messages").orderBy("createdAt", "asc").limit(MAX_LOADED_MESSAGES).get();
  const messages = messageSnapshot.docs.map(snapshot => {
    const data = snapshot.data() || {};
    return {
      id: snapshot.id,
      role: data.role === "assistant" ? "assistant" : "user",
      content: cleanText(data.content, LIMITS.messageContent),
      webUsed: data.webUsed === true,
      citations: normalizeMessageCitations(data.citations),
      sources: normalizeMessageSources(data.sources),
      createdAt: isoDate(data.createdAt)
    };
  }).filter(message => message.content);
  const data = conversationSnapshot.data() || {};
  return { ok: true, projectId, conversation: conversationSummary(conversationSnapshot), messages, summary: cleanText(data.summary, LIMITS.conversationSummary) };
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

function buildRollingSummary(previous, userContent, assistantContent) {
  const previousText = cleanText(previous, LIMITS.conversationSummary);
  const exchange = `Bruker: ${cleanText(userContent, 700)}\nCoach: ${cleanText(assistantContent, 1100)}`;
  const combined = [previousText, exchange].filter(Boolean).join("\n\n");
  return combined.length <= LIMITS.conversationSummary ? combined : combined.slice(-LIMITS.conversationSummary);
}

async function getChatScope(db, uid, value = {}) {
  const projectId = requireResourceId(value.projectId || DEFAULT_PROJECT_ID, "projectId");
  const project = await requireProject(db, uid, projectId);
  if (!project.ok) return project;
  const conversationId = requireResourceId(value.conversationId, "conversationId");
  const conversation = await conversationRef(db, uid, projectId, conversationId).get();
  if (!conversation.exists || conversation.data()?.status === "archived") return { ok: false, code: "CONVERSATION_NOT_AVAILABLE", message: "Samtalen kan ikke oppdateres." };
  return {
    ok: true,
    projectId,
    projectInstructions: cleanText(project.snapshot.data()?.instructions, LIMITS.projectInstructions),
    conversationSummary: project.snapshot.data()?.summaryEnabled === false ? "" : cleanText(conversation.data()?.summary, LIMITS.conversationSummary)
  };
}

async function clearConversationSummary(db, uid, value = {}) {
  const projectId = requireResourceId(value.projectId || DEFAULT_PROJECT_ID, "projectId");
  const ref = conversationRef(db, uid, projectId, value.conversationId);
  const snapshot = await ref.get();
  if (!snapshot.exists) return { ok: false, code: "CONVERSATION_NOT_FOUND", message: "Samtalen finnes ikke lenger." };
  await ref.set({ summary: "", updatedAt: new Date() }, { merge: true });
  return { ok: true, projectId, conversationId: ref.id };
}

async function persistConversationExchange(db, uid, value = {}) {
  const projectId = requireResourceId(value.projectId || DEFAULT_PROJECT_ID, "projectId");
  const ref = conversationRef(db, uid, projectId, value.conversationId);
  const snapshot = await ref.get();
  const project = await projectRef(db, uid, projectId).get();
  if (!snapshot.exists || snapshot.data()?.status === "archived" || !project.exists) return { ok: false, code: "CONVERSATION_NOT_AVAILABLE", message: "Samtalen kan ikke oppdateres." };
  const userText = cleanText(value.userContent, LIMITS.messageContent);
  const assistantText = cleanText(value.assistantContent, LIMITS.messageContent);
  if (!userText || !assistantText) throw new Error("conversation exchange is incomplete");
  const messages = ref.collection("messages");
  const userRef = messages.doc();
  const assistantRef = messages.doc();
  const now = new Date();
  const previousCount = Math.max(0, Number(snapshot.data()?.messageCount) || 0);
  const usage = {
    inputTokens: Math.max(0, Number(value.usage?.inputTokens) || 0),
    outputTokens: Math.max(0, Number(value.usage?.outputTokens) || 0),
    totalTokens: Math.max(0, Number(value.usage?.totalTokens) || 0)
  };
  const summary = project.data()?.summaryEnabled === false ? "" : buildRollingSummary(snapshot.data()?.summary, userText, assistantText);
  const batch = db.batch();
  batch.set(userRef, { schemaVersion: 1, role: "user", content: userText, createdAt: now, requestId: cleanText(value.requestId, 96) });
  batch.set(assistantRef, {
    schemaVersion: 2,
    role: "assistant",
    content: assistantText,
    webUsed: value.webUsed === true,
    citations: normalizeMessageCitations(value.citations),
    sources: normalizeMessageSources(value.sources),
    createdAt: now,
    requestId: cleanText(value.requestId, 96),
    modelLabel: cleanText(value.modelLabel, 80),
    usage
  });
  batch.set(ref, { summary, messageCount: previousCount + 2, totalTokens: Math.max(0, Number(snapshot.data()?.totalTokens) || 0) + usage.totalTokens, updatedAt: now, lastMessageAt: now }, { merge: true });
  batch.set(projectRef(db, uid, projectId), { totalTokens: Math.max(0, Number(project.data()?.totalTokens) || 0) + usage.totalTokens, updatedAt: now, lastConversationAt: now }, { merge: true });
  await batch.commit();
  return { ok: true, conversationId: ref.id, messageCount: previousCount + 2, summaryUpdated: Boolean(summary) };
}

async function exportChatData(db, uid) {
  const projectResult = await listProjects(db, uid);
  const projects = [];
  for (const project of projectResult.projects) {
    const conversationsResult = await listConversations(db, uid, { projectId: project.id });
    const conversations = [];
    for (const conversation of conversationsResult.conversations) {
      const detail = await getConversation(db, uid, { projectId: project.id, conversationId: conversation.id });
      conversations.push({ ...conversation, summary: detail.summary || "", messages: detail.messages || [] });
    }
    projects.push({ ...project, conversations });
  }
  return { ok: true, export: { schemaVersion: 1, exportedAt: new Date().toISOString(), projects } };
}

async function deleteAllChatData(db, uid, value = {}) {
  if (value.confirmed !== true) return { ok: false, code: "CONFIRMATION_REQUIRED", message: "Bekreft sletting av alle chatdata." };
  await db.recursiveDelete(rootRef(db, uid));
  return { ok: true };
}

module.exports = {
  MAX_LIST_CONVERSATIONS, MAX_LIST_PROJECTS, MAX_LOADED_MESSAGES,
  archiveConversation, archiveProject, buildRollingSummary, clearConversationSummary,
  conversationRef, createConversation, createProject, deleteAllChatData, deleteConversation,
  deleteProject, ensureDefaultProject, exportChatData, getChatScope, getConversation,
  listConversations, listProjects, normalizeMessageCitations, normalizeMessageSources,
  persistConversationExchange, projectRef, rootPath,
  rootRef, updateProject
};
