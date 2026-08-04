import {
  formatHeartRateZoneDuration,
  heartRateZoneDistributionRows,
  normalizeHeartRateZoneDistribution
} from './domain-heart-rate-zones.js';

function normalizedText(value) {
  return String(value || '').trim().toLowerCase();
}

export function workoutHistoryPeriodRange(period, today, customFrom = '', customTo = '') {
  const addDays = (iso, offset) => {
    const date = new Date(`${iso}T12:00:00`);
    date.setDate(date.getDate() + offset);
    return date.toISOString().slice(0, 10);
  };
  if (period === '7') return { from: addDays(today, -6), to: today };
  if (period === '28') return { from: addDays(today, -27), to: today };
  if (period === 'month') return { from: `${today.slice(0, 8)}01`, to: today };
  if (period === 'custom') return { from: customFrom || '', to: customTo || '' };
  return { from: '', to: '' };
}

export function filterWorkoutHistory({
  completed = [],
  filters = {},
  resolveTemplate = () => ({}),
  resolveTrainingEffectCategory = () => '',
  resolveLoadLevel = () => '',
  hasBodySignal = () => false,
  searchText = () => ''
} = {}) {
  const type = filters.type || 'Alle';
  const effect = filters.effect || 'all';
  const load = filters.load || 'all';
  const bodySignal = filters.bodySignal || 'all';
  const query = normalizedText(filters.search);
  const from = filters.from || '';
  const to = filters.to || '';
  let items = [...completed];
  if (type !== 'Alle') items = items.filter(item => resolveTemplate(item).type === type);
  if (from) items = items.filter(item => String(item.date || '') >= from);
  if (to) items = items.filter(item => String(item.date || '') <= to);
  if (effect !== 'all') {
    items = items.filter(item => {
      const category = resolveTrainingEffectCategory(item);
      return effect === 'missing' ? !category : category === effect;
    });
  }
  if (load !== 'all') items = items.filter(item => resolveLoadLevel(item) === load);
  if (bodySignal !== 'all') items = items.filter(item => hasBodySignal(item) === (bodySignal === 'yes'));
  if (query) items = items.filter(item => normalizedText(searchText(item)).includes(query));
  items.sort((a, b) => (filters.sort || 'desc') === 'desc'
    ? String(b.date || '').localeCompare(String(a.date || ''))
    : String(a.date || '').localeCompare(String(b.date || '')));
  return items;
}

