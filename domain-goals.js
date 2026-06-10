function parseNonNegativeInteger(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function dateToISO(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().slice(0, 10);
}

export const RACE_DISTANCE_PRESETS = [
  { key: '1k', label: '1 km', km: 1 },
  { key: '2k', label: '2 km', km: 2 },
  { key: '3k', label: '3 km', km: 3 },
  { key: '5k', label: '5 km', km: 5 },
  { key: '10k', label: '10 km', km: 10 },
  { key: '12k', label: '12 km', km: 12 },
  { key: 'half_marathon', label: 'Halvmaraton', km: 21.0975 },
  { key: 'marathon', label: 'Maraton', km: 42.195 }
];

export function parseRaceTimeToSeconds(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? Math.round(value) : 0;
  const text = String(value).trim();
  if (!text) return 0;
  if (/^\d+$/.test(text)) return parseNonNegativeInteger(text);
  const parts = text.split(':').map(part => Number.parseInt(part, 10));
  if (parts.some(part => !Number.isFinite(part) || part < 0)) return 0;
  if (parts.length === 2) return (parts[0] * 60) + Math.min(parts[1], 59);
  if (parts.length === 3) return (parts[0] * 3600) + (Math.min(parts[1], 59) * 60) + Math.min(parts[2], 59);
  return 0;
}

export function formatRaceTime(seconds) {
  const total = parseNonNegativeInteger(seconds);
  if (!total) return '';
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainingSeconds = total % 60;
  if (hours) return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

export function normalizeRaceResult(value = {}) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const distanceKm = Number(source.distanceKm) > 0 ? Number(source.distanceKm) : '';
  const resultSeconds = parseRaceTimeToSeconds(source.resultSeconds || source.resultTime || source.time);
  const normalized = {
    name: String(source.name || '').trim(),
    distanceKm,
    resultSeconds: resultSeconds || '',
    course: String(source.course || '').trim(),
    note: String(source.note || '').trim(),
    countsAsPersonalBest: source.countsAsPersonalBest === false ? false : true
  };
  const hasValue = normalized.name || normalized.distanceKm || normalized.resultSeconds || normalized.course || normalized.note;
  return hasValue ? normalized : null;
}

export function raceDistanceLabel(distanceKm) {
  const value = Number(distanceKm) || 0;
  if (!value) return '';
  const preset = RACE_DISTANCE_PRESETS.find(item => Math.abs(item.km - value) < 0.02);
  if (preset) return preset.label;
  return `${value.toLocaleString('no-NO', { maximumFractionDigits: value < 10 ? 2 : 1 })} km`;
}

export function normalizeRaceGoal(value = {}) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const distanceKm = Number(source.distanceKm) > 0 ? Number(source.distanceKm) : '';
  return {
    name: String(source.name || '').trim(),
    date: String(source.date || '').trim(),
    distanceKm,
    targetTimeSeconds: parseRaceTimeToSeconds(source.targetTimeSeconds || source.targetTime || '') || '',
    note: String(source.note || '').trim()
  };
}

export function raceGoalCountdown(goal = {}, todayIso = dateToISO(new Date())) {
  const normalized = normalizeRaceGoal(goal);
  if (!normalized.name && !normalized.date) return null;
  if (!normalized.date) {
    return { ...normalized, daysLeft: null, status: 'missing_date', label: 'Dato ikke satt' };
  }
  const targetMs = new Date(`${normalized.date}T12:00:00`).getTime();
  const todayMs = new Date(`${todayIso}T12:00:00`).getTime();
  const daysLeft = Math.round((targetMs - todayMs) / 86400000);
  const status = daysLeft > 0 ? 'upcoming' : daysLeft === 0 ? 'today' : 'past';
  const label = status === 'upcoming'
    ? `${daysLeft} dager igjen`
    : status === 'today'
    ? 'I dag'
    : `${Math.abs(daysLeft)} dager siden`;
  return { ...normalized, daysLeft, status, label };
}

export function raceResultsFromCompleted(completedItems = []) {
  const items = Array.isArray(completedItems) ? completedItems : [];
  return items
    .map(item => {
      const raceResult = normalizeRaceResult(item.raceResult);
      if (!raceResult?.distanceKm || !raceResult?.resultSeconds) return null;
      return {
        id: item.id || '',
        date: item.date || '',
        workoutName: item.name || item.templateSnapshot?.name || item.manualName || '',
        source: 'completed',
        ...raceResult
      };
    })
    .filter(Boolean)
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
}

export function normalizeRaceResultEntry(value = {}) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const raceResult = normalizeRaceResult(source);
  if (!raceResult?.distanceKm || !raceResult?.resultSeconds) return null;
  return {
    id: String(source.id || ''),
    date: String(source.date || '').trim(),
    source: String(source.source || 'manual').trim() || 'manual',
    createdAt: source.createdAt || '',
    updatedAt: source.updatedAt || '',
    ...raceResult
  };
}

export function normalizeRaceResultEntries(items = []) {
  return Array.isArray(items) ? items.map(normalizeRaceResultEntry).filter(Boolean) : [];
}

