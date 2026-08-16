const REQUIRED_PRINCIPLES = [
  'controlled_threshold',
  'golden_zone',
  'easy_support',
  'fresh_legs',
  'body_signals_first',
  'recovery_is_training',
  'repeatable_week'
];

const isPlainObject = value =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const cloneValue = value => {
  if (Array.isArray(value)) return value.map(cloneValue);
  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneValue(item)]));
  }
  return value;
};

const deepFreeze = value => {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
};

const deepMerge = (defaults, loaded) => {
  if (!isPlainObject(defaults)) return cloneValue(loaded === undefined ? defaults : loaded);
  const source = isPlainObject(loaded) ? loaded : {};
  const merged = {};
  Object.keys(defaults).forEach(key => {
    const fallbackValue = defaults[key];
    const loadedValue = source[key];
    if (isPlainObject(fallbackValue)) {
      merged[key] = deepMerge(fallbackValue, loadedValue);
    } else if (loadedValue === undefined) {
      merged[key] = cloneValue(fallbackValue);
    } else {
      merged[key] = cloneValue(loadedValue);
    }
  });
  Object.keys(source).forEach(key => {
    if (!(key in merged)) merged[key] = cloneValue(source[key]);
  });
  return merged;
};

export const DEFAULT_COACH_RULES = deepFreeze({
  version: 3,
  source: './Treningsfilosofi/coach-rammeverk.md',
  framework: 'Bakken-inspirert kontrollert terskel',
  principles: {
    controlled_threshold: 'Terskel skal være kontrollert og repeterbar, ikke maksimal.',
    golden_zone: 'Den gylne sonen prioriterer litt lavere intensitet for bedre kontinuitet.',
    easy_support: 'Rolig volum støtter kvalitet og kontinuitet.',
    fresh_legs: 'Kvalitet bør komme med friske bein.',
    body_signals_first: 'Kroppssignaler trumfer planen.',
    recovery_is_training: 'Restitusjon er aktiv belastningsstyring.',
    repeatable_week: 'Normaluken skal være enkel, repeterbar og justerbar.'
  },
  knowledge: {
    version: 1,
    sourceLabel: 'Coach-rammeverk for Treningsdagboka',
    concepts: {
      controlled_threshold: { title: 'Kontrollert terskel', explanation: 'Terskelarbeid skal være kontrollert og repeterbart, ikke maksimalt.', use: 'Avslutt med følelsen av at du kunne gjort litt mer, slik at kvalitet kan gjentas over tid.', limit: 'Smerte, tung dagsform eller blokkert hard kvalitet går foran planlagt terskel.' },
      golden_zone: { title: 'Den gylne sonen', explanation: 'En nivåtilpasset pulssone for kontrollert løpskvalitet, beregnet fra registrert makspuls. Nybegynner bruker 77–84 %, viderekommen 78–85 % og erfaren 80–87 %.', use: 'Bruk sonen som veiledning for kontrollert terskel og kvalitetsarbeid.', limit: 'God dagsform eller midlertidig toppform endrer ikke sonen alene; en varig endring i treningsnivå kan gjøre det. Sonen er ikke et generelt pulsmål for rolige/baseøkter.' },
      easy_support: { title: 'Rolig volum støtter kvalitet', explanation: 'Rolige økter bygger aerob base og gjør kvalitetsarbeidet mer repeterbart.', use: 'La hoveddelen av treningen være lett nok til å bevare kontinuitet og friske bein.', limit: 'Gåtur og svært lett aktivitet er nyttig styring, men er ikke alene full løpsspesifikk stimulus.' },
      fresh_legs: { title: 'Friske bein', explanation: 'Kvalitet gir mest verdi når kroppen er klar til å absorbere belastningen.', use: 'Møt terskel, intervall og race/test med overskudd og kontrollerte signaler.', limit: 'Tunge bein, smerteøkning, høy RPE eller svak dagsform trekker anbefalingen ned.' },
      body_signals_first: { title: 'Kroppssignaler først', explanation: 'Smerte og tydelige kroppssignaler trumfer planen og målpress.', use: 'Juster, velg alternativ trening eller hvil når signalene tilsier det.', limit: 'AI gir ikke diagnose; alvorlige eller vedvarende symptomer bør vurderes av fagperson.' },
      recovery_is_training: { title: 'Restitusjon er aktiv styring', explanation: 'Hvile, mobilitet og lett aktivitet kan være riktig belastningsstyring.', use: 'Velg restitusjon når det gjør neste meningsfulle økt bedre.', limit: 'Fryskort og hvile teller ikke som gjennomført trening.' },
      repeatable_week: { title: 'Repeterbar normaluke', explanation: 'Normaluken skal være enkel, justerbar og mulig å gjenta uten å koste for mye.', use: 'Balanser hovedterskel, kontrollert støtte, rolig lengre økt og eventuell X-økt.', limit: 'Normaluken er en standard, ikke en tvang; kroppssignaler og totalbelastning kan endre planen.' }
    }
  },
  decisionPriority: [
    'injury_active',
    'readiness_red',
    'readiness_yellow',
    'recent_load',
    'volume_ramp',
    'week_structure',
    'consistency'
  ],
  thresholds: {
    pain: {
      lowMax: 2,
      moderateMax: 4,
      highMin: 5,
      releaseMaxScore: 1,
      releaseStableCheckins: 2
    },
    readiness: {
      redAvgMax: 2,
      yellowAvgMax: 3.5,
      redHrDelta: 10,
      yellowHrDelta: 5
    },
    intensityBalance: {
      windowDays: 14,
      minimumSessions: 3,
      minEasyShare: 0.4,
      heroConflictHardShare: 0.65,
      insightsEasyPerHardTarget: 3,
      countHighPulseBaseAsEasy: true
    },
    easyCeiling: {
      pctOfThresholdHr: 0.92,
      pctOfMaxHr: 0.82,
      maxPctOfMaxHr: 0.9
    },
    goldenZone: {
      beginner: [0.77, 0.84],
      intermediate: [0.78, 0.85],
      experienced: [0.8, 0.87]
    },
    quality: {
      maxPer7Days: 2,
      minDaysBetween: 2,
      moderateRpeMin: 6,
      hardRpeMin: 7
    },
    volumeRamp: {
      windowWeeks: 4,
      maxWeeklyIncreaseFactor: 1.25,
      minimumBaselineSessions: 4,
      minimumRecentSessions: 2
    },
    periodizedPlan: {
      baselineLookbackWeeks: 6,
      minimumBaselineWeeks: 4,
      durationCoverageThreshold: 0.5,
      significantBaselineChangeFactor: 0.1,
      blockFactors: [
        { min: 0.95, max: 1 },
        { min: 1, max: 1.05 },
        { min: 1.05, max: 1.15 },
        { min: 0.7, max: 0.8 }
      ]
    },
    comeback: {
      triggerDaysSinceLast: 5,
      longBreakDays: 10,
      reducedWeekFactor: 0.65,
      shortBreakWeekFactor: 0.8,
      protocolDays: 7
    },
    streakFreeze: {
      cardsPerMonth: 1,
      validReasons: ['sick', 'injury', 'travel', 'life_load', 'other'],
      requireNoteForReasons: ['other'],
      maxDaysPerFreeze: 14,
      maxActiveFreezesPerMonth: 2,
      protectedWeekCoverageDays: 3,
      allowAutomaticActivation: false
    }
  },
  bakkenRunningWeek: {
    roles: ['main_threshold', 'support_threshold', 'long_easy', 'x_workout'],
    constraints: {
      easyDayAfterQuality: true,
      xWorkoutRequiresSurplus: true
    }
  }
});

