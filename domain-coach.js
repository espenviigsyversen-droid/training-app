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

function signalPriority(id, rules = getCoachRules()) {
  const requestedOrder = [
    'injury_active',
    'readiness_red',
    'readiness_yellow',
    'comeback',
    'volume_ramp',
    'intensity_balance',
    'planned_quality',
    'tomorrow_quality',
    'normal_plan'
  ];
  const ruleOrder = Array.isArray(rules?.decisionPriority) ? rules.decisionPriority : [];
  const mapped = {
    injury_active: 'injury_active',
    readiness_red: 'readiness_red',
    readiness_yellow: 'readiness_yellow',
    comeback: 'volume_ramp',
    volume_ramp: 'volume_ramp',
    intensity_balance: 'recent_load',
    planned_quality: 'week_structure',
    tomorrow_quality: 'week_structure',
    normal_plan: 'consistency'
  };
  const ruleIndex = ruleOrder.indexOf(mapped[id]);
  if (ruleIndex >= 0) return (ruleIndex + 1) * 10;
  const fallbackIndex = requestedOrder.indexOf(id);
  return fallbackIndex >= 0 ? (fallbackIndex + 1) * 10 : 999;
}

function uniqueValues(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function signalReason(signal) {
  return {
    id: signal.id,
    label: signal.title,
    detail: signal.summary,
    severity: signal.severity,
    priority: signal.priority
  };
}

export function completedWorkoutNextStep(input = {}) {
  const easyIntent = Boolean(input.easyIntent);
  const easyShare = input.easyShare === null || input.easyShare === undefined
    ? null
    : Math.max(0, Math.min(100, Number(input.easyShare) || 0));
  const rpe = Math.max(0, Number(input.rpe) || 0);
  const loadLevel = String(input.loadLevel || '').toLowerCase();
  const painBefore = Math.max(0, Number(input.painBefore) || 0);
  const painAfter = Math.max(0, Number(input.painAfter) || 0);
  const painArea = String(input.painArea || '').trim();
  const adaptation = String(input.adaptation || '').trim().toLowerCase();
  const bodySignalObserved = Boolean(input.bodySignalObserved);
  const bakkenProfile = input.primaryFocus === 'running' && input.philosophy === 'bakken_threshold';
  const painConcern = painAfter >= 4 || painAfter > painBefore + 1;
  const painPresent = painBefore > 0 || painAfter > 0;
  const areaText = painArea ? ` i ${painArea}` : '';
  const clearSignalText = bodySignalObserved && !painPresent
    ? 'Ingen negativ smerterespons er registrert.'
    : '';

  if (painConcern) {
    return {
      level: 'red',
      title: 'Kroppssignal styrer neste steg',
      recommendation: `Smerteresponsen${areaText} økte til ${painAfter}/10. Velg hvile eller smertefri alternativ trening neste gang, og vurder signalet på nytt før løping.`,
      summary: 'Registrert smerte veier tyngre enn puls- og belastningstall.'
    };
  }

  if (painPresent) {
    return {
      level: 'yellow',
      title: 'Følg registrert kroppssignal',
      recommendation: `Smerte${areaText} var ${painBefore}/10 før og ${painAfter}/10 etter. Hold neste økt rolig eller alternativ til signalet er lavt og stabilt.`,
      summary: 'Neste steg er knyttet til den registrerte kroppsresponsen.'
    };
  }

  if (adaptation && adaptation !== 'none') {
    return {
      level: 'yellow',
      title: 'Bekreft responsen etter tilpasningen',
      recommendation: 'Økten ble tilpasset. La neste økt være rolig og bruk den registrerte kroppsresponsen til å avgjøre når belastningen kan økes.',
      summary: 'En gjennomføringstilpasning skal påvirke neste valg.'
    };
  }

  if (loadLevel === 'high') {
    return {
      level: 'yellow',
      title: 'Gi kvaliteten plass til å virke',
      recommendation: bakkenProfile
        ? 'Prioriter rolig volum, mobilitet eller hvile før neste Bakken-inspirerte kvalitetsøkt.'
        : 'La neste økt være rolig eller restitusjon før ny kvalitetsbelastning.',
      summary: 'Høy belastning bør følges av et tydelig lettere neste steg.'
    };
  }

  if (easyIntent && easyShare !== null) {
    if (easyShare >= 95 && (!rpe || rpe <= 3)) {
      return {
        level: 'green',
        title: 'Den rolige intensjonen traff svært godt',
        recommendation: `${clearSignalText ? `${clearSignalText} ` : ''}Neste planlagte kvalitetsøkt kan beholdes; denne økten krever ingen ekstra belastningsjustering.`,
        summary: `${Math.round(easyShare)} % i sone 1–2 og lav RPE viser en tydelig rolig økt.`
      };
    }
    if (easyShare >= 85) {
      return {
        level: 'green',
        title: 'Rolig økt med god kontroll',
        recommendation: `${clearSignalText ? `${clearSignalText} ` : ''}Følg normal plan videre; økten gir ikke grunn til å flytte neste planlagte kvalitet.`,
        summary: 'Pulsfordelingen samsvarer i hovedsak med den rolige intensjonen.'
      };
    }
    if (easyShare >= 70) {
      return {
        level: 'yellow',
        title: 'Rolig økt ble litt hardere enn ønsket',
        recommendation: `${clearSignalText ? `${clearSignalText} ` : ''}La neste økt være rolig eller hvile før ny kvalitet; mer tid i høyere soner skal gi et lettere neste steg.`,
        summary: `${Math.round(easyShare)} % i sone 1–2 betyr at en merkbar del av økten gikk høyere enn den rolige intensjonen.`
      };
    }
    return {
      level: 'yellow',
      title: 'Økten traff ikke rolig intensjon',
      recommendation: `${clearSignalText ? `${clearSignalText} ` : ''}Behandle økten som moderat belastning og prioriter restitusjon eller svært rolig trening neste gang.`,
      summary: 'Pulsfordelingen viser for mye arbeid over rolige soner til å følge opp med ny kvalitet.'
    };
  }

  if (loadLevel === 'moderate') {
    return {
      level: 'yellow',
      title: 'Moderat belastning trenger rolig støtte',
      recommendation: `${clearSignalText ? `${clearSignalText} ` : ''}La neste økt være rolig nok til at denne belastningen kan absorberes.`,
      summary: 'Belastningsnivået tilsier rolig støtte før mer kvalitet.'
    };
  }

  return {
    level: 'green',
    title: 'Normal plan kan fortsette',
    recommendation: `${clearSignalText ? `${clearSignalText} ` : ''}Følg neste planlagte økt; de registrerte belastningstallene krever ingen endring.`,
    summary: 'Ingen høyere prioritert observasjon krever justering.'
  };
}

export function coachDecisionEngine(input = {}) {
  const rules = input.rules && typeof input.rules === 'object' ? input.rules : getCoachRules();
  const planned = input.planned && typeof input.planned === 'object' ? input.planned : {};
  const tomorrowPlanned = input.tomorrowPlanned && typeof input.tomorrowPlanned === 'object' ? input.tomorrowPlanned : {};
  const plannedLabel = String(planned.label || input.plannedWorkoutLabel || '').trim();
  const tomorrowLabel = String(tomorrowPlanned.label || '').trim();
  const readiness = String(input.dailyReadinessLevel || '').toLowerCase();
  const painTier = String(input.highestPainTier || '').toLowerCase();
  const injuryStatus = String(input.injuryStatus || '').toLowerCase();
  const injuryActive = Boolean(input.injuryActive || painTier || ['worse', 'high', 'improving', 'caution', 'stable'].includes(injuryStatus));
  const painImprovingAfterHigh = Boolean(input.painImprovingAfterHigh);
  const comeback = input.comeback && typeof input.comeback === 'object' ? input.comeback : null;
  const volumeRamp = input.volumeRamp && typeof input.volumeRamp === 'object' ? input.volumeRamp : null;
  const intensityBalance = input.intensityBalance && typeof input.intensityBalance === 'object' ? input.intensityBalance : null;
  const hasPlannedToday = Boolean(input.hasPlannedToday);
  const hasNextPlanned = Boolean(input.hasNextPlanned || plannedLabel);
  const plannedQuality = plannedWorkoutIsQuality(planned) || plannedWorkoutIsQuality({ ...planned, label: plannedLabel });
  const tomorrowQuality = plannedWorkoutIsQuality(tomorrowPlanned);
  const completedAssessment = input.completedAssessment && typeof input.completedAssessment === 'object'
    ? completedWorkoutNextStep(input.completedAssessment)
    : null;
  const completedFeedback = input.completedFeedback && typeof input.completedFeedback === 'object'
    ? input.completedFeedback
    : completedAssessment
    ? {
        level: completedAssessment.level,
        title: completedAssessment.title,
        action: completedAssessment.recommendation,
        reason: completedAssessment.summary
      }
    : null;
  const continuityFreezeToday = Boolean(input.continuityFreezeToday);
  const signals = [];

  const addSignal = (signal) => {
    if (!signal?.id) return;
    const normalized = {
      primaryEligible: signal.primaryEligible !== false,
      blockedActions: [],
      allowedActions: [],
      guardrails: [],
      ...signal,
      priority: Number.isFinite(signal.priority) ? signal.priority : signalPriority(signal.id, rules)
    };
    signals.push(normalized);
  };

  if (completedFeedback) {
    addSignal({
      id: completedFeedback.level === 'red' ? 'post_workout_warning' : 'post_workout_feedback',
      severity: completedFeedback.level || 'green',
      title: completedFeedback.title || 'Økt gjennomført',
      recommendation: completedFeedback.action || 'Bruk resten av dagen til restitusjon.',
      summary: completedFeedback.reason || 'Dagens økt er logget.',
      priority: 1,
      blockedActions: completedFeedback.level === 'red' ? ['hard_quality', 'race_test'] : [],
      allowedActions: completedFeedback.level === 'red' ? ['rest', 'pain_free_alternative'] : ['recovery', 'easy_bonus'],
      guardrails: completedFeedback.level === 'red'
        ? ['Ikke anbefal ny hard økt etter smerteøkning samme dag.']
        : ['Ikke anbefal ekstra hard trening samme dag som kvalitet allerede er gjennomført.']
    });
  }

  if (injuryActive || painImprovingAfterHigh) {
    const redInjury = painTier === 'high' || injuryStatus === 'worse' || injuryStatus === 'high';
    addSignal({
      id: 'injury_active',
      severity: redInjury ? 'red' : 'yellow',
      title: redInjury ? 'Kroppssignal styrer dagen' : 'Følg kroppssignalet tett',
      recommendation: redInjury
        ? 'Velg hvile eller smertefri alternativ trening.'
        : 'Velg rolig/alternativ trening og vent med hard kvalitet.',
      summary: painImprovingAfterHigh
        ? 'Smerten er bedre, men tidligere høy smerte skal fortsatt styre før planen.'
        : redInjury
        ? 'Aktivt eller forverret skadesignal skal overstyre plan og mål.'
        : 'Moderat/lavt skadesignal gjør at hard kvalitet bør vente.',
      blockedActions: ['hard_quality', 'race_test', 'aggressive_progression'],
      allowedActions: redInjury ? ['rest', 'pain_free_alternative', 'mobility'] : ['easy_test', 'easy_alternative', 'mobility'],
      guardrails: ['AI skal ikke anbefale terskel, intervall eller race-test når aktivt kroppssignal blokkerer kvalitet.']
    });
  }

  if (readiness === 'red') {
    addSignal({
      id: 'readiness_red',
      severity: 'red',
      title: 'Rød dagsform',
      recommendation: 'La planen vike og velg hvile eller svært rolig alternativ.',
      summary: 'Søvn, energi, hvilepuls eller trappetest peker mot restitusjon først.',
      blockedActions: ['hard_quality', 'race_test'],
      allowedActions: ['rest', 'very_easy', 'mobility'],
      guardrails: ['Rød dagsform skal ikke matches med hard løping samme dag.']
    });
  } else if (readiness === 'yellow') {
    addSignal({
      id: 'readiness_yellow',
      severity: 'yellow',
      title: 'Gul dagsform',
      recommendation: plannedQuality ? 'Start kontrollert eller bytt til lettere økt.' : 'Hold økten rolig og kort nok til overskudd.',
      summary: 'Dagsformen er brukbar, men bør senke terskelen for justering.',
      blockedActions: plannedQuality ? ['max_effort', 'race_test'] : [],
      allowedActions: ['easy', 'adjusted_plan', 'mobility'],
      guardrails: ['Gul dagsform skal gi justering, ikke prestasjonspress.']
    });
  }

  if (comeback?.active) {
    addSignal({
      id: 'comeback',
      severity: 'yellow',
      title: comeback.label || 'Comeback krever lavere terskel',
      recommendation: 'Gjør økten lettere/kortere og bygg rytme før kvalitet.',
      summary: comeback.explanation || 'Et opphold tilsier redusert forventning denne uken.',
      blockedActions: plannedQuality ? ['hard_quality', 'race_test'] : ['aggressive_progression'],
      allowedActions: ['easy', 'shortened_plan', 'mobility'],
      guardrails: ['Ikke anbefal å ta igjen tapt trening i comeback-perioden.']
    });
  }

  if (volumeRamp?.status === 'high') {
    addSignal({
      id: 'volume_ramp',
      severity: 'yellow',
      title: 'Volumet har økt raskt',
      recommendation: 'Hold neste økt rolig eller kortere.',
      summary: volumeRamp.explanation || 'Siste periode ligger over normal belastning.',
      blockedActions: plannedQuality ? ['hard_quality'] : ['aggressive_progression'],
      allowedActions: ['easy', 'recovery', 'shortened_plan'],
      guardrails: ['Rask volumøkning skal dempe hard kvalitet, ikke trigge mer progresjon.']
    });
  }

  if (intensityBalance?.verdict === 'too_hard' || intensityBalance?.status === 'yellow') {
    addSignal({
      id: 'intensity_balance',
      severity: 'yellow',
      title: 'Intensitetsbalansen er for hard',
      recommendation: 'Prioriter rolig støtte eller restitusjon.',
      summary: intensityBalance.explanation || 'Fordelingen mellom rolige og harde økter trenger mer rolig volum.',
      blockedActions: plannedQuality ? ['hard_quality'] : [],
      allowedActions: ['easy', 'recovery', 'mobility'],
      guardrails: ['Ikke tolk skjev hardandel som grunn til mer kvalitet.']
    });
  }

  if (tomorrowQuality && !hasPlannedToday) {
    addSignal({
      id: 'tomorrow_quality',
      severity: 'green',
      title: 'Kvalitet i morgen',
      recommendation: 'Hold dagen lett slik at morgendagens kvalitet får friske bein.',
      summary: tomorrowLabel ? `${tomorrowLabel} ligger i morgen.` : 'Det ligger en hard/kvalitetsøkt i morgen.',
      blockedActions: ['extra_hard_today'],
      allowedActions: ['rest', 'easy', 'mobility'],
      guardrails: ['Ikke anbefal hard bonusøkt dagen før planlagt kvalitet.']
    });
  }

  if (continuityFreezeToday) {
    addSignal({
      id: 'continuity_freeze_today',
      severity: 'neutral',
      title: 'Fryskort aktivt i dag',
      recommendation: 'Fryskort beskytter kontinuitet, men teller ikke som trening.',
      summary: 'Dette er motivasjonsbeskyttelse, ikke treningsbelastning.',
      primaryEligible: false,
      allowedActions: ['rest', 'normal_plan_if_body_ready'],
      guardrails: ['Fryskort skal ikke gi økter, kilometer, kvalitet eller belastningskreditt.']
    });
  }

  addSignal({
    id: 'normal_plan',
    severity: hasPlannedToday || hasNextPlanned ? 'green' : 'neutral',
    title: hasPlannedToday ? 'Følg planen' : hasNextPlanned ? 'Bruk planen som retning' : 'Planlegg realistisk',
    recommendation: hasPlannedToday
      ? plannedLabel ? `Gjennomfør ${plannedLabel} med kontroll.` : 'Gjennomfør planlagt økt med kontroll.'
      : hasNextPlanned
      ? 'Bruk dagen til å møte neste økt med overskudd.'
      : 'Velg én gjennomførbar økt eller planlegg neste steg.',
    summary: 'Ingen høyere prioriterte signaler krever endring.',
    allowedActions: ['normal_plan', 'easy_adjustment']
  });

  const primaryCandidates = signals.filter(signal => signal.primaryEligible);
  const primary = [...primaryCandidates].sort((a, b) => a.priority - b.priority)[0] || signals[0];
  const secondarySignals = signals
    .filter(signal => signal !== primary && signal.id !== 'normal_plan')
    .sort((a, b) => a.priority - b.priority);
  const relevantSignals = [primary, ...secondarySignals].filter(Boolean);

  return {
    primarySignal: primary?.id || 'normal_plan',
    severity: primary?.severity || 'neutral',
    recommendation: primary?.recommendation || '',
    title: primary?.title || '',
    summary: primary?.summary || '',
    reasons: relevantSignals.map(signalReason),
    secondarySignals: secondarySignals.map(signal => ({
      id: signal.id,
      severity: signal.severity,
      title: signal.title,
      summary: signal.summary,
      recommendation: signal.recommendation
    })),
    blockedActions: uniqueValues(relevantSignals.flatMap(signal => signal.blockedActions || [])),
    allowedActions: uniqueValues(relevantSignals.flatMap(signal => signal.allowedActions || [])),
    guardrails: uniqueValues(relevantSignals.flatMap(signal => signal.guardrails || []))
  };
}

const AI_CONTEXT_SCHEMA_VERSION = 2;
const AI_CONTEXT_MAX_TEXT = 500;
const AI_CONTEXT_MAX_REASONS = 8;
const AI_CONTEXT_MAX_ACTIONS = 12;

function aiPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function aiText(value, maxLength = AI_CONTEXT_MAX_TEXT) {
  return String(value ?? '').trim().slice(0, maxLength);
}

function aiNullableText(value, maxLength = AI_CONTEXT_MAX_TEXT) {
  const text = aiText(value, maxLength);
  return text || null;
}

function aiNumber(value, options = {}) {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  const min = Number.isFinite(options.min) ? options.min : -Infinity;
  const max = Number.isFinite(options.max) ? options.max : Infinity;
  return Math.min(max, Math.max(min, number));
}

function aiBoolean(value) {
  return value === true;
}

function aiTextList(values, maxItems = AI_CONTEXT_MAX_ACTIONS, maxLength = 160) {
  return uniqueValues((Array.isArray(values) ? values : [])
    .map(value => aiText(value, maxLength))
    .filter(Boolean))
    .slice(0, maxItems);
}

function aiReasonList(values) {
  return (Array.isArray(values) ? values : [])
    .slice(0, AI_CONTEXT_MAX_REASONS)
    .map(value => {
      const reason = aiPlainObject(value);
      return {
        id: aiNullableText(reason.id, 80),
        label: aiNullableText(reason.label || reason.title, 160),
        detail: aiNullableText(reason.detail || reason.summary, AI_CONTEXT_MAX_TEXT),
        severity: aiNullableText(reason.severity, 40),
        priority: aiNumber(reason.priority, { min: 0, max: 9999 })
      };
    })
    .filter(reason => reason.id || reason.label || reason.detail);
}

function aiSecondarySignals(values) {
  return (Array.isArray(values) ? values : [])
    .slice(0, AI_CONTEXT_MAX_REASONS)
    .map(value => {
      const signal = aiPlainObject(value);
      return {
        id: aiNullableText(signal.id, 80),
        severity: aiNullableText(signal.severity, 40),
        title: aiNullableText(signal.title, 160),
        summary: aiNullableText(signal.summary, AI_CONTEXT_MAX_TEXT),
        recommendation: aiNullableText(signal.recommendation, AI_CONTEXT_MAX_TEXT)
      };
    })
    .filter(signal => signal.id || signal.title || signal.summary);
}

function aiCoachDecision(value) {
  const decision = aiPlainObject(value);
  return {
    primarySignal: aiNullableText(decision.primarySignal, 80) || 'normal_plan',
    severity: aiNullableText(decision.severity, 40) || 'neutral',
    recommendation: aiNullableText(decision.recommendation, AI_CONTEXT_MAX_TEXT),
    title: aiNullableText(decision.title, 160),
    summary: aiNullableText(decision.summary, AI_CONTEXT_MAX_TEXT),
    reasons: aiReasonList(decision.reasons),
    secondarySignals: aiSecondarySignals(decision.secondarySignals),
    blockedActions: aiTextList(decision.blockedActions),
    allowedActions: aiTextList(decision.allowedActions),
    guardrails: aiTextList(decision.guardrails, AI_CONTEXT_MAX_ACTIONS, AI_CONTEXT_MAX_TEXT)
  };
}

function aiReadiness(value) {
  const readiness = aiPlainObject(value);
  return {
    light: aiNullableText(readiness.light || readiness.level, 40),
    sleepScore: aiNumber(readiness.sleepScore ?? readiness.sleep, { min: 1, max: 5 }),
    energyScore: aiNumber(readiness.energyScore ?? readiness.energy, { min: 1, max: 5 }),
    stairsOk: readiness.stairsOk === true ? true : readiness.stairsOk === false ? false : null,
    restingHeartRate: aiNumber(readiness.restingHeartRate, { min: 20, max: 250 })
  };
}

function aiBodySignal(value) {
  const signal = aiPlainObject(value);
  return {
    active: aiBoolean(signal.active),
    region: aiNullableText(signal.region, 80),
    side: aiNullableText(signal.side, 40),
    area: aiNullableText(signal.area, 120),
    painNow: aiNumber(signal.painNow, { min: 0, max: 10 }),
    trend: aiNullableText(signal.trend, 40),
    status: aiNullableText(signal.status, 40)
  };
}

function aiWorkout(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const workout = aiPlainObject(value);
  const result = {
    date: aiNullableText(workout.date, 10),
    label: aiNullableText(workout.label || workout.name, 180),
    type: aiNullableText(workout.type, 80),
    intensity: aiNullableText(workout.intensity, 80),
    role: aiNullableText(workout.role, 80),
    purpose: aiNullableText(workout.purpose, 80),
    load: aiNullableText(workout.load, 80),
    durationSeconds: aiNumber(workout.durationSeconds, { min: 0, max: 172800 }),
    distanceKm: aiNumber(workout.distanceKm, { min: 0, max: 1000 }),
    averageHeartRate: aiNumber(workout.averageHeartRate, { min: 20, max: 250 }),
    rpe: aiNumber(workout.rpe, { min: 0, max: 10 }),
    structuredWorkSeconds: aiNumber(workout.structuredWorkSeconds, { min: 0, max: 86400 }),
    completionStatus: aiNullableText(workout.completionStatus, 60)
  };
  return Object.values(result).some(value => value !== null) ? result : null;
}

function aiTrainingWindow(value) {
  const summary = aiPlainObject(value);
  return {
    sessions: aiNumber(summary.sessions, { min: 0, max: 1000 }) || 0,
    durationSeconds: aiNumber(summary.durationSeconds ?? summary.seconds, { min: 0, max: 31536000 }) || 0,
    distanceKm: aiNumber(summary.distanceKm ?? summary.km, { min: 0, max: 100000 }) || 0,
    easyCount: aiNumber(summary.easyCount, { min: 0, max: 1000 }) || 0,
    hardCount: aiNumber(summary.hardCount, { min: 0, max: 1000 }) || 0,
    structuredIntervalCount: aiNumber(summary.structuredIntervalCount, { min: 0, max: 1000 }) || 0,
    structuredWorkSeconds: aiNumber(summary.structuredWorkSeconds, { min: 0, max: 31536000 }) || 0
  };
}

function aiIntensityBalance(value) {
  const balance = aiPlainObject(value);
  return {
    windowDays: aiNumber(balance.windowDays, { min: 1, max: 90 }),
    easyCount: aiNumber(balance.easyCount, { min: 0, max: 1000 }) || 0,
    hardCount: aiNumber(balance.hardCount, { min: 0, max: 1000 }) || 0,
    highPulseBaseCount: aiNumber(balance.highPulseBaseCount, { min: 0, max: 1000 }) || 0,
    totalCount: aiNumber(balance.totalCount, { min: 0, max: 1000 }) || 0,
    easyShare: aiNumber(balance.easyShare, { min: 0, max: 1 }),
    hardShare: aiNumber(balance.hardShare, { min: 0, max: 1 }),
    verdict: aiNullableText(balance.verdict, 60),
    explanation: aiNullableText(balance.explanation, AI_CONTEXT_MAX_TEXT)
  };
}

function aiVolumeRamp(value) {
  const ramp = aiPlainObject(value);
  return {
    status: aiNullableText(ramp.status, 60),
    level: aiNullableText(ramp.level, 40),
    label: aiNullableText(ramp.label, 120),
    explanation: aiNullableText(ramp.explanation, AI_CONTEXT_MAX_TEXT),
    metric: aiNullableText(ramp.metric, 40),
    factor: aiNumber(ramp.factor, { min: 0, max: 10 }),
    percentChange: aiNumber(ramp.percentChange, { min: -100, max: 1000 }),
    enoughData: aiBoolean(ramp.enoughData)
  };
}

function aiComeback(value) {
  const comeback = aiPlainObject(value);
  return {
    active: aiBoolean(comeback.active),
    phase: aiNullableText(comeback.phase, 60),
    level: aiNullableText(comeback.level, 40),
    label: aiNullableText(comeback.label, 120),
    explanation: aiNullableText(comeback.explanation, AI_CONTEXT_MAX_TEXT),
    gapDays: aiNumber(comeback.gapDays, { min: 0, max: 3650 }),
    daysSinceReturn: aiNumber(comeback.daysSinceReturn, { min: 0, max: 3650 }),
    weekFactor: aiNumber(comeback.weekFactor, { min: 0, max: 1 }),
    effectiveWeeklyTarget: aiNumber(comeback.effectiveWeeklyTarget, { min: 0, max: 100 })
  };
}

function aiProfile(value) {
  const profile = aiPlainObject(value);
  const goldenZone = aiPlainObject(profile.goldenZone);
  const heartRateZoneProfile = aiPlainObject(profile.heartRateZoneProfile);
  const levelAssessment = aiPlainObject(profile.trainingLevelAssessment);
  const rawLevel = aiNullableText(profile.level, 80);
  const levelLabel = rawLevel === 'experienced'
    ? 'Erfaren/godt trent'
    : rawLevel === 'intermediate'
      ? 'Viderekommen'
      : rawLevel
        ? 'Nybegynner/under oppbygging'
        : null;
  return {
    primaryFocus: aiNullableText(profile.primaryFocus, 80),
    level: rawLevel,
    levelLabel,
    levelSource: 'user_configured',
    philosophy: aiNullableText(profile.philosophy, 80),
    priority: aiNullableText(profile.priority, 80),
    trainingFocus: aiNullableText(profile.trainingFocus, 80),
    weeklySessionTarget: aiNumber(profile.weeklySessionTarget, { min: 0, max: 100 }),
    trainingLevelAssessment: {
      version: aiNumber(levelAssessment.version, { min: 1, max: 20 }),
      level: aiNullableText(levelAssessment.level, 40),
      levelLabel: aiNullableText(levelAssessment.levelLabel, 80),
      score: aiNumber(levelAssessment.score, { min: 0, max: 100 }),
      confidence: aiNullableText(levelAssessment.confidence, 20),
      recommendedCoachLevel: aiNullableText(levelAssessment.recommendedCoachLevel, 40),
      eligibleForConfirmation: Boolean(levelAssessment.eligibleForConfirmation),
      safetyBlockers: (Array.isArray(levelAssessment.safetyBlockers) ? levelAssessment.safetyBlockers : [])
        .slice(0, 5).map(item => aiNullableText(item, 120)).filter(Boolean),
      dimensions: (Array.isArray(levelAssessment.dimensions) ? levelAssessment.dimensions : [])
        .slice(0, 6)
        .map(item => {
          const dimension = aiPlainObject(item);
          return {
            id: aiNullableText(dimension.id, 40),
            score: aiNumber(dimension.score, { min: 0, max: 100 }),
            status: aiNullableText(dimension.status, 20),
            summary: aiNullableText(dimension.summary, 240)
          };
        })
        .filter(item => item.id)
    },
    goldenZone: {
      low: aiNumber(goldenZone.low, { min: 20, max: 250 }),
      high: aiNumber(goldenZone.high, { min: 20, max: 250 }),
      maxHeartRate: aiNumber(goldenZone.maxHeartRate ?? goldenZone.maxHR, { min: 20, max: 250 }),
      lowPct: aiNumber(goldenZone.lowPct, { min: 0.4, max: 1 }),
      highPct: aiNumber(goldenZone.highPct, { min: 0.4, max: 1 }),
      appliesTo: 'controlled_running_quality',
      source: 'coach_calculated',
      sourceLabel: aiNullableText(goldenZone.sourceLabel, 120),
      separateFromTestZones: true
    },
    heartRateZoneProfile: heartRateZoneProfile.id ? {
      id: aiNullableText(heartRateZoneProfile.id, 120),
      name: aiNullableText(heartRateZoneProfile.name, 160),
      sourceType: aiNullableText(heartRateZoneProfile.sourceType, 20),
      sourceName: aiNullableText(heartRateZoneProfile.sourceName, 160),
      testedAt: aiNullableText(heartRateZoneProfile.testedAt, 10),
      effectiveFrom: aiNullableText(heartRateZoneProfile.effectiveFrom, 10),
      boundaryPolicy: aiNullableText(heartRateZoneProfile.boundaryPolicy, 80),
      zones: (Array.isArray(heartRateZoneProfile.zones) ? heartRateZoneProfile.zones : [])
        .slice(0, 5)
        .map(item => {
          const zone = aiPlainObject(item);
          return {
            id: aiNullableText(zone.id, 20),
            label: aiNullableText(zone.label, 80),
            minBpm: aiNumber(zone.minBpm, { min: 20, max: 250 }),
            maxBpm: aiNumber(zone.maxBpm, { min: 20, max: 250 })
          };
        })
        .filter(zone => zone.id && zone.minBpm !== null && zone.maxBpm !== null),
      separateFromGoldenZone: true
    } : null
  };
}

function aiCoachKnowledge(value) {
  const knowledge = aiPlainObject(value);
  const goldenZoneModel = aiPlainObject(knowledge.goldenZoneModel);
  const allowedLevels = new Set(['beginner', 'intermediate', 'experienced']);
  const ranges = (Array.isArray(goldenZoneModel.ranges) ? goldenZoneModel.ranges : [])
    .slice(0, 3)
    .map(item => {
      const range = aiPlainObject(item);
      return {
        level: aiNullableText(range.level, 40),
        lowPct: aiNumber(range.lowPct, { min: 0.4, max: 1 }),
        highPct: aiNumber(range.highPct, { min: 0.4, max: 1 })
      };
    })
    .filter(range => allowedLevels.has(range.level) && range.lowPct !== null && range.highPct !== null);
  const concepts = (Array.isArray(knowledge.concepts) ? knowledge.concepts : [])
    .slice(0, 12)
    .map(item => {
      const concept = aiPlainObject(item);
      return {
        id: aiNullableText(concept.id, 80),
        title: aiNullableText(concept.title, 120),
        explanation: aiNullableText(concept.explanation, 400),
        use: aiNullableText(concept.use, 400),
        limit: aiNullableText(concept.limit, 400)
      };
    })
    .filter(concept => concept.id && concept.title && concept.explanation);
  return {
    version: aiNumber(knowledge.version, { min: 1, max: 20 }) || 1,
    framework: aiNullableText(knowledge.framework, 160),
    sourceLabel: aiNullableText(knowledge.sourceLabel, 160),
    concepts,
    goldenZoneModel: {
      basis: 'training_level_and_registered_max_hr',
      dailyReadinessChangesRange: false,
      ranges
    }
  };
}

function aiGoals(value) {
  const goals = aiPlainObject(value);
  return {
    active: aiBoolean(goals.active),
    raceName: aiNullableText(goals.raceName || goals.name, 160),
    raceDate: aiNullableText(goals.raceDate || goals.date, 10),
    distanceKm: aiNumber(goals.distanceKm, { min: 0, max: 1000 }),
    targetTimeSeconds: aiNumber(goals.targetTimeSeconds, { min: 0, max: 604800 }),
    phase: aiNullableText(goals.phase, 120),
    score: aiNumber(goals.score, { min: 0, max: 100 }),
    scoreTrend: aiNumber(goals.scoreTrend, { min: -100, max: 100 }),
    nextMilestone: aiNullableText(goals.nextMilestone, 240),
    nextStep: aiNullableText(goals.nextStep, AI_CONTEXT_MAX_TEXT)
  };
}

function aiContinuity(value) {
  const continuity = aiPlainObject(value);
  return {
    streakWeeks: aiNumber(continuity.streakWeeks, { min: 0, max: 5200 }) || 0,
    freezeActiveToday: aiBoolean(continuity.freezeActiveToday),
    weekProtected: aiBoolean(continuity.weekProtected),
    freezeReason: aiNullableText(continuity.freezeReason, 80),
    freezeIsTraining: false
  };
}

function aiDataQuality(value) {
  const quality = aiPlainObject(value);
  return {
    missing: aiTextList(quality.missing, 20, 120),
    stale: aiTextList(quality.stale, 20, 120),
    assumptions: aiTextList(quality.assumptions, 20, 240)
  };
}

export function buildAiCoachContext(input = {}, options = {}) {
  const source = aiPlainObject(input);
  const today = aiPlainObject(source.today);
  const training = aiPlainObject(source.trainingSummary);
  const highlights = aiPlainObject(source.recentHighlights);
  const generatedAtValue = options.generatedAt || source.generatedAt || new Date().toISOString();
  const generatedAtDate = new Date(generatedAtValue);
  const generatedAt = Number.isNaN(generatedAtDate.getTime())
    ? new Date(0).toISOString()
    : generatedAtDate.toISOString();

  return {
    schemaVersion: AI_CONTEXT_SCHEMA_VERSION,
    generatedAt,
    locale: 'nb-NO',
    coachDecision: aiCoachDecision(source.coachDecision),
    today: {
      date: aiNullableText(today.date, 10),
      readiness: aiReadiness(today.readiness),
      bodySignal: aiBodySignal(today.bodySignal),
      plannedToday: aiWorkout(today.plannedToday),
      plannedTomorrow: aiWorkout(today.plannedTomorrow)
    },
    trainingSummary: {
      days7: aiTrainingWindow(training.days7),
      days14: aiTrainingWindow(training.days14),
      days28: aiTrainingWindow(training.days28),
      intensityBalance: aiIntensityBalance(training.intensityBalance),
      volumeRamp: aiVolumeRamp(training.volumeRamp),
      comeback: aiComeback(training.comeback)
    },
    profile: aiProfile(source.profile),
    coachKnowledge: aiCoachKnowledge(source.coachKnowledge),
    goals: aiGoals(source.goals),
    continuity: aiContinuity(source.continuity),
    recentHighlights: {
      latestWorkout: aiWorkout(highlights.latestWorkout),
      latestRelevantTest: aiWorkout(highlights.latestRelevantTest),
      latestPb: aiWorkout(highlights.latestPb)
    },
    dataQuality: aiDataQuality(source.dataQuality)
  };
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
      body: decision.action || decision.reason || 'Økten er logget. Neste steg følger av responsen og planen.',
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
  const decisionPackage = input.coachDecision || decision.coachDecision || null;
  const secondarySignal = Array.isArray(decisionPackage?.secondarySignals)
    ? decisionPackage.secondarySignals[0]
    : null;
  if (secondarySignal?.title) {
    add('Sekundærsignal', secondarySignal.title, secondarySignal.summary || secondarySignal.recommendation || '', secondarySignal.severity || 'neutral');
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

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const FREEZE_REASON_LABELS = {
  sick: 'Sykdom',
  injury: 'Skade/kroppssignal',
  travel: 'Reise',
  life_load: 'Livsbelastning',
  other: 'Annet'
};

function cleanIsoDate(value) {
  const text = String(value || '').trim();
  return ISO_DATE_RE.test(text) ? text : '';
}

function cleanFreezeStatus(value) {
  return value === 'archived' ? 'archived' : value === 'ended' ? 'ended' : 'active';
}

function cleanFreezeReason(value, rules = getCoachRules()) {
  const reason = String(value || '').trim();
  const validReasons = Array.isArray(rules?.thresholds?.streakFreeze?.validReasons)
    ? rules.thresholds.streakFreeze.validReasons
    : ['sick', 'injury', 'travel', 'life_load', 'other'];
  return validReasons.includes(reason) ? reason : '';
}

export function continuityFreezeReasonLabel(reason) {
  return FREEZE_REASON_LABELS[String(reason || '').trim()] || 'Annet';
}

export function normalizeContinuityFreeze(input = {}, options = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const rules = options.rules && typeof options.rules === 'object' ? options.rules : getCoachRules();
  const id = String(input.id || '').trim();
  const startDate = cleanIsoDate(input.startDate);
  const endDate = cleanIsoDate(input.endDate);
  if (!id || !startDate || !endDate || endDate < startDate) return null;
  const reason = cleanFreezeReason(input.reason, rules);
  if (!reason) return null;
  const note = String(input.note || '').trim().slice(0, 500);
  const requiredNotes = Array.isArray(rules?.thresholds?.streakFreeze?.requireNoteForReasons)
    ? rules.thresholds.streakFreeze.requireNoteForReasons
    : ['other'];
  if (requiredNotes.includes(reason) && !note) return null;
  const source = input.source === 'system_suggested' ? 'system_suggested' : 'manual';
  const status = cleanFreezeStatus(input.status);
  const recoveredAt = cleanIsoDate(input.recoveredAt);
  if (recoveredAt && (recoveredAt < startDate || recoveredAt > endDate)) return null;
  return {
    id,
    startDate,
    endDate,
    reason,
    note,
    source,
    status,
    recoveredAt,
    endedAt: String(input.endedAt || '').trim(),
    createdAt: String(input.createdAt || '').trim(),
    updatedAt: String(input.updatedAt || '').trim()
  };
}

export function normalizeContinuityFreezes(values = [], options = {}) {
  return (Array.isArray(values) ? values : [])
    .map(item => normalizeContinuityFreeze(item, options))
    .filter(Boolean)
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.endDate.localeCompare(b.endDate));
}

function activeFreezes(values = [], rules = getCoachRules()) {
  return normalizeContinuityFreezes(values, { rules }).filter(item => item.status === 'active');
}

export function isDateFrozen(dateIso, freezes = [], options = {}) {
  const date = cleanIsoDate(dateIso);
  if (!date) return false;
  const rules = options.rules && typeof options.rules === 'object' ? options.rules : getCoachRules();
  return activeFreezes(freezes, rules).some(item => item.startDate <= date && item.endDate >= date);
}

export function continuityFreezeDays(freezes = [], startDateIso, endDateIso, options = {}) {
  const startDate = cleanIsoDate(startDateIso);
  const endDate = cleanIsoDate(endDateIso);
  if (!startDate || !endDate || endDate < startDate) return [];
  const rules = options.rules && typeof options.rules === 'object' ? options.rules : getCoachRules();
  const days = new Set();
  activeFreezes(freezes, rules).forEach(item => {
    const from = item.startDate > startDate ? item.startDate : startDate;
    const to = item.endDate < endDate ? item.endDate : endDate;
    if (to < from) return;
    let cursor = from;
    while (cursor <= to) {
      days.add(cursor);
      cursor = addDays(cursor, 1);
    }
  });
  return [...days].sort();
}

export function continuityFreezeWeekSummary(weekStartIso, freezes = [], options = {}) {
  const weekStart = cleanIsoDate(weekStartIso);
  if (!weekStart) {
    return { protected: false, weekStart: '', weekEnd: '', frozenDays: [], frozenDayCount: 0, reasons: [], reasonLabels: [], primaryReason: '' };
  }
  const rules = options.rules && typeof options.rules === 'object' ? options.rules : getCoachRules();
  const weekEnd = addDays(weekStart, 6);
  const frozenDays = continuityFreezeDays(freezes, weekStart, weekEnd, { rules });
  const threshold = Math.max(1, Math.round(Number(rules?.thresholds?.streakFreeze?.protectedWeekCoverageDays) || 3));
  const reasons = [...new Set(activeFreezes(freezes, rules)
    .filter(item => item.startDate <= weekEnd && item.endDate >= weekStart)
    .map(item => item.reason))];
  return {
    protected: frozenDays.length >= threshold,
    weekStart,
    weekEnd,
    frozenDays,
    frozenDayCount: frozenDays.length,
    threshold,
    reasons,
    reasonLabels: reasons.map(continuityFreezeReasonLabel),
    primaryReason: reasons[0] || ''
  };
}

export function isWeekProtectedByFreeze(weekStartIso, freezes = [], options = {}) {
  return continuityFreezeWeekSummary(weekStartIso, freezes, options).protected;
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
  const recoveryDate = cleanIsoDate(options.recoveryDate);
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

  const firstAfterRecovery = recoveryDate ? dates.find(date => date >= recoveryDate) || '' : '';
  const lastBeforeRecovery = recoveryDate ? [...dates].reverse().find(date => date < recoveryDate) || '' : '';
  if (recoveryDate && recoveryDate <= todayIso && !firstAfterRecovery) {
    phase = 'awaiting_return';
    gapDays = lastBeforeRecovery ? daysBetweenIso(lastBeforeRecovery, recoveryDate) : daysSinceLast;
  } else if (recoveryDate && firstAfterRecovery && daysBetweenIso(firstAfterRecovery, todayIso) < protocolDays) {
    phase = 'return_week';
    gapDays = lastBeforeRecovery ? daysBetweenIso(lastBeforeRecovery, firstAfterRecovery) : daysSinceLast;
    daysSinceReturn = daysBetweenIso(firstAfterRecovery, todayIso);
  } else if (daysSinceLast >= triggerDays) {
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
    , recoveryDate: recoveryDate || null
  };
}
