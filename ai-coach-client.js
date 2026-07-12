import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js';

function normalizeCallableError(error) {
  const details = error?.details && typeof error.details === 'object' ? error.details : {};
  const rawCode = String(details.code || error?.code || 'INTERNAL_ERROR');
  const code = rawCode.includes('/') ? rawCode.split('/').pop().toUpperCase().replaceAll('-', '_') : rawCode;
  return {
    ok: false,
    code,
    message: String(details.message || error?.message || 'Kunne ikke kontakte AI-tjenesten.'),
    retryAfterMs: Number(details.retryAfterMs) || null
  };
}

export function createAiCoachClient(firebaseApp, options = {}) {
  const region = String(options.region || 'europe-west1');
  const functions = getFunctions(firebaseApp, region);
  const callable = name => httpsCallable(functions, name, { timeout: 70000 });
  const endpoints = {
    status: callable('aiCoachStatus'),
    saveKey: callable('aiCoachSaveOpenAiKey'),
    testKey: callable('aiCoachTestOpenAiKey'),
    deleteKey: callable('aiCoachDeleteOpenAiKey'),
    chat: callable('aiCoachChat'),
    listConversations: callable('aiChatListConversations'),
    getConversation: callable('aiChatGetConversation'),
    createConversation: callable('aiChatCreateConversation'),
    archiveConversation: callable('aiChatArchiveConversation'),
    deleteConversation: callable('aiChatDeleteConversation')
  };

  async function call(endpoint, payload = {}) {
    try {
      const result = await endpoints[endpoint](payload);
      return result?.data && typeof result.data === 'object'
        ? result.data
        : { ok: false, code: 'INVALID_RESPONSE', message: 'AI-tjenesten ga et ugyldig svar.' };
    } catch (error) {
      return normalizeCallableError(error);
    }
  }

  return {
    status: () => call('status'),
    saveKey: key => call('saveKey', { key }),
    testKey: () => call('testKey'),
    deleteKey: () => call('deleteKey'),
    chat: payload => call('chat', payload),
    listConversations: projectId => call('listConversations', { projectId }),
    getConversation: (projectId, conversationId) => call('getConversation', { projectId, conversationId }),
    createConversation: (projectId, title) => call('createConversation', { projectId, title }),
    archiveConversation: (projectId, conversationId, archived = true) => call('archiveConversation', { projectId, conversationId, archived }),
    deleteConversation: (projectId, conversationId) => call('deleteConversation', { projectId, conversationId, confirmed: true })
  };
}

