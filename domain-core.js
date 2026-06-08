export function addDays(dateIso, days) {
  const d = new Date(`${dateIso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function dateToISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function startOfWeek(dateIso) {
  const date = new Date(`${dateIso}T12:00:00`);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return dateToISO(date);
}

export function goldenZonePercentages(level) {
  if (level === 'experienced') return { lowPct: 0.80, highPct: 0.87 };
  if (level === 'intermediate') return { lowPct: 0.78, highPct: 0.85 };
  return { lowPct: 0.77, highPct: 0.84 };
}

export function assessTrafficLight(sleep, energy, restingHR, stairsOk, baselineRestingHR = null) {
  if (stairsOk === false) return 'red';
  const avg = (sleep + energy) / 2;
  const hrDelta = (restingHR && baselineRestingHR) ? Number(restingHR) - Number(baselineRestingHR) : 0;
  if (avg <= 2 || hrDelta >= 10) return 'red';
  if (avg <= 3.5 || hrDelta >= 5) return 'yellow';
  return 'green';
}

export function injurySignalSummary(checkins = []) {
  const items = Array.isArray(checkins)
    ? checkins
        .filter(item => item && item.date && item.painNow !== '' && item.painNow !== null && item.painNow !== undefined)
        .map(item => ({
          date: String(item.date),
          painNow: Math.max(0, Math.min(10, Number(item.painNow) || 0)),
          area: String(item.area || '').trim(),
          trend: String(item.trend || '').trim()
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
    : [];

  if (!items.length) {
    return {
      hasSignal: false,
      status: 'none',
      statusLabel: 'Ingen aktiv oppfølging',
      trendText: '',
      area: '',
      latestPain: null,
      recommendation: 'Ingen nylig smerte registrert.',
      releaseCriteria: 'Coachen slipper signalet når det ikke finnes aktiv smerte å følge opp.',
      suggestedAction: 'Følg vanlig plan og registrer smerte hvis noe dukker opp.'
    };
  }

  const latest = items[items.length - 1];
  const first = items[0];
  const prior = items.slice(0, -1);
  const maxPriorPain = prior.length ? Math.max(...prior.map(item => item.painNow)) : first.painNow;
  const trendText = items.map(item => `${item.painNow}`).join(' -> ');
  const area = latest.area || [...items].reverse().find(item => item.area)?.area || '';
  const latestPain = latest.painNow;
  const previousPain = prior.length ? prior[prior.length - 1].painNow : null;
  const improving = latest.trend === 'better' || latestPain < maxPriorPain;
  const worsening = latest.trend === 'worse' || (previousPain !== null && latestPain > previousPain);

  let status = 'stable';
  let statusLabel = 'Stabil';
  let recommendation = 'Hold treningen kontrollert og følg med på om samme område reagerer.';
  let releaseCriteria = 'Slipp signalet etter smertefri økt eller 0-1/10 i minst én ny innsjekk.';
  let suggestedAction = 'Velg rolig bevegelse eller en kort test hvis området kjennes trygt.';

  if (latestPain <= 1) {
    status = 'calming';
    statusLabel = 'Nesten rolig';
    recommendation = 'Smerten er lav. Normal trening kan vurderes hvis oppvarming og første minutter kjennes bra.';
    releaseCriteria = 'Coachen kan slippe signalet etter smertefri økt eller én ny innsjekk på 0-1/10.';
    suggestedAction = 'Start rolig, stopp hvis smerten øker, og logg responsen etter økten.';
  } else if (worsening) {
    status = 'worse';
    statusLabel = 'Forverres';
    recommendation = 'Smerten øker. Ikke løp hardt; velg hvile eller smertefri alternativ trening.';
    releaseCriteria = 'Vent til trenden peker ned og smerten er 0-2/10 før løping bygges opp igjen.';
    suggestedAction = 'Prioriter hvile, mobilitet uten smerte, rolig sykkel eller gåtur hvis det kjennes bedre.';
  } else if (improving && latestPain <= 3) {
    status = 'improving';
    statusLabel = 'Bedres';
    recommendation = 'Smerten er bedre, men fortsatt merkbar. Vent med hard løping; bruk rolig test eller alternativ trening.';
    releaseCriteria = 'Slipp signalet når smerten er 0-1/10 eller en rolig økt er gjennomført uten økning.';
    suggestedAction = 'Aktuelt nå: hvile, rolig sykkel, mobilitet eller 10-20 min svært rolig test uten drag.';
  } else if (latestPain >= 5) {
    status = 'high';
    statusLabel = 'Høy';
    recommendation = 'Dette er fortsatt høy smerte. Kroppssignalet bør overstyre planen.';
    releaseCriteria = 'Vent til smerten er tydelig lavere og stabil før løping vurderes.';
    suggestedAction = 'Velg hvile eller smertefri alternativ trening. Ikke test hard løping.';
  } else if (latestPain >= 3) {
    status = 'caution';
    statusLabel = 'Følg nøye';
    recommendation = 'Moderat smerte bør avklares før kvalitet eller lengre løping.';
    releaseCriteria = 'Slipp signalet etter 0-1/10 eller smertefri rolig økt.';
    suggestedAction = 'Velg kort, rolig økt eller alternativ trening. Unngå terskel/intervall.';
  }

  return {
    hasSignal: true,
    status,
    statusLabel,
    trendText,
    area,
    latestPain,
    recommendation,
    releaseCriteria,
    suggestedAction
  };
}

export function injuryAdjustedWorkoutAdvice(injurySummary = {}, planned = {}) {
  if (!injurySummary || !injurySummary.hasSignal) {
    return { active: false, title: '', action: '', reason: '', options: [], plannedWarning: '' };
  }

  const label = String(planned.label || '').trim();
  const intensity = String(planned.intensity || '').toLowerCase();
  const role = String(planned.role || '').toLowerCase();
  const purpose = String(planned.purpose || '').toLowerCase();
  const load = String(planned.load || '').toLowerCase();
  const text = `${label} ${intensity} ${role} ${purpose} ${load}`.toLowerCase();
  const plannedQuality = Boolean(label) && (
    load === 'high' ||
    intensity.includes('terskel') ||
    intensity.includes('intervall') ||
    intensity.includes('tempo') ||
    role.includes('threshold') ||
    role.includes('race') ||
    purpose.includes('threshold') ||
    purpose.includes('race') ||
    text.includes('terskel') ||
    text.includes('intervall') ||
    text.includes('race')
  );

  const base = {
    active: true,
    title: 'Skadejustert øktvalg',
    action: injurySummary.suggestedAction || 'Velg lavrisiko trening og sjekk kroppssignalet underveis.',
    reason: injurySummary.recommendation || 'Aktivt kroppssignal bør styre øktvalg.',
    options: ['Hvile', 'Rolig sykkel', 'Mobilitet'],
    plannedWarning: plannedQuality && label ? `Planlagt ${label} bør flyttes eller byttes til lavrisiko alternativ i dag.` : ''
  };

  if (injurySummary.status === 'worse' || injurySummary.status === 'high') {
    return {
      ...base,
      action: 'Velg hvile eller smertefri alternativ trening.',
      options: ['Hvile', 'Rolig sykkel', 'Smertefri mobilitet'],
      plannedWarning: label ? `Ikke gjennomfør ${label} som løpe-/kvalitetsøkt mens signalet er høyt eller forverres.` : base.plannedWarning
    };
  }

  if (injurySummary.status === 'improving') {
    return {
      ...base,
      action: 'Velg alternativ trening eller en svært rolig test med stoppregel.',
      options: ['Rolig sykkel', 'Mobilitet', '10-20 min rolig test'],
      plannedWarning: plannedQuality && label ? `Flytt ${label}, eller bytt til 10-20 min rolig test uten drag.` : base.plannedWarning
    };
  }

  if (injurySummary.status === 'calming') {
    return {
      ...base,
      action: 'Start rolig og bruk første minutter som test.',
      options: ['Rolig testløp', 'Rolig sykkel', 'Kort mobilitet'],
      plannedWarning: plannedQuality && label ? `${label} bør bare gjennomføres hvis oppvarmingen er smertefri og kontrollert.` : base.plannedWarning
    };
  }

  return {
    ...base,
    options: ['Kort rolig økt', 'Rolig sykkel', 'Mobilitet'],
    plannedWarning: plannedQuality && label ? `Terskel/intervall bør vente. Gjør ${label} roligere, kortere eller flytt den.` : base.plannedWarning
  };
}

export function todayDecision(input = {}) {
  const plannedLabel = String(input.plannedWorkoutLabel || '').trim();
  const hasPlannedToday = Boolean(input.hasPlannedToday);
  const hasNextPlanned = Boolean(input.hasNextPlanned || plannedLabel);
  const readiness = input.dailyReadinessLevel || null;
  const painTier = input.highestPainTier || null;
  const painImprovingAfterHigh = Boolean(input.painImprovingAfterHigh);
  const adaptationCount = Number(input.bodySignals14Adaptation || 0);
  const structured7 = Number(input.structuredIntervalsLast7Count || 0);
  const closeQualityDays = Boolean(input.structuredIntervalsCloseQualityDays);
  const daysSinceLast = input.daysSinceLast === null || input.daysSinceLast === undefined
    ? null
    : Number(input.daysSinceLast);
  const weekSessions = Number(input.weekSessions || 0);
  const weeklyTarget = Number(input.weeklyTarget || 0);

  if (readiness === 'red') {
    return {
      level: 'red',
      title: 'Restitusjon først',
      action: 'Hvil, gå lett eller velg en svært rolig alternativ økt.',
      reason: 'Dagsformen er rød, så planen bør vike for kroppen.'
    };
  }

  if (painImprovingAfterHigh) {
    return {
      level: 'yellow',
      title: 'Forsiktig oppfølging',
      action: 'Velg hvile, alternativ trening eller svært rolig test.',
      reason: 'Smerten er bedre, men fortsatt moderat og skal styre før planen.'
    };
  }

  if (painTier === 'high') {
    return {
      level: 'red',
      title: 'Hvil eller velg alternativ trening',
      action: 'Ikke press gjennom høy smerte i dag.',
      reason: 'Aktive kroppssignaler skal styre før planen.'
    };
  }

  if (painTier === 'moderate') {
    return {
      level: 'yellow',
      title: 'Juster ned',
      action: hasPlannedToday ? 'Gjør planlagt økt roligere, kortere eller flytt den.' : 'Velg rolig bevegelse og kjenn etter.',
      reason: 'Moderat smerte bør avklares før ny kvalitet.'
    };
  }

  if (readiness === 'yellow') {
    return {
      level: 'yellow',
      title: 'Senk terskelen for å justere',
      action: hasPlannedToday ? 'Start kontrollert og gjør økten lettere hvis kroppen ikke svarer.' : 'Rolig økt eller lett bevegelse passer best.',
      reason: 'Søvn, energi eller hvilepuls peker mot litt lavere belastning.'
    };
  }

  if (adaptationCount > 0) {
    return {
      level: 'yellow',
      title: 'Bekreft at kroppen responderer',
      action: hasPlannedToday ? 'Hold planlagt økt kontrollert og stopp tidlig ved nye signaler.' : 'Velg en rolig økt før du øker belastningen.',
      reason: 'Du har nylig tilpasset trening etter kroppssignal.'
    };
  }

  if (structured7 >= 2 || closeQualityDays) {
    return {
      level: 'yellow',
      title: 'Rolig rundt kvaliteten',
      action: 'Prioriter rolig trening eller restitusjon i dag.',
      reason: 'Nylig strukturert intervallarbeid trenger friske bein for å gi effekt.'
    };
  }

  if (hasPlannedToday) {
    return {
      level: readiness === 'green' ? 'green' : 'neutral',
      title: plannedLabel ? `Gjennomfør ${plannedLabel}` : 'Gjennomfør planlagt økt',
      action: 'Hold deg til planen og juster bare hvis kroppen gir tydelige signaler.',
      reason: readiness === 'green' ? 'Dagsformen er grønn.' : 'Du har en økt planlagt i dag.'
    };
  }

  if (daysSinceLast !== null && daysSinceLast >= 5) {
    return {
      level: 'neutral',
      title: 'Start kontrollert',
      action: hasNextPlanned ? 'Bruk neste planlagte økt som retning, men hold første steg lett.' : 'Planlegg en gjennomførbar rolig økt.',
      reason: `Det er ${daysSinceLast} dager siden siste økt.`
    };
  }

  if (weeklyTarget > 0 && weekSessions >= weeklyTarget) {
    return {
      level: 'green',
      title: 'Ukemålet er nådd',
      action: 'Eventuell trening i dag bør være bonus og styrt av overskudd.',
      reason: 'Kontinuiteten er allerede ivaretatt denne uken.'
    };
  }

  if (hasNextPlanned) {
    return {
      level: readiness === 'green' ? 'green' : 'neutral',
      title: plannedLabel ? `Neste: ${plannedLabel}` : 'Følg neste planlagte økt',
      action: 'Bruk dagen til å møte neste økt med overskudd.',
      reason: 'Det ligger allerede en plan i kalenderen.'
    };
  }

  return {
    level: 'neutral',
    title: 'Planlegg én realistisk økt',
    action: 'Velg noe enkelt nok til at du faktisk får det gjort.',
    reason: 'Appen mangler en konkret plan for i dag.'
  };
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

export function formatKm(km) {
  const value = Number(km) || 0;
  return `${value.toLocaleString('no-NO', { maximumFractionDigits: value < 10 ? 1 : 0 })} km`;
}

export function asArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}

export function normalizeStructuredWorkout(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const blocks = Array.isArray(value.blocks)
    ? value.blocks
        .filter(block => block && typeof block === 'object' && !Array.isArray(block))
        .map(normalizeStructuredWorkoutBlock)
        .filter(Boolean)
    : [];
  if (!blocks.length) return null;
  return {
    version: Number(value.version) || 1,
    blocks,
    note: typeof value.note === 'string' ? value.note : ''
  };
}

export function normalizeStructuredWorkoutBlock(block = {}) {
  const type = String(block.type || '').trim();
  if (type === 'warmup' || type === 'cooldown') {
    const durationSeconds = parseNonNegativeInteger(block.durationSeconds);
    if (!durationSeconds) return null;
    return {
      type,
      durationSeconds,
      note: String(block.note || '')
    };
  }
  if (type === 'interval') {
    const repetitions = parseNonNegativeInteger(block.repetitions);
    const workSeconds = parseNonNegativeInteger(block.workSeconds);
    const restSeconds = parseNonNegativeInteger(block.restSeconds);
    if (!repetitions || !workSeconds) return null;
    return {
      type,
      repetitions,
      workSeconds,
      restSeconds,
      restType: String(block.restType || ''),
      intensity: String(block.intensity || ''),
      note: String(block.note || '')
    };
  }
  return null;
}

export function buildStructuredWorkout(input = {}) {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const blocks = [];
  const warmupSeconds = parseNonNegativeInteger(source.warmupMinutes) * 60;
  const cooldownSeconds = parseNonNegativeInteger(source.cooldownMinutes) * 60;
  const repetitions = parseNonNegativeInteger(source.repetitions);
  const workSeconds = parseNonNegativeInteger(source.workSeconds);
  const restSeconds = parseNonNegativeInteger(source.restSeconds);

  if (warmupSeconds) blocks.push({ type: 'warmup', durationSeconds: warmupSeconds });
  if (repetitions && workSeconds) {
    blocks.push({
      type: 'interval',
      repetitions,
      workSeconds,
      restSeconds,
      restType: String(source.restType || ''),
      intensity: String(source.intensity || ''),
      note: String(source.intervalNote || '')
    });
  }
  if (cooldownSeconds) blocks.push({ type: 'cooldown', durationSeconds: cooldownSeconds });

  return normalizeStructuredWorkout({
    version: 1,
    blocks,
    note: String(source.note || '')
  });
}

export function structuredWorkoutWorkSeconds(structuredWorkout) {
  const workout = normalizeStructuredWorkout(structuredWorkout);
  if (!workout) return 0;
  return workout.blocks.reduce((sum, block) => {
    if (block.type !== 'interval') return sum;
    return sum + (block.repetitions * block.workSeconds);
  }, 0);
}

export function structuredWorkoutRestSeconds(structuredWorkout) {
  const workout = normalizeStructuredWorkout(structuredWorkout);
  if (!workout) return 0;
  return workout.blocks.reduce((sum, block) => {
    if (block.type !== 'interval') return sum;
    return sum + (block.repetitions * block.restSeconds);
  }, 0);
}

export function structuredWorkoutTotalSeconds(structuredWorkout) {
  const workout = normalizeStructuredWorkout(structuredWorkout);
  if (!workout) return 0;
  return workout.blocks.reduce((sum, block) => {
    if (block.type === 'warmup' || block.type === 'cooldown') return sum + block.durationSeconds;
    if (block.type === 'interval') {
      return sum + (block.repetitions * block.workSeconds) + (block.repetitions * block.restSeconds);
    }
    return sum;
  }, 0);
}

export function structuredWorkoutWarmupSeconds(structuredWorkout) {
  const workout = normalizeStructuredWorkout(structuredWorkout);
  if (!workout) return 0;
  return workout.blocks.reduce((sum, block) => (
    block.type === 'warmup' ? sum + block.durationSeconds : sum
  ), 0);
}

export function structuredWorkoutCooldownSeconds(structuredWorkout) {
  const workout = normalizeStructuredWorkout(structuredWorkout);
  if (!workout) return 0;
  return workout.blocks.reduce((sum, block) => (
    block.type === 'cooldown' ? sum + block.durationSeconds : sum
  ), 0);
}

export function structuredWorkoutIntervalBlocks(structuredWorkout) {
  const workout = normalizeStructuredWorkout(structuredWorkout);
  return workout ? workout.blocks.filter(block => block.type === 'interval') : [];
}

export function hasStructuredIntervals(structuredWorkout) {
  return structuredWorkoutIntervalBlocks(structuredWorkout)
    .some(block => block.repetitions > 0 && block.workSeconds > 0);
}

export function structuredWorkoutFromItem(item = {}) {
  if (!item || typeof item !== 'object') return null;
  return normalizeStructuredWorkout(item.structuredWorkout || item.templateSnapshot?.structuredWorkout);
}

export function compactDurationText(seconds) {
  const total = parseNonNegativeInteger(seconds);
  if (!total) return '0';
  if (total < 60) return String(total);
  const minutes = Math.floor(total / 60);
  const restSeconds = total % 60;
  return restSeconds ? `${minutes}:${String(restSeconds).padStart(2, '0')}` : `${minutes} min`;
}

export function structuredWorkoutCompactText(structuredWorkout) {
  const blocks = structuredWorkoutIntervalBlocks(structuredWorkout);
  if (!blocks.length) return '';
  return blocks.map(block => {
    const rest = block.restSeconds ? `/${compactDurationText(block.restSeconds)}` : '';
    return `${block.repetitions} x ${compactDurationText(block.workSeconds)}${rest}`;
  }).join(' + ');
}

export function structuredWorkoutBreakdown(structuredWorkout) {
  const workout = normalizeStructuredWorkout(structuredWorkout);
  if (!workout) return null;
  const interval = structuredWorkoutIntervalBlocks(workout)[0] || null;
  const restType = interval?.restType ? restTypeLabel(interval.restType) : '';
  const intensity = interval?.intensity ? structuredIntensityLabel(interval.intensity) : '';
  return {
    compact: structuredWorkoutCompactText(workout),
    warmupSeconds: structuredWorkoutWarmupSeconds(workout),
    workSeconds: structuredWorkoutWorkSeconds(workout),
    restSeconds: structuredWorkoutRestSeconds(workout),
    cooldownSeconds: structuredWorkoutCooldownSeconds(workout),
    totalSeconds: structuredWorkoutTotalSeconds(workout),
    restType,
    intensity,
    note: workout.note || interval?.note || ''
  };
}

export function structuredWorkoutSummary(structuredWorkout) {
  const breakdown = structuredWorkoutBreakdown(structuredWorkout);
  if (!breakdown) return '';
  const parts = [];
  if (breakdown.compact) parts.push(breakdown.compact);
  if (breakdown.warmupSeconds) parts.push(`oppvarming ${formatDurationWords(breakdown.warmupSeconds)}`);
  if (breakdown.workSeconds) parts.push(`arbeid ${formatDuration(breakdown.workSeconds)}`);
  if (breakdown.restSeconds) parts.push(`hvile ${formatDuration(breakdown.restSeconds)}`);
  if (breakdown.cooldownSeconds) parts.push(`nedjogg ${formatDurationWords(breakdown.cooldownSeconds)}`);
  if (breakdown.totalSeconds) parts.push(`totalt ${formatDuration(breakdown.totalSeconds)}`);
  if (breakdown.restType) parts.push(`hviletype ${breakdown.restType.toLowerCase()}`);
  if (breakdown.intensity) parts.push(`intensitet ${breakdown.intensity.toLowerCase()}`);
  if (breakdown.note) parts.push(breakdown.note);
  return parts.join(' · ');
}

export function structuredIntervalInsights(completedItems = [], todayIso = dateToISO(new Date())) {
  const startIso = addDays(todayIso, -27);
  const items = Array.isArray(completedItems) ? completedItems : [];
  const structuredItems = items
    .filter(item => item?.date >= startIso && item?.date <= todayIso)
    .map(item => ({
      ...item,
      structuredWorkout: structuredWorkoutFromItem(item)
    }))
    .filter(item => hasStructuredIntervals(item.structuredWorkout))
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

  const totalWorkSeconds = structuredItems.reduce((sum, item) => sum + structuredWorkoutWorkSeconds(item.structuredWorkout), 0);
  const totalRestSeconds = structuredItems.reduce((sum, item) => sum + structuredWorkoutRestSeconds(item.structuredWorkout), 0);
  const latest = structuredItems[0] || null;

  return {
    count: structuredItems.length,
    totalWorkSeconds,
    totalRestSeconds,
    latest: latest ? {
      date: latest.date || '',
      name: latest.name || latest.templateSnapshot?.name || 'Strukturert intervall',
      summary: structuredWorkoutSummary(latest.structuredWorkout)
    } : null
  };
}

export function structuredIntervalContext(completedItems = [], todayIso = dateToISO(new Date())) {
  const items = Array.isArray(completedItems) ? completedItems : [];
  const structuredItems = items
    .filter(item => item?.date && item.date <= todayIso)
    .map(item => ({
      ...item,
      structuredWorkout: structuredWorkoutFromItem(item)
    }))
    .filter(item => hasStructuredIntervals(item.structuredWorkout))
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

  const summarizeWindow = (days) => {
    const startIso = addDays(todayIso, -(days - 1));
    const inRange = structuredItems.filter(item => item.date >= startIso && item.date <= todayIso);
    return {
      days,
      count: inRange.length,
      totalWorkSeconds: inRange.reduce((sum, item) => sum + structuredWorkoutWorkSeconds(item.structuredWorkout), 0),
      totalRestSeconds: inRange.reduce((sum, item) => sum + structuredWorkoutRestSeconds(item.structuredWorkout), 0)
    };
  };

  const closeWindowStartIso = addDays(todayIso, -13);
  const datesAsc = [...new Set(
    structuredItems
      .filter(item => item.date >= closeWindowStartIso && item.date <= todayIso)
      .map(item => item.date)
  )].sort();
  const closeQualityDays = datesAsc.some((date, index) => {
    if (index === 0) return false;
    const previous = datesAsc[index - 1];
    const diff = (new Date(`${date}T12:00:00`) - new Date(`${previous}T12:00:00`)) / 86400000;
    return diff <= 2;
  });
  const latest = structuredItems[0] || null;

  return {
    last7: summarizeWindow(7),
    last14: summarizeWindow(14),
    last28: summarizeWindow(28),
    latest: latest ? {
      date: latest.date,
      name: latest.name || latest.templateSnapshot?.name || 'Strukturert intervall',
      summary: structuredWorkoutSummary(latest.structuredWorkout)
    } : null,
    closeQualityDays
  };
}

export function formatDurationWords(seconds) {
  const total = parseNonNegativeInteger(seconds);
  if (!total) return '';
  const minutes = Math.floor(total / 60);
  const remainingSeconds = total % 60;
  if (minutes && remainingSeconds) return `${minutes} min ${remainingSeconds} sek`;
  if (minutes) return `${minutes} min`;
  return `${remainingSeconds} sek`;
}

export function restTypeLabel(value) {
  return {
    float: 'Flyt',
    jog: 'Jogg',
    walk: 'Gange',
    standing: 'Stående',
    passive: 'Passiv'
  }[value] || value || 'Hvile';
}

export function structuredIntensityLabel(value) {
  return {
    easy: 'Rolig',
    threshold: 'Terskel',
    vo2: 'VO2 maks',
    hard: 'Hard',
    sprint: 'Sprint'
  }[value] || value || '';
}

export function normalizeTemplate(template = {}) {
  const source = template && typeof template === 'object' && !Array.isArray(template) ? template : {};
  return {
    ...source,
    id: String(source.id || ''),
    name: String(source.name || 'Uten navn'),
    type: String(source.type || 'Annet'),
    intensity: String(source.intensity || ''),
    role: String(source.role || ''),
    purpose: String(source.purpose || ''),
    load: String(source.load || ''),
    recommendedWhen: asArray(source.recommendedWhen),
    avoidWhen: asArray(source.avoidWhen),
    structure: String(source.structure || ''),
    structuredWorkout: normalizeStructuredWorkout(source.structuredWorkout)
  };
}

export function parseNonNegativeInteger(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function formatDuration(totalSeconds) {
  const secondsTotal = parseNonNegativeInteger(totalSeconds);
  if (!secondsTotal) return '';
  const hours = Math.floor(secondsTotal / 3600);
  const minutes = Math.floor((secondsTotal % 3600) / 60);
  const seconds = secondsTotal % 60;
  if (hours) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatPace(secondsPerKm) {
  const secondsTotal = parseNonNegativeInteger(secondsPerKm);
  if (!secondsTotal) return '';
  const minutes = Math.floor(secondsTotal / 60);
  const seconds = secondsTotal % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function calculatePaceMetrics(durationSeconds, distanceKm) {
  const seconds = parseNonNegativeInteger(durationSeconds);
  const distance = Number(String(distanceKm || '').replace(',', '.'));
  if (!seconds || !Number.isFinite(distance) || distance <= 0) {
    return { averageSpeedKmh: '', paceSecondsPerKm: '', paceDisplay: '' };
  }
  const averageSpeedKmh = distance / (seconds / 3600);
  const paceSecondsPerKm = Math.round(seconds / distance);
  return {
    averageSpeedKmh: averageSpeedKmh.toFixed(1),
    paceSecondsPerKm,
    paceDisplay: formatPace(paceSecondsPerKm)
  };
}

export function completedDurationSeconds(completed = {}) {
  if (completed.durationSeconds) return Number(completed.durationSeconds) || 0;
  if (completed.durationMinutes) return (Number(completed.durationMinutes) || 0) * 60;
  return 0;
}

export function formatClockDuration(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainingSeconds = total % 60;
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

export function challengeValueLabel(value, metric) {
  const number = Number(value) || 0;
  if (metric === 'hours') return `${number.toLocaleString('no-NO', { maximumFractionDigits: number < 10 ? 1 : 0 })} t`;
  if (metric === 'km') return formatKm(number);
  return `${Math.round(number)} økt${Math.round(number) === 1 ? '' : 'er'}`;
}

export function challengeRemainingLabel(progress, metric) {
  if (progress.done) return 'Mål nådd';
  return `${challengeValueLabel(progress.remaining, metric)} igjen`;
}

export function challengeProgress(challenge, completedItems = [], todayIso) {
  const items = completedItems.filter(item => {
    if (!item.date || item.date < challenge.startDate || item.date > challenge.endDate) return false;
    if (!challenge.activity || challenge.activity === 'all') return true;
    return (item.type || 'Annet') === challenge.activity;
  });
  const target = Number(challenge.target) || 0;
  let current = 0;
  if (challenge.metric === 'hours') current = items.reduce((sum, item) => sum + (Number(item.durationSeconds) || 0), 0) / 3600;
  else if (challenge.metric === 'sessions') current = items.length;
  else current = items.reduce((sum, item) => sum + (Number(item.distanceKm) || 0), 0);
  const percent = target ? Math.max(0, Math.min(100, (current / target) * 100)) : 0;
  const done = target > 0 && current >= target;
  const expired = todayIso > challenge.endDate && !done;
  const remaining = Math.max(0, target - current);
  const daysLeft = Math.max(0, Math.ceil((new Date(`${challenge.endDate}T12:00:00`) - new Date(`${todayIso}T12:00:00`)) / 86400000));
  return { current, target, remaining, percent, done, expired, daysLeft, count: items.length };
}

export function weekPlanDates(today, weekEnd, plannedThisWeek = [], blockedDays = [], count = 0) {
  const busyDates = new Set(plannedThisWeek.map(item => item.date));
  blockedDays.filter(day => day.date >= today && day.date <= weekEnd).forEach(day => busyDates.add(day.date));
  const dates = [];
  const preferredOffsets = count >= 3 ? [1, 3, 5, 2, 4, 6, 0] : count === 2 ? [1, 4, 2, 5, 3, 6, 0] : [1, 2, 3, 4, 5, 6, 0];
  preferredOffsets.forEach(offset => {
    const date = addDays(today, offset);
    if (date >= today && date <= weekEnd && !busyDates.has(date) && !dates.includes(date)) dates.push(date);
  });
  return dates.slice(0, count);
}

export function weekPlanDatesInRange(rangeStart, rangeEnd, plannedItems = [], blockedDays = [], count = 0) {
  const occupiedDates = new Set(plannedItems.map(item => item.date));
  blockedDays.filter(day => day.date >= rangeStart && day.date <= rangeEnd).forEach(day => occupiedDates.add(day.date));
  const placed = new Set(occupiedDates);

  function isAdjacentToPlaced(date) {
    return placed.has(addDays(date, -1)) || placed.has(addDays(date, 1));
  }

  const preferredOffsets = count >= 3 ? [0, 2, 4, 6, 1, 3, 5] : count === 2 ? [0, 3, 1, 4, 2, 5, 6] : [0, 1, 2, 3, 4, 5, 6];
  const dates = [];

  preferredOffsets.forEach(offset => {
    if (dates.length >= count) return;
    const date = addDays(rangeStart, offset);
    if (date >= rangeStart && date <= rangeEnd && !placed.has(date) && !isAdjacentToPlaced(date)) {
      dates.push(date);
      placed.add(date);
    }
  });

  if (dates.length < count) {
    preferredOffsets.forEach(offset => {
      if (dates.length >= count) return;
      const date = addDays(rangeStart, offset);
      if (date >= rangeStart && date <= rangeEnd && !placed.has(date)) {
        dates.push(date);
        placed.add(date);
      }
    });
  }

  return dates.slice(0, count);
}
