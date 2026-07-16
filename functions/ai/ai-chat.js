"use strict";

const crypto = require("crypto");
const { validateAiCoachContext } = require("./context-schema");
const { resolveOpenAiKey } = require("./keys");
const { runOpenAiCoach } = require("./openai-provider");
const { enforceRateLimit } = require("./rate-limit");
const { buildAiCoachSystemPrompt } = require("./system-prompt");
const { getChatScope, persistConversationExchange } = require("./chat-store");

const MAX_HISTORY_MESSAGES = 8;
const MAX_USER_TEXT = 2000;
const MAX_ASSISTANT_TEXT = 5000;

function normalizeMessages(values) {
  return (Array.isArray(values) ? values : [])
    .filter(message => message && ["user", "assistant"].includes(message.role) && typeof message.content === "string")
    .slice(-MAX_HISTORY_MESSAGES)
    .map(message => ({
      role: message.role,
      content: message.content.trim().slice(0, message.role === "user" ? MAX_USER_TEXT : MAX_ASSISTANT_TEXT)
    }))
    .filter(message => message.content);
}

function safetyIdentifier(uid) {
  return crypto.createHash("sha256").update("treningsapp-ai-coach:" + uid).digest("hex");
}

async function handleAiCoachChat(options = {}) {
  const { db, uid, data, logger, encryptionSecret } = options;
  const requestId = crypto.randomUUID();
  const context = data?.context;
  const validation = validateAiCoachContext(context);
  if (!validation.valid) {
    return { ok: false, code: validation.errors.some(error => error.includes("exceeds")) ? "CONTEXT_TOO_LARGE" : "CONTEXT_INVALID", message: "AI-contexten er ugyldig. Oppdater appen og prøv igjen.", requestId };
  }

  const messages = normalizeMessages(data?.messages);
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return { ok: false, code: "REQUEST_INVALID", message: "Siste melding må være et spørsmål fra brukeren.", requestId };
  }

  const chatScope = data?.conversationId
    ? await getChatScope(db, uid, { projectId: data.projectId, conversationId: data.conversationId })
    : { ok: true, projectInstructions: "", conversationSummary: "" };
  if (!chatScope.ok) return { ...chatScope, requestId };

  const apiKey = await resolveOpenAiKey(db, uid, encryptionSecret);
  if (!apiKey) return { ok: false, code: "AI_NOT_CONFIGURED", message: "Legg inn OpenAI-nøkkelen under Setup først.", requestId };

  const rate = await enforceRateLimit(db, uid);
  if (!rate.allowed) {
    return { ok: false, code: rate.code, message: rate.code === "DAILY_BUDGET_REACHED" ? "Dagens AI-grense er nådd. Prøv igjen i morgen." : "Du har sendt flere spørsmål på kort tid. Vent litt og prøv igjen.", retryAfterMs: rate.retryAfterMs, requestId };
  }

  const startedAt = Date.now();
  const result = await runOpenAiCoach({
    apiKey,
    context,
    messages,
    instructions: buildAiCoachSystemPrompt(),
    projectInstructions: chatScope.projectInstructions,
    conversationSummary: chatScope.conversationSummary,
    safetyIdentifier: safetyIdentifier(uid),
    fetchImpl: options.fetchImpl
  });
  const latencyMs = Date.now() - startedAt;
  const usage = result.usage || { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  const logData = {
    requestId,
    ok: Boolean(result.ok),
    code: result.code || "OK",
    latencyMs,
    contextBytes: validation.bytes,
    contextSchemaVersion: context.schemaVersion,
    inputTokens: usage.inputTokens || 0,
    outputTokens: usage.outputTokens || 0,
    model: result.model || "server-configured"
  };
  if (result.ok) logger?.info?.("AI coach request completed", logData);
  else logger?.warn?.("AI coach request failed", logData);

  if (!result.ok) return { ...result, requestId };
  let persisted = null;
  if (data?.conversationId) {
    persisted = await persistConversationExchange(db, uid, {
      projectId: data.projectId,
      conversationId: data.conversationId,
      userContent: messages[messages.length - 1].content,
      assistantContent: result.answer,
      requestId,
      modelLabel: result.model,
      usage
    });
    if (!persisted.ok) return { ...persisted, requestId };
  }
  return {
    ok: true,
    answer: result.answer,
    usage,
    requestId,
    modelLabel: result.model,
    contextSchemaVersion: context.schemaVersion,
    remainingToday: rate.remainingToday,
    conversationId: persisted?.conversationId || null,
    persisted: Boolean(persisted?.ok)
  };
}

module.exports = { MAX_HISTORY_MESSAGES, handleAiCoachChat, normalizeMessages, safetyIdentifier };