const requiredMainSections = [
  ['principles', isPlainObject],
  ['knowledge', isPlainObject],
  ['decisionPriority', Array.isArray],
  ['thresholds', isPlainObject],
  ['bakkenRunningWeek', isPlainObject]
];

const finiteNumber = value => typeof value === 'number' && Number.isFinite(value);

function validateResolvedRules(rules, errors) {
  REQUIRED_PRINCIPLES.forEach(id => {
    if (typeof rules.principles?.[id] !== 'string' || !rules.principles[id].trim()) {
      errors.push(`principles.${id} must be a non-empty string`);
    }
  });
  if (!rules.decisionPriority.length || rules.decisionPriority.some(item => typeof item !== 'string' || !item)) {
    errors.push('decisionPriority must contain non-empty strings');
  }
  if (rules.knowledge?.version !== 1 || typeof rules.knowledge?.sourceLabel !== 'string' || !rules.knowledge.sourceLabel.trim()) {
    errors.push('knowledge must have version 1 and a sourceLabel');
  }
  REQUIRED_PRINCIPLES.forEach(id => {
    const concept = rules.knowledge?.concepts?.[id];
    if (!isPlainObject(concept) || ['title', 'explanation', 'use', 'limit'].some(key => typeof concept[key] !== 'string' || !concept[key].trim())) {
      errors.push(`knowledge.concepts.${id} must contain title, explanation, use and limit`);
    }
  });

  const numberPaths = [
    ['thresholds.pain.lowMax', rules.thresholds?.pain?.lowMax],
    ['thresholds.pain.moderateMax', rules.thresholds?.pain?.moderateMax],
    ['thresholds.pain.highMin', rules.thresholds?.pain?.highMin],
    ['thresholds.readiness.redAvgMax', rules.thresholds?.readiness?.redAvgMax],
    ['thresholds.readiness.yellowAvgMax', rules.thresholds?.readiness?.yellowAvgMax],
    ['thresholds.intensityBalance.windowDays', rules.thresholds?.intensityBalance?.windowDays],
    ['thresholds.intensityBalance.minimumSessions', rules.thresholds?.intensityBalance?.minimumSessions],
    ['thresholds.intensityBalance.minEasyShare', rules.thresholds?.intensityBalance?.minEasyShare],
    ['thresholds.intensityBalance.heroConflictHardShare', rules.thresholds?.intensityBalance?.heroConflictHardShare],
    ['thresholds.easyCeiling.pctOfThresholdHr', rules.thresholds?.easyCeiling?.pctOfThresholdHr],
    ['thresholds.easyCeiling.pctOfMaxHr', rules.thresholds?.easyCeiling?.pctOfMaxHr],
    ['thresholds.easyCeiling.maxPctOfMaxHr', rules.thresholds?.easyCeiling?.maxPctOfMaxHr],
    ['thresholds.quality.moderateRpeMin', rules.thresholds?.quality?.moderateRpeMin],
    ['thresholds.quality.hardRpeMin', rules.thresholds?.quality?.hardRpeMin],
    ['thresholds.volumeRamp.windowWeeks', rules.thresholds?.volumeRamp?.windowWeeks],
    ['thresholds.volumeRamp.maxWeeklyIncreaseFactor', rules.thresholds?.volumeRamp?.maxWeeklyIncreaseFactor],
    ['thresholds.volumeRamp.minimumBaselineSessions', rules.thresholds?.volumeRamp?.minimumBaselineSessions],
    ['thresholds.volumeRamp.minimumRecentSessions', rules.thresholds?.volumeRamp?.minimumRecentSessions],
    ['thresholds.periodizedPlan.baselineLookbackWeeks', rules.thresholds?.periodizedPlan?.baselineLookbackWeeks],
    ['thresholds.periodizedPlan.minimumBaselineWeeks', rules.thresholds?.periodizedPlan?.minimumBaselineWeeks],
    ['thresholds.periodizedPlan.durationCoverageThreshold', rules.thresholds?.periodizedPlan?.durationCoverageThreshold],
    ['thresholds.periodizedPlan.significantBaselineChangeFactor', rules.thresholds?.periodizedPlan?.significantBaselineChangeFactor],
    ['thresholds.comeback.triggerDaysSinceLast', rules.thresholds?.comeback?.triggerDaysSinceLast],
    ['thresholds.comeback.longBreakDays', rules.thresholds?.comeback?.longBreakDays],
    ['thresholds.comeback.reducedWeekFactor', rules.thresholds?.comeback?.reducedWeekFactor],
    ['thresholds.comeback.shortBreakWeekFactor', rules.thresholds?.comeback?.shortBreakWeekFactor],
    ['thresholds.comeback.protocolDays', rules.thresholds?.comeback?.protocolDays],
    ['thresholds.streakFreeze.maxDaysPerFreeze', rules.thresholds?.streakFreeze?.maxDaysPerFreeze],
    ['thresholds.streakFreeze.maxActiveFreezesPerMonth', rules.thresholds?.streakFreeze?.maxActiveFreezesPerMonth],
    ['thresholds.streakFreeze.protectedWeekCoverageDays', rules.thresholds?.streakFreeze?.protectedWeekCoverageDays]
  ];
  numberPaths.forEach(([path, value]) => {
    if (!finiteNumber(value)) errors.push(`${path} must be a finite number`);
  });

  Object.entries(rules.thresholds?.goldenZone || {}).forEach(([level, range]) => {
    if (!Array.isArray(range) || range.length !== 2 || range.some(value => !finiteNumber(value))) {
      errors.push(`thresholds.goldenZone.${level} must contain two numbers`);
    }
  });

  const blockFactors = rules.thresholds?.periodizedPlan?.blockFactors;
  if (!Array.isArray(blockFactors) || blockFactors.length !== 4 || blockFactors.some((factor) => (
    !isPlainObject(factor)
    || !finiteNumber(factor.min)
    || !finiteNumber(factor.max)
    || factor.min <= 0
    || factor.max < factor.min
  ))) {
    errors.push('thresholds.periodizedPlan.blockFactors must contain four positive min/max ranges');
  }

  const roles = rules.bakkenRunningWeek?.roles;
  if (!Array.isArray(roles) || !roles.length || roles.some(role => typeof role !== 'string' || !role)) {
    errors.push('bakkenRunningWeek.roles must contain non-empty strings');
  }
  if (!isPlainObject(rules.bakkenRunningWeek?.constraints)) {
    errors.push('bakkenRunningWeek.constraints must be an object');
  }
  const freeze = rules.thresholds?.streakFreeze || {};
  if (!Array.isArray(freeze.validReasons) || !freeze.validReasons.length || freeze.validReasons.some(reason => typeof reason !== 'string' || !reason.trim())) {
    errors.push('thresholds.streakFreeze.validReasons must contain non-empty strings');
  }
  if (!Array.isArray(freeze.requireNoteForReasons) || freeze.requireNoteForReasons.some(reason => typeof reason !== 'string' || !reason.trim())) {
    errors.push('thresholds.streakFreeze.requireNoteForReasons must be an array of strings');
  }
  if (typeof freeze.allowAutomaticActivation !== 'boolean') {
    errors.push('thresholds.streakFreeze.allowAutomaticActivation must be a boolean');
  }
}