export function combinedRaceResults(completedItems = [], manualRaceResults = []) {
  return [
    ...raceResultsFromCompleted(completedItems),
    ...normalizeRaceResultEntries(manualRaceResults)
  ].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
}

export function personalBestSummary(completedItems = [], manualRaceResults = [], presets = RACE_DISTANCE_PRESETS) {
  const raceResults = combinedRaceResults(completedItems, manualRaceResults)
    .filter(result => result.countsAsPersonalBest !== false);
  const entries = presets.map(preset => {
    const history = raceHistoryForDistance(completedItems, manualRaceResults, preset.km);
    return { ...preset, best: history.best, history, trend: history.trend };
  });
  return {
    entries,
    raceResults,
    latest: raceResults[0] || null
  };
}

export function personalBestTrendLabel(trendSeconds = null) {
  if (trendSeconds === null || trendSeconds === undefined) return 'Trenger minst to resultater';
  if (Number(trendSeconds) === 0) return 'Stabilt fra første til siste';
  return Number(trendSeconds) < 0
    ? `${formatRaceTime(Math.abs(Number(trendSeconds)))} raskere fra første til siste`
    : `${formatRaceTime(Number(trendSeconds))} saktere fra første til siste`;
}

export function personalBestTrendSummary(results = []) {
  const sorted = Array.isArray(results)
    ? results
        .filter(result => Number(result.resultSeconds) > 0)
        .slice()
        .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')))
    : [];
  const best = sorted.slice().sort((a, b) => Number(a.resultSeconds) - Number(b.resultSeconds))[0] || null;
  const first = sorted[0] || null;
  const latest = sorted[sorted.length - 1] || null;
  const trendSeconds = first && latest && first !== latest
    ? Number(latest.resultSeconds) - Number(first.resultSeconds)
    : null;
  const bestGapSeconds = best && latest ? Number(latest.resultSeconds) - Number(best.resultSeconds) : null;
  const bestGapPercent = best && latest && Number(best.resultSeconds) > 0
    ? Math.round((bestGapSeconds / Number(best.resultSeconds)) * 1000) / 10
    : null;
  const latestIsBest = Boolean(best && latest && Number(latest.resultSeconds) === Number(best.resultSeconds));
  const nearBest = Boolean(!latestIsBest && bestGapSeconds !== null && bestGapSeconds <= Math.max(10, Number(best.resultSeconds) * 0.03));
  const status = !latest
    ? 'empty'
    : latestIsBest
    ? 'pb'
    : nearBest
    ? 'near'
    : trendSeconds !== null && trendSeconds < 0
    ? 'improving'
    : trendSeconds !== null && trendSeconds > 0
    ? 'regression'
    : 'stable';
  const statusLabel = status === 'pb'
    ? 'Siste er PB'
    : status === 'near'
    ? 'Nær PB'
    : status === 'improving'
    ? 'Bedre trend'
    : status === 'regression'
    ? 'Siste tregere'
    : status === 'stable'
    ? 'Stabilt'
    : 'Ingen registrert';
  const improvementPercent = first && latest && Number(first.resultSeconds) > 0
    ? Math.round(((Number(first.resultSeconds) - Number(latest.resultSeconds)) / Number(first.resultSeconds)) * 1000) / 10
    : null;
  return {
    count: sorted.length,
    best,
    first,
    latest,
    trendSeconds,
    trendLabel: personalBestTrendLabel(trendSeconds),
    bestGapSeconds,
    bestGapPercent,
    latestIsBest,
    nearBest,
    status,
    statusLabel,
    improvementPercent
  };
}

export function raceHistoryForDistance(completedItems = [], manualRaceResults = [], distanceKm = 0, tolerance = 0.02) {
  const km = Number(distanceKm) || 0;
  if (!km) {
    return {
      distanceKm: 0,
      label: '',
      results: [],
      best: null,
      latest: null,
      first: null,
      trendSeconds: null,
      trend: personalBestTrendSummary([])
    };
  }
  const results = combinedRaceResults(completedItems, manualRaceResults)
    .filter(result => result.countsAsPersonalBest !== false)
    .filter(result => Math.abs(Number(result.distanceKm) - km) < tolerance)
    .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
  const best = results.slice().sort((a, b) => Number(a.resultSeconds) - Number(b.resultSeconds))[0] || null;
  const first = results[0] || null;
  const latest = results[results.length - 1] || null;
  const trendSeconds = first && latest && first !== latest
    ? Number(latest.resultSeconds) - Number(first.resultSeconds)
    : null;
  return {
    distanceKm: km,
    label: raceDistanceLabel(km),
    results,
    best,
    latest,
    first,
    trendSeconds,
    trend: personalBestTrendSummary(results)
  };
}

