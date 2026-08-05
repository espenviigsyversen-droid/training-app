import { normalizeTemplate, parseNonNegativeInteger } from './domain-core.js';
import { normalizeContinuityFreezes } from './domain-coach.js';
import {
  normalizeRaceGoal,
  normalizeRaceResult,
  normalizeRaceResultEntries
} from './domain-goals.js';
import { normalizeTrainingLevelProgress } from './domain-fitness.js';
import { normalizeExerciseLibrary } from './domain-exercises.js';
import {
  normalizeHeartRateZoneDistribution,
  normalizeHeartRateZoneSets
} from './domain-heart-rate-zones.js';

export const WORKOUT_ROLE_LABELS = {
  main_threshold: 'Hovedterskel',
  support_threshold: 'Støtteterskel',
  long_easy: 'Rolig langtur',
  recovery: 'Restitusjon',
  x_workout: 'X-økt',
  strength: 'Styrke',
  mobility: 'Mobilitet',
  technique: 'Teknikk',
  race: 'Konkurranse / race',
  other: 'Annet'
};

export const DEFAULT_SETTINGS = {
  activityTypes: ['Løping', 'Styrke', 'Mobilitet', 'Ski', 'Sykling', 'Annet'],
  intensities: ['Rolig', 'Tempo', 'Terskel', 'Intervall', 'Anaerob', 'Styrke', 'Restitusjon'],
  goals: {
    weeklySessionsTarget: 3,
    weeklyStretchSessionsTarget: 4,
    weeklyHoursTarget: '',
    weeklyKmTarget: ''
  },
  raceGoal: {
    name: '',
    date: '',
    distanceKm: '',
    targetTimeSeconds: '',
    note: ''
  },
  trainingProfile: {
    primaryFocus: 'running',
    level: 'building_beginner',
    philosophy: 'bakken_threshold',
    priority: 'injury_free_progression',
    trainingFocus: 'base_threshold',
    weekPlanPreset: 'bakken_3',
    weekPlanRoles: ['main_threshold', 'support_threshold', 'long_easy', 'x_workout']
  },
  personProfile: {
    name: '',
    birthYear: '',
    sex: '',
    heightCm: '',
    weightKg: '',
    maxHeartRate: '',
    thresholdHeartRate: ''
  },
  trainingLevelProgress: {
    version: 2,
    highestTier: 'foundation',
    history: []
  },
  features: {
    structuredIntervals: true
  }
};

export const PAIN_AREA_REGIONS = {
  fot_ankel: 'Fot/ankel',
  kne: 'Kne',
  legg_skinneben: 'Legg/skinneben',
  lar_hofte: 'Lår/hofte',
  rygg: 'Rygg',
  skulder_nakke: 'Skulder/nakke',
  annet: 'Annet'
};

export const PAIN_AREA_SIDES = {
  hoeyre: 'Høyre',
  venstre: 'Venstre',
  begge: 'Begge'
};

export function freshDefaultSettings() {
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}

export function createEmptyAppState(settings = freshDefaultSettings()) {
  return {
    exercises: [],
    templates: [],
    planned: [],
    completed: [],
    wellness: [],
    challenges: [],
    blockedDays: [],
    raceResults: [],
    continuityFreezes: [],
    heartRateZoneSets: [],
    settings: normalizeSettings(settings)
  };
}

export function formatAreaLabel(region, side) {
  const regionLabel = PAIN_AREA_REGIONS[region] || '';
  const sideLabel = PAIN_AREA_SIDES[side] || '';
  if (!regionLabel) return sideLabel || '';
  return sideLabel ? `${sideLabel} ${regionLabel.toLowerCase()}` : regionLabel;
}

export function normalizeGoalNumber(value, fallback = '', min = 0) {
  if (value === '' || value === null || value === undefined) return fallback;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min) return fallback;
  return number;
}

