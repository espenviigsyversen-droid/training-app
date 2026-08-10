function roundedNumber(value, maximumFractionDigits = 1) {
  return Number(value || 0).toLocaleString('nb-NO', { maximumFractionDigits });
}

function monthLabel(monthKey) {
  const match = String(monthKey || '').match(/^(\d{4})-(\d{2})$/);
  if (!match) return '';
  const date = new Date(`${monthKey}-01T12:00:00`);
  return date.toLocaleDateString('nb-NO', { month: 'long' });
}

function defaultEscapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function createTrainingInsightsUi({
  documentRef = globalThis.document,
  escapeHtml = defaultEscapeHtml,
  formatDate = value => String(value || ''),
  formatClockDuration = value => String(value || 0),
  onShowMissingActivitySetting = () => {}
} = {}) {
  let latestInsight = null;
  let isBound = false;
  let milestoneTrigger = null;

  function milestoneLabel(milestone = {}) {
    if (milestone.metric === 'distance') return `${roundedNumber(milestone.target, 0)} km`;
    if (milestone.metric === 'weeks') return `${roundedNumber(milestone.target, 0)} aktive uker`;
    return `${roundedNumber(milestone.target, 0)} økter`;
  }

  function nextMilestoneText(milestone = {}) {
    const remaining = Math.max(0, milestone.target - milestone.current);
    if (milestone.metric === 'distance') return `${roundedNumber(remaining)} km igjen til ${roundedNumber(milestone.target, 0)} km`;
    if (milestone.metric === 'weeks') return `${roundedNumber(remaining, 0)} aktive uker igjen til ${roundedNumber(milestone.target, 0)}`;
    return `${roundedNumber(remaining, 0)} treningsøkter igjen til ${roundedNumber(milestone.target, 0)}`;
  }

  function highlightHtml(highlight = {}) {
    if (highlight.kind === 'longest_distance') {
      return `<div class="year-highlight"><span>Lengste løpeøkt</span><strong>${escapeHtml(roundedNumber(highlight.distanceKm))} km</strong><small>${escapeHtml(formatDate(highlight.date))} · ${escapeHtml(highlight.name)}</small></div>`;
    }
    if (highlight.kind === 'strongest_month') {
      return `<div class="year-highlight"><span>Største løpemåned</span><strong>${escapeHtml(roundedNumber(highlight.distanceKm))} km</strong><small>${escapeHtml(monthLabel(highlight.monthKey))} · ${escapeHtml(String(highlight.sessions))} økter</small></div>`;
    }
    if (highlight.kind === 'highest_ascent') {
      return `<div class="year-highlight"><span>Mest stigning i én økt</span><strong>${escapeHtml(roundedNumber(highlight.elevationGainM, 0))} hm</strong><small>${escapeHtml(formatDate(highlight.date))} · ${escapeHtml(highlight.name)}</small></div>`;
    }
    return `<div class="year-highlight"><span>Lengste registrerte økt</span><strong>${escapeHtml(formatClockDuration(highlight.durationSeconds))}</strong><small>${escapeHtml(formatDate(highlight.date))} · ${escapeHtml(highlight.name)}</small></div>`;
  }

  function settingSummaryHtml(settings = {}) {
    const labels = [
      ['outdoor', 'utendørs'],
      ['treadmill', 'tredemølle'],
      ['indoor', 'innendørs'],
      ['pool', 'basseng']
    ];
    const parts = labels
      .filter(([key]) => Number(settings[key] || 0) > 0)
      .map(([key, label]) => `${roundedNumber(settings[key], 0)} ${label}`);
    if (Number(settings.unknown || 0) > 0) {
      parts.push(`<button type="button" class="year-setting-link" data-insight-action="missing-setting">${escapeHtml(roundedNumber(settings.unknown, 0))} uten angivelse</button>`);
    }
    return parts.join(' · ');
  }

  function milestoneTrackTitle(metric) {
    if (metric === 'distance') return 'Løping';
    if (metric === 'weeks') return 'Aktive uker';
    return 'Treningsøkter';
  }

  function milestoneCurrentLabel(track = {}) {
    if (track.metric === 'distance') return `${roundedNumber(track.current)} km hittil`;
    if (track.metric === 'weeks') return `${roundedNumber(track.current, 0)} aktive uker hittil`;
    return `${roundedNumber(track.current, 0)} treningsøkter hittil`;
  }

  function milestoneOverviewHtml(insight = {}) {
    const tracks = insight.milestoneTracks || [];
    return `
      <div class="milestone-modal-heading">
        <div><span class="eyebrow">${escapeHtml(String(insight.year || ''))}</span><h2>Årets milepæler</h2></div>
        <button type="button" class="btn-soft btn-icon" data-insight-action="close-milestones" aria-label="Lukk milepæler">×</button>
      </div>
      <p class="small-note">Se hva du har nådd og hvilke naturlige markører som ligger foran deg. Milepælene er motivasjon, ikke treningskrav.</p>
      <div class="milestone-track-list">
        ${tracks.map(track => `
          <section class="milestone-track">
            <div class="milestone-track-heading"><strong>${escapeHtml(milestoneTrackTitle(track.metric))}</strong><span>${escapeHtml(milestoneCurrentLabel(track))}</span></div>
            <div class="milestone-track-grid">
              ${(track.milestones || []).map(item => `<div class="milestone-track-item ${escapeHtml(item.status || 'future')}">
                <strong>${escapeHtml(milestoneLabel(item))}</strong>
                <small>${item.status === 'achieved' ? escapeHtml(item.achievedAt ? formatDate(item.achievedAt) : 'Nådd') : item.status === 'next' ? 'Neste' : 'Senere'}</small>
              </div>`).join('')}
            </div>
          </section>`).join('')}
      </div>
      <button type="button" class="btn-soft btn-full" data-insight-action="close-milestones">Lukk</button>`;
  }

  function openMilestoneOverview() {
    const modal = documentRef?.getElementById('milestoneOverviewModal');
    const content = documentRef?.getElementById('milestoneOverviewContent');
    if (!modal || !content || !latestInsight) return;
    milestoneTrigger = documentRef.activeElement;
    content.innerHTML = milestoneOverviewHtml(latestInsight);
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    content.querySelector('[data-insight-action="close-milestones"]')?.focus();
  }

  function closeMilestoneOverview() {
    const modal = documentRef?.getElementById('milestoneOverviewModal');
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    milestoneTrigger?.focus?.();
  }

  function handleAction(action) {
    if (action === 'all-milestones') openMilestoneOverview();
    if (action === 'close-milestones') closeMilestoneOverview();
    if (action === 'missing-setting') onShowMissingActivitySetting();
  }

  function bind() {
    if (isBound || !documentRef) return;
    isBound = true;
    documentRef.getElementById('insightYearToDate')?.addEventListener('click', event => {
      const action = event.target.closest?.('[data-insight-action]')?.dataset?.insightAction;
      if (action) handleAction(action);
    });
    const modal = documentRef.getElementById('milestoneOverviewModal');
    modal?.addEventListener('click', event => {
      const action = event.target.closest?.('[data-insight-action]')?.dataset?.insightAction;
      if (action) handleAction(action);
      else if (event.target === modal) closeMilestoneOverview();
    });
    documentRef.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeMilestoneOverview();
    });
  }

  function renderYearToDate(insight = {}) {
    latestInsight = insight;
    const container = documentRef?.getElementById('insightYearToDate');
    const yearLabel = documentRef?.getElementById('insightYearToDateYear');
    if (!container) return;
    if (yearLabel) yearLabel.textContent = insight.year || '';
    if (!insight.hasData) {
      container.innerHTML = '<div class="year-empty"><strong>Året starter med første loggede økt</strong><p>Her kommer treningstid, kilometer, milepæler og høydepunkter etter hvert.</p></div>';
      return;
    }

    const summary = insight.summary || {};
    const milestones = (insight.milestones || []).slice(0, 3);
    const next = insight.nextMilestone;
    const nextProgress = next ? Math.max(0, Math.min(100, Math.round((next.current / Math.max(1, next.target)) * 100))) : 0;
    const settings = insight.settingBreakdown || {};
    const settingText = settings.total ? settingSummaryHtml(settings) : '';

    container.innerHTML = `
      <div class="year-summary-grid">
        <div class="insight-stat"><strong>${escapeHtml(String(summary.sessions || 0))}</strong><span>Økter</span></div>
        <div class="insight-stat"><strong>${escapeHtml(formatClockDuration(summary.seconds || 0))}</strong><span>Treningstid</span></div>
        <div class="insight-stat"><strong>${escapeHtml(roundedNumber(summary.primaryDistanceKm))} km</strong><span>Løping</span></div>
        <div class="insight-stat"><strong>${escapeHtml(String(summary.activeWeeks || 0))}</strong><span>Aktive uker</span></div>
      </div>
      ${settingText ? `<p class="year-setting-summary"><strong>Løpemiljø:</strong> ${settingText}</p>` : ''}
      <div class="year-insight-block">
        <div class="year-insight-heading"><strong>Høydepunkter så langt</strong><span>${escapeHtml(String(insight.year || ''))}</span></div>
        <div class="year-highlight-grid">${(insight.highlights || []).slice(0, 3).map(highlightHtml).join('')}</div>
      </div>
      <div class="year-insight-block">
        <div class="year-insight-heading"><strong>${milestones.length ? 'Milepæler nådd' : 'Milepæler'}</strong><span>Ingen hast</span></div>
        ${milestones.length ? `<div class="year-milestones">${milestones.map(milestone => `<span><strong>${escapeHtml(milestone.metric === 'sessions' ? `${roundedNumber(milestone.target, 0)} treningsøkter` : milestoneLabel(milestone))}</strong>${milestone.achievedAt ? `<small>${escapeHtml(formatDate(milestone.achievedAt))}</small>` : ''}</span>`).join('')}</div>` : '<p class="small-note">Første naturlige markør kommer etter hvert som du logger økter.</p>'}
        <button type="button" class="btn-soft year-milestone-button" data-insight-action="all-milestones">Se alle milepæler</button>
      </div>
      ${next ? `<div class="year-next-milestone">
        <div><span>Neste naturlige milepæl</span><strong>${escapeHtml(nextMilestoneText(next))}</strong></div>
        <div class="progress-track"><div class="progress-fill partial" style="width:${nextProgress}%;"></div></div>
        <small>Milepælen er en markør for motivasjon, ikke et krav om å øke belastningen.</small>
      </div>` : ''}`;
  }

  return { bind, closeMilestoneOverview, renderYearToDate };
}