export function raceReadinessSummary(goal = {}, completedItems = [], manualRaceResults = [], todayIso = dateToISO(new Date())) {
  const countdown = raceGoalCountdown(goal, todayIso);
  if (!countdown || (!countdown.name && !countdown.date)) {
    return { status: 'no_goal', countdown: null, targetPaceSeconds: null, latestRelevant: null, projectedTargetSeconds: null, paceGapSeconds: null, note: '', nextStep: '' };
  }

  const targetDistance = Number(countdown.distanceKm) || 0;
  const targetTime = Number(countdown.targetTimeSeconds) || 0;
  const targetPaceSeconds = targetDistance && targetTime ? Math.round(targetTime / targetDistance) : null;
  const allResults = combinedRaceResults(completedItems, manualRaceResults)
    .filter(result => result.countsAsPersonalBest !== false)
    .filter(result => Number(result.distanceKm) > 0 && Number(result.resultSeconds) > 0);
  const relevant = targetDistance
    ? allResults
        .filter(result => Number(result.distanceKm) <= targetDistance + 0.02)
        .sort((a, b) => {
          const dateDiff = String(b.date || '').localeCompare(String(a.date || ''));
          if (dateDiff !== 0) return dateDiff;
          return Number(b.distanceKm) - Number(a.distanceKm);
        })
    : allResults;
  const latestRelevant = relevant[0] || null;

  if (!targetDistance) {
    return {
      status: 'missing_distance',
      countdown,
      targetPaceSeconds,
      latestRelevant,
      projectedTargetSeconds: null,
      paceGapSeconds: null,
      note: 'Legg inn distanse på mål-løpet for å få bedre race-status.',
      nextStep: 'Sett distanse først, så kan appen sammenligne testløp med målet.'
    };
  }

  if (!targetPaceSeconds) {
    return {
      status: latestRelevant ? 'missing_target_time' : 'needs_test',
      countdown,
      targetPaceSeconds,
      latestRelevant,
      projectedTargetSeconds: null,
      paceGapSeconds: null,
      note: latestRelevant
        ? `Siste relevante test er ${raceDistanceLabel(latestRelevant.distanceKm)} på ${formatRaceTime(latestRelevant.resultSeconds)}.`
        : 'Mål-løpet er registrert, men appen mangler relevant testdata og måltid.',
      nextStep: latestRelevant
        ? 'Legg inn måltid hvis du vil sammenligne pace mot målet.'
        : 'Logg et kontrollert testløp på 2-10 km for å få et tydeligere nå-bilde.'
    };
  }

  if (!latestRelevant) {
    return {
      status: 'needs_test',
      countdown,
      targetPaceSeconds,
      latestRelevant: null,
      projectedTargetSeconds: null,
      paceGapSeconds: null,
      note: 'Målet er satt, men appen mangler relevante testløp å sammenligne mot.',
      nextStep: 'Planlegg et kontrollert 2-5 km testløp eller legg inn en gammel tid manuelt.'
    };
  }

  const resultPace = Math.round(Number(latestRelevant.resultSeconds) / Number(latestRelevant.distanceKm));
  const projectedTargetSeconds = Math.round(resultPace * targetDistance);
  const paceGapSeconds = resultPace - targetPaceSeconds;
  const status = paceGapSeconds <= 0 ? 'ahead' : paceGapSeconds <= 20 ? 'close' : 'behind';
  const note = status === 'ahead'
    ? `Siste relevante testpace er raskere enn målpace. Hold kontinuiteten og bygg trygt.`
    : status === 'close'
    ? `Siste relevante testpace er nær målpace. Det viktigste blir rolig volum og kontrollert kvalitet.`
    : `Siste relevante testpace er roligere enn målpace. Målet trenger trolig mer volum, terskel og tid.`;
  const nextStep = status === 'ahead'
    ? 'Neste smarte steg: vedlikehold rolig volum og legg inn kontrollert kvalitet uten å jage maks.'
    : status === 'close'
    ? 'Neste smarte steg: bygg rolig mengde og bruk en kontrollert 5-10 km test senere.'
    : 'Neste smarte steg: bygg rolig volum først, og bruk korte testløp for å følge fremgang.';

  return {
    status,
    countdown,
    targetPaceSeconds,
    latestRelevant,
    projectedTargetSeconds,
    paceGapSeconds,
    note,
    nextStep
  };
}

