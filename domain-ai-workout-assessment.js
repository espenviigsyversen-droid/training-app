const ASSESSMENT_VERSION = 2;

function finite(value) {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function text(value, max = 180) {
  return String(value || '').trim().slice(0, max);
}

function compactObject(value = {}) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== null && item !== '' && item !== undefined));
}

function zonePercentages(distribution) {
  if (!distribution?.zones || typeof distribution.zones !== 'object') return null;
  const result = {};
  for (const id of ['z1', 'z2', 'z3', 'z4', 'z5']) {
    const zone = distribution.zones[id];
    const percent = finite(zone?.percent ?? zone);
    if (percent !== null) result[id] = Math.max(0, Math.min(100, Math.round(percent)));
  }
  return Object.keys(result).length ? result : null;
}

function normalizedComparisonContext(value = {}) {
  if (!value || typeof value !== 'object' || !['available', 'insufficient', 'not_applicable'].includes(value.status)) return null;
  const allowedText = ['status', 'basis', 'activitySetting', 'paceSource', 'confidence'];
  const allowedNumbers = [
    'sampleSize', 'windowDays', 'currentPaceSecondsPerKm', 'referencePaceSecondsPerKm', 'paceDeltaPercent',
    'currentAverageHeartRate', 'referenceAverageHeartRate', 'heartRateDeltaBpm', 'currentDurationSeconds',
    'referenceDurationSeconds', 'durationDeltaPercent', 'currentElevationGainPerKm', 'referenceElevationGainPerKm'
  ];
  const result = {};
  allowedText.forEach(key => {
    const normalized = text(value[key], 80);
    if (normalized) result[key] = normalized;
  });
  allowedNumbers.forEach(key => {
    const normalized = finite(value[key]);
    if (normalized !== null) result[key] = normalized;
  });
  return Object.keys(result).length ? result : null;
}

export function buildAiWorkoutAssessmentInput({ completed = {}, template = {}, loadAssessment = {}, zoneCompliance = null, comparisonContext = null } = {}) {
  const garmin = completed?.externalData?.garmin || {};
  return compactObject({
    schemaVersion: ASSESSMENT_VERSION,
    date: text(completed.date, 10),
    label: text(template.name || completed.manualName || 'Gjennomført økt'),
    type: text(template.type),
    intensity: text(template.intensity),
    role: text(template.role),
    purpose: text(template.purpose, 300),
    durationSeconds: finite(completed.durationSeconds),
    distanceKm: finite(completed.distanceKm),
    averagePaceSecondsPerKm: finite(completed.averagePaceSecondsPerKm),
    averageSpeedKmh: finite(completed.averageSpeedKmh),
    elevationGainM: finite(completed.elevationGainM),
    averageHeartRate: finite(completed.avgHeartRate),
    maxHeartRate: finite(completed.maxHeartRate),
    heartRateZonePercent: zonePercentages(completed.heartRateZoneDistribution),
    rpe: finite(completed.rpe),
    execution: text(completed.execution),
    feelingScore: finite(completed.feelingScore),
    readiness: compactObject({
      sleep: finite(completed.readiness?.sleep),
      energy: finite(completed.readiness?.energy),
      stairsOk: typeof completed.readiness?.stairsOk === 'boolean' ? completed.readiness.stairsOk : null
    }),
    bodyResponse: compactObject({
      painBefore: finite(completed.bodyStatus?.painBefore),
      painAfter: finite(completed.bodyStatus?.painAfter),
      adaptation: text(completed.bodyStatus?.adaptation)
    }),
    objectiveMetrics: compactObject({
      aerobicTrainingEffect: finite(garmin.aerobicTrainingEffect),
      trainingStressScore: finite(garmin.trainingStressScore),
      movingTimeSeconds: finite(garmin.movingTimeSeconds),
      elapsedTimeSeconds: finite(garmin.elapsedTimeSeconds),
      rounds: finite(garmin.numberOfLaps),
      bestPaceSecondsPerKm: finite(garmin.pace?.bestPaceSecondsPerKm),
      averageGapSecondsPerKm: finite(garmin.pace?.averageGapSecondsPerKm),
      averageCadenceSpm: finite(garmin.cadence?.averageSpm),
      averagePowerW: finite(garmin.averagePowerW),
      normalizedPowerW: finite(garmin.normalizedPowerW),
      calories: finite(garmin.calories),
      bodyBatteryDrain: finite(garmin.bodyBatteryDrain),
      temperatureMinC: finite(garmin.temperatureC?.min),
      temperatureMaxC: finite(garmin.temperatureC?.max)
    }),
    appAssessment: compactObject({
      loadLevel: text(loadAssessment.level),
      loadLabel: text(loadAssessment.label),
      loadReason: text(loadAssessment.reason, 300),
      planStatus: text(zoneCompliance?.status),
      planLabel: text(zoneCompliance?.label),
      planSummary: text(zoneCompliance?.summary, 300),
      planReasons: Array.isArray(zoneCompliance?.reasons) ? zoneCompliance.reasons.slice(0, 3).map(value => text(value, 220)).filter(Boolean) : []
    }),
    comparisonContext: normalizedComparisonContext(comparisonContext)
  });
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
}

