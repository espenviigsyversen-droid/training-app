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
  formatClockDuration = value => String(value || 0)
} = {}) {
  function milestoneLabel(milestone = {}) {
    if (milestone.metric === 'distance') return `${roundedNumber(milestone.target, 0)} km`;
    if (milestone.metric === 'weeks') return `${roundedNumber(milestone.target, 0)} aktive uker`;
    return `${roundedNumber(milestone.target, 0)} økter`;
  }

  function nextMilestoneText(milestone = {}) {
    const remaining = Math.max(0, milestone.target - milestone.current);
    if (milestone.metric === 'distance') return `${roundedNumber(remaining)} km igjen til ${roundedNumber(milestone.target, 0)} km`;
    if (milestone.metric === 'weeks') return `${roundedNumber(remaining, 0)} aktive uker igjen til ${roundedNumber(milestone.target, 0)}`;
    return `${roundedNumber(remaining, 0)} økter igjen til ${roundedNumber(milestone.target, 0)}`;
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

  function renderYearToDate(insight = {}) {
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
    const settingText = settings.known
      ? `${settings.outdoor || 0} utendørs · ${settings.treadmill || 0} tredemølle${settings.unknown ? ` · ${settings.unknown} uten angivelse` : ''}`
      : '';

    container.innerHTML = `
      <div class="year-summary-grid">
        <div class="insight-stat"><strong>${escapeHtml(String(summary.sessions || 0))}</strong><span>Økter</span></div>
        <div class="insight-stat"><strong>${escapeHtml(formatClockDuration(summary.seconds || 0))}</strong><span>Treningstid</span></div>
        <div class="insight-stat"><strong>${escapeHtml(roundedNumber(summary.primaryDistanceKm))} km</strong><span>Løping</span></div>
        <div class="insight-stat"><strong>${escapeHtml(String(summary.activeWeeks || 0))}</strong><span>Aktive uker</span></div>
      </div>
      ${settingText ? `<p class="year-setting-summary"><strong>Løpemiljø:</strong> ${escapeHtml(settingText)}</p>` : ''}
      <div class="year-insight-block">
        <div class="year-insight-heading"><strong>Høydepunkter så langt</strong><span>${escapeHtml(String(insight.year || ''))}</span></div>
        <div class="year-highlight-grid">${(insight.highlights || []).slice(0, 3).map(highlightHtml).join('')}</div>
      </div>
      ${milestones.length ? `<div class="year-insight-block">
        <div class="year-insight-heading"><strong>Milepæler nådd</strong><span>Ingen hast</span></div>
        <div class="year-milestones">${milestones.map(milestone => `<span><strong>${escapeHtml(milestoneLabel(milestone))}</strong>${milestone.achievedAt ? `<small>${escapeHtml(formatDate(milestone.achievedAt))}</small>` : ''}</span>`).join('')}</div>
      </div>` : ''}
      ${next ? `<div class="year-next-milestone">
        <div><span>Neste naturlige milepæl</span><strong>${escapeHtml(nextMilestoneText(next))}</strong></div>
        <div class="progress-track"><div class="progress-fill partial" style="width:${nextProgress}%;"></div></div>
        <small>Milepælen er en markør for motivasjon, ikke et krav om å øke belastningen.</small>
      </div>` : ''}`;
  }

  return { renderYearToDate };
}