export function raceGoalPlan(goal = {}, readiness = {}, injurySummary = {}, todayIso = dateToISO(new Date())) {
  const countdown = raceGoalCountdown(goal, todayIso);
  if (!countdown || (!countdown.name && !countdown.date)) {
    return {
      hasPlan: false,
      phase: 'none',
      phaseLabel: '',
      weeksLeft: null,
      nextTest: '',
      focus: '',
      risk: '',
      nextStep: ''
    };
  }

  const daysLeft = Number.isFinite(Number(countdown.daysLeft)) ? Number(countdown.daysLeft) : null;
  const weeksLeft = daysLeft === null ? null : Math.max(0, Math.ceil(daysLeft / 7));
  const distance = Number(countdown.distanceKm) || 0;
  const status = readiness?.status || 'needs_test';
  const injuryActive = Boolean(injurySummary?.hasSignal && !['none', 'calming'].includes(injurySummary.status));

  let phase = 'base';
  let phaseLabel = 'Basebygging';
  let focus = 'Bygg kontinuitet og rolig volum. Kvalitet skal være kontrollert og gjentas uten å koste for mye.';
  let nextTest = distance >= 10 ? 'Neste relevante test: 5 km kontrollert test når kroppen er stabil.' : 'Neste relevante test: 2-3 km kontrollert test.';
  let nextStep = 'Neste 2-4 uker: prioriter repeterbar uke, rolig mengde og én kontrollert kvalitetsøkt når signalene er grønne.';

  if (daysLeft !== null && daysLeft <= 7) {
    phase = 'taper';
    phaseLabel = 'Taper / rolig siste uke';
    focus = 'Hold beina friske. Reduser volum, behold litt lett fart hvis kroppen er grønn, og unngå nye tester.';
    nextTest = 'Ingen ny test nå. Bruk dagsform og korte lette stigninger hvis kroppen kjennes bra.';
    nextStep = 'Neste steg: sov godt, hold øktene korte og møt løpet med overskudd.';
  } else if (daysLeft !== null && daysLeft <= 28) {
    phase = 'specific';
    phaseLabel = 'Spesifikk oppkjøring';
    focus = distance >= 10
      ? 'Bygg spesifikk utholdenhet rundt målpace: rolig volum, kontrollert terskel og korte segmenter i konkurransefølelse.'
      : 'Hold kvaliteten kontrollert og skjerp fart/rytme uten å samle for mye belastning.';
    nextTest = distance >= 10 ? 'Neste relevante test: 8-10 km kontrollert eller progressiv tur.' : 'Neste relevante test: 2-3 km test før siste rolige uke.';
    nextStep = 'Neste 2-4 uker: gjør treningen mer løpsspesifikk, men la siste uke bli lettere.';
  } else if (daysLeft !== null && daysLeft <= 84) {
    phase = 'test';
    phaseLabel = 'Testfase';
    focus = 'Bruk testløp til å kalibrere målpace, men la normaluka fortsatt styre mesteparten av treningen.';
    nextTest = distance >= 12 ? 'Neste relevante test: 5 km nå, senere 10 km eller 8-10 km kontrollert.' : distance >= 5 ? 'Neste relevante test: 3-5 km.' : 'Neste relevante test: 1-2 km.';
    nextStep = status === 'needs_test'
      ? 'Neste steg: få inn ett kontrollert testløp slik at målstatus blir mer presis.'
      : 'Neste steg: sammenlign neste test med forrige, ikke jag maks hver uke.';
  }

  if (status === 'behind' && phase !== 'taper') {
    nextStep = 'Neste 2-4 uker: bygg rolig volum først, legg inn kontrollert terskel, og bruk testløp for å se om målpace nærmer seg.';
  } else if (status === 'ahead' && phase !== 'taper') {
    nextStep = 'Neste 2-4 uker: vedlikehold kontinuitet, hold kvalitet kontrollert og unngå å gjøre målet dyrere enn nødvendig.';
  }

  const risk = injuryActive
    ? `Risiko: aktivt skadesignal (${injurySummary.statusLabel || 'følg med'}). Utsett testløp og hard kvalitet til smerten er lavere/stabil.`
    : 'Risiko: ingen aktivt skadesignal i mål-løp-planen akkurat nå.';

  return {
    hasPlan: true,
    phase,
    phaseLabel,
    weeksLeft,
    nextTest,
    focus,
    risk,
    nextStep
  };
}

function goalScoreItem(label, status, detail) {
  const value = status === 'good' ? 2 : status === 'watch' ? 1 : 0;
  return { label, status, detail, value };
}

