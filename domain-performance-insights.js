import { completedDurationSeconds } from './domain-core.js';
import { activitySettingForCompleted } from './domain-activity.js';

const DISTANCE_MILESTONES = [100, 250, 500, 750, 1000, 1500, 2000, 2500, 3000];
const SESSION_MILESTONES = [10, 25, 50, 75, 100, 150, 200, 250, 300];
const WEEK_MILESTONES = [4, 8, 12, 20, 26, 40, 52];

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
    type: snapshot.type || live.type || item.type || 'Annet'
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
    nextMilestone
  };
}
