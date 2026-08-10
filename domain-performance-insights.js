import { classifyWorkoutIntensityContext, completedDurationSeconds } from './domain-core.js';
import { activitySettingForCompleted } from './domain-activity.js';

const DISTANCE_MILESTONES = [100, 250, 500, 750, 1000, 1500, 2000, 2500, 3000];
const SESSION_MILESTONES = [10, 25, 50, 75, 100, 150, 200, 250, 300];
const WEEK_MILESTONES = [4, 8, 12, 20, 26, 40, 52];
const SAME_EFFORT_SETTINGS = ['outdoor', 'treadmill'];
const SAME_EFFORT_MIN_GROUP = 4;
const SAME_EFFORT_MAX_GROUP = 6;

function validIsoDate(value) {
  const text = String(value || '');
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
}

function finiteNonNegative(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function mondayWeekKey(isoDate) {
  const date = new Date(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return '';
  const day = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - day);
  return date.toISOString().slice(0, 10);
}

function completedTemplate(item, templatesById) {
  const live = templatesById.get(item.templateId) || {};
  const snapshot = item.templateSnapshot || {};
  return {
    name: item.manualName || snapshot.name || live.name || 'Historisk økt',
    type: snapshot.type || live.type || item.activityType || item.type || 'Annet',
    intensity: snapshot.intensity || live.intensity || item.intensity || '',
    role: snapshot.role || live.role || item.role || '',
    purpose: snapshot.purpose || live.purpose || item.purpose || '',
    load: snapshot.load || live.load || item.load || '',
    structure: snapshot.structure || live.structure || item.structure || '',
    structuredWorkout: snapshot.structuredWorkout || live.structuredWorkout || item.structuredWorkout || null
  };
}

function median(values = []) {
  const sorted = values.map(Number).filter(Number.isFinite).sort((left, right) => left - right);
  if (!sorted.length) return 0;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function hasMaterialBodySignal(item = {}) {
  const body = item.bodyStatus || {};
  return Boolean(
    Number(body.painBefore) > 0 ||
    Number(body.painAfter) > 0 ||
    (body.adaptation && body.adaptation !== 'none')
  );
}

function canonicalPace(item = {}) {
  const imported = item.externalData?.garmin || {};
  const importedPace = Number(imported.pace?.averagePaceSecondsPerKm);
  const directPace = Number(item.paceSecondsPerKm);
  if (importedPace > 0) return importedPace;
  if (directPace > 0) return directPace;
  const movingSeconds = Number(imported.movingTimeSeconds);
  const durationSeconds = completedDurationSeconds(item);
  const distanceKm = Number(item.distanceKm);
  const seconds = movingSeconds > 0 ? movingSeconds : durationSeconds;
  return seconds > 0 && distanceKm > 0 ? seconds / distanceKm : 0;
}

function sameEffortCandidate(item, templatesById, primaryActivityType) {
  const template = completedTemplate(item, templatesById);
  const setting = activitySettingForCompleted(item);
  const durationSeconds = completedDurationSeconds(item);
  const distanceKm = Number(item.distanceKm);
  const avgHeartRate = Number(item.avgHeartRate || item.averageHeartRate);
  const paceSecondsPerKm = canonicalPace(item);
  const gapSecondsPerKm = Number(item.externalData?.garmin?.pace?.averageGapSecondsPerKm);
  const elevationGainM = Number(item.elevationGainM) || 0;
  const rpe = Number(item.rpe);
  if (template.type !== primaryActivityType) return { running: false, accepted: false, reason: 'not_running' };
  if (hasMaterialBodySignal(item)) return { running: true, accepted: false, reason: 'body_signal' };
  if (rpe > 5) return { running: true, accepted: false, reason: 'high_rpe' };
  const intensity = classifyWorkoutIntensityContext({ completed: item, template });
  if (!intensity.countsAsEasySupport || intensity.countsAsHardQuality || intensity.countsAsHardLoad) {
    return { running: true, accepted: false, reason: 'not_easy' };
  }
  if (!SAME_EFFORT_SETTINGS.includes(setting)) return { running: true, accepted: false, reason: 'missing_setting' };
  if (!(durationSeconds >= 1200 && durationSeconds <= 9000) || !(distanceKm >= 3 && distanceKm <= 30)) {
    return { running: true, accepted: false, reason: 'duration_distance' };
  }
  if (!(avgHeartRate >= 80 && avgHeartRate <= 220)) return { running: true, accepted: false, reason: 'heart_rate' };
  if (!(paceSecondsPerKm >= 150 && paceSecondsPerKm <= 900)) return { running: true, accepted: false, reason: 'pace' };
  return { running: true, accepted: true, candidate: {
    date: validIsoDate(item.date),
    setting,
    durationSeconds,
    distanceKm,
    avgHeartRate,
    paceSecondsPerKm,
    gapSecondsPerKm: gapSecondsPerKm >= 150 && gapSecondsPerKm <= 900 ? gapSecondsPerKm : 0,
    lowElevation: elevationGainM / distanceKm <= 12
  } };
}

function sameEffortPeriod(items = []) {
  return {
    count: items.length,
    from: items[0]?.date || '',
    to: items.at(-1)?.date || '',
    medianHeartRate: Math.round(median(items.map(item => item.avgHeartRate))),
    medianPaceSecondsPerKm: Math.round(median(items.map(item => item.metricPace))),
    medianDurationSeconds: Math.round(median(items.map(item => item.durationSeconds)))
  };
}

function sameEffortComparison(setting, sourceItems = []) {
  const gapItems = sourceItems.filter(item => item.gapSecondsPerKm > 0);
  const rawItems = sourceItems.filter(item => setting === 'treadmill' || item.lowElevation);
  const paceSource = setting === 'outdoor' && gapItems.length >= SAME_EFFORT_MIN_GROUP * 2 ? 'gap' : 'pace';
  const comparable = (paceSource === 'gap' ? gapItems : rawItems)
    .map(item => ({ ...item, metricPace: paceSource === 'gap' ? item.gapSecondsPerKm : item.paceSecondsPerKm }))
    .sort((left, right) => left.date.localeCompare(right.date));
  const groupSize = Math.min(SAME_EFFORT_MAX_GROUP, Math.floor(comparable.length / 2));
  if (groupSize < SAME_EFFORT_MIN_GROUP) {
    return {
      setting,
      status: 'insufficient',
      reason: 'too_few',
      candidateCount: sourceItems.length,
      eligibleCount: comparable.length,
      paceSource
    };
  }

  const recentItems = comparable.slice(-groupSize);
  const baselineItems = comparable.slice(-(groupSize * 2), -groupSize);
  const baseline = sameEffortPeriod(baselineItems);
  const recent = sameEffortPeriod(recentItems);
  const heartRateDifference = recent.medianHeartRate - baseline.medianHeartRate;
  const durationRatio = recent.medianDurationSeconds / Math.max(1, baseline.medianDurationSeconds);
  if (Math.abs(heartRateDifference) > 5) {
    return { setting, status: 'insufficient', reason: 'heart_rate_gap', candidateCount: sourceItems.length, eligibleCount: comparable.length, paceSource, baseline, recent };
  }
  if (durationRatio < 0.67 || durationRatio > 1.5) {
    return { setting, status: 'insufficient', reason: 'duration_gap', candidateCount: sourceItems.length, eligibleCount: comparable.length, paceSource, baseline, recent };
  }

  const paceChangePercent = ((baseline.medianPaceSecondsPerKm - recent.medianPaceSecondsPerKm) / baseline.medianPaceSecondsPerKm) * 100;
  const trend = paceChangePercent >= 2 ? 'improving' : paceChangePercent <= -2 ? 'declining' : 'stable';
  const confidence = groupSize >= 6 && Math.abs(heartRateDifference) <= 3 ? 'high' : 'medium';
  return {
    setting,
    status: 'ready',
    trend,
    paceSource,
    paceChangePercent: Math.round(paceChangePercent * 10) / 10,
    heartRateDifference,
    confidence,
    candidateCount: sourceItems.length,
    eligibleCount: comparable.length,
    baseline,
    recent
  };
}

export function comparableEasyRunFormInsight({
  completedItems = [],
  templates = [],
  today,
  primaryActivityType = 'Løping'
} = {}) {
  const endDate = validIsoDate(today) || '9999-12-31';
  const templatesById = new Map((Array.isArray(templates) ? templates : [])
    .filter(template => template?.id)
    .map(template => [template.id, template]));
  const evaluations = (Array.isArray(completedItems) ? completedItems : [])
    .filter(item => item && validIsoDate(item.date) && item.date <= endDate)
    .map(item => sameEffortCandidate(item, templatesById, primaryActivityType));
  const runningEvaluations = evaluations.filter(item => item.running);
  const candidates = runningEvaluations
    .filter(item => item.accepted && item.candidate?.date)
    .map(item => item.candidate);
  const comparisons = SAME_EFFORT_SETTINGS.map(setting => sameEffortComparison(
    setting,
    candidates.filter(item => item.setting === setting)
  ));
  const rejectedReasons = runningEvaluations
    .filter(item => !item.accepted)
    .reduce((summary, item) => {
      summary[item.reason] = (summary[item.reason] || 0) + 1;
      return summary;
    }, {});
  return {
    hasData: comparisons.some(item => item.status === 'ready'),
    comparisons,
    candidateCount: candidates.length,
    diagnostics: {
      runningCount: runningEvaluations.length,
      candidateCount: candidates.length,
      rejectedReasons,
      settings: Object.fromEntries(comparisons.map(item => [item.setting, {
        candidateCount: item.candidateCount || 0,
        eligibleCount: item.eligibleCount || 0,
        paceSource: item.paceSource || 'pace',
        reason: item.reason || ''
      }]))
    },
    primaryActivityType
  };
}

function nextThreshold(value, thresholds, fallbackStep) {
  const predefined = thresholds.find(threshold => threshold > value);
  if (predefined) return predefined;
  return Math.max(fallbackStep, Math.ceil((value + 1) / fallbackStep) * fallbackStep);
}

function achievedDate(items, metric, target, primaryActivityType) {
  let value = 0;
  const weeks = new Set();
  for (const item of items) {
    if (metric === 'sessions') value += 1;
    if (metric === 'distance' && item.type === primaryActivityType) value += item.distanceKm;
    if (metric === 'weeks') {
      weeks.add(item.weekKey);
      value = weeks.size;
    }
    if (value >= target) return item.date;
  }
  return '';
}

function highestReached(value, thresholds) {
  return [...thresholds].reverse().find(threshold => value >= threshold) || 0;
}

function milestoneTrack(items, metric, current, thresholds, primaryActivityType) {
  const nextTarget = thresholds.find(target => target > current) || 0;
  return {
    metric,
    current,
    milestones: thresholds.map(target => ({
      metric,
      target,
      status: current >= target ? 'achieved' : target === nextTarget ? 'next' : 'future',
      achievedAt: current >= target ? achievedDate(items, metric, target, primaryActivityType) : ''
    }))
  };
}

export function yearToDatePerformanceInsights({
  completedItems = [],
  templates = [],
  today,
  primaryActivityType = 'Løping'
} = {}) {
  const endDate = validIsoDate(today);
  const year = Number(endDate.slice(0, 4)) || new Date().getFullYear();
  const safeEndDate = endDate || `${year}-12-31`;
  const startDate = `${year}-01-01`;
  const templatesById = new Map((Array.isArray(templates) ? templates : [])
    .filter(template => template?.id)
    .map(template => [template.id, template]));
  const items = (Array.isArray(completedItems) ? completedItems : [])
    .filter(item => item && validIsoDate(item.date) && item.date >= startDate && item.date <= safeEndDate)
    .map(item => {
      const template = completedTemplate(item, templatesById);
      return {
        source: item,
        date: item.date,
        weekKey: mondayWeekKey(item.date),
        monthKey: item.date.slice(0, 7),
        name: template.name,
        type: template.type,
        durationSeconds: completedDurationSeconds(item),
        distanceKm: finiteNonNegative(item.distanceKm),
        elevationGainM: finiteNonNegative(item.elevationGainM),
        activitySetting: activitySettingForCompleted(item)
      };
    })
    .sort((left, right) => left.date.localeCompare(right.date) || left.name.localeCompare(right.name, 'nb'));

  const primaryItems = items.filter(item => item.type === primaryActivityType);
  const totalSeconds = items.reduce((sum, item) => sum + item.durationSeconds, 0);
  const primaryDistanceKm = primaryItems.reduce((sum, item) => sum + item.distanceKm, 0);
  const activeWeeks = new Set(items.map(item => item.weekKey).filter(Boolean)).size;
  const settingBreakdown = primaryItems.reduce((summary, item) => {
    const key = item.activitySetting || 'unknown';
    summary[key] = (summary[key] || 0) + 1;
    return summary;
  }, { outdoor: 0, treadmill: 0, indoor: 0, pool: 0, unknown: 0 });

  const longestDistance = [...primaryItems]
    .filter(item => item.distanceKm > 0)
    .sort((left, right) => right.distanceKm - left.distanceKm || right.date.localeCompare(left.date))[0] || null;
  const longestDuration = [...items]
    .filter(item => item.durationSeconds > 0)
    .sort((left, right) => right.durationSeconds - left.durationSeconds || right.date.localeCompare(left.date))[0] || null;
  const highestAscent = [...primaryItems]
    .filter(item => item.elevationGainM > 0)
    .sort((left, right) => right.elevationGainM - left.elevationGainM || right.date.localeCompare(left.date))[0] || null;
  const monthMap = new Map();
  primaryItems.forEach(item => {
    const current = monthMap.get(item.monthKey) || { monthKey: item.monthKey, distanceKm: 0, sessions: 0 };
    current.distanceKm += item.distanceKm;
    current.sessions += 1;
    monthMap.set(item.monthKey, current);
  });
  const strongestMonth = [...monthMap.values()]
    .sort((left, right) => right.distanceKm - left.distanceKm || right.sessions - left.sessions || right.monthKey.localeCompare(left.monthKey))[0] || null;

  const milestoneCandidates = [
    { metric: 'distance', value: primaryDistanceKm, target: highestReached(primaryDistanceKm, DISTANCE_MILESTONES) },
    { metric: 'sessions', value: items.length, target: highestReached(items.length, SESSION_MILESTONES) },
    { metric: 'weeks', value: activeWeeks, target: highestReached(activeWeeks, WEEK_MILESTONES) }
  ].filter(item => item.target > 0)
    .map(item => ({
      ...item,
      achievedAt: achievedDate(items, item.metric, item.target, primaryActivityType)
    }))
    .sort((left, right) => right.achievedAt.localeCompare(left.achievedAt));

  const nextDistance = nextThreshold(primaryDistanceKm, DISTANCE_MILESTONES, 500);
  const nextSessions = nextThreshold(items.length, SESSION_MILESTONES, 50);
  const nextWeeks = activeWeeks < 52 ? nextThreshold(activeWeeks, WEEK_MILESTONES, 52) : 0;
  const nextOptions = [
    primaryItems.length ? { metric: 'distance', current: primaryDistanceKm, target: nextDistance } : null,
    { metric: 'sessions', current: items.length, target: nextSessions },
    nextWeeks ? { metric: 'weeks', current: activeWeeks, target: nextWeeks } : null
  ].filter(Boolean)
    .map(item => ({ ...item, progress: item.target ? Math.min(1, item.current / item.target) : 0 }));
  const nextMilestone = nextOptions.sort((left, right) => right.progress - left.progress)[0] || null;
  const milestoneTracks = [
    milestoneTrack(items, 'distance', primaryDistanceKm, DISTANCE_MILESTONES, primaryActivityType),
    milestoneTrack(items, 'sessions', items.length, SESSION_MILESTONES, primaryActivityType),
    milestoneTrack(items, 'weeks', activeWeeks, WEEK_MILESTONES, primaryActivityType)
  ];

  return {
    year,
    startDate,
    endDate: safeEndDate,
    hasData: items.length > 0,
    primaryActivityType,
    summary: {
      sessions: items.length,
      seconds: totalSeconds,
      primaryDistanceKm,
      activeWeeks
    },
    settingBreakdown: {
      ...settingBreakdown,
      known: settingBreakdown.outdoor + settingBreakdown.treadmill + settingBreakdown.indoor + settingBreakdown.pool,
      total: primaryItems.length
    },
    highlights: [
      longestDistance ? { kind: 'longest_distance', ...longestDistance } : null,
      strongestMonth ? { kind: 'strongest_month', ...strongestMonth } : null,
      highestAscent ? { kind: 'highest_ascent', ...highestAscent } : (longestDuration ? { kind: 'longest_duration', ...longestDuration } : null)
    ].filter(Boolean),
    milestones: milestoneCandidates,
    milestoneTracks,
    nextMilestone
  };
}