export function goalProgressScore(input = {}) {
  const readiness = input.readiness || {};
  const injurySummary = input.injurySummary || {};
  const last7 = input.last7 || {};
  const last28 = input.last28 || {};
  const previous7 = input.previous7 || null;
  const previous28 = input.previous28 || null;
  const injuryActive = Boolean(injurySummary?.hasSignal && !['none', 'calming'].includes(injurySummary.status));

  const continuityStatus = Number(last28.sessions || 0) >= 8 ? 'good' : Number(last7.sessions || 0) >= 1 ? 'watch' : 'neutral';
  const qualityStatus = Number(last7.hard || 0) <= 1 ? 'good' : Number(last7.hard || 0) === 2 ? 'watch' : 'neutral';
  const injuryStatus = injuryActive ? 'watch' : 'good';
  const raceStatus = ['ahead', 'close'].includes(readiness?.status)
    ? 'good'
    : ['behind', 'needs_test', 'missing_target_time'].includes(readiness?.status)
    ? 'watch'
    : 'neutral';
  const volumeStatus = Number(last28.km || 0) >= 40 || Number(last28.seconds || 0) >= 8 * 3600
    ? 'good'
    : Number(last28.km || 0) > 0 || Number(last28.seconds || 0) > 0
    ? 'watch'
    : 'neutral';

  const items = [
    goalScoreItem('Kontinuitet', continuityStatus, Number(last28.sessions || 0) ? `${last28.sessions} økter siste 28 dager` : 'Bygg første repeterbare uke'),
    goalScoreItem('Rolig grunnlag', volumeStatus, Number(last28.km || 0) ? `${Math.round(last28.km)} km siste 28 dager` : 'Få inn rolig volum over tid'),
    goalScoreItem('Kontrollert kvalitet', qualityStatus, Number(last7.hard || 0) ? `${last7.hard} harde økter siste 7 dager` : 'Ingen hard økt siste 7 dager'),
    goalScoreItem('Skadefrihet', injuryStatus, injuryActive ? injurySummary.statusLabel || 'Følg med' : 'Ingen aktivt signal i målstatus'),
    goalScoreItem('Race/test-status', raceStatus, readiness?.note || 'Mangler nok race-/testdata')
  ];

  const value = items.reduce((sum, item) => sum + item.value, 0);
  const max = items.length * 2;
  const percent = max ? Math.round((value / max) * 100) : 0;
  const status = percent >= 80 ? 'good' : percent >= 50 ? 'watch' : 'neutral';
  const label = status === 'good' ? 'God retning' : status === 'watch' ? 'På vei' : 'Bygg grunnlag';

  let previousPercent = null;
  let trend = null;
  if (previous7 || previous28) {
    const previous = goalProgressScore({
      readiness,
      injurySummary: { hasSignal: false },
      last7: previous7 || {},
      last28: previous28 || {}
    });
    previousPercent = previous.percent;
    const delta = percent - previous.percent;
    trend = {
      delta,
      label: delta > 0 ? `+${delta} fra forrige uke` : delta < 0 ? `${delta} fra forrige uke` : 'Uendret fra forrige uke',
      status: delta > 0 ? 'good' : delta < 0 ? 'watch' : 'neutral'
    };
  }

  const weakest = items.slice().sort((a, b) => a.value - b.value)[0] || null;
  const nextImprovement = weakest
    ? weakest.label === 'Skadefrihet'
      ? 'Få skadesignalet lavere/stabilt før hard kvalitet.'
      : weakest.label === 'Race/test-status'
      ? 'Bruk et kontrollert testløp når dagsform og kroppssignaler er ok.'
      : weakest.label === 'Kontrollert kvalitet'
      ? 'Hold kvaliteten kontrollert, og la rolig volum bære resten av uka.'
      : weakest.label === 'Rolig grunnlag'
      ? 'Bygg rolig volum før du jager mer fart.'
      : 'Bygg en repeterbar uke med nok økter.'
    : 'Fortsett med repeterbare uker og juster etter kroppen.';

  return {
    percent,
    value,
    max,
    label,
    status,
    previousPercent,
    trend,
    nextImprovement,
    items
  };
}

export function goalMotivationSummary(input = {}, todayIso = dateToISO(new Date())) {
  const goal = normalizeRaceGoal(input.goal || {});
  const readiness = input.readiness || raceReadinessSummary(goal, input.completedItems || [], input.manualRaceResults || [], todayIso);
  const countdown = readiness?.countdown || raceGoalCountdown(goal, todayIso);
  const injurySummary = input.injurySummary || {};
  const plan = input.plan || raceGoalPlan(goal, readiness, injurySummary, todayIso);
  const last7 = input.last7 || {};
  const last28 = input.last28 || {};

  if (!countdown || (!countdown.name && !countdown.date)) {
    return {
      hasGoal: false,
      title: 'Velg et mål å jobbe mot',
      subtitle: 'Et konkret mål gjør øktene lettere å prioritere.',
      action: 'Legg inn et mål-løp eller bruk challenges som kortsiktig retning.',
      motivation: 'Når målet er tydelig, kan appen gjøre rådene mer konkrete.',
      metrics: [],
      score: { label: 'Mål ikke satt', status: 'neutral', percent: 0, items: [] }
    };
  }

  const injuryActive = Boolean(injurySummary?.hasSignal && !['none', 'calming'].includes(injurySummary.status));
  const targetPace = readiness?.targetPaceSeconds ? `${formatRaceTime(readiness.targetPaceSeconds)} /km` : '';
  const latest = readiness?.latestRelevant || null;
  const latestLabel = latest
    ? `${raceDistanceLabel(latest.distanceKm)} på ${formatRaceTime(latest.resultSeconds)}`
    : 'Trenger test';
  const phaseLabel = plan?.phaseLabel || 'Målperiode';
  const title = countdown.status === 'today'
    ? `${countdown.name || 'Mål-løp'} er i dag`
    : countdown.status === 'past'
    ? `${countdown.name || 'Mål-løp'} er passert`
    : `${countdown.name || 'Mål-løp'}: ${countdown.label}`;
  const subtitleParts = [
    phaseLabel,
    countdown.distanceKm ? raceDistanceLabel(countdown.distanceKm) : '',
    countdown.targetTimeSeconds ? `mål ${formatRaceTime(countdown.targetTimeSeconds)}` : ''
  ].filter(Boolean);
  const action = injuryActive
    ? `Skadesignal er aktivt (${injurySummary.statusLabel || 'følg med'}). Hold testløp og hard kvalitet igjen til signalet er lavere/stabilt.`
    : plan?.nextStep || readiness?.nextStep || 'Bygg kontinuitet og bruk testløp til å følge fremgang.';

  const score = goalProgressScore({
    readiness,
    injurySummary,
    last7,
    last28,
    previous7: input.previous7,
    previous28: input.previous28
  });

  const motivation = injuryActive
    ? 'Målet står, men akkurat nå er beste investering å komme skadefritt tilbake.'
    : readiness?.status === 'ahead'
    ? 'Du ligger godt an. Den største gevinsten er å holde kontinuiteten uten å overdrive.'
    : readiness?.status === 'close'
    ? 'Du er nær nok til at smarte, repeterbare uker kan flytte målet mye.'
    : readiness?.status === 'behind'
    ? 'Avstanden til målpace er nyttig informasjon, ikke dom. Bygg rolig volum og test på nytt senere.'
    : 'Du bygger grunnlaget. Første verdi kommer fra kontinuitet og et kontrollert testløp.';

  return {
    hasGoal: true,
    title,
    subtitle: subtitleParts.join(' · '),
    action,
    motivation,
    metrics: [
      { label: 'Fase', value: phaseLabel },
      { label: 'Målpace', value: targetPace || '-' },
      { label: 'Siste test', value: latestLabel },
      { label: 'Status', value: score.label }
    ],
    score
  };
}

