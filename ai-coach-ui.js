const CONSENT_KEY = 'treningsapp:ai-coach-consent:v1';
const MAX_HISTORY_MESSAGES = 8;

const SUGGESTIONS = [
  'Hvorfor anbefaler appen dette i dag?',
  'Bør jeg gjennomføre den planlagte økten?',
  'Hva bør være mitt viktigste fokus denne uken?',
  'Hvordan bør jeg tolke de siste kroppssignalene?'
];

function byId(id) {
  return document.getElementById(id);
}

function setText(id, value) {
  const element = byId(id);
  if (element) element.textContent = String(value || '');
}

function createMessageElement(message) {
  const article = document.createElement('article');
  article.className = `ai-coach-message ${message.role === 'assistant' ? 'assistant' : 'user'}`;
  const role = document.createElement('span');
  role.className = 'ai-coach-message-role';
  role.textContent = message.role === 'assistant' ? 'AI-coach' : 'Du';
  const text = document.createElement('p');
  text.textContent = message.content;
  article.append(role, text);
  return article;
}

function contextCategoryLabels(context = {}) {
  const labels = ['Dagens coach-beslutning'];
  if (context.today?.readiness?.light) labels.push('Dagsform');
  if (context.today?.bodySignal?.active) labels.push('Kroppssignal');
  if (context.today?.plannedToday || context.today?.plannedTomorrow) labels.push('Planlagte økter');
  if (context.trainingSummary) labels.push('Trening 7/14/28 dager');
  if (context.profile?.primaryFocus) labels.push('Treningsprofil');
  if (context.goals?.active) labels.push('Mål');
  if (context.continuity) labels.push('Kontinuitet');
  if (context.recentHighlights?.latestWorkout || context.recentHighlights?.latestPb) labels.push('Siste økt/høydepunkt');
  return labels;
}

