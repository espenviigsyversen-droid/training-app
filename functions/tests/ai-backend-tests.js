"use strict";

const assert = require("assert");
const { handleAiCoachChat, normalizeMessages, safetyIdentifier } = require("../ai/ai-chat");
const { validateAiCoachContext } = require("../ai/context-schema");
const { maskKey, testOpenAiKey, validateOpenAiKey } = require("../ai/keys");
const { extractOutputText, runOpenAiCoach } = require("../ai/openai-provider");
const { buildAiCoachSystemPrompt } = require("../ai/system-prompt");

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => console.log("ok - " + name))
    .catch(error => {
      console.error("not ok - " + name);
      console.error(error.stack || error.message);
      process.exitCode = 1;
    });
}

function validContext() {
  return {
    schemaVersion: 1,
    generatedAt: "2026-07-11T10:00:00.000Z",
    locale: "nb-NO",
    coachDecision: {
      primarySignal: "readiness_red",
      severity: "red",
      recommendation: "Hvil.",
      title: "Restitusjon først",
      summary: "Dagsformen er rød.",
      reasons: [],
      secondarySignals: [],
      blockedActions: ["hard_quality"],
      allowedActions: ["rest"],
      guardrails: ["Ikke anbefal hard trening."]
    },
    today: { date: "2026-07-11", readiness: {}, bodySignal: {}, plannedToday: null, plannedTomorrow: null },
    trainingSummary: { days7: {}, days14: {}, days28: {}, intensityBalance: {}, volumeRamp: {}, comeback: {} },
    profile: {},
    goals: {},
    continuity: { freezeIsTraining: false },
    recentHighlights: {},
    dataQuality: { missing: [], stale: [], assumptions: [] }
  };
}

function response(body, status = 200, headers = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: name => headers[name.toLowerCase()] || null },
    json: async () => body
  };
}

function fakeDb(initial = {}) {
  const store = new Map(Object.entries(initial));
  const ref = path => ({
    path,
    get: async () => ({ exists: store.has(path), data: () => store.get(path) }),
    set: async (value, options = {}) => store.set(path, options.merge ? { ...(store.get(path) || {}), ...value } : value),
    delete: async () => store.delete(path)
  });
  return {
    doc: ref,
    runTransaction: async callback => callback({
      get: async document => ({ exists: store.has(document.path), data: () => store.get(document.path) }),
      set: (document, value, options = {}) => store.set(document.path, options.merge ? { ...(store.get(document.path) || {}), ...value } : value)
    }),
    _store: store
  };
}

(async () => {
  await test("context schema accepts v1 and rejects unknown raw fields", () => {
    assert.strictEqual(validateAiCoachContext(validContext()).valid, true);
    const invalid = { ...validContext(), uid: "must-not-pass" };
    const result = validateAiCoachContext(invalid);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(error => /Unknown context fields/.test(error)));
  });

  await test("system prompt makes coach decision and blocked actions authoritative", () => {
    const prompt = buildAiCoachSystemPrompt();
    assert.match(prompt, /coachDecision er appens autoritative/);
    assert.match(prompt, /aldri overstyre primarySignal, blockedActions eller guardrails/);
    assert.match(prompt, /Ikke gi medisinsk diagnose/);
    assert.match(prompt, /Fryskort.*aldri trening/);
  });

  await test("OpenAI key validation and masking never return the plaintext key", async () => {
    const key = "sk-test-1234567890";
    const result = await validateOpenAiKey(key, async () => response({ data: [] }));
    assert.strictEqual(result.valid, true);
    assert.ok(!maskKey(key).includes("1234567890"));
    const rejected = await validateOpenAiKey(key, async () => response({ error: {} }, 401));
    assert.strictEqual(rejected.code, "INVALID_API_KEY");
  });

  await test("OpenAI connection test persists connected and invalid status", async () => {
    const db = fakeDb({
      "apiKeys/user-1": { openai: "sk-test-1234567890" },
      "users/user-1/settings/openai": { configured: true, maskedKey: "sk-t…7890", status: "connected" }
    });
    const connected = await testOpenAiKey(db, "user-1", async () => response({ data: [] }));
    assert.strictEqual(connected.ok, true);
    assert.strictEqual(db._store.get("users/user-1/settings/openai").status, "connected");
    assert.ok(db._store.get("users/user-1/settings/openai").lastTestedAt instanceof Date);

    const invalid = await testOpenAiKey(db, "user-1", async () => response({ error: {} }, 401));
    assert.strictEqual(invalid.ok, false);
    assert.strictEqual(invalid.status, "invalid");
    assert.strictEqual(db._store.get("users/user-1/settings/openai").status, "invalid");
  });

  await test("provider uses stateless Responses API without tools", async () => {
    let requestBody = null;
    const result = await runOpenAiCoach({
      apiKey: "sk-test",
      context: validContext(),
      messages: [{ role: "user", content: "Bør jeg trene?" }],
      instructions: buildAiCoachSystemPrompt(),
      safetyIdentifier: "safe-hash",
      fetchImpl: async (url, options) => {
        assert.strictEqual(url, "https://api.openai.com/v1/responses");
        requestBody = JSON.parse(options.body);
        return response({ id: "resp_1", output_text: "Kort svar.", usage: { input_tokens: 100, output_tokens: 20, total_tokens: 120 } });
      }
    });
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.answer, "Kort svar.");
    assert.strictEqual(requestBody.store, false);
    assert.strictEqual(requestBody.model, "gpt-5.6-luna");
    assert.deepStrictEqual(requestBody.reasoning, { effort: "low" });
    assert.strictEqual(requestBody.text.verbosity, "low");
    assert.strictEqual(requestBody.safety_identifier, "safe-hash");
    assert.ok(!Object.hasOwn(requestBody, "tools"));
  });

  await test("provider extracts text only from message output items", () => {
    const text = extractOutputText({
      output: [
        { type: "reasoning", content: [{ type: "text", text: "hidden reasoning" }] },
        { type: "message", content: [{ type: "output_text", text: "Visible answer" }] }
      ]
    });
    assert.strictEqual(text, "Visible answer");
  });

  await test("chat history is capped and safety identifier is stable", () => {
    const messages = Array.from({ length: 12 }, (_, index) => ({ role: index % 2 ? "assistant" : "user", content: "message " + index }));
    assert.strictEqual(normalizeMessages(messages).length, 8);
    assert.strictEqual(safetyIdentifier("user-1"), safetyIdentifier("user-1"));
    assert.notStrictEqual(safetyIdentifier("user-1"), safetyIdentifier("user-2"));
    assert.ok(!safetyIdentifier("user-1").includes("user-1"));
  });

  await test("chat handler validates, rate-limits and returns sanitized usage", async () => {
    const db = fakeDb({ "apiKeys/user-1": { openai: "sk-test" } });
    const logs = [];
    const result = await handleAiCoachChat({
      db,
      uid: "user-1",
      data: { context: validContext(), messages: [{ role: "user", content: "Hvorfor hvile?" }] },
      logger: { info: (message, data) => logs.push({ message, data }), warn: () => {} },
      fetchImpl: async () => response({ id: "resp_2", output_text: "Fordi dagsformen er rød.", usage: { input_tokens: 90, output_tokens: 12, total_tokens: 102 } })
    });
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.usage.inputTokens, 90);
    assert.ok(result.requestId);
    assert.strictEqual(logs.length, 1);
    assert.ok(!JSON.stringify(logs).includes("Hvorfor hvile"));
    assert.ok(!JSON.stringify(logs).includes("sk-test"));
  });
})();