function milestone(id, title, detail, status = 'upcoming', tag = '') {
  return { id, title, detail, status, tag };
}

export function goalMilestones(input = {}, todayIso = dateToISO(new Date())) {
  const goal = normalizeRaceGoal(input.goal || {});
  const readiness = input.readiness || raceReadinessSummary(goal, input.completedItems || [], input.manualRaceResults || [], todayIso);
  const countdown = readiness?.countdown || raceGoalCountdown(goal, todayIso);
  const injurySummary = input.injurySummary || {};
  const plan = input.plan || raceGoalPlan(goal, readiness, injurySummary, todayIso);
  const last7 = input.last7 || {};
  const last28 = input.last28 || {};
  const injuryActive = Boolean(injurySummary?.hasSignal && !['none', 'calming'].includes(injurySummary.status));
  const distance = Number(countdown?.distanceKm || goal.distanceKm) || 0;
  const milestones = [];

  if (!countdown || (!countdown.name && !countdown.date)) {
    return [
      milestone('set-goal', 'Sett et prioritert mål', 'Legg inn mål-løp eller et konkret treningsmål før appen bygger milepæler.', 'current', 'Start')
    ];
  }

  milestones.push(milestone(
    'injury-stable',
    'Skadefri/stabil uke',
    injuryActive
      ? `Vent med hard test til skadesignalet er lavere/stabilt (${injurySummary.statusLabel || 'følg med'}).`
      : 'Ingen aktivt skadesignal i målstatusen nå. Fortsett å bruke dagsform før kvalitet.',
    injuryActive ? 'current' : 'done',
    injuryActive ? 'Nå' : 'OK'
  ));

  const sessions28 = Number(last28.sessions || 0);
  const km28 = Number(last28.km || 0);
  const stableVolumeReached = sessions28 >= 8 || km28 >= Math.max(40, distance * 3);
  milestones.push(milestone(
    'stable-volume',
    'Stabil 4-ukers base',
    stableVolumeReached
      ? `${sessions28} økter${km28 ? ` og ${Math.round(km28)} km` : ''} siste 28 dager gir et brukbart grunnlag.`
      : 'Bygg repeterbare uker før du jager mer fart. Målet er stabilitet først.',
    stableVolumeReached ? 'done' : 'current',
    'Base'
  ));

  const needsTest = ['needs_test', 'missing_target_time', 'behind'].includes(readiness?.status);
  const shortTestDistance = distance >= 10 ? '5 km' : distance >= 5 ? '3 km' : '1-2 km';
  milestones.push(milestone(
    'short-test',
    `${shortTestDistance} kontrollert test`,
    injuryActive
      ? 'Utsett testløp til kroppen er stabil. Bruk rolig trening eller alternativ økt først.'
      : needsTest
      ? 'Bruk en kontrollert test til å kalibrere målpace uten å gjøre det til maksjakt.'
      : 'Du har relevant testdata. Neste test kan vente til ny treningsblokk er gjennomført.',
    injuryActive ? 'blocked' : needsTest ? 'current' : 'done',
    'Test'
  ));

  if (distance >= 10) {
    const longTestTitle = distance >= 12 ? '10-12 km relevant test' : '8-10 km relevant test';
    const hasLongRelevant = readiness?.latestRelevant && Number(readiness.latestRelevant.distanceKm) >= Math.min(10, distance * 0.75);
    milestones.push(milestone(
      'long-test',
      longTestTitle,
      hasLongRelevant
        ? 'Du har en lengre relevant test. Bruk den som referanse for målpace.'
        : 'Når basen er stabil, bruk en lengre kontrollert test for å se om målpace holder over tid.',
      hasLongRelevant ? 'done' : plan?.phase === 'specific' || plan?.phase === 'test' ? 'current' : 'upcoming',
      'Spesifikk'
    ));
  }

  const daysLeft = Number(countdown.daysLeft);
  const taperSoon = Number.isFinite(daysLeft) && daysLeft <= 14;
  milestones.push(milestone(
    'specific-or-taper',
    taperSoon ? 'Friske bein inn mot løp' : 'Spesifikk oppkjøring',
    taperSoon
      ? 'Reduser volum, behold lett rytme og prioriter overskudd.'
      : plan?.phase === 'specific'
      ? 'Bygg løpsspesifikk utholdenhet uten å gjøre hver uke for hard.'
      : 'Denne kommer senere når grunnlag og testdata er mer på plass.',
    taperSoon || plan?.phase === 'specific' || plan?.phase === 'taper' ? 'current' : 'upcoming',
    taperSoon ? 'Taper' : 'Senere'
  ));

  return milestones.slice(0, 5);
}

