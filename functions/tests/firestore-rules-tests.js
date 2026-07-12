"use strict";

const fs = require("fs");
const path = require("path");
const { assertFails, assertSucceeds, initializeTestEnvironment } = require("@firebase/rules-unit-testing");
const { doc, getDoc, setDoc } = require("firebase/firestore");

async function run() {
  const rules = fs.readFileSync(path.resolve(__dirname, "../../firestore.rules"), "utf8");
  const testEnv = await initializeTestEnvironment({
    projectId: "treningsapp-rules-test",
    firestore: { rules }
  });

  try {
    const ownerDb = testEnv.authenticatedContext("owner-1").firestore();
    const otherDb = testEnv.authenticatedContext("other-1").firestore();
    const anonymousDb = testEnv.unauthenticatedContext().firestore();

    await assertSucceeds(setDoc(doc(ownerDb, "users/owner-1/completed/session-1"), { name: "Rolig tur" }));
    await assertFails(getDoc(doc(otherDb, "users/owner-1/completed/session-1")));
    await assertFails(getDoc(doc(anonymousDb, "users/owner-1/completed/session-1")));

    await testEnv.withSecurityRulesDisabled(async context => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, "users/owner-1/settings/openai"), { status: "connected", maskedKey: "sk-..." });
      await setDoc(doc(adminDb, "aiChatUsers/owner-1/projects/general-training"), { title: "Generell trening", status: "active" });
      await setDoc(doc(adminDb, "aiChatUsers/owner-1/projects/general-training/conversations/conversation-1"), { title: "Dagens økt" });
      await setDoc(doc(adminDb, "aiChatUsers/owner-1/projects/general-training/conversations/conversation-1/messages/message-1"), { role: "assistant", content: "Svar" });
      await setDoc(doc(adminDb, "apiKeys/owner-1"), { openaiEncrypted: { ciphertext: "secret" } });
      await setDoc(doc(adminDb, "aiUsage/owner-1"), { dailyCount: 1 });
    });

    await assertSucceeds(getDoc(doc(ownerDb, "users/owner-1/settings/openai")));
    await assertSucceeds(setDoc(doc(ownerDb, "users/owner-1/settings/openai"), { status: "connected" }));
    await assertFails(getDoc(doc(otherDb, "users/owner-1/settings/openai")));

    await assertSucceeds(getDoc(doc(ownerDb, "aiChatUsers/owner-1/projects/general-training")));
    await assertSucceeds(getDoc(doc(ownerDb, "aiChatUsers/owner-1/projects/general-training/conversations/conversation-1")));
    await assertSucceeds(getDoc(doc(ownerDb, "aiChatUsers/owner-1/projects/general-training/conversations/conversation-1/messages/message-1")));
    await assertFails(setDoc(doc(ownerDb, "aiChatUsers/owner-1/projects/general-training"), { title: "Bypass" }));
    await assertFails(setDoc(doc(ownerDb, "aiChatUsers/owner-1/projects/general-training/conversations/conversation-2"), { title: "Bypass" }));
    await assertFails(setDoc(doc(ownerDb, "aiChatUsers/owner-1/projects/general-training/conversations/conversation-1/messages/message-2"), { role: "user", content: "Bypass" }));
    await assertFails(getDoc(doc(otherDb, "aiChatUsers/owner-1/projects/general-training")));

    // Shared Firebase project regressions: existing family apps keep access.
    await assertSucceeds(setDoc(doc(ownerDb, "households/home/tasks/task-1"), { title: "Oppgave" }));
    await assertSucceeds(setDoc(doc(ownerDb, "families/familie-esyvers/tasks/task-1"), { title: "Oppdrag" }));
    await assertSucceeds(setDoc(doc(ownerDb, "familyCodes/ABC123"), { familyId: "familie-esyvers" }));

    await assertFails(getDoc(doc(ownerDb, "apiKeys/owner-1")));
    await assertFails(getDoc(doc(ownerDb, "aiUsage/owner-1")));
    await assertSucceeds(setDoc(doc(ownerDb, "users/owner-1/unknown/document-1"), { preserved: true }));

    console.log("ok - Firestore Rules preserve owner training access and isolate AI data");
  } finally {
    await testEnv.cleanup();
  }
}

run().catch(error => {
  console.error("not ok - Firestore Rules v155");
  console.error(error.stack || error.message);
  process.exitCode = 1;
});