export function validateCoachRules(rawRules) {
  const errors = [];
  if (!isPlainObject(rawRules)) {
    return { valid: false, errors: ['rules must be an object'] };
  }
  if (rawRules.version !== 3) errors.push('version must be 3');
  if (typeof rawRules.framework !== 'string' || !rawRules.framework.trim()) {
    errors.push('framework must be a non-empty string');
  }
  requiredMainSections.forEach(([key, validator]) => {
    if (!validator(rawRules[key])) errors.push(`${key} has an invalid or missing main section`);
  });
  if (errors.length) return { valid: false, errors };

  const merged = deepMerge(DEFAULT_COACH_RULES, rawRules);
  validateResolvedRules(merged, errors);
  return { valid: errors.length === 0, errors };
}

export function mergeCoachRules(loadedRules) {
  return deepMerge(DEFAULT_COACH_RULES, loadedRules);
}

export function resolveCoachRules(rawRules) {
  const validation = validateCoachRules(rawRules);
  if (!validation.valid) {
    return {
      rules: cloneValue(DEFAULT_COACH_RULES),
      source: 'defaults',
      valid: false,
      errors: validation.errors
    };
  }
  return {
    rules: mergeCoachRules(rawRules),
    source: 'loaded',
    valid: true,
    errors: []
  };
}