export function normalizeGoals(goals = {}) {
  return {
    weeklySessionsTarget: normalizeGoalNumber(goals.weeklySessionsTarget, DEFAULT_SETTINGS.goals.weeklySessionsTarget, 1),
    weeklyStretchSessionsTarget: normalizeGoalNumber(goals.weeklyStretchSessionsTarget, DEFAULT_SETTINGS.goals.weeklyStretchSessionsTarget, 1),
    weeklyHoursTarget: normalizeGoalNumber(goals.weeklyHoursTarget, ''),
    weeklyKmTarget: normalizeGoalNumber(goals.weeklyKmTarget, '')
  };
}

export function normalizeWeekPlanRoles(roles = []) {
  const validRoles = new Set(Object.keys(WORKOUT_ROLE_LABELS));
  const defaults = DEFAULT_SETTINGS.trainingProfile.weekPlanRoles;
  const source = Array.isArray(roles) && roles.length ? roles : defaults;
  return [0, 1, 2, 3].map(index => {
    const role = source[index] || '';
    return !role || validRoles.has(role) ? role : defaults[index] || '';
  });
}

export function normalizeTrainingProfile(profile = {}) {
  const defaults = DEFAULT_SETTINGS.trainingProfile;
  const legacyFocusMap = {
    base_building: 'base_threshold',
    five_ten_k: 'competition_prep'
  };
  const rawTrainingFocus = profile.trainingFocus || profile.runningPhase || defaults.trainingFocus;
  return {
    primaryFocus: profile.primaryFocus || defaults.primaryFocus,
    level: profile.level || defaults.level,
    philosophy: profile.philosophy || defaults.philosophy,
    priority: profile.priority || defaults.priority,
    trainingFocus: legacyFocusMap[rawTrainingFocus] || rawTrainingFocus,
    weekPlanPreset: profile.weekPlanPreset || defaults.weekPlanPreset,
    weekPlanRoles: normalizeWeekPlanRoles(profile.weekPlanRoles)
  };
}

export function normalizePersonProfile(profile = {}) {
  const defaults = DEFAULT_SETTINGS.personProfile;
  return {
    name: profile.name || defaults.name,
    birthYear: normalizeGoalNumber(profile.birthYear, defaults.birthYear, 1900),
    sex: profile.sex || defaults.sex,
    heightCm: normalizeGoalNumber(profile.heightCm, defaults.heightCm),
    weightKg: normalizeGoalNumber(profile.weightKg, defaults.weightKg),
    maxHeartRate: normalizeGoalNumber(profile.maxHeartRate, defaults.maxHeartRate),
    thresholdHeartRate: normalizeGoalNumber(profile.thresholdHeartRate, defaults.thresholdHeartRate)
  };
}

export function normalizeFeatures(features = {}) {
  const source = features && typeof features === 'object' && !Array.isArray(features) ? features : {};
  return {
    structuredIntervals: Boolean(source.structuredIntervals ?? DEFAULT_SETTINGS.features.structuredIntervals)
  };
}

export function normalizeInjuryCheckin(value = {}) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const painNow = source.painNow === '' || source.painNow === null || source.painNow === undefined
    ? ''
    : Math.max(0, Math.min(10, parseNonNegativeInteger(source.painNow)));
  const areaRegion = String(source.areaRegion || '').trim();
  const areaSide = String(source.areaSide || '').trim();
  const area = String(source.area || formatAreaLabel(areaRegion, areaSide)).trim();
  const trend = ['better', 'same', 'worse'].includes(source.trend) ? source.trend : '';
  const note = String(source.note || '').trim();
  const hasValue = painNow !== '' || areaRegion || areaSide || area || trend || note;
  return hasValue ? { painNow, areaRegion, areaSide, area, trend, note } : null;
}

export function normalizeDailyReadinessMap(map = {}) {
  const source = map && typeof map === 'object' && !Array.isArray(map) ? map : {};
  return Object.fromEntries(Object.entries(source).map(([date, value]) => {
    const item = value && typeof value === 'object' && !Array.isArray(value) ? { ...value } : {};
    const injuryCheckin = normalizeInjuryCheckin(item.injuryCheckin);
    if (injuryCheckin) item.injuryCheckin = injuryCheckin;
    else delete item.injuryCheckin;
    return [date, item];
  }));
}

