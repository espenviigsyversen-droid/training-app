const CONSENT_KEY = 'treningsapp:ai-coach-consent:v1';
const WEB_CONSENT_KEY = 'treningsapp:ai-coach-web-consent:v1';
const MAX_HISTORY_MESSAGES = 8;
const DEFAULT_PROJECT_ID = 'general-training';

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

function plainAssistantText(value) {
  return String(value || '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/^#{1,4}\s+/gm, '')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .trim();
}

function safeSource(value) {
  try {
    const url = new URL(String(value?.url || ''));
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return { url: url.href, title: String(value?.title || url.hostname).slice(0, 180) };
  } catch {
    return null;
  }
}

function appendAssistantText(element, message) {
  const raw = String(message.content || '');
  const citations = (Array.isArray(message.citations) ? message.citations : [])
    .map(value => ({ ...safeSource(value), startIndex: Number(value?.startIndex), endIndex: Number(value?.endIndex) }))
    .filter(value => value.url && Number.isInteger(value.startIndex) && Number.isInteger(value.endIndex) && value.startIndex >= 0 && value.endIndex > value.startIndex && value.endIndex <= raw.length)
    .sort((a, b) => a.startIndex - b.startIndex);
  if (!citations.length) {
    element.textContent = plainAssistantText(raw);
    return;
  }
  let cursor = 0;
  citations.forEach(citation => {
    if (citation.startIndex < cursor) return;
    element.append(document.createTextNode(raw.slice(cursor, citation.startIndex)));
    const link = document.createElement('a');
    link.href = citation.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer nofollow';
    link.textContent = raw.slice(citation.startIndex, citation.endIndex) || citation.title;
    link.title = citation.title;
    element.append(link);
    cursor = citation.endIndex;
  });
  element.append(document.createTextNode(raw.slice(cursor)));
}

function appendWebSources(article, message) {
  const sources = (Array.isArray(message.sources) ? message.sources : []).map(safeSource).filter(Boolean).slice(0, 8);
  if (!message.webUsed && !sources.length) return;
  const wrapper = document.createElement('div');
  wrapper.className = 'ai-coach-web-sources';
  const label = document.createElement('span');
  label.textContent = sources.length ? 'Nettsøk brukt · Kilder' : 'Nettsøk brukt';
  wrapper.append(label);
  sources.forEach((source, index) => {
    const link = document.createElement('a');
    link.href = source.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer nofollow';
    link.textContent = `${index + 1}. ${source.title}`;
    wrapper.append(link);
  });
  article.append(wrapper);
}

function createMessageElement(message) {
  const article = document.createElement('article');
  article.className = `ai-coach-message ${message.role === 'assistant' ? 'assistant' : 'user'}`;
  const role = document.createElement('span');
  role.className = 'ai-coach-message-role';
  role.textContent = message.role === 'assistant' ? 'AI-coach' : 'Du';
  const text = document.createElement('p');
  if (message.role === 'assistant') appendAssistantText(text, message);
  else text.textContent = message.content;
  article.append(role, text);
  if (message.role === 'assistant') appendWebSources(article, message);
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
  let projects = [];
  let activeProjectId = DEFAULT_PROJECT_ID;
  let conversations = [];
  let activeConversationId = null;
  let activeConversationStatus = 'active';
  let configured = false;
  let backendAvailable = true;
  let connectionStatus = 'checking';
  let loading = false;
  let usage = { inputTokens: 0, outputTokens: 0, requests: 0 };
  let lastContextLabels = [];

  function activeProject() {
    return projects.find(project => project.id === activeProjectId) || null;
  }

  function updateWorkspaceSummary() {
    const projectTitle = activeProject()?.title || 'Generell trening';
    const conversation = conversations.find(item => item.id === activeConversationId);
    const conversationTitle = conversation?.title || 'Ny samtale';
    setText('aiCoachWorkspaceSummary', `${projectTitle} · ${conversationTitle}`);
  }

  function renderProjectToolbar() {
    const select = byId('aiCoachProjectSelect');
    if (select) {
      select.replaceChildren();
      projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = `${project.title}${project.status === 'archived' ? ' (arkivert)' : ''}`;
        select.append(option);
      });
      select.value = activeProjectId;
    }
    const project = activeProject();
    const title = byId('aiCoachProjectTitle');
    const instructions = byId('aiCoachProjectInstructions');
    const summary = byId('aiCoachProjectSummaryEnabled');
    if (title) title.value = project?.title || '';
    if (instructions) instructions.value = project?.instructions || '';
    if (summary) summary.checked = project?.summaryEnabled !== false;
    const isDefault = activeProjectId === DEFAULT_PROJECT_ID;
    const archive = byId('aiCoachArchiveProjectBtn');
    const remove = byId('aiCoachDeleteProjectBtn');
    if (archive) {
      archive.disabled = isDefault || !project;
      archive.textContent = project?.status === 'archived' ? 'Gjenåpne' : 'Arkiver';
    }
    if (remove) remove.disabled = isDefault || !project;
    updateWorkspaceSummary();
  }

  async function refreshProjects() {
    setText('aiCoachProjectFeedback', 'Henter prosjekter ...');
    const result = await client.listProjects();
    if (!result.ok) {
      setText('aiCoachProjectFeedback', result.message || 'Kunne ikke hente prosjekter.');
      return result;
    }
    projects = Array.isArray(result.projects) ? result.projects : [];
    if (!projects.some(project => project.id === activeProjectId)) activeProjectId = result.defaultProjectId || DEFAULT_PROJECT_ID;
    renderProjectToolbar();
    setText('aiCoachProjectFeedback', '');
    return result;
  }

  function conversationTitleFromQuestion(question) {
    const compact = String(question || '').replace(/\s+/g, ' ').trim();
    return compact.length > 54 ? `${compact.slice(0, 51)}...` : compact || 'Ny samtale';
  }

  function renderConversationToolbar() {
    const select = byId('aiCoachConversationSelect');
    if (select) {
      select.replaceChildren();
      const fresh = document.createElement('option');
      fresh.value = '';
      fresh.textContent = 'Ny samtale';
      select.append(fresh);
      conversations.forEach(conversation => {
        const option = document.createElement('option');
        option.value = conversation.id;
        option.textContent = `${conversation.title}${conversation.status === 'archived' ? ' (arkivert)' : ''}`;
        select.append(option);
      });
      select.value = activeConversationId || '';
    }
    const hasActive = Boolean(activeConversationId);
    const archive = byId('aiCoachArchiveConversationBtn');
    const remove = byId('aiCoachDeleteConversationBtn');
    if (archive) {
      archive.disabled = !hasActive;
      archive.textContent = activeConversationStatus === 'archived' ? 'Gjenåpne' : 'Arkiver';
    }
    if (remove) remove.disabled = !hasActive;
    setText('aiCoachConversationFeedback', activeConversationId
      ? activeConversationStatus === 'archived'
        ? 'Arkivert samtale. Gjenåpne den for å fortsette.'
        : 'Samtalen synkroniseres mellom enhetene dine.'
      : 'En ny samtale lagres når du sender første spørsmål.');
    const composer = byId('aiCoachComposer');
    composer?.classList.toggle('conversation-readonly', activeConversationStatus === 'archived' || activeProject()?.status === 'archived');
    updateWorkspaceSummary();
  }

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
    byId('aiCoachSuggestions')?.classList.toggle('hidden', messages.length > 0);
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

  function resetConversation() {
    activeConversationId = null;
    activeConversationStatus = 'active';
    messages = [];
    usage = { inputTokens: 0, outputTokens: 0, requests: 0 };
    lastContextLabels = [];
    setText('aiCoachError', '');
    renderConversationToolbar();
    renderMessages();
    renderUsage();
  }

  async function selectProject(projectId) {
    activeProjectId = String(projectId || DEFAULT_PROJECT_ID);
    resetConversation();
    renderProjectToolbar();
    await refreshConversations({ openFirst: true });
  }

  async function saveProject() {
    const title = String(byId('aiCoachProjectTitle')?.value || '').trim();
    const instructions = String(byId('aiCoachProjectInstructions')?.value || '').trim();
    const summaryEnabled = byId('aiCoachProjectSummaryEnabled')?.checked !== false;
    if (!title) return setText('aiCoachProjectFeedback', 'Prosjektet må ha et navn.');
    setText('aiCoachProjectFeedback', 'Lagrer prosjekt ...');
    const result = await client.updateProject(activeProjectId, title, instructions, summaryEnabled);
    setText('aiCoachProjectFeedback', result.ok ? 'Prosjektet er lagret.' : result.message || 'Kunne ikke lagre prosjektet.');
    if (result.ok) await refreshProjects();
  }

  async function createNewProject() {
    const title = window.prompt('Navn på nytt prosjekt:', 'Nytt treningsprosjekt');
    if (!String(title || '').trim()) return;
    const result = await client.createProject(String(title).trim(), '', true);
    if (!result.ok || !result.project?.id) return setText('aiCoachProjectFeedback', result.message || 'Kunne ikke opprette prosjektet.');
    await refreshProjects();
    await selectProject(result.project.id);
    byId('aiCoachProjectPanel')?.classList.remove('hidden');
  }

  async function archiveActiveProject() {
    const project = activeProject();
    if (!project || activeProjectId === DEFAULT_PROJECT_ID) return;
    const reopening = project.status === 'archived';
    if (!reopening && !window.confirm('Arkivere prosjektet og beholde samtalene?')) return;
    const result = await client.archiveProject(activeProjectId, !reopening);
    if (!result.ok) return setText('aiCoachProjectFeedback', result.message || 'Kunne ikke oppdatere prosjektet.');
    await refreshProjects();
  }

  async function deleteActiveProject() {
    if (activeProjectId === DEFAULT_PROJECT_ID) return;
    if (!window.confirm('Slette prosjektet og alle samtalene permanent?')) return;
    const result = await client.deleteProject(activeProjectId);
    if (!result.ok) return setText('aiCoachProjectFeedback', result.message || 'Kunne ikke slette prosjektet.');
    activeProjectId = DEFAULT_PROJECT_ID;
    resetConversation();
    await refreshProjects();
    await refreshConversations({ openFirst: true });
  }

  async function clearActiveSummary() {
    if (!activeConversationId) return setText('aiCoachPrivacyFeedback', 'Velg en samtale først.');
    if (!window.confirm('Tømme det begrensede samtaleminnet? Meldingene beholdes.')) return;
    const result = await client.clearSummary(activeProjectId, activeConversationId);
    setText('aiCoachPrivacyFeedback', result.ok ? 'Samtaleminnet er tømt.' : result.message || 'Kunne ikke tømme samtaleminnet.');
  }

  async function exportChat() {
    setText('aiCoachPrivacyFeedback', 'Lager eksport ...');
    const result = await client.exportData();
    if (!result.ok || !result.export) return setText('aiCoachPrivacyFeedback', result.message || 'Kunne ikke eksportere chatdata.');
    const blob = new Blob([JSON.stringify(result.export, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `treningsapp-chat-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setText('aiCoachPrivacyFeedback', 'Chatdata er eksportert.');
  }

  async function deleteAllChat() {
    if (!window.confirm('Slette alle chatprosjekter, samtaler og meldinger permanent?')) return;
    if (!window.confirm('Dette kan ikke angres. Bekreft sletting én gang til.')) return;
    const result = await client.deleteAllData();
    if (!result.ok) return setText('aiCoachPrivacyFeedback', result.message || 'Kunne ikke slette chatdata.');
    projects = [];
    activeProjectId = DEFAULT_PROJECT_ID;
    resetConversation();
    await refreshProjects();
    await refreshConversations();
    setText('aiCoachPrivacyFeedback', 'Alle chatdata er slettet. Et tomt standardprosjekt er opprettet på nytt.');
  }

  async function refreshConversations(options = {}) {
    setText('aiCoachConversationFeedback', 'Henter samtaler ...');
    const result = await client.listConversations(activeProjectId);
    if (!result.ok) {
      setText('aiCoachConversationFeedback', result.message || 'Kunne ikke hente samtaler. Du kan fortsatt starte en ny.');
      return result;
    }
    conversations = Array.isArray(result.conversations) ? result.conversations : [];
    if (activeConversationId && !conversations.some(item => item.id === activeConversationId)) {
      activeConversationId = null;
      activeConversationStatus = 'active';
    }
    renderConversationToolbar();
    if (options.openFirst && !activeConversationId && conversations.length) {
      await openConversation(conversations[0].id);
    }
    return result;
  }

  async function openConversation(conversationId) {
    const id = String(conversationId || '').trim();
    if (!id) return resetConversation();
    setText('aiCoachConversationFeedback', 'Åpner samtalen ...');
    const result = await client.getConversation(activeProjectId, id);
    if (!result.ok) {
      setText('aiCoachConversationFeedback', result.message || 'Kunne ikke åpne samtalen.');
      return;
    }
    activeConversationId = result.conversation?.id || id;
    activeConversationStatus = result.conversation?.status === 'archived' ? 'archived' : 'active';
    messages = (Array.isArray(result.messages) ? result.messages : [])
      .filter(message => ['user', 'assistant'].includes(message.role) && message.content)
      .map(message => ({
        role: message.role,
        content: String(message.content),
        webUsed: message.webUsed === true,
        citations: Array.isArray(message.citations) ? message.citations : [],
        sources: Array.isArray(message.sources) ? message.sources : []
      }));
    usage = { inputTokens: 0, outputTokens: 0, requests: 0 };
    lastContextLabels = [];
    renderConversationToolbar();
    renderMessages();
    renderUsage();
  }

  async function archiveActiveConversation() {
    if (!activeConversationId) return;
    const reopening = activeConversationStatus === 'archived';
    if (!reopening && !window.confirm('Arkivere denne samtalen? Den kan åpnes igjen senere.')) return;
    const result = await client.archiveConversation(activeProjectId, activeConversationId, !reopening);
    if (!result.ok) return setText('aiCoachConversationFeedback', result.message || 'Kunne ikke oppdatere samtalen.');
    activeConversationStatus = reopening ? 'active' : 'archived';
    await refreshConversations();
    renderConversationToolbar();
  }

  async function deleteActiveConversation() {
    if (!activeConversationId) return;
    if (!window.confirm('Slette denne samtalen og alle meldingene permanent?')) return;
    const result = await client.deleteConversation(activeProjectId, activeConversationId);
    if (!result.ok) return setText('aiCoachConversationFeedback', result.message || 'Kunne ikke slette samtalen.');
    resetConversation();
    await refreshConversations({ openFirst: true });
  }

  function renderUsage() {
    setText('aiCoachUsage', usage.requests
      ? `${usage.requests} svar · ${usage.inputTokens + usage.outputTokens} tokens i denne appøkten${Number.isFinite(usage.remainingToday) ? ` · ${usage.remainingToday} kall igjen i dag` : ''}`
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

  function ensureWebConsent() {
    if (localStorage.getItem(WEB_CONSENT_KEY) === 'accepted') return true;
    const accepted = window.confirm('Nettsøk sender spørsmålet til OpenAIs webverktøy og kan hente innhold fra eksterne nettsteder. Appens sikkerhetsregler gjelder fortsatt, og kildene vises i svaret. Fortsette?');
    if (accepted) localStorage.setItem(WEB_CONSENT_KEY, 'accepted');
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
    if (loading || !configured || activeConversationStatus === 'archived') return;
    const input = byId('aiCoachInput');
    const question = String(input?.value || '').trim();
    if (!question) return;
    if (question.length > 2000) return setText('aiCoachError', 'Spørsmålet kan være maks 2 000 tegn.');
    if (!ensureConsent()) return;
    const webSearchEnabled = byId('aiCoachWebSearchEnabled')?.checked === true;
    if (webSearchEnabled && !ensureWebConsent()) return;

    if (!activeConversationId) {
      setLoading(true);
      const created = await client.createConversation(activeProjectId, conversationTitleFromQuestion(question));
      setLoading(false);
      if (!created.ok || !created.conversation?.id) {
        return setText('aiCoachError', created.message || 'Kunne ikke opprette samtalen.');
      }
      activeConversationId = created.conversation.id;
      activeConversationStatus = 'active';
      conversations = [created.conversation, ...conversations];
      renderConversationToolbar();
    }

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
      projectId: activeProjectId,
      conversationId: activeConversationId,
      webSearchEnabled,
      client: { appVersion: options.appVersion || '', contextSchemaVersion: context.schemaVersion }
    });
    setLoading(false);
    if (!result.ok) {
      setText('aiCoachError', result.message || 'AI-coachen kunne ikke svare. Ingen appdata ble endret.');
      if (result.code === 'AI_NOT_CONFIGURED' || result.code === 'INVALID_API_KEY') await refreshStatus();
      return;
    }
    messages.push({
      role: 'assistant',
      content: String(result.answer || '').trim() || 'Jeg fikk ikke laget et svar.',
      webUsed: result.webUsed === true,
      citations: Array.isArray(result.citations) ? result.citations : [],
      sources: Array.isArray(result.sources) ? result.sources : []
    });
    messages = messages.slice(-MAX_HISTORY_MESSAGES);
    usage = {
      inputTokens: usage.inputTokens + Number(result.usage?.inputTokens || 0),
      outputTokens: usage.outputTokens + Number(result.usage?.outputTokens || 0),
      requests: usage.requests + 1,
      remainingToday: Number(result.remainingToday)
    };
    renderMessages();
    renderUsage();
    const webSearchToggle = byId('aiCoachWebSearchEnabled');
    if (webSearchToggle) webSearchToggle.checked = false;
    await refreshConversations();
  }

  function clear() {
    resetConversation();
    const workspace = byId('aiCoachWorkspaceDetails');
    if (workspace) workspace.open = false;
  }

  async function open() {
    navigate('aiCoach');
    renderSuggestions();
    renderMessages();
    renderUsage();
    await refreshStatus();
    if (configured) {
      await refreshProjects();
      await refreshConversations({ openFirst: true });
    }
  }

  function bind() {
    byId('aiCoachSendBtn')?.addEventListener('click', send);
    byId('aiCoachInput')?.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        send();
      }
    });
    byId('aiCoachNewConversationBtn')?.addEventListener('click', clear);
    byId('aiCoachProjectSelect')?.addEventListener('change', event => selectProject(event.target.value));
    byId('aiCoachManageProjectBtn')?.addEventListener('click', () => byId('aiCoachProjectPanel')?.classList.toggle('hidden'));
    byId('aiCoachSaveProjectBtn')?.addEventListener('click', saveProject);
    byId('aiCoachNewProjectBtn')?.addEventListener('click', createNewProject);
    byId('aiCoachArchiveProjectBtn')?.addEventListener('click', archiveActiveProject);
    byId('aiCoachDeleteProjectBtn')?.addEventListener('click', deleteActiveProject);
    byId('aiCoachConversationSelect')?.addEventListener('change', event => openConversation(event.target.value));
    byId('aiCoachArchiveConversationBtn')?.addEventListener('click', archiveActiveConversation);
    byId('aiCoachDeleteConversationBtn')?.addEventListener('click', deleteActiveConversation);
    byId('aiCoachClearSummaryBtn')?.addEventListener('click', clearActiveSummary);
    byId('aiCoachExportBtn')?.addEventListener('click', exportChat);
    byId('aiCoachDeleteAllBtn')?.addEventListener('click', deleteAllChat);
    byId('aiCoachOpenSettingsBtn')?.addEventListener('click', openSettings);
    byId('aiCoachSaveKeyBtn')?.addEventListener('click', saveKey);
    byId('aiCoachTestKeyBtn')?.addEventListener('click', testKey);
    byId('aiCoachDeleteKeyBtn')?.addEventListener('click', deleteKey);
  }

  return { bind, clear, deleteKey, open, openConversation, refreshConversations, refreshProjects, refreshStatus, saveKey, send, testKey };
}

export { plainAssistantText };