export function raceTestRecommendation(input = {}, todayIso = dateToISO(new Date())) {
  const goal = normalizeRaceGoal(input.goal || {});
  const readiness = input.readiness || raceReadinessSummary(goal, input.completedItems || [], input.manualRaceResults || [], todayIso);
  const countdown = readiness?.countdown || raceGoalCountdown(goal, todayIso);
  const injurySummary = input.injurySummary || {};
  const plan = input.plan || raceGoalPlan(goal, readiness, injurySummary, todayIso);
  const last7 = input.last7 || {};
  const last28 = input.last28 || {};
  const injuryActive = Boolean(injurySummary?.hasSignal && !['none', 'calming'].includes(injurySummary.status));

  if (!countdown || (!countdown.name && !countdown.date)) {
    return {
      shouldTest: false,
      distanceKm: null,
      label: 'Ikke test nå',
      intensity: 'Ingen',
      timing: 'Sett et mål først',
      reason: 'Appen trenger mål-løp eller et tydelig mål før testanbefalingen blir nyttig.',
      status: 'neutral'
    };
  }

  if (injuryActive) {
    return {
      shouldTest: false,
      distanceKm: null,
      label: 'Ikke test nå',
      intensity: 'Ingen hard test',
      timing: 'Når smerte er lav/stabil og rolig økt tolereres',
      reason: `Skadesignal er aktivt (${injurySummary.statusLabel || 'følg med'}). Testløp bør vente til kroppen tåler rolig belastning.`,
      status: 'blocked'
    };
  }

  const daysLeft = Number(countdown.daysLeft);
  if (Number.isFinite(daysLeft) && daysLeft <= 7) {
    return {
      shouldTest: false,
      distanceKm: null,
      label: 'Ikke test nå',
      intensity: 'Bevar overskudd',
      timing: 'Etter mål-løpet',
      reason: 'Mål-løpet er for nært. Nå er friske bein viktigere enn ny test.',
      status: 'hold'
    };
  }

  const hard7 = Number(last7.hard || 0);
  if (hard7 >= 2) {
    return {
      shouldTest: false,
      distanceKm: null,
      label: 'Ikke test denne uken',
      intensity: 'Rolig uke',
      timing: 'Vurder igjen etter roligere dager',
      reason: `${hard7} harde økter siste 7 dager gjør ny test mindre nyttig og mer risikabel.`,
      status: 'hold'
    };
  }

  const targetDistance = Number(countdown.distanceKm) || 0;
  const sessions28 = Number(last28.sessions || 0);
  const latest = readiness?.latestRelevant || null;
  const latestDistance = Number(latest?.distanceKm || 0);
  let distanceKm = targetDistance >= 12 ? 5 : targetDistance >= 10 ? 5 : targetDistance >= 5 ? 3 : targetDistance >= 2 ? 2 : 1;
  let label = `${raceDistanceLabel(distanceKm)} kontrollert test`;
  let intensity = 'Kontrollert, ikke maks';
  let timing = 'Når dagsform er grønn/gul og beina kjennes friske';
  let reason = 'En kort kontrollert test gir bedre retning uten å koste for mye.';
  let status = 'ready';

  if (sessions28 < 4) {
    return {
      shouldTest: false,
      distanceKm: null,
      label: 'Bygg grunnlag først',
      intensity: 'Rolig kontinuitet',
      timing: 'Etter flere repeterbare uker',
      reason: 'Det er for lite nylig treningsgrunnlag til at testløp er førsteprioritet.',
      status: 'hold'
    };
  }

  if (!latest) {
    reason = targetDistance >= 10
      ? 'Målet er langt nok til at en 5 km kontrollert test gir et første relevant pace-bilde.'
      : 'Appen mangler testdata. Start med kort kontrollert test for å kalibrere nivå.';
  } else if (targetDistance >= 10 && latestDistance < 5) {
    distanceKm = 5;
    label = '5 km kontrollert test';
    reason = `Siste relevante test er ${raceDistanceLabel(latestDistance)}. For et ${raceDistanceLabel(targetDistance)}-mål trenger du etter hvert en lengre referanse.`;
  } else if (targetDistance >= 12 && latestDistance >= 5 && latestDistance < 10 && ['specific', 'test'].includes(plan?.phase)) {
    distanceKm = 10;
    label = '10 km kontrollert test';
    intensity = 'Kontrollert/progressiv';
    reason = 'Du har kortere testdata. En lengre kontrollert test kan vise om målpace holder over tid.';
  } else if (readiness?.status === 'behind') {
    distanceKm = targetDistance >= 10 ? 5 : distanceKm;
    label = `${raceDistanceLabel(distanceKm)} kontrollert retest`;
    reason = 'Siste testpace er roligere enn målpace. Bruk en kontrollert retest etter mer rolig volum.';
    status = 'watch';
  } else if (readiness?.status === 'ahead' || readiness?.status === 'close') {
    label = 'Ingen hast med ny test';
    intensity = 'Vedlikehold kontroll';
    timing = 'Etter neste treningsblokk';
    reason = 'Du har relevant testdata som allerede gir god retning. Treningskontinuitet er viktigere akkurat nå.';
    return { shouldTest: false, distanceKm: null, label, intensity, timing, reason, status: 'watch' };
  }

  return {
    shouldTest: true,
    distanceKm,
    label,
    intensity,
    timing,
    reason,
    status
  };
}