export function createAiCoachUi(options = {}) {
  const client = options.client;
  const buildContext = options.buildContext;
  const navigate = options.navigate;
  const openSettings = options.openSettings;
  let messages = [];
  let configured = false;
  let backendAvailable = true;
  let connectionStatus = 'checking';
  let loading = false;
  let usage = { inputTokens: 0, outputTokens: 0, requests: 0 };
  let lastContextLabels = [];

  function renderMessages() {
    const list = byId('aiCoachMessages');
    if (!list) return;
    list.replaceChildren();
    if (!messages.length) {
      const empty = document.createElement('div');
      empty.className = 'ai-coach-empty';
      empty.textContent = 'Still et spørsmål om dagens råd, plan, belastning eller mål.';
      list.append(empty);
    } else {
      messages.forEach(message => list.append(createMessageElement(message)));
    }
    list.scrollTop = list.scrollHeight;
  }

  function renderSuggestions() {
    const container = byId('aiCoachSuggestions');
    if (!container) return;
    container.replaceChildren();
    SUGGESTIONS.forEach(suggestion => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'ai-coach-suggestion';
      button.textContent = suggestion;
      button.addEventListener('click', () => {
        const input = byId('aiCoachInput');
        if (input) {
          input.value = suggestion;
          input.focus();
        }
      });
      container.append(button);
    });
  }

  function connectionPresentation() {
    if (!backendAvailable) return { label: 'AI-backend utilgjengelig', badge: 'Utilgjengelig', tone: 'error' };
    if (!configured) return { label: 'OpenAI ikke konfigurert', badge: 'Ikke tilkoblet', tone: 'offline' };
    if (connectionStatus === 'connected') return { label: 'OpenAI tilkoblet', badge: 'Tilkoblet', tone: 'connected' };
    if (connectionStatus === 'invalid') return { label: 'OpenAI-nøkkelen må oppdateres', badge: 'Nøkkel avvist', tone: 'error' };
    if (connectionStatus === 'unavailable') return { label: 'OpenAI midlertidig utilgjengelig', badge: 'Utilgjengelig', tone: 'warning' };
    if (connectionStatus === 'checking') return { label: 'Sjekker OpenAI ...', badge: 'Sjekker', tone: 'checking' };
    return { label: 'OpenAI konfigurert', badge: 'Konfigurert', tone: 'offline' };
  }

  function renderStatus() {
    const status = byId('aiCoachConnectionStatus');
    const setupTag = byId('aiCoachSetupConnectionTag');
    const composer = byId('aiCoachComposer');
    const missing = byId('aiCoachMissingKey');
    const presentation = connectionPresentation();
    if (status) {
      status.className = `ai-coach-status ${presentation.tone}`;
      status.textContent = presentation.label;
    }
    if (setupTag) {
      setupTag.className = `api-connection-badge ${presentation.tone}`;
      setupTag.textContent = presentation.badge;
    }
    composer?.classList.toggle('hidden', !configured);
    missing?.classList.toggle('hidden', configured || !backendAvailable);
  }

  function renderUsage() {
    setText('aiCoachUsage', usage.requests
      ? `${usage.requests} svar · ${usage.inputTokens + usage.outputTokens} tokens i denne appøkten`
      : 'Ingen AI-kall i denne appøkten.');
    setText('aiCoachContextUsed', lastContextLabels.join(' · '));
  }

  function setLoading(value) {
    loading = value;
    const send = byId('aiCoachSendBtn');
    const input = byId('aiCoachInput');
    if (send) {
      send.disabled = value;
      send.textContent = value ? 'Tenker ...' : 'Send';
    }
    if (input) input.disabled = value;
  }

  function ensureConsent() {
    if (localStorage.getItem(CONSENT_KEY) === 'accepted') return true;
    const accepted = window.confirm('AI-coachen sender en minimert treningskontekst til OpenAI for å svare. API-nøkkel, e-post, UID, backup og full historikk sendes ikke. Fortsette?');
    if (accepted) localStorage.setItem(CONSENT_KEY, 'accepted');
    return accepted;
  }

  async function refreshStatus() {
    setText('aiCoachSetupStatus', 'Sjekker tilkobling ...');
    connectionStatus = 'checking';
    renderStatus();
    const result = await client.status();
    backendAvailable = Boolean(result.ok);
    configured = Boolean(result.ok && result.configured);
    connectionStatus = result.ok ? String(result.status || (configured ? 'configured' : 'not_configured')) : 'unavailable';
    const label = !result.ok
      ? result.message || 'AI-backend er ikke tilgjengelig.'
      : configured
      ? connectionStatus === 'connected'
        ? `Tilkoblet (${result.maskedKey || '••••'})`
        : connectionStatus === 'invalid'
        ? `Nøkkelen er lagret, men ble avvist (${result.maskedKey || '••••'}).`
        : connectionStatus === 'unavailable'
        ? `Nøkkelen er lagret, men OpenAI er midlertidig utilgjengelig (${result.maskedKey || '••••'}).`
        : `Konfigurert (${result.maskedKey || '••••'})`
      : result.code === 'AUTH_REQUIRED'
      ? 'Logg inn for å bruke AI-coachen.'
      : 'Ikke konfigurert';
    setText('aiCoachSetupStatus', label);
    renderStatus();
    return result;
  }

  async function saveKey() {
    const input = byId('aiCoachApiKey');
    const key = String(input?.value || '').trim();
    if (!key) return setText('aiCoachSetupFeedback', 'Skriv inn en OpenAI API-nøkkel.');
    setText('aiCoachSetupFeedback', 'Validerer og lagrer sikkert ...');
    const result = await client.saveKey(key);
    if (input) input.value = '';
    setText('aiCoachSetupFeedback', result.ok
      ? `Nøkkelen er lagret og validert (${result.maskedKey || '••••'}).`
      : result.message || 'Kunne ikke lagre nøkkelen.');
    await refreshStatus();
  }

  async function testKey() {
    setText('aiCoachSetupFeedback', 'Tester tilkoblingen ...');
    const result = await client.testKey();
    setText('aiCoachSetupFeedback', result.ok ? 'Tilkoblingen fungerer.' : result.message || 'Tilkoblingstesten feilet.');
    await refreshStatus();
  }

  async function deleteKey() {
    if (!window.confirm('Slette den lagrede OpenAI-nøkkelen?')) return;
    const result = await client.deleteKey();
    setText('aiCoachSetupFeedback', result.ok ? 'Nøkkelen er slettet.' : result.message || 'Kunne ikke slette nøkkelen.');
    await refreshStatus();
  }

  async function send() {
    if (loading || !configured) return;
    const input = byId('aiCoachInput');
    const question = String(input?.value || '').trim();
    if (!question) return;
    if (question.length > 2000) return setText('aiCoachError', 'Spørsmålet kan være maks 2 000 tegn.');
    if (!ensureConsent()) return;

    setText('aiCoachError', '');
    const context = buildContext();
    lastContextLabels = contextCategoryLabels(context);
    const outgoing = [...messages, { role: 'user', content: question }].slice(-MAX_HISTORY_MESSAGES);
    messages = outgoing;
    if (input) input.value = '';
    renderMessages();
    renderUsage();
    setLoading(true);
    const result = await client.chat({
      context,
      messages: outgoing,
      client: { appVersion: options.appVersion || '', contextSchemaVersion: context.schemaVersion }
    });
    setLoading(false);
    if (!result.ok) {
      setText('aiCoachError', result.message || 'AI-coachen kunne ikke svare. Ingen appdata ble endret.');
      if (result.code === 'AI_NOT_CONFIGURED' || result.code === 'INVALID_API_KEY') await refreshStatus();
      return;
    }
    messages.push({ role: 'assistant', content: String(result.answer || '').trim() || 'Jeg fikk ikke laget et svar.' });
    messages = messages.slice(-MAX_HISTORY_MESSAGES);
    usage = {
      inputTokens: usage.inputTokens + Number(result.usage?.inputTokens || 0),
      outputTokens: usage.outputTokens + Number(result.usage?.outputTokens || 0),
      requests: usage.requests + 1
    };
    renderMessages();
    renderUsage();
  }

  function clear() {
    messages = [];
    usage = { inputTokens: 0, outputTokens: 0, requests: 0 };
    lastContextLabels = [];
    setText('aiCoachError', '');
    renderMessages();
    renderUsage();
  }

  async function open() {
    navigate('aiCoach');
    renderSuggestions();
    renderMessages();
    renderUsage();
    await refreshStatus();
  }

  function bind() {
    byId('aiCoachSendBtn')?.addEventListener('click', send);
    byId('aiCoachInput')?.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        send();
      }
    });
    byId('aiCoachClearBtn')?.addEventListener('click', clear);
    byId('aiCoachOpenSettingsBtn')?.addEventListener('click', openSettings);
    byId('aiCoachSaveKeyBtn')?.addEventListener('click', saveKey);
    byId('aiCoachTestKeyBtn')?.addEventListener('click', testKey);
    byId('aiCoachDeleteKeyBtn')?.addEventListener('click', deleteKey);
  }

  return { bind, clear, deleteKey, open, refreshStatus, saveKey, send, testKey };
}
