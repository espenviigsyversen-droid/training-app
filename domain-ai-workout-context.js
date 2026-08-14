import { classifyWorkoutIntensityContext, completedDurationSeconds } from './domain-core.js';
import { activitySettingForCompleted } from './domain-activity.js';

const WINDOW_DAYS = 180;
const MAX_SAMPLES = 6;

function finite(value) {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function median(values = []) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function rounded(value, decimals = 0) {
  return Number.isFinite(value) ? Number(value.toFixed(decimals)) : null;
}

function dateValue(value) {
  const date = new Date(`${String(value || '').slice(0, 10)}T12:00:00`);
  return Number.isFinite(date.getTime()) ? date : null;
}

function templateForCompleted(completed = {}, templates = []) {
  const live = templates.find(item => item.id === completed.templateId) || {};
  return {
    ...live,
    ...(completed.templateSnapshot || {}),
    name: completed.manualName || completed.templateSnapshot?.name || live.name || ''
  };
}

function hasBodySignal(completed = {}) {
  const before = finite(completed.bodyStatus?.painBefore) || 0;
  const after = finite(completed.bodyStatus?.painAfter) || 0;
  const adaptation = String(completed.bodyStatus?.adaptation || '').toLowerCase();
  return after >= 4 || after > before + 1 || /avbryt|alternativ|tilpas|smerte/.test(adaptation);
}

function paceFor(completed = {}, setting = '') {
  const gap = finite(completed?.externalData?.garmin?.pace?.averageGapSecondsPerKm);
  if (setting === 'outdoor' && gap !== null && gap >= 150 && gap <= 900) {
    return { secondsPerKm: gap, source: 'gap' };
  }
  const pace = finite(completed.averagePaceSecondsPerKm)
    || (() => {
      const duration = completedDurationSeconds(completed);
      const distance = finite(completed.distanceKm);
      return duration > 0 && distance > 0 ? duration / distance : null;
    })();
  return pace !== null && pace >= 150 && pace <= 900 ? { secondsPerKm: pace, source: 'pace' } : null;
}

function comparableBasics(completed = {}, template = {}) {
  const durationSeconds = completedDurationSeconds(completed);
  const distanceKm = finite(completed.distanceKm);
  const averageHeartRate = finite(completed.avgHeartRate);
  const intensity = classifyWorkoutIntensityContext({ completed, template });
  if (!intensity.countsAsEasySupport || intensity.countsAsHardQuality || intensity.countsAsHardLoad) return null;
  if (hasBodySignal(completed)) return null;
  if (!(durationSeconds >= 20 * 60 && durationSeconds <= 150 * 60)) return null;
  if (!(distanceKm >= 3 && distanceKm <= 30)) return null;
  if (!(averageHeartRate >= 80 && averageHeartRate <= 220)) return null;
  return { durationSeconds, distanceKm, averageHeartRate };
}

export function buildAiWorkoutComparisonContext({ completed = {}, completedItems = [], templates = [] } = {}) {
  const targetDate = dateValue(completed.date);
  const activitySetting = activitySettingForCompleted(completed);
  const targetBasics = comparableBasics(completed, templateForCompleted(completed, templates));
  const targetPace = paceFor(completed, activitySetting);
  if (!targetDate || !['outdoor', 'treadmill'].includes(activitySetting) || !targetBasics || !targetPace) {
    return { status: 'not_applicable' };
  }

  const earliest = new Date(targetDate);
  earliest.setDate(earliest.getDate() - WINDOW_DAYS);
  const candidates = completedItems
    .filter(item => item && item.id !== completed.id)
    .map(item => {
      const date = dateValue(item.date);
      if (!date || date >= targetDate || date < earliest) return null;
      if (activitySettingForCompleted(item) !== activitySetting) return null;
      const basics = comparableBasics(item, templateForCompleted(item, templates));
      const pace = paceFor(item, activitySetting);
      if (!basics || !pace || pace.source !== targetPace.source) return null;
      if (Math.abs(basics.averageHeartRate - targetBasics.averageHeartRate) > 8) return null;
      const durationRatio = basics.durationSeconds / targetBasics.durationSeconds;
      if (durationRatio < 0.5 || durationRatio > 2) return null;
      return {
        date,
        ...basics,
        paceSecondsPerKm: pace.secondsPerKm,
        elevationGainPerKm: (finite(item.elevationGainM) || 0) / basics.distanceKm
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.date - a.date)
    .slice(0, MAX_SAMPLES);

  const base = {
    status: candidates.length >= 3 ? 'available' : 'insufficient',
    basis: 'easy_same_setting_similar_effort',
    activitySetting,
    paceSource: targetPace.source,
    sampleSize: candidates.length,
    windowDays: WINDOW_DAYS
  };
  if (candidates.length < 3) return base;

  const referencePace = median(candidates.map(item => item.paceSecondsPerKm));
  const referenceHeartRate = median(candidates.map(item => item.averageHeartRate));
  const referenceDuration = median(candidates.map(item => item.durationSeconds));
  const referenceElevation = median(candidates.map(item => item.elevationGainPerKm));
  const currentElevation = (finite(completed.elevationGainM) || 0) / targetBasics.distanceKm;
  return {
    ...base,
    confidence: candidates.length >= 6 ? 'high' : candidates.length >= 4 ? 'medium' : 'low',
    currentPaceSecondsPerKm: rounded(targetPace.secondsPerKm),
    referencePaceSecondsPerKm: rounded(referencePace),
    paceDeltaPercent: rounded(((referencePace - targetPace.secondsPerKm) / referencePace) * 100, 1),
    currentAverageHeartRate: rounded(targetBasics.averageHeartRate),
    referenceAverageHeartRate: rounded(referenceHeartRate),
    heartRateDeltaBpm: rounded(targetBasics.averageHeartRate - referenceHeartRate, 1),
    currentDurationSeconds: rounded(targetBasics.durationSeconds),
    referenceDurationSeconds: rounded(referenceDuration),
    durationDeltaPercent: rounded(((targetBasics.durationSeconds - referenceDuration) / referenceDuration) * 100, 1),
    currentElevationGainPerKm: rounded(currentElevation, 1),
    referenceElevationGainPerKm: rounded(referenceElevation, 1)
  };
}