export function raceWeekPlanContext(input = {}, todayIso = dateToISO(new Date())) {
  const goal = normalizeRaceGoal(input.goal || {});
  const readiness = input.readiness || raceReadinessSummary(goal, input.completedItems || [], input.manualRaceResults || [], todayIso);
  const countdown = readiness?.countdown || raceGoalCountdown(goal, todayIso);
  const injurySummary = input.injurySummary || {};
  const plan = input.plan || raceGoalPlan(goal, readiness, injurySummary, todayIso);
  const testRecommendation = input.testRecommendation || raceTestRecommendation({ goal, readiness, plan, injurySummary, last7: input.last7, last28: input.last28 }, todayIso);
  const injuryActive = Boolean(injurySummary?.hasSignal && !['none', 'calming'].includes(injurySummary.status));

  if (!countdown || (!countdown.name && !countdown.date)) {
    return {
      active: false,
      phase: 'none',
      phaseLabel: '',
      title: '',
      summary: '',
      note: '',
      allowRaceTest: false,
      preferredRoles: [],
      avoidRoles: [],
      testSuggestion: null
    };
  }

  const phase = plan?.phase || 'base';
  const phaseLabel = plan?.phaseLabel || 'Mål-løp';
  const name = countdown.name || 'mål-løpet';
  const weeksLeft = Number.isFinite(Number(plan?.weeksLeft)) ? Number(plan.weeksLeft) : null;
  const distanceLabel = raceDistanceLabel(countdown.distanceKm);
  const title = `${name}${distanceLabel ? ` · ${distanceLabel}` : ''}`;
  const phaseText = weeksLeft === null
    ? phaseLabel
    : `${phaseLabel} · ${weeksLeft} uke${weeksLeft === 1 ? '' : 'r'} igjen`;

  if (injuryActive) {
    return {
      active: true,
      phase,
      phaseLabel,
      title,
      summary: phaseText,
      note: `Skadesignal er aktivt (${injurySummary.statusLabel || 'følg med'}). Ukeplanen bør prioritere rolig/alternativ trening og vente med testløp eller hard kvalitet.`,
      allowRaceTest: false,
      preferredRoles: ['recovery', 'long_easy', 'mobility'],
      avoidRoles: ['race', 'main_threshold', 'support_threshold', 'x_workout'],
      testSuggestion: null
    };
  }

  if (phase === 'taper') {
    return {
      active: true,
      phase,
      phaseLabel,
      title,
      summary: phaseText,
      note: 'Taperfase: hold beina friske. Ukeplanen bør bruke rolig løp, lett rytme og minst mulig ny belastning.',
      allowRaceTest: false,
      preferredRoles: ['recovery', 'long_easy'],
      avoidRoles: ['race', 'main_threshold', 'support_threshold', 'x_workout'],
      testSuggestion: null
    };
  }

  const shouldTest = Boolean(testRecommendation?.shouldTest);
  const preferredRoles = phase === 'specific'
    ? ['long_easy', 'support_threshold', 'race']
    : phase === 'test'
    ? ['support_threshold', 'race', 'long_easy']
    : ['long_easy', 'support_threshold', 'recovery'];
  const avoidRoles = shouldTest ? [] : ['race'];
  const testSuggestion = shouldTest
    ? {
        title: testRecommendation.label || 'Kontrollert testløp',
        detail: `${testRecommendation.intensity || 'Kontrollert'} · ${testRecommendation.timing || 'når dagsform er grønn/gul'}`,
        note: testRecommendation.reason || 'Bruk testløp som kalibrering, ikke som maksimal belastning.',
        distanceKm: testRecommendation.distanceKm || null
      }
    : null;

  const note = shouldTest
    ? `${testRecommendation.label} kan legges inn som kontrollert test hvis dagsform og kroppssignaler er ok. Ikke jag maks, bruk testen som datapunkt.`
    : `${plan?.focus || 'Bygg kontinuitet og rolig volum.'} ${testRecommendation?.reason || ''}`.trim();

  return {
    active: true,
    phase,
    phaseLabel,
    title,
    summary: phaseText,
    note,
    allowRaceTest: shouldTest,
    preferredRoles,
    avoidRoles,
    testSuggestion
  };
}