export function normalizeTemplates(templates = []) {
  return Array.isArray(templates) ? templates.map(normalizeTemplate).filter(template => template.id) : [];
}

function normalizeOptionalTemplateSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return null;
  return normalizeTemplate(snapshot);
}

function optionalFiniteNumber(value, { integer = false } = {}) {
  if (value === '' || value === null || value === undefined) return undefined;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return undefined;
  return integer ? Math.round(numeric) : numeric;
}

function optionalText(value, maxLength) {
  const text = String(value ?? '').trim();
  return text ? text.slice(0, maxLength) : undefined;
}

function compactRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) =>
    value !== undefined && value !== null && value !== '' &&
    !(typeof value === 'object' && !Array.isArray(value) && !Object.keys(value).length)
  ));
}

function numericRecord(input, fields) {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  return compactRecord(Object.fromEntries(fields.map(field => [field, optionalFiniteNumber(source[field])])));
}

export function normalizeGarminExternalData(input) {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const fingerprint = optionalText(source.fingerprint, 80);
  if (!fingerprint || !/^garmin_csv_v\d+_[a-f0-9]{16}$/i.test(fingerprint)) return null;
  const sourceDistanceInput = source.sourceDistance && typeof source.sourceDistance === 'object' ? source.sourceDistance : {};
  const sourceDistance = compactRecord({
    value: optionalFiniteNumber(sourceDistanceInput.value),
    unit: ['km', 'm'].includes(sourceDistanceInput.unit) ? sourceDistanceInput.unit : undefined
  });
  const cadence = numericRecord(source.cadence, ['averageSpm', 'maxSpm']);
  const pace = numericRecord(source.pace, [
    'averagePaceSecondsPerKm', 'bestPaceSecondsPerKm', 'averageGapSecondsPerKm',
    'averagePaceSecondsPer100m', 'bestPaceSecondsPer100m', 'averageSpeedKmh', 'maxSpeedKmh'
  ]);
  const temperatureC = numericRecord(source.temperatureC, ['min', 'max']);
  const respiration = numericRecord(source.respiration, ['average', 'min', 'max']);
  const elevationM = numericRecord(source.elevationM, ['min', 'max']);
  return compactRecord({
    version: Math.max(1, optionalFiniteNumber(source.version, { integer: true }) || 1),
    adapter: optionalText(source.adapter, 40),
    fingerprint,
    fingerprintVersion: Math.max(1, optionalFiniteNumber(source.fingerprintVersion, { integer: true }) || 1),
    startedAtLocal: optionalText(source.startedAtLocal, 40),
    activityType: optionalText(source.activityType, 80),
    activityCode: optionalText(source.activityCode, 60),
    sourceDistance,
    calories: optionalFiniteNumber(source.calories, { integer: true }),
    movingTimeSeconds: optionalFiniteNumber(source.movingTimeSeconds, { integer: true }),
    elapsedTimeSeconds: optionalFiniteNumber(source.elapsedTimeSeconds, { integer: true }),
    aerobicTrainingEffect: optionalFiniteNumber(source.aerobicTrainingEffect),
    cadence,
    pace,
    totalDescentM: optionalFiniteNumber(source.totalDescentM),
    strideLengthM: optionalFiniteNumber(source.strideLengthM),
    verticalRatioPercent: optionalFiniteNumber(source.verticalRatioPercent),
    verticalOscillationCm: optionalFiniteNumber(source.verticalOscillationCm),
    groundContactTimeMs: optionalFiniteNumber(source.groundContactTimeMs),
    normalizedPowerW: optionalFiniteNumber(source.normalizedPowerW),
    trainingStressScore: optionalFiniteNumber(source.trainingStressScore),
    averagePowerW: optionalFiniteNumber(source.averagePowerW),
    maxPowerW: optionalFiniteNumber(source.maxPowerW),
    totalStrokes: optionalFiniteNumber(source.totalStrokes, { integer: true }),
    averageSwolf: optionalFiniteNumber(source.averageSwolf),
    averageStrokeRate: optionalFiniteNumber(source.averageStrokeRate),
    steps: optionalFiniteNumber(source.steps, { integer: true }),
    totalReps: optionalFiniteNumber(source.totalReps, { integer: true }),
    totalSets: optionalFiniteNumber(source.totalSets, { integer: true }),
    bodyBatteryDrain: optionalFiniteNumber(source.bodyBatteryDrain),
    temperatureC,
    respiration,
    numberOfLaps: optionalFiniteNumber(source.numberOfLaps, { integer: true }),
    elevationM,
    importedAt: optionalText(source.importedAt, 40)
  });
}

