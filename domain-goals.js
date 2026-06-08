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
    const matches = raceResults.filter(result => Math.abs(Number(result.distanceKm) - preset.km) < 0.02);
    const best = matches.sort((a, b) => Number(a.resultSeconds) - Number(b.resultSeconds))[0] || null;
    return { ...preset, best };
  });
  return {
    entries,
    raceResults,
    latest: raceResults[0] || null
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
      trendSeconds: null
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
    trendSeconds
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
