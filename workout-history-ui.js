import {
  formatHeartRateZoneDuration,
  heartRateValueContext,
  heartRateZoneDistributionRows,
  normalizeHeartRateZoneDistribution
} from './domain-heart-rate-zones.js';
import { buildWorkoutCoachAssessment } from './domain-workout-assessment.js';
import { activitySettingForCompleted, activitySettingLabel } from './domain-activity.js';

function normalizedText(value) {
  return String(value || '').trim().toLowerCase();
}

function finiteNumber(value) {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function decimalLabel(value, maximumFractionDigits = 1) {
  const number = finiteNumber(value);
  if (number === null) return '';
  return number.toLocaleString('nb-NO', { maximumFractionDigits });
}

function durationLabel(value) {
  const seconds = finiteNumber(value);
  return seconds === null ? '' : formatHeartRateZoneDuration(seconds);
}

function paceLabel(value) {
  const seconds = finiteNumber(value);
  if (seconds === null || seconds <= 0) return '';
  const rounded = Math.round(seconds);
  const minutes = Math.floor(rounded / 60);
  return `${minutes}:${String(rounded % 60).padStart(2, '0')} min/km`;
}

function localStartTimeLabel(value) {
  const match = String(value || '').match(/T(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : '';
}

function detailValue(label, value) {
  return value ? { label, value } : null;
}

function compactDetailValues(values) {
  return values.filter(Boolean);
}

export function workoutActivityDetails(completed = {}) {
  const activity = completed?.externalData?.garmin || {};
  const pace = activity.pace || {};
  const cadence = activity.cadence || {};
  const respiration = activity.respiration || {};
  const temperature = activity.temperatureC || {};
  const elevation = activity.elevationM || {};

  return {
    timing: compactDetailValues([
      detailValue('Starttid', localStartTimeLabel(activity.startedAtLocal)),
      detailValue('Tid i bevegelse', durationLabel(activity.movingTimeSeconds)),
      detailValue('Total tid', durationLabel(activity.elapsedTimeSeconds)),
      detailValue('Runder', decimalLabel(activity.numberOfLaps, 0))
    ]),
    load: compactDetailValues([
      detailValue('Aerob treningseffekt', decimalLabel(activity.aerobicTrainingEffect)),
      detailValue('Treningsbelastning (TSS)', decimalLabel(activity.trainingStressScore))
    ]),
    breathing: compactDetailValues([
      detailValue('Gjennomsnittlig pustefrekvens', respiration.average === undefined ? '' : `${decimalLabel(respiration.average)} pust/min`),
      detailValue('Laveste pustefrekvens', respiration.min === undefined ? '' : `${decimalLabel(respiration.min)} pust/min`),
      detailValue('Høyeste pustefrekvens', respiration.max === undefined ? '' : `${decimalLabel(respiration.max)} pust/min`)
    ]),
    speed: compactDetailValues([
      detailValue('Beste tempo', paceLabel(pace.bestPaceSecondsPerKm)),
      detailValue('Snitt GAP', paceLabel(pace.averageGapSecondsPerKm)),
      detailValue('Maksfart', pace.maxSpeedKmh === undefined ? '' : `${decimalLabel(pace.maxSpeedKmh)} km/t`),
      detailValue('Snittempo per 100 m', pace.averagePaceSecondsPer100m === undefined ? '' : `${durationLabel(pace.averagePaceSecondsPer100m)} min/100 m`),
      detailValue('Beste tempo per 100 m', pace.bestPaceSecondsPer100m === undefined ? '' : `${durationLabel(pace.bestPaceSecondsPer100m)} min/100 m`)
    ]),
    runningDynamics: compactDetailValues([
      detailValue('Gjennomsnittlig kadens', cadence.averageSpm === undefined ? '' : `${decimalLabel(cadence.averageSpm, 0)} steg/min`),
      detailValue('Maksimal kadens', cadence.maxSpm === undefined ? '' : `${decimalLabel(cadence.maxSpm, 0)} steg/min`),
      detailValue('Steg', decimalLabel(activity.steps, 0)),
      detailValue('Steglengde', activity.strideLengthM === undefined ? '' : `${decimalLabel(activity.strideLengthM, 2)} m`),
      detailValue('Vertikalt forhold', activity.verticalRatioPercent === undefined ? '' : `${decimalLabel(activity.verticalRatioPercent)} %`),
      detailValue('Vertikal bevegelse', activity.verticalOscillationCm === undefined ? '' : `${decimalLabel(activity.verticalOscillationCm)} cm`),
      detailValue('Bakkekontakttid', activity.groundContactTimeMs === undefined ? '' : `${decimalLabel(activity.groundContactTimeMs, 0)} ms`)
    ]),
    terrain: compactDetailValues([
      detailValue('Stigning', completed.elevationGainM ? `${decimalLabel(completed.elevationGainM)} hm` : ''),
      detailValue('Nedstigning', activity.totalDescentM === undefined ? '' : `${decimalLabel(activity.totalDescentM)} hm`),
      detailValue('Laveste høyde', elevation.min === undefined ? '' : `${decimalLabel(elevation.min)} moh.`),
      detailValue('Høyeste høyde', elevation.max === undefined ? '' : `${decimalLabel(elevation.max)} moh.`),
      detailValue('Møllestigning', completed.treadmillInclinePercent ? `${decimalLabel(completed.treadmillInclinePercent)} %` : '')
    ]),
    power: compactDetailValues([
      detailValue('Gjennomsnittseffekt', activity.averagePowerW === undefined ? '' : `${decimalLabel(activity.averagePowerW, 0)} W`),
      detailValue('Maksimal effekt', activity.maxPowerW === undefined ? '' : `${decimalLabel(activity.maxPowerW, 0)} W`),
      detailValue('Normalisert effekt', activity.normalizedPowerW === undefined ? '' : `${decimalLabel(activity.normalizedPowerW, 0)} W`)
    ]),
    energyAndEnvironment: compactDetailValues([
      detailValue('Energi', activity.calories === undefined ? '' : `${decimalLabel(activity.calories, 0)} kcal`),
      detailValue('Body Battery-endring', decimalLabel(activity.bodyBatteryDrain)),
      detailValue('Laveste temperatur', temperature.min === undefined ? '' : `${decimalLabel(temperature.min)} °C`),
      detailValue('Høyeste temperatur', temperature.max === undefined ? '' : `${decimalLabel(temperature.max)} °C`)
    ]),
    swimming: compactDetailValues([
      detailValue('Svømmetak', decimalLabel(activity.totalStrokes, 0)),
      detailValue('Gjennomsnittlig SWOLF', decimalLabel(activity.averageSwolf)),
      detailValue('Gjennomsnittlig takfrekvens', activity.averageStrokeRate === undefined ? '' : `${decimalLabel(activity.averageStrokeRate)} tak/min`)
    ]),
    strength: compactDetailValues([
      detailValue('Sett', decimalLabel(activity.totalSets, 0)),
      detailValue('Repetisjoner', decimalLabel(activity.totalReps, 0))
    ])
  };
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
  const activitySetting = filters.activitySetting || 'all';
  if (activitySetting !== 'all') {
    items = items.filter(item => {
      const setting = activitySettingForCompleted(item);
      return activitySetting === 'missing' ? !setting : setting === activitySetting;
    });
  }
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
  heartRateReferenceForCompleted,
  heartRateZoneCompliance,
  structuredWorkoutSummaryHtml,
  exercisePlanSummaryHtml,
  templateCalendarKind,
  uniqueValues,
  aiAssessmentState,
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

  function detailDataGrid(values = []) {
    if (!values.length) return '';
    return `<div class="detail-data-grid">${values.map(item => `
      <div class="detail-data-item"><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.value)}</strong></div>
    `).join('')}</div>`;
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
        <div class="heart-rate-zone-value"><span>${escapeHtml(formatHeartRateZoneDuration(row.seconds))}</span><strong>${escapeHtml(row.percent)} %</strong></div>
        <div class="heart-rate-zone-track"><span style="width:${Math.max(0, Math.min(100, row.percent))}%"></span></div>
      </div>`).join('')}
    </div>`;
  }

  function heartRateZoneComplianceHtml(completed) {
    if (!normalizeHeartRateZoneDistribution(completed.heartRateZoneDistribution)) return '';
    const result = heartRateZoneCompliance?.(completed);
    if (!result) return '';
    const confidence = { high: 'høy', medium: 'middels', low: 'lav' }[result.confidence] || 'lav';
    return `<div class="zone-compliance-detail status-${escapeHtml(result.status)}">
      <div class="zone-compliance-detail-head">
        <strong>${escapeHtml(result.label)}</strong>
        <span>${escapeHtml(confidence)} vurderingssikkerhet</span>
      </div>
      <p>${escapeHtml(result.summary)}</p>
      ${result.reasons?.length ? `<ul>${result.reasons.slice(0, 2).map(reason => `<li>${escapeHtml(reason)}</li>`).join('')}</ul>` : ''}
      <small>RPE og kroppssignaler veier tyngre enn soneprosentene.</small>
    </div>`;
  }

  function heartRateSummaryHtml(completed, reference) {
    const cards = [
      { label: 'Snittpuls', value: completed.avgHeartRate },
      { label: 'Makspuls', value: completed.maxHeartRate }
    ].filter(item => Number(item.value) > 0).map(item => {
      const context = heartRateValueContext(item.value, reference);
      const details = [
        context?.zone?.label || '',
        context?.maxPercent !== null && context?.maxPercent !== undefined ? `${context.maxPercent} % av maks` : '',
        context?.thresholdPercent !== null && context?.thresholdPercent !== undefined ? `${context.thresholdPercent} % av terskel` : ''
      ].filter(Boolean).join(' · ');
      return `<div class="heart-rate-summary-card">
        <span>${escapeHtml(item.label)}</span>
        <strong>${escapeHtml(`${Math.round(Number(item.value))} bpm`)}</strong>
        ${details ? `<small>${escapeHtml(details)}</small>` : ''}
      </div>`;
    });
    const goldenZone = reference.goldenZone;
    if (!cards.length && !goldenZone) return '';
    return `<div class="heart-rate-summary-grid">${cards.join('')}</div>
      ${goldenZone ? `<div class="heart-rate-golden-chip">Gyllen sone ${escapeHtml(`${goldenZone.low}–${goldenZone.high} bpm`)}</div>` : ''}`;
  }

  function coachAssessmentHtml(result) {
    return `<div class="workout-coach-assessment">
      <strong class="workout-coach-headline">${escapeHtml(result.headline)}</strong>
      <div><span>Hva økten viser</span><p>${escapeHtml(result.evidence)}</p></div>
      <div><span>Samsvar med planen</span><p>${escapeHtml(result.planFit)}</p></div>
      <div><span>Neste steg</span><p>${escapeHtml(result.nextStep)}</p></div>
    </div>`;
  }

  function aiCoachAssessmentHtml(completed) {
    const state = aiAssessmentState?.(completed) || {};
    const result = state.assessment;
    if (!result) {
      return `<div class="ai-workout-assessment empty">
        <p>Be AI-coachen vurdere økten opp mot målet, planen og treningsbelastningen din.</p>
        <button class="btn-primary ai-workout-assessment-btn" data-workout-id="${escapeHtml(completed.id)}" onclick="requestAiWorkoutAssessment('${completed.id}')">Få AI-vurdering</button>
      </div>`;
    }
    return `<div class="ai-workout-assessment${state.stale ? ' stale' : ''}">
      ${state.stale ? '<div class="ai-assessment-stale">Øktgrunnlaget er endret siden denne vurderingen ble laget.</div>' : ''}
      <strong class="workout-coach-headline">${escapeHtml(result.headline)}</strong>
      <div><span>Observasjoner</span><ul>${result.evidence.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>
      <div><span>Samsvar med planen</span><p>${escapeHtml(result.planFit)}</p></div>
      <div><span>Neste steg</span><p>${escapeHtml(result.nextStep)}</p></div>
      ${result.uncertainty ? `<div><span>Usikkerhet</span><p>${escapeHtml(result.uncertainty)}</p></div>` : ''}
      <div class="ai-assessment-meta">${escapeHtml([result.modelLabel, result.generatedAt ? new Date(result.generatedAt).toLocaleString('nb-NO') : ''].filter(Boolean).join(' · '))}</div>
      <button class="btn-soft ai-workout-assessment-btn" data-workout-id="${escapeHtml(completed.id)}" onclick="requestAiWorkoutAssessment('${completed.id}')">Vurder på nytt</button>
    </div>`;
  }

  function detailHtml(completed) {
    const template = completedTemplate(completed);
    const state = getState();
    const profile = normalizeTrainingProfile(state.settings.trainingProfile);
    const pace = completedPaceMetrics(completed);
    const assessment = completedLoadAssessment(completed);
    const trainingEffect = trainingEffectInfo(completed.trainingEffectType);
    const activityDetails = workoutActivityDetails(completed);
    const heartRateReference = heartRateReferenceForCompleted(completed);
    const zoneCompliance = heartRateZoneCompliance?.(completed);
    const coachAssessment = buildWorkoutCoachAssessment({
      completed,
      template,
      loadAssessment: assessment,
      zoneCompliance,
      trainingProfile: profile
    });
    const heartRateSummary = heartRateSummaryHtml(completed, heartRateReference);
    const settingLabel = activitySettingLabel(activitySettingForCompleted(completed));
    return `
      <div class="detail-hero">
        <div class="detail-hero-heading">
          <div class="detail-hero-copy">
            <span class="tag done">Utført</span>
            <h2 id="workoutDetailTitle">${escapeHtml(template.name)}</h2>
            <p>${formatDate(completed.date)} · ${escapeHtml(template.type)}${template.intensity ? ` · ${escapeHtml(template.intensity)}` : ''}${settingLabel ? ` · ${escapeHtml(settingLabel)}` : ''}</p>
          </div>
          <button type="button" class="btn-icon detail-modal-close" data-workout-detail-close onclick="closeWorkoutDetailModal()" aria-label="Lukk øktdetaljer">×</button>
        </div>
      </div>
      <div class="detail-metrics-grid">
        ${detailMetric('Varighet', completedDurationLabel(completed))}
        ${detailMetric('Distanse', completed.distanceKm ? `${completed.distanceKm} km` : '')}
        ${detailMetric('Pace', pace.paceDisplay ? `${pace.paceDisplay} min/km` : '')}
        ${detailMetric('Fart', pace.averageSpeedKmh ? `${pace.averageSpeedKmh} km/t` : '')}
      </div>
      ${detailSection('Tid og bevegelse', detailDataGrid(activityDetails.timing))}
      ${detailSection('Belastning', `
        <div class="load-assessment ${assessment.level}"><span class="tag load-${assessment.level}">${escapeHtml(assessment.label)}</span><p>${escapeHtml(assessment.reason)}</p></div>
        ${trainingEffect ? `<p class="detail-text"><strong>Treningseffekt:</strong> ${escapeHtml(trainingEffect.label)} · ${escapeHtml(trainingEffect.categoryLabel)}</p>` : ''}
        ${completed.rpe ? `<p class="detail-text"><strong>Opplevd intensitet:</strong> ${escapeHtml(completed.rpe)}/10</p>` : ''}
        ${detailDataGrid(activityDetails.load)}`)}
      ${detailSection(activityDetails.breathing.length ? 'Puls og pust' : 'Puls', `${heartRateSummary}${detailDataGrid(activityDetails.breathing)}`)}
      ${detailSection('Tid i pulssoner', heartRateZoneDistributionHtml(completed))}
      ${detailSection('Fart og tempo', detailDataGrid(activityDetails.speed))}
      ${detailSection('Løpsdynamikk', detailDataGrid(activityDetails.runningDynamics))}
      ${detailSection('Terreng og høyde', detailDataGrid(activityDetails.terrain))}
      ${detailSection('Effekt', detailDataGrid(activityDetails.power))}
      ${detailSection('Energi og omgivelser', detailDataGrid(activityDetails.energyAndEnvironment))}
      ${detailSection('Svømming', detailDataGrid(activityDetails.swimming))}
      ${detailSection('Styrke', detailDataGrid(activityDetails.strength))}
      ${detailSection('Etterlevelse av plan', heartRateZoneComplianceHtml(completed))}
      ${detailSection('Strukturert intervall', structuredWorkoutSummaryHtml(template.structuredWorkout))}
      ${detailSection('Øvelsesplan', exercisePlanSummaryHtml(template.exercisePlan))}
      ${detailSection('Øktlenke', template.sourceUrl
        ? `<a href="${escapeHtml(template.sourceUrl)}" target="_blank" rel="noopener noreferrer">Åpne demonstrasjon</a>`
        : '')}
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
      ${detailSection('Coach-vurdering', coachAssessmentHtml(coachAssessment))}
      ${detailSection('AI-vurdering', aiCoachAssessmentHtml(completed))}
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
    const settingLabel = activitySettingLabel(activitySettingForCompleted(completed));
    const meta = [template.type, template.intensity, settingLabel].filter(Boolean).join(' · ');
    return `<div class="history-row history-kind-${escapeHtml(kind.key)}" role="button" tabindex="0" onclick="openWorkoutDetail('${completed.id}')" onkeydown="if(event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openWorkoutDetail('${completed.id}'); }">
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
      activitySettingLabel(activitySettingForCompleted(completed)),
      feelingLabel(completed.feelingScore), trainingEffectInfo(completed.trainingEffectType)?.label,
      completedLoadAssessment(completed).label].filter(Boolean).join(' ');
  }

  function currentFilters() {
    const period = element('historyPeriod')?.value || 'all';
    const range = workoutHistoryPeriodRange(period, todayISO(), element('historyFromDate')?.value, element('historyToDate')?.value);
    return {
      type: element('historyFilter')?.value || 'Alle', sort: element('historySort')?.value || 'desc', period,
      activitySetting: element('historyActivitySetting')?.value || 'all',
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
    return [filters.search.trim(), filters.period !== 'all', filters.type !== 'Alle', filters.activitySetting !== 'all', filters.effect !== 'all', filters.load !== 'all', filters.bodySignal !== 'all']
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
