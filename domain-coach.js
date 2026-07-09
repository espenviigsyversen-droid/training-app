import { getCoachRules } from './domain-coach-rules.js';
import { addDays, completedDurationSeconds } from './domain-core.js';

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
  const comeback = input.comeback && typeof input.comeback === 'object' ? input.comeback : null;
  const volumeRamp = input.volumeRamp && typeof input.volumeRamp === 'object' ? input.volumeRamp : null;

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

  if (comeback?.active) {
    return {
      level: 'yellow',
      title: comeback.phase === 'awaiting_return' ? 'Start comebacken rolig' : 'Bygg deg gradvis tilbake',
      action: hasPlannedToday
        ? 'Gjør dagens økt roligere og kortere enn en normal treningsdag.'
        : 'Velg en lett, gjennomførbar økt og la responsen styre neste steg.',
      reason: comeback.explanation || 'Et opphold tilsier redusert forventning denne uken.'
    };
  }

  if (volumeRamp?.status === 'high') {
    return {
      level: 'yellow',
      title: 'La kroppen ta igjen volumet',
      action: hasPlannedToday
        ? 'Behold økten bare hvis den er rolig, eller gjør den kortere.'
        : 'Velg hvile, recovery eller en kort rolig økt.',
      reason: volumeRamp.explanation || 'Treningsvolumet har økt raskere enn normalt.'
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

function plannedWorkoutIsQuality(planned = {}) {
  const text = [
    planned.label,
    planned.intensity,
    planned.role,
    planned.purpose,
    planned.load
  ].filter(Boolean).join(' ').toLowerCase();
  return Boolean(
    text.includes('terskel') ||
    text.includes('intervall') ||
    text.includes('tempo') ||
    text.includes('anaerob') ||
    text.includes('race') ||
    text.includes('threshold') ||
    text.includes('high')
  );
}

export function homeHeroState(input = {}) {
  const rules = input.rules && typeof input.rules === 'object' ? input.rules : getCoachRules();
  const hardShareLimit = Number(rules?.thresholds?.intensityBalance?.heroConflictHardShare || 0.65) * 100;
  const completedToday = input.completedToday || null;
  const planned = input.planned || {};
  const hasPlannedToday = Boolean(input.hasPlannedToday);
  const hasNextPlanned = Boolean(input.hasNextPlanned || planned.label);
  const decision = input.decision || {};
  const readiness = String(input.dailyReadinessLevel || '').toLowerCase();
  const injuryStatus = String(input.injuryStatus || '').toLowerCase();
  const injuryActive = Boolean(input.injuryActive);
  const hardShare14 = Number(input.hardShare14 || 0);
  const comeback = input.comeback && typeof input.comeback === 'object' ? input.comeback : null;
  const volumeRamp = input.volumeRamp && typeof input.volumeRamp === 'object' ? input.volumeRamp : null;
  const daysSinceLast = input.daysSinceLast === null || input.daysSinceLast === undefined
    ? null
    : Number(input.daysSinceLast);
  const plannedLabel = String(planned.label || '').trim();
  const plannedType = String(planned.type || '').trim();
  const nextDateLabel = String(input.nextDateLabel || '').trim();
  const quality = plannedWorkoutIsQuality(planned);

  if (completedToday) {
    return {
      state: 'post_workout',
      level: decision.level || 'green',
      kicker: completedToday.type ? `Fullført i dag · ${completedToday.type}` : 'Fullført i dag',
      title: decision.title || `Bra gjennomført: ${completedToday.label || 'dagens økt'}`,
      body: decision.reason || decision.action || 'Økten er logget. Bruk resten av dagen til restitusjon og respons.',
      primaryAction: 'details'
    };
  }

  const conflictReasons = [];
  const hasReadinessConflict = quality && (readiness === 'red' || readiness === 'yellow');
  const hasInjuryConflict = quality && injuryActive && ['worse', 'high', 'improving', 'caution', 'stable'].includes(injuryStatus);
  const hasLoadConflict = quality && hardShare14 >= hardShareLimit;
  const hasComebackConflict = quality && Boolean(comeback?.active);
  const hasVolumeConflict = quality && volumeRamp?.status === 'high';
  if (quality && readiness === 'red') conflictReasons.push('dagsform rød');
  else if (quality && readiness === 'yellow') conflictReasons.push('dagsform gul');
  if (quality && injuryActive && ['worse', 'high', 'improving', 'caution', 'stable'].includes(injuryStatus)) {
    conflictReasons.push('kroppssignal');
  }
  if (hasLoadConflict) conflictReasons.push(`intensitetsbalanse ${Math.round(100 - hardShare14)}/${Math.round(hardShare14)}`);
  if (hasComebackConflict) conflictReasons.push('comeback-uke');
  if (hasVolumeConflict) conflictReasons.push('rask volumøkning');

  if (hasNextPlanned && quality && conflictReasons.length) {
    const redConflict = readiness === 'red' || decision.level === 'red' || injuryStatus === 'worse' || injuryStatus === 'high';
    const loadOnlyConflict = (hasLoadConflict || hasComebackConflict || hasVolumeConflict) && !hasReadinessConflict && !hasInjuryConflict;
    return {
      state: 'conflict',
      level: redConflict ? 'red' : 'yellow',
      kicker: loadOnlyConflict ? 'Belastning og plan krasjer litt' : 'Dagsform og plan krasjer litt',
      title: loadOnlyConflict ? 'Belastningen tilsier lettere økt' : 'Dagsform tilsier lettere økt',
      body: plannedLabel
        ? `${hasPlannedToday ? 'Planlagt' : 'Neste'} ${plannedLabel} ser hard ut. Bytt til rolig alternativ?`
        : 'Planen ser hard ut. Bytt til rolig alternativ?',
      reason: conflictReasons.join(' · '),
      primaryAction: redConflict ? 'swap_recovery' : 'swap_easy'
    };
  }

  const fallbackComeback = !comeback && daysSinceLast !== null
    && daysSinceLast >= Number(rules?.thresholds?.comeback?.triggerDaysSinceLast || 5);
  if (comeback?.active || fallbackComeback) {
    return {
      state: 'comeback',
      level: 'neutral',
      kicker: 'Velkommen tilbake',
      title: comeback?.phase === 'return_week' ? 'Fortsett comebacken kontrollert' : 'Start kontrollert',
      body: comeback?.explanation || `Det er ${daysSinceLast} dager siden siste økt. Velg en lett start og bruk kroppen som fasit.`,
      primaryAction: hasNextPlanned ? 'start_easy' : 'plan'
    };
  }

  if (!hasPlannedToday && hasNextPlanned) {
    return {
      state: 'rest_day',
      level: decision.level || 'green',
      kicker: 'Planlagt hviledag',
      title: 'Bygg overskudd i dag',
      body: nextDateLabel
        ? `Neste økt er ${plannedLabel || 'planlagt økt'} ${nextDateLabel}. Bruk dagen til å møte den med friske bein.`
        : 'Hvile er en aktiv del av planen. Bruk dagen til å hente overskudd.',
      primaryAction: 'show_next'
    };
  }

  return {
    state: hasPlannedToday ? 'planned' : 'empty',
    level: decision.level || 'neutral',
    kicker: hasPlannedToday ? 'Dagens økt' : hasNextPlanned ? 'Neste økt' : 'Ingen økt planlagt',
    title: plannedLabel || 'Planlegg én realistisk økt',
    body: decision.action || decision.reason || 'Velg neste steg ut fra dagsform og plan.',
    meta: plannedType,
    primaryAction: hasPlannedToday ? 'complete' : hasNextPlanned ? 'show_next' : 'plan'
  };
}

export function coachDecisionBasis(input = {}) {
  const items = [];
  const add = (label, value, detail = '', status = 'neutral') => {
    const safeLabel = String(label || '').trim();
    const safeValue = String(value || '').trim();
    const safeDetail = String(detail || '').trim();
    if (!safeLabel || (!safeValue && !safeDetail)) return;
    items.push({ label: safeLabel, value: safeValue, detail: safeDetail, status: String(status || 'neutral') });
  };

  const decision = input.decision || {};
  const completedToday = input.completedToday || null;
  const planned = input.planned || null;
  const dailyReadiness = input.dailyReadiness || null;
  const injury = input.injury || null;
  const week = input.week || null;
  const loadTrend = input.loadTrend || null;
  const intensity = input.intensity || null;
  const race = input.race || null;
  const intervals = input.intervals || null;
  const metrics = input.metrics || null;

  if (decision.title) {
    add('Beslutning', decision.title, decision.reason || '', decision.level || 'neutral');
  }

  if (completedToday?.label) {
    const response = completedToday.painText || completedToday.loadLabel || '';
    add('I dag', `Fullført: ${completedToday.label}`, response, completedToday.status || 'green');
  } else if (planned?.label) {
    add('Plan', planned.hasPlannedToday ? `Planlagt i dag: ${planned.label}` : `Neste plan: ${planned.label}`, planned.detail || '', planned.status || 'neutral');
  }

  if (dailyReadiness?.label) {
    const parts = [
      dailyReadiness.sleep ? `søvn ${dailyReadiness.sleep}/5` : '',
      dailyReadiness.energy ? `energi ${dailyReadiness.energy}/5` : '',
      dailyReadiness.stairs
    ].filter(Boolean);
    add('Dagsform', dailyReadiness.label, parts.join(', '), dailyReadiness.status || 'neutral');
  }

  if (injury?.active) {
    add('Kroppssignal', injury.label || 'Aktivt signal', injury.detail || injury.action || '', injury.status || 'yellow');
  }

  if (week?.label) {
    add('Uke', week.label, week.detail || '', week.status || 'neutral');
  }

  if (loadTrend?.label) {
    add('Belastningstrend', loadTrend.label, loadTrend.detail || '', loadTrend.status || 'neutral');
  }

  if (intensity?.label) {
    add('Intensitet', intensity.label, intensity.detail || '', intensity.status || 'neutral');
  }

  if (race?.label) {
    add('Mål', race.label, race.detail || '', race.status || 'neutral');
  }

  if (intervals?.label) {
    add('Kvalitet', intervals.label, intervals.detail || '', intervals.status || 'neutral');
  }

  if (metrics?.label) {
    add('Signaldata', metrics.label, metrics.detail || '', metrics.status || 'neutral');
  }

  if (!items.length) {
    add('Grunnlag', 'Ikke nok data ennå', 'Logg økter, dagsform og kroppssignaler for mer presise råd.');
  }

  return items.slice(0, 8);
}

function trainingVolumeSummary(items = []) {
  return items.reduce((summary, item) => {
    const seconds = completedDurationSeconds(item);
    summary.sessions += 1;
    summary.seconds += seconds;
    summary.km += Math.max(0, Number(item?.distanceKm) || 0);
    if (seconds > 0) summary.sessionsWithDuration += 1;
    return summary;
  }, { sessions: 0, seconds: 0, km: 0, sessionsWithDuration: 0 });
}

export function trainingVolumeRamp(completedItems = [], options = {}) {
  const rules = options.rules && typeof options.rules === 'object' ? options.rules : getCoachRules();
  const config = rules?.thresholds?.volumeRamp || {};
  const todayIso = String(options.todayIso || '').trim();
  const windowWeeks = Math.max(1, Math.round(Number(config.windowWeeks) || 4));
  const maxFactor = Math.max(1, Number(config.maxWeeklyIncreaseFactor) || 1.25);
  const minimumBaselineSessions = Math.max(1, Math.round(Number(config.minimumBaselineSessions) || windowWeeks));
  const minimumRecentSessions = Math.max(1, Math.round(Number(config.minimumRecentSessions) || 2));
  const recentStart = todayIso ? addDays(todayIso, -6) : '';
  const baselineEnd = todayIso ? addDays(todayIso, -7) : '';
  const baselineStart = todayIso ? addDays(todayIso, -((windowWeeks + 1) * 7 - 1)) : '';
  const validItems = Array.isArray(completedItems)
    ? completedItems.filter(item => item?.date && (!todayIso || item.date <= todayIso))
    : [];
  const recentItems = todayIso
    ? validItems.filter(item => item.date >= recentStart)
    : [];
  const baselineItems = todayIso
    ? validItems.filter(item => item.date >= baselineStart && item.date <= baselineEnd)
    : [];
  const recent = trainingVolumeSummary(recentItems);
  const baseline = trainingVolumeSummary(baselineItems);
  const durationCoverage = recent.sessions > 0
    && baseline.sessions > 0
    && recent.sessionsWithDuration / recent.sessions >= 0.5
    && baseline.sessionsWithDuration / baseline.sessions >= 0.5;
  const metric = durationCoverage ? 'duration' : 'sessions';
  const recentValue = metric === 'duration' ? recent.seconds : recent.sessions;
  const baselineWeeklyValue = (metric === 'duration' ? baseline.seconds : baseline.sessions) / windowWeeks;
  const enoughData = Boolean(
    todayIso
    && recent.sessions >= minimumRecentSessions
    && baseline.sessions >= minimumBaselineSessions
    && baselineWeeklyValue > 0
  );
  const factor = enoughData ? recentValue / baselineWeeklyValue : null;
  const status = !enoughData
    ? 'insufficient_data'
    : factor > maxFactor
    ? 'high'
    : factor > 1
    ? 'rising'
    : 'stable';
  const percentChange = factor === null ? null : Math.round((factor - 1) * 100);
  const label = status === 'high'
    ? 'Rask volumøkning'
    : status === 'rising'
    ? 'Volumet øker'
    : status === 'stable'
    ? 'Kontrollert volum'
    : 'Ikke nok volumgrunnlag';
  const metricLabel = metric === 'duration' ? 'treningstid' : 'antall økter';
  const explanation = status === 'high'
    ? `Siste 7 dager har ${Math.max(0, percentChange)} % mer ${metricLabel} enn ukesnittet fra de foregående ${windowWeeks} ukene.`
    : status === 'rising'
    ? `Siste 7 dager ligger ${Math.max(0, percentChange)} % over normalt ${metricLabel}, men under varselgrensen.`
    : status === 'stable'
    ? `Siste 7 dager ligger på eller under normalt ${metricLabel}.`
    : `Trenger minst ${minimumRecentSessions} nyere og ${minimumBaselineSessions} tidligere økter for en trygg sammenligning.`;

  return {
    status,
    level: status === 'high' ? 'yellow' : status === 'stable' ? 'green' : 'neutral',
    label,
    explanation,
    metric,
    windowWeeks,
    maxFactor,
    factor,
    percentChange,
    enoughData,
    recent,
    baseline,
    baselineWeekly: {
      sessions: baseline.sessions / windowWeeks,
      seconds: baseline.seconds / windowWeeks,
      km: baseline.km / windowWeeks
    },
    ranges: { recentStart, recentEnd: todayIso, baselineStart, baselineEnd }
  };
}

function daysBetweenIso(fromIso, toIso) {
  return Math.round((new Date(`${toIso}T12:00:00`) - new Date(`${fromIso}T12:00:00`)) / 86400000);
}

export function comebackProtocol(completedItems = [], options = {}) {
  const rules = options.rules && typeof options.rules === 'object' ? options.rules : getCoachRules();
  const config = rules?.thresholds?.comeback || {};
  const todayIso = String(options.todayIso || '').trim();
  const weeklyTarget = Math.max(0, Math.round(Number(options.weeklyTarget) || 0));
  const triggerDays = Math.max(1, Math.round(Number(config.triggerDaysSinceLast) || 5));
  const longBreakDays = Math.max(triggerDays, Math.round(Number(config.longBreakDays) || 10));
  const longFactor = Math.max(0.1, Math.min(1, Number(config.reducedWeekFactor) || 0.65));
  const shortFactor = Math.max(longFactor, Math.min(1, Number(config.shortBreakWeekFactor) || 0.8));
  const protocolDays = Math.max(1, Math.round(Number(config.protocolDays) || 7));
  const dates = [...new Set(
    (Array.isArray(completedItems) ? completedItems : [])
      .map(item => String(item?.date || '').trim())
      .filter(date => date && (!todayIso || date <= todayIso))
  )].sort();

  const inactive = {
    active: false,
    phase: 'none',
    level: 'neutral',
    label: 'Vanlig treningsrytme',
    explanation: 'Ingen nylig pause krever redusert forventning.',
    gapDays: null,
    daysSinceReturn: null,
    longBreak: false,
    weekFactor: 1,
    effectiveWeeklyTarget: weeklyTarget,
    protocolDays
  };
  if (!todayIso || !dates.length) return inactive;

  const latestDate = dates[dates.length - 1];
  const daysSinceLast = daysBetweenIso(latestDate, todayIso);
  let phase = 'none';
  let gapDays = null;
  let daysSinceReturn = null;

  if (daysSinceLast >= triggerDays) {
    phase = 'awaiting_return';
    gapDays = daysSinceLast;
  } else {
    for (let index = dates.length - 1; index > 0; index -= 1) {
      const gap = daysBetweenIso(dates[index - 1], dates[index]);
      const sinceReturn = daysBetweenIso(dates[index], todayIso);
      if (gap >= triggerDays && sinceReturn >= 0 && sinceReturn < protocolDays) {
        phase = 'return_week';
        gapDays = gap;
        daysSinceReturn = sinceReturn;
        break;
      }
    }
  }

  if (phase === 'none') return inactive;
  const longBreak = gapDays >= longBreakDays;
  const weekFactor = longBreak ? longFactor : shortFactor;
  const effectiveWeeklyTarget = weeklyTarget
    ? Math.max(1, Math.round(weeklyTarget * weekFactor))
    : 0;
  const percent = Math.round(weekFactor * 100);
  const label = phase === 'awaiting_return'
    ? longBreak ? 'Rolig comeback etter lengre pause' : 'Kontrollert retur'
    : 'Comeback-uke';
  const explanation = phase === 'awaiting_return'
    ? `Det er ${gapDays} dager siden siste økt. Start lett og sikt mot omtrent ${percent} % av normal uke.`
    : `Du er ${daysSinceReturn + 1}. dag i retur etter ${gapDays} dagers opphold. Hold uka rundt ${percent} % av normalen.`;

  return {
    active: true,
    phase,
    level: 'yellow',
    label,
    explanation,
    gapDays,
    daysSinceReturn,
    longBreak,
    weekFactor,
    effectiveWeeklyTarget,
    protocolDays
  };
}