export function createWorkoutHistoryUi({
  getState,
  documentRef = globalThis.document,
  escapeHtml,
  formatDate,
  formatRaceTime,
  raceDistanceLabel,
  normalizeRaceResult,
  normalizePersonProfile,
  normalizeTrainingProfile,
  completedTemplate,
  completedDurationLabel,
  completedPaceMetrics,
  completedLoadAssessment,
  executionLabel,
  feelingLabel,
  readinessLabel,
  bodyStatusLabel,
  trainingEffectInfo,
  trainingEffectCategory,
  heartRateContextLabel,
  lastWorkoutCoachNote,
  structuredWorkoutSummaryHtml,
  exercisePlanSummaryHtml,
  templateCalendarKind,
  uniqueValues,
  todayISO
}) {
  function element(id) {
    return documentRef.getElementById(id);
  }

  function detailMetric(label, value) {
    return value ? `<div class="detail-metric"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>` : '';
  }

  function detailSection(title, html) {
    return html ? `<section class="detail-section"><h3>${escapeHtml(title)}</h3>${html}</section>` : '';
  }

  function detailLine(label, value) {
    return value ? `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>` : '';
  }

  function raceResultDetailHtml(completed) {
    const race = normalizeRaceResult(completed.raceResult);
    if (!race) return '';
    return [
      detailLine('Løp', race.name || completedTemplate(completed).name),
      detailLine('Distanse', raceDistanceLabel(race.distanceKm)),
      detailLine('Resultat', formatRaceTime(race.resultSeconds)),
      detailLine('Løype/sted', race.course),
      detailLine('PB', race.countsAsPersonalBest === false ? 'Teller ikke' : 'Teller mot bestenoteringer'),
      detailLine('Notat', race.note)
    ].join('');
  }

  function heartRateZoneDistributionHtml(completed) {
    const distribution = normalizeHeartRateZoneDistribution(completed.heartRateZoneDistribution);
    if (!distribution) return '';
    const rows = heartRateZoneDistributionRows(distribution, completed.durationSeconds || 0).reverse();
    return `<div class="heart-rate-zone-chart">
      ${rows.map(row => `<div class="heart-rate-zone-row zone-${escapeHtml(row.zoneId)}">
        <div class="heart-rate-zone-label"><strong>${escapeHtml(row.label)}</strong><span>${escapeHtml(row.range)}</span></div>
        <div class="heart-rate-zone-value"><span>${row.estimated ? 'ca. ' : ''}${escapeHtml(formatHeartRateZoneDuration(row.seconds))}</span><strong>${escapeHtml(row.percent)} %</strong></div>
        <div class="heart-rate-zone-track"><span style="width:${Math.max(0, Math.min(100, row.percent))}%"></span></div>
      </div>`).join('')}
      <p class="heart-rate-zone-source">${escapeHtml(distribution.zoneSetSnapshot?.name || 'Lagret pulssoneprofil')} · ${escapeHtml(distribution.totalPercent)} % registrert${rows.some(row => row.estimated) ? ' · tid er estimert fra prosent' : ''}</p>
    </div>`;
  }

  function detailHtml(completed) {
    const template = completedTemplate(completed);
    const state = getState();
    const personProfile = normalizePersonProfile(state.settings.personProfile);
    const profile = normalizeTrainingProfile(state.settings.trainingProfile);
    const pace = completedPaceMetrics(completed);
    const assessment = completedLoadAssessment(completed);
    const trainingEffect = trainingEffectInfo(completed.trainingEffectType);
    const coachNote = lastWorkoutCoachNote(completed, profile).replace(/^Siste økt/, 'Denne økten');
    const heartRateLines = [
      detailLine('Snittpuls', completed.avgHeartRate ? `${completed.avgHeartRate} bpm${heartRateContextLabel(completed.avgHeartRate, personProfile, true)}` : ''),
      detailLine('Makspuls økt', completed.maxHeartRate ? `${completed.maxHeartRate} bpm${heartRateContextLabel(completed.maxHeartRate, personProfile)}` : ''),
      detailLine('Din maks/terskel', personProfile.maxHeartRate || personProfile.thresholdHeartRate
        ? `${personProfile.maxHeartRate || '-'} / ${personProfile.thresholdHeartRate || '-'} bpm` : '')
    ].join('');
    return `
      <div class="detail-hero">
        <span class="tag done">Utført</span>
        <h2>${escapeHtml(template.name)}</h2>
        <p>${formatDate(completed.date)} · ${escapeHtml(template.type)}${template.intensity ? ` · ${escapeHtml(template.intensity)}` : ''}</p>
      </div>
      <div class="detail-metrics-grid">
        ${detailMetric('Varighet', completedDurationLabel(completed))}
        ${detailMetric('Distanse', completed.distanceKm ? `${completed.distanceKm} km` : '')}
        ${detailMetric('Pace', pace.paceDisplay ? `${pace.paceDisplay} min/km` : '')}
        ${detailMetric('Fart', pace.averageSpeedKmh ? `${pace.averageSpeedKmh} km/t` : '')}
      </div>
      ${detailSection('Belastning', `
        <div class="load-assessment ${assessment.level}"><span class="tag load-${assessment.level}">${escapeHtml(assessment.label)}</span><p>${escapeHtml(assessment.reason)}</p></div>
        ${trainingEffect ? `<p class="detail-text"><strong>Garmin:</strong> ${escapeHtml(trainingEffect.label)} · ${escapeHtml(trainingEffect.categoryLabel)}</p>` : ''}
        ${completed.rpe ? `<p class="detail-text"><strong>Opplevd intensitet:</strong> ${escapeHtml(completed.rpe)}/10</p>` : ''}`)}
      ${detailSection('Puls', heartRateLines)}
      ${detailSection('Tid i pulssoner', heartRateZoneDistributionHtml(completed))}
      ${detailSection('Strukturert intervall', structuredWorkoutSummaryHtml(template.structuredWorkout))}
      ${detailSection('Styrkeøvelser', exercisePlanSummaryHtml(template.exercisePlan))}
      ${detailSection('Øktlenke', template.sourceUrl
        ? `<a href="${escapeHtml(template.sourceUrl)}" target="_blank" rel="noopener noreferrer">Åpne demonstrasjon</a>`
        : '')}
      ${detailSection('Terreng og stigning', [
        detailLine('Høydemeter', completed.elevationGainM ? `${completed.elevationGainM} hm` : ''),
        detailLine('Møllestigning', completed.treadmillInclinePercent ? `${completed.treadmillInclinePercent}%` : '')
      ].join(''))}
      ${detailSection('Konkurranse / testløp', raceResultDetailHtml(completed))}
      ${detailSection('Gjennomføring', [
        detailLine('Gjennomføring', executionLabel(completed.execution)),
        detailLine('Følelse etter økt', feelingLabel(completed.feelingScore)),
        detailLine('Dagsform før økt', readinessLabel(completed.readiness))
      ].join(''))}
      ${detailSection('Kropp og tilpasning', [
        detailLine('Status', bodyStatusLabel(completed.bodyStatus)),
        detailLine('Kroppsnotat', completed.bodyStatus?.notes || '')
      ].join(''))}
      ${detailSection('Coach-notat', `<p>${escapeHtml(coachNote)}</p>`)}
      ${detailSection('Egne notater', completed.notes ? `<p>${escapeHtml(completed.notes)}</p>` : '')}
      <div class="button-row">
        <button class="btn-primary" onclick="editCompleted('${completed.id}'); closeWorkoutDetailModal();">Rediger</button>
        <button class="btn-soft" onclick="closeWorkoutDetailModal()">Lukk</button>
      </div>
      <div class="detail-danger-row"><button class="btn-subtle-danger" onclick="undoComplete('${completed.id}')">${completed.plannedWorkoutId ? 'Angre utført' : 'Slett fra logg'}</button></div>`;
  }

  function intensityStripeClass(intensity) {
    if (['Rolig', 'Restitusjon', 'Mobilitet'].includes(intensity)) return 'easy';
    if (['Tempo', 'Terskel'].includes(intensity)) return 'medium';
    if (['Intervall', 'Anaerob'].includes(intensity)) return 'hard';
    if (intensity === 'Styrke') return 'strength';
    return 'neutral';
  }

  function painText(bodyStatus = {}) {
    const before = Number(bodyStatus.painBefore || 0);
    const after = Number(bodyStatus.painAfter || 0);
    if (!before && !after) return '';
    if (before && after) return `Smerte ${before}->${after} (${after > before ? 'opp' : after < before ? 'ned' : 'stabil'})`;
    return `Smerte ${before || after}/10`;
  }

  function priorityChip(completed, template, kind, assessment, pain) {
    const race = normalizeRaceResult(completed.raceResult);
    if (race) return { className: 'race', label: race.resultSeconds ? `Race ${formatRaceTime(race.resultSeconds)}` : 'Race/test' };
    if (pain || (completed.bodyStatus?.adaptation && completed.bodyStatus.adaptation !== 'none')) return { className: 'signal', label: pain || 'Kroppssignal' };
    if (assessment.level === 'high') return { className: 'load-high', label: 'Høy belastning' };
    if (template.structuredWorkout) return { className: 'neutral', label: 'Strukturert' };
    if (kind.key === 'quality') return { className: 'kind-quality', label: 'Kvalitet' };
    return null;
  }

  function row(completed) {
    const template = completedTemplate(completed);
    const kind = templateCalendarKind(template);
    const metrics = [
      completed.distanceKm ? `${completed.distanceKm} km` : '',
      completedDurationLabel(completed),
      completed.avgHeartRate ? `${completed.avgHeartRate} bpm` : ''
    ].filter(Boolean).join(' · ');
    const assessment = completedLoadAssessment(completed);
    const pain = painText(completed.bodyStatus || {});
    const chip = priorityChip(completed, template, kind, assessment, pain);
    const stripeClass = kind.key === 'race' ? 'race' : kind.key === 'quality' ? 'medium' : intensityStripeClass(template.intensity);
    const meta = [template.type, template.intensity].filter(Boolean).join(' · ');
    return `<div class="history-row history-kind-${escapeHtml(kind.key)}" onclick="openWorkoutDetail('${completed.id}')">
      <div class="history-row-stripe stripe-${stripeClass}"></div>
      <div class="history-row-body"><div class="history-row-head"><div>
        <div class="history-row-title">${escapeHtml(template.name)}</div>
        <div class="history-row-date">${formatDate(completed.date)}${meta ? ` · ${escapeHtml(meta)}` : ''}</div>
      </div></div><div class="history-row-bottom">
        <span class="history-row-metrics">${escapeHtml(metrics || 'Ingen nøkkeltall')}</span>
        ${chip ? `<span class="history-chip ${escapeHtml(chip.className)}">${escapeHtml(chip.label)}</span>` : ''}
      </div></div><div class="history-row-chevron">›</div></div>`;
  }

  function hasBodySignal(completed) {
    const body = completed.bodyStatus || {};
    return Boolean(body.painBefore || body.painAfter || body.area || body.notes || (body.adaptation && body.adaptation !== 'none'));
  }

  function searchText(completed) {
    const template = completedTemplate(completed);
    return [template.name, template.type, template.intensity, template.structure, completed.manualName, completed.notes,
      completed.raceResult?.name, completed.raceResult?.course, completed.raceResult?.note,
      completed.raceResult?.resultSeconds ? formatRaceTime(completed.raceResult.resultSeconds) : '',
      completed.bodyStatus?.area, completed.bodyStatus?.notes, executionLabel(completed.execution),
      feelingLabel(completed.feelingScore), trainingEffectInfo(completed.trainingEffectType)?.label,
      completedLoadAssessment(completed).label].filter(Boolean).join(' ');
  }

  function currentFilters() {
    const period = element('historyPeriod')?.value || 'all';
    const range = workoutHistoryPeriodRange(period, todayISO(), element('historyFromDate')?.value, element('historyToDate')?.value);
    return {
      type: element('historyFilter')?.value || 'Alle', sort: element('historySort')?.value || 'desc', period,
      effect: element('historyEffect')?.value || 'all', load: element('historyLoad')?.value || 'all',
      bodySignal: element('historyBodySignal')?.value || 'all', search: element('historySearch')?.value || '', ...range
    };
  }

  function filtered() {
    return filterWorkoutHistory({
      completed: getState().completed,
      filters: currentFilters(),
      resolveTemplate: completedTemplate,
      resolveTrainingEffectCategory: item => item.trainingEffectCategory || trainingEffectCategory(item.trainingEffectType),
      resolveLoadLevel: item => completedLoadAssessment(item).level,
      hasBodySignal,
      searchText
    });
  }

  function renderFilterOptions() {
    const select = element('historyFilter');
    if (!select) return;
    const state = getState();
    const selected = select.value || 'Alle';
    const values = ['Alle', ...uniqueValues([...(state.settings.activityTypes || []), ...state.templates.map(template => template.type)])];
    select.innerHTML = values.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('');
    select.value = values.includes(selected) ? selected : 'Alle';
  }

  function activeFilterCount() {
    const filters = currentFilters();
    return [filters.search.trim(), filters.period !== 'all', filters.type !== 'Alle', filters.effect !== 'all', filters.load !== 'all', filters.bodySignal !== 'all']
      .filter(Boolean).length;
  }

  function renderSummary(items) {
    const customRange = element('historyCustomRange');
    if (customRange) customRange.classList.toggle('hidden', currentFilters().period !== 'custom');
    const total = getState().completed.length;
    if (element('historyFilterSummary')) {
      element('historyFilterSummary').textContent = total === items.length
        ? `${items.length} økt${items.length === 1 ? '' : 'er'} i historikken.`
        : `Viser ${items.length} av ${total} økt${total === 1 ? '' : 'er'}.`;
    }
    const badge = element('historyFilterBadge');
    if (badge) {
      const count = activeFilterCount();
      badge.textContent = count;
      badge.classList.toggle('hidden', count === 0);
    }
  }

  function renderList() {
    const items = filtered();
    renderSummary(items);
    const list = element('historyList');
    if (list) list.innerHTML = items.length ? items.map(row).join('') : '<div class="empty">Ingen økter matcher filtrene.</div>';
    return items;
  }

  return { detailHtml, filtered, renderFilterOptions, renderList, renderSummary, row };
}
