function closestCard(documentRef, selector) {
  return documentRef.querySelector(selector)?.closest('.card') || null;
}

const WORKSPACES = Object.freeze({
  insights: {
    labels: [
      { id: 'insights-status', label: 'Status', title: 'Status og belastning', note: 'Uken, intensitetsbalansen og eventuelle kroppssignaler.', priority: true,
        cards: ['#insightWeekTime', '#insightWeeklyStatus', '#insightBodySignalsCard', '#insightInjurySignalCard', '#insightIntensityBalanceCard'] },
      { id: 'insights-continuity', label: 'Kontinuitet', title: 'Kontinuitet og kvalitet', note: 'Uker på rad, fireukersrytme og treningsmønstre.',
        cards: ['#insightStreakWeeks', '#insightFourWeeks', '#insightPatterns', '#insightStructuredIntervalsCard', '#insightHeartRateComplianceCard'] },
      { id: 'insights-development', label: 'Utvikling', title: 'Utvikling', note: 'Treningsnivå, mengde og formmålinger.',
        cards: ['#insightSameEffortFormCard', '#fitnessLevelAssessment', '#insightVolumeTrends', '#insightWellnessTrend'] },
      { id: 'insights-year', label: 'Året', title: 'Året så langt', note: 'Høydepunkter og milepæler.',
        cards: ['#insightYearToDate'] }
    ]
  },
  goals: {
    labels: [
      { id: 'goals-status', label: 'Oversikt', title: 'Målstatus', note: 'Retning, score og neste smarte steg.', priority: true,
        cards: ['#goalsStatusCard'] },
      { id: 'goals-race', label: 'Mål-løp', title: 'Mål-løp', note: 'Testgrunnlag og konkurranseplan.', cards: ['#insightRaceGoalCard'] },
      { id: 'goals-pb', label: 'PB', title: 'Personlige bestenoteringer', note: 'Resultater og utvikling.', cards: ['#insightPersonalBestsCard'] },
      { id: 'goals-challenges', label: 'Challenges', title: 'Challenges', note: 'Aktive og tidligere korttidsmål.', cards: ['#goalsChallengesCard'] }
    ]
  }
});

function element(documentRef, tag, className = '') {
  const node = documentRef.createElement(tag);
  if (className) node.className = className;
  return node;
}

export function createWorkspaceSectionsUi({
  documentRef = globalThis.document,
  scrollBehavior = 'smooth'
} = {}) {
  let bound = false;

  function cardFor(selector) {
    const direct = documentRef.querySelector(selector);
    return direct?.classList?.contains('card') ? direct : closestCard(documentRef, selector);
  }

  function helpDisclosure(paragraph) {
    if (!paragraph || paragraph.closest('.context-help')) return;
    const details = element(documentRef, 'details', 'context-help');
    const summary = element(documentRef, 'summary');
    summary.textContent = paragraph.dataset.progressiveHelp || 'Forklaring';
    paragraph.parentNode.insertBefore(details, paragraph);
    details.append(summary, paragraph);
  }

  function sectionHeading(config) {
    const heading = element(documentRef, 'div', 'workspace-section-heading');
    const titleWrap = element(documentRef, 'div');
    const title = element(documentRef, 'h2');
    title.textContent = config.title;
    titleWrap.append(title);
    const note = element(documentRef, 'p');
    note.textContent = config.note;
    heading.append(titleWrap, note);
    return heading;
  }

  function disclosureSummary(config) {
    const summary = element(documentRef, 'summary');
    const text = element(documentRef, 'span');
    const title = element(documentRef, 'strong');
    title.textContent = config.title;
    const note = element(documentRef, 'small');
    note.textContent = config.note;
    text.append(title, note);
    const action = element(documentRef, 'span', 'workspace-section-action');
    action.textContent = '›';
    action.setAttribute('aria-hidden', 'true');
    summary.append(text, action);
    return summary;
  }

  function assembleWorkspace(rootId, workspace) {
    const root = documentRef.getElementById(rootId);
    if (!root || root.dataset.workspaceAssembled === 'true') return;
    const intro = root.querySelector(':scope > .workspace-intro-card');
    if (!intro) return;

    const nav = element(documentRef, 'div', 'section-jump-nav');
    nav.dataset.sectionNav = rootId;
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', `Områder under ${rootId === 'insights' ? 'Innsikt' : 'Mål'}`);
    intro.after(nav);

    let previous = nav;
    workspace.labels.forEach(config => {
      const wrapper = element(documentRef, config.priority ? 'section' : 'details', `workspace-section${config.priority ? ' workspace-section-priority' : ''}`);
      wrapper.id = config.id;
      wrapper.dataset.workspaceSection = config.id;
      if (config.priority) wrapper.append(sectionHeading(config));
      else wrapper.append(disclosureSummary(config));
      const content = element(documentRef, 'div', 'workspace-section-content');
      const cards = [...new Set(config.cards.map(cardFor).filter(Boolean))];
      cards.forEach(card => content.append(card));
      wrapper.append(content);
      previous.after(wrapper);
      previous = wrapper;

      const button = element(documentRef, 'button');
      button.type = 'button';
      button.dataset.sectionTarget = config.id;
      button.textContent = config.label;
      button.setAttribute('aria-controls', config.id);
      button.setAttribute('aria-selected', config.priority ? 'true' : 'false');
      if (config.priority) button.classList.add('active');
      nav.append(button);
    });
    root.dataset.workspaceAssembled = 'true';
  }

  function updateDisclosure(details) {
    const action = details.querySelector(':scope > summary .workspace-section-action');
    if (action) action.textContent = '›';
  }

  function activate(root, target) {
    if (!root || !target) return;
    if (target.tagName === 'DETAILS') {
      target.open = true;
      updateDisclosure(target);
    }
    root.querySelectorAll('.section-jump-nav [data-section-target]').forEach(button => {
      const active = button.dataset.sectionTarget === target.id;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    target.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
  }

  function refresh() {
    Object.keys(WORKSPACES).forEach(rootId => {
      const root = documentRef.getElementById(rootId);
      if (!root) return;
      root.querySelectorAll('.workspace-section').forEach(section => {
        const cards = [...section.querySelectorAll(':scope > .workspace-section-content > .card')];
        const hasVisibleCard = cards.some(card => card.style.display !== 'none');
        section.hidden = !hasVisibleCard;
        const navButton = root.querySelector(`[data-section-target="${section.id}"]`);
        if (navButton) navButton.hidden = !hasVisibleCard;
      });
    });
  }

  function bind() {
    if (bound || !documentRef) return;
    bound = true;
    Object.entries(WORKSPACES).forEach(([rootId, workspace]) => assembleWorkspace(rootId, workspace));
    documentRef.querySelectorAll('[data-progressive-help]').forEach(helpDisclosure);
    documentRef.addEventListener('click', event => {
      const button = event.target.closest?.('.section-jump-nav [data-section-target]');
      if (!button) return;
      const root = button.closest('.tab');
      activate(root, documentRef.getElementById(button.dataset.sectionTarget));
    });
    documentRef.querySelectorAll('details.workspace-section').forEach(details => {
      updateDisclosure(details);
      details.addEventListener('toggle', () => updateDisclosure(details));
    });
    refresh();
  }

  return { bind, refresh };
}