function normalizeExternalData(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const { garmin: garminInput, ...otherProviders } = input;
  const garmin = normalizeGarminExternalData(garminInput);
  const normalized = { ...otherProviders };
  if (garmin) normalized.garmin = garmin;
  return Object.keys(normalized).length ? normalized : null;
}

export function normalizePlannedItems(items = []) {
  return Array.isArray(items)
    ? items
        .filter(item => item && typeof item === 'object' && !Array.isArray(item))
        .map(item => ({
          ...item,
          templateSnapshot: normalizeOptionalTemplateSnapshot(item.templateSnapshot)
        }))
    : [];
}

export function normalizeCompletedItems(items = []) {
  return Array.isArray(items)
    ? items
        .filter(item => item && typeof item === 'object' && !Array.isArray(item))
        .map(item => {
          const normalized = {
            ...item,
            templateSnapshot: normalizeOptionalTemplateSnapshot(item.templateSnapshot),
            raceResult: normalizeRaceResult(item.raceResult),
            heartRateZoneDistribution: normalizeHeartRateZoneDistribution(item.heartRateZoneDistribution)
          };
          const externalData = normalizeExternalData(item.externalData);
          if (externalData) normalized.externalData = externalData;
          else delete normalized.externalData;
          return normalized;
        })
    : [];
}

export function normalizeSettings(settings = {}) {
  const source = settings && typeof settings === 'object' && !Array.isArray(settings) ? settings : {};
  const trainingProfile = normalizeTrainingProfile(source.trainingProfile);
  return {
    activityTypes: Array.isArray(source.activityTypes) && source.activityTypes.length
      ? source.activityTypes
      : [...DEFAULT_SETTINGS.activityTypes],
    intensities: Array.isArray(source.intensities) && source.intensities.length
      ? source.intensities
      : [...DEFAULT_SETTINGS.intensities],
    goals: normalizeGoals(source.goals),
    raceGoal: normalizeRaceGoal(source.raceGoal),
    trainingProfile,
    personProfile: normalizePersonProfile(source.personProfile),
    trainingLevelProgress: normalizeTrainingLevelProgress(source.trainingLevelProgress, trainingProfile.level),
    features: normalizeFeatures(source.features),
    dailyReadiness: normalizeDailyReadinessMap(source.dailyReadiness)
  };
}

export function normalizeAppState(input = {}) {
  return {
    exercises: normalizeExerciseLibrary(input.exercises),
    templates: normalizeTemplates(input.templates),
    planned: normalizePlannedItems(input.planned),
    completed: normalizeCompletedItems(input.completed),
    wellness: Array.isArray(input.wellness) ? input.wellness : [],
    challenges: Array.isArray(input.challenges) ? input.challenges : [],
    blockedDays: Array.isArray(input.blockedDays) ? input.blockedDays : [],
    raceResults: normalizeRaceResultEntries(input.raceResults),
    continuityFreezes: normalizeContinuityFreezes(input.continuityFreezes),
    heartRateZoneSets: normalizeHeartRateZoneSets(input.heartRateZoneSets),
    settings: normalizeSettings(input.settings)
  };
}
