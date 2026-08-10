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

function paceLabel(totalSeconds) {
  const seconds = Math.max(0, Math.round(Number(totalSeconds) || 0));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} min/km`;
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

  function sameEffortComparisonHtml(comparison = {}) {
    const settingLabel = comparison.setting === 'treadmill' ? 'Tredemølle' : 'Utendørs';
    const trendContent = {
      improving: {
        title: 'Bedre respons ved samme innsats',
        change: `${roundedNumber(Math.abs(comparison.paceChangePercent))} % raskere`,
        note: 'Du løp raskere ved omtrent samme puls i de nyeste sammenlignbare øktene.'
      },
      declining: {
        title: 'Svakere respons i denne perioden',
        change: `${roundedNumber(Math.abs(comparison.paceChangePercent))} % roligere`,
        note: 'Farten var lavere ved omtrent samme puls. Varme, underlag, bakker og dagsform kan påvirke.'
      },
      stable: {
        title: 'Stabil respons ved samme innsats',
        change: 'Omtrent uendret',
        note: 'Fart og pulsrespons er stabile mellom de to sammenlignbare periodene.'
      }
    }[comparison.trend] || {};
    const confidenceLabel = comparison.confidence === 'high' ? 'Høy sikkerhet' : 'Middels sikkerhet';
    const metricLabel = comparison.paceSource === 'gap' ? 'GAP' : 'Pace';
    const baseline = comparison.baseline || {};
    const recent = comparison.recent || {};
    return `<article class="same-effort-result ${escapeHtml(comparison.trend)}">
      <div class="same-effort-heading">
        <div><span class="eyebrow">${escapeHtml(settingLabel)} · ${escapeHtml(metricLabel)}</span><h3>${escapeHtml(trendContent.title)}</h3></div>
        <span class="same-effort-confidence ${escapeHtml(comparison.confidence)}">${escapeHtml(confidenceLabel)}</span>
      </div>
      <strong class="same-effort-change">${escapeHtml(trendContent.change)}</strong>
      <p>${escapeHtml(trendContent.note)}</p>
      <div class="same-effort-periods">
        <div><span>Før</span><strong>${escapeHtml(paceLabel(baseline.medianPaceSecondsPerKm))}</strong><small>${escapeHtml(String(baseline.medianHeartRate || 0))} bpm · ${escapeHtml(String(baseline.count || 0))} økter</small></div>
        <div><span>Nå</span><strong>${escapeHtml(paceLabel(recent.medianPaceSecondsPerKm))}</strong><small>${escapeHtml(String(recent.medianHeartRate || 0))} bpm · ${escapeHtml(String(recent.count || 0))} økter</small></div>
      </div>
      <details class="same-effort-basis"><summary>Datagrunnlag</summary>
        <p>${escapeHtml(formatDate(baseline.from))}–${escapeHtml(formatDate(baseline.to))} mot ${escapeHtml(formatDate(recent.from))}–${escapeHtml(formatDate(recent.to))}. Medianpuls skilte ${escapeHtml(String(Math.abs(comparison.heartRateDifference || 0)))} bpm.</p>
        <small>Kun rolige løpeøkter uten registrerte kroppssignaler. ${comparison.paceSource === 'gap' ? 'Utendørs sammenlignes med GAP.' : 'Sammenligningen bruker ordinær pace.'}</small>
      </details>
    </article>`;
  }

  function sameEffortSettingStatus(comparison = {}) {
    const label = comparison.setting === 'treadmill' ? 'Tredemølle' : 'Utendørs';
    const source = comparison.paceSource === 'gap' ? 'GAP' : 'pace';
    const candidates = Number(comparison.candidateCount || 0);
    const eligible = Number(comparison.eligibleCount || 0);
    if (comparison.status === 'ready') {
      return `<div><strong>${escapeHtml(label)}</strong><span>${escapeHtml(String(candidates))} kandidater · ${escapeHtml(String(eligible))} sammenlignbare · ${escapeHtml(source)}</span></div>`;
    }
    if (comparison.reason === 'heart_rate_gap') {
      const difference = Math.abs(Number(comparison.recent?.medianHeartRate || 0) - Number(comparison.baseline?.medianHeartRate || 0));
      return `<div><strong>${escapeHtml(label)}</strong><span>${escapeHtml(String(candidates))} kandidater · ${escapeHtml(String(eligible))} sammenlignbare · medianpulsen skiller ${escapeHtml(String(difference))} bpm</span></div>`;
    }
    if (comparison.reason === 'duration_gap') {
      return `<div><strong>${escapeHtml(label)}</strong><span>${escapeHtml(String(candidates))} kandidater · ${escapeHtml(String(eligible))} sammenlignbare · periodene har for ulik varighet</span></div>`;
    }
    return `<div><strong>${escapeHtml(label)}</strong><span>${escapeHtml(String(candidates))} kandidater · ${escapeHtml(String(eligible))} sammenlignbare av minst 8 · ${escapeHtml(source)}</span></div>`;
  }

  function sameEffortRejectedHtml(rejected = {}) {
    const labels = {
      not_easy: 'ikke klassifisert som rolig/base',
      missing_setting: 'mangler utendørs/tredemølle',
      body_signal: 'har smerte eller aktiv tilpasning',
      high_rpe: 'har RPE 7+ uten kvalitetsintensjon',
      duration_distance: 'har varighet eller distanse utenfor sammenligningsområdet',
      heart_rate: 'mangler gyldig snittpuls',
      pace: 'mangler gyldig pace'
    };
    const rows = Object.entries(rejected)
      .filter(([reason, count]) => labels[reason] && Number(count) > 0)
      .sort((left, right) => Number(right[1]) - Number(left[1]));
    if (!rows.length) return '';
    return `<ul class="same-effort-rejections">${rows.map(([reason, count]) => `<li><strong>${escapeHtml(String(count))}</strong> ${escapeHtml(labels[reason])}</li>`).join('')}</ul>`;
  }

  function sameEffortDiagnosticsHtml(insight = {}, { expanded = false } = {}) {
    const diagnostics = insight.diagnostics || {};
    const comparisons = insight.comparisons || [];
    return `<details class="same-effort-diagnostics"${expanded ? ' open' : ''}>
      <summary>Hvorfor disse øktene teller</summary>
      <div class="same-effort-diagnostic-summary"><strong>${escapeHtml(String(diagnostics.runningCount || 0))} løpeøkter vurdert</strong><span>${escapeHtml(String(diagnostics.candidateCount || 0))} oppfyller grunnkravene</span></div>
      <div class="same-effort-setting-status">${comparisons.map(sameEffortSettingStatus).join('')}</div>
      ${sameEffortRejectedHtml(diagnostics.rejectedReasons)}
      <small>En økt kan bare få én avvisningsgrunn. RPE 6 kan inngå når øktintensjonen ellers er rolig. Utendørsøkter bruker GAP når minst åtte har GAP; ellers brukes pace på relativt flate økter.</small>
    </details>`;
  }

  function renderSameEffortForm(insight = {}) {
    const container = documentRef?.getElementById('insightSameEffortForm');
    if (!container) return;
    const ready = (insight.comparisons || []).filter(item => item.status === 'ready');
    if (!ready.length) {
      const diagnostics = insight.diagnostics || {};
      container.innerHTML = `<div class="same-effort-empty">
        <strong>Sammenligningen trenger et tydeligere datagrunnlag</strong>
        <p>${diagnostics.runningCount ? `${escapeHtml(String(diagnostics.runningCount))} løpeøkter er vurdert, og ${escapeHtml(String(diagnostics.candidateCount || 0))} oppfyller alle grunnkrav før periodene sammenlignes.` : 'Når rolige løpeøkter har puls, pace og aktivitetsmiljø, kan utviklingen vises her.'}</p>
        ${sameEffortDiagnosticsHtml(insight, { expanded: true })}
        <small>Manglende grunnlag betyr ikke svak form.</small>
      </div>`;
      return;
    }
    container.innerHTML = `<div class="same-effort-list">${ready.map(sameEffortComparisonHtml).join('')}</div>
      <p class="same-effort-disclaimer">Viser respons i sammenlignbare rolige økter – ikke en generell formscore eller et råd om å øke belastningen.</p>
      ${sameEffortDiagnosticsHtml(insight)}`;
  }

  return { bind, closeMilestoneOverview, renderYearToDate, renderSameEffortForm };
}