let activeCoachRules = DEFAULT_COACH_RULES;

export function getCoachRules() {
  return activeCoachRules;
}

export function setActiveCoachRules(rules) {
  activeCoachRules = deepFreeze(cloneValue(rules));
  return activeCoachRules;
}

export function resetCoachRules() {
  activeCoachRules = DEFAULT_COACH_RULES;
  return activeCoachRules;
}

export function coachFrameworkFromRules(rules = getCoachRules()) {
  return {
    name: rules.framework,
    source: rules.source,
    principles: cloneValue(rules.principles)
  };
}

export function coachKnowledgeFromRules(rules = getCoachRules()) {
  const concepts = Object.entries(rules.knowledge?.concepts || {})
    .filter(([id, value]) => REQUIRED_PRINCIPLES.includes(id) && isPlainObject(value))
    .map(([id, value]) => ({
      id,
      title: value.title,
      explanation: value.explanation,
      use: value.use,
      limit: value.limit
    }));
  return {
    version: rules.knowledge?.version || 1,
    framework: rules.framework,
    sourceLabel: rules.knowledge?.sourceLabel || rules.source,
    concepts,
    goldenZoneModel: {
      basis: 'training_level_and_registered_max_hr',
      dailyReadinessChangesRange: false,
      ranges: ['beginner', 'intermediate', 'experienced'].map(level => {
        const range = rules.thresholds?.goldenZone?.[level] || DEFAULT_COACH_RULES.thresholds.goldenZone[level];
        return {
          level,
          lowPct: Number(range[0]),
          highPct: Number(range[1])
        };
      })
    }
  };
}

export async function loadCoachRules(url = './data/coach-rules.json', fetchImpl = globalThis.fetch) {
  if (typeof fetchImpl !== 'function') {
    const fallback = resolveCoachRules(null);
    fallback.errors = ['fetch is unavailable'];
    setActiveCoachRules(fallback.rules);
    return fallback;
  }
  try {
    const response = await fetchImpl(url, { cache: 'no-cache' });
    if (!response?.ok) throw new Error(`rules request failed (${response?.status || 'unknown'})`);
    const resolved = resolveCoachRules(await response.json());
    setActiveCoachRules(resolved.rules);
    return resolved;
  } catch (error) {
    const fallback = resolveCoachRules(null);
    fallback.errors = [String(error?.message || error || 'rules could not be loaded')];
    setActiveCoachRules(fallback.rules);
    return fallback;
  }
}