export function aiWorkoutAssessmentFingerprint(input) {
  const source = JSON.stringify(stable(input || {}));
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `v${ASSESSMENT_VERSION}-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

export function normalizeAiWorkoutAssessment(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const version = Number(value.version) || (value.summary || value.trainingMeaning || value.standouts ? 2 : 1);
  if (version >= 2) {
    const headline = text(value.headline, 180);
    const summary = text(value.summary, 500);
    const standouts = (Array.isArray(value.standouts) ? value.standouts : []).slice(0, 3).map(item => text(item, 320)).filter(Boolean);
    const trainingMeaning = text(value.trainingMeaning, 500);
    const nextStep = text(value.nextStep, 500);
    if (!headline || !summary || standouts.length < 2 || !trainingMeaning || !nextStep) return null;
    return {
      version: ASSESSMENT_VERSION,
      headline,
      summary,
      standouts,
      trainingMeaning,
      goalConnection: text(value.goalConnection, 400),
      nextStep,
      uncertainty: text(value.uncertainty, 320),
      generatedAt: text(value.generatedAt, 40),
      inputFingerprint: text(value.inputFingerprint, 80),
      modelProfileId: text(value.modelProfileId, 80),
      modelLabel: text(value.modelLabel, 120)
    };
  }
  const headline = text(value.headline, 180);
  const evidence = (Array.isArray(value.evidence) ? value.evidence : []).slice(0, 3).map(item => text(item, 320)).filter(Boolean);
  const planFit = text(value.planFit, 500);
  const nextStep = text(value.nextStep, 500);
  if (!headline || !evidence.length || !planFit || !nextStep) return null;
  return {
    version: 1,
    headline,
    evidence,
    planFit,
    nextStep,
    uncertainty: text(value.uncertainty, 320),
    generatedAt: text(value.generatedAt, 40),
    inputFingerprint: text(value.inputFingerprint, 80),
    modelProfileId: text(value.modelProfileId, 80),
    modelLabel: text(value.modelLabel, 120)
  };
}

export function storedAiWorkoutAssessment(result, inputFingerprint, generatedAt = new Date().toISOString()) {
  return normalizeAiWorkoutAssessment({
    ...result,
    generatedAt,
    inputFingerprint,
    modelProfileId: result?.modelProfileId,
    modelLabel: result?.modelLabel
  });
}

export function isAiWorkoutAssessmentStale(assessment, inputFingerprint) {
  const normalized = normalizeAiWorkoutAssessment(assessment);
  return Boolean(normalized && normalized.inputFingerprint !== String(inputFingerprint || ''));
}
