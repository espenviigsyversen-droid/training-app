import { completedDurationSeconds } from './domain-core.js';
import { DEFAULT_COACH_RULES } from './domain-coach-rules.js';
import { applyRaceContextToSuggestionMix, suggestionForWorkoutRole } from './domain-training-plan.js';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function validIsoDate(value) {
  const text = String(value || '').trim();
  if (!ISO_DATE_PATTERN.test(text)) return '';
  const date = new Date(`${text}T12:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text ? '' : text;
}

function addIsoDays(dateIso, days) {
  const date = new Date(`${dateIso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + Number(days || 0));
  return date.toISOString().slice(0, 10);
}

function positiveSessionTarget(value, fallback = 1) {
  const numeric = Math.round(Number(value));
  if (Number.isFinite(numeric) && numeric > 0) return numeric;
  const safeFallback = Math.round(Number(fallback));
  return Number.isFinite(safeFallback) && safeFallback > 0 ? safeFallback : 1;
}

function normalizeReduction(value = {}) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const active = Boolean(source.active);
  const target = active ? positiveSessionTarget(source.target, 0) : null;
  return {
    active: active && Number.isFinite(Number(source.target)) && Number(source.target) > 0,
    target: active && Number.isFinite(Number(source.target)) && Number(source.target) > 0 ? target : null,
    ...(source.planId ? { planId: String(source.planId) } : {}),
    ...(source.type ? { type: String(source.type) } : {}),
    ...(source.phase ? { phase: String(source.phase) } : {}),
    ...(Number.isFinite(Number(source.slotCount)) ? { slotCount: Math.max(0, Math.round(Number(source.slotCount))) } : {})
  };
}

export function weeklyTargetComebackReadWindow(rules = {}) {
  const comeback = rules?.thresholds?.comeback && typeof rules.thresholds.comeback === 'object'
    ? rules.thresholds.comeback
    : {};
  const protocolDays = positiveSessionTarget(comeback.protocolDays, 7);
  const longBreakDays = positiveSessionTarget(comeback.longBreakDays, 10);
  return {
    protocolDays,
    longBreakDays,
    lookbackDays: protocolDays + longBreakDays
  };
}

export function normalizeWeeklyTargetCandidate(input = {}) {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const weekStart = validIsoDate(source.weekStart || source.id);
  if (!weekStart) return null;
  return {
    id: weekStart,
    version: 1,
    weekStart,
    normalTarget: positiveSessionTarget(source.normalTarget, 1),
    capturedAt: String(source.capturedAt || '')
  };
}

export function normalizeWeeklyTargetCandidates(items = []) {
  const byWeek = new Map();
  (Array.isArray(items) ? items : []).forEach(item => {
    const normalized = normalizeWeeklyTargetCandidate(item);
    if (normalized) byWeek.set(normalized.weekStart, normalized);
  });
  return [...byWeek.values()].sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

export function upsertOpenWeeklyTargetCandidate(items = [], {
  weekStart,
  normalTarget,
  currentWeekStart = weekStart,
  capturedAt = ''
} = {}) {
  const normalizedWeekStart = validIsoDate(weekStart);
  const normalizedCurrentWeek = validIsoDate(currentWeekStart);
  const existing = normalizeWeeklyTargetCandidates(items);
  if (!normalizedWeekStart || !normalizedCurrentWeek || normalizedWeekStart !== normalizedCurrentWeek) return existing;
  return normalizeWeeklyTargetCandidates([
    ...existing.filter(item => item.weekStart !== normalizedWeekStart),
    { weekStart: normalizedWeekStart, normalTarget, capturedAt }
  ]);
}

export function normalizeWeeklyTargetSnapshotPolicy(input = {}, fallbackEffectiveFrom = '') {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  return {
    version: 1,
    effectiveFrom: validIsoDate(source.effectiveFrom) || validIsoDate(fallbackEffectiveFrom)
  };
}

export function normalizeWeeklyTargetSnapshot(input = {}) {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const weekStart = validIsoDate(source.weekStart || source.id);
  if (!weekStart) return null;
  const normalTarget = positiveSessionTarget(source.normalTarget, 1);
  const effectiveTarget = Math.min(normalTarget, positiveSessionTarget(source.effectiveTarget, normalTarget));
  const plan = normalizeReduction(source.reductions?.plan);
  const comeback = normalizeReduction(source.reductions?.comeback);
  const winningReason = ['normal', 'deload', 'comeback', 'plan_and_comeback'].includes(source.winningReason)
    ? source.winningReason
    : effectiveTarget < normalTarget
      ? plan.active && comeback.active ? 'plan_and_comeback' : plan.active ? 'deload' : comeback.active ? 'comeback' : 'normal'
      : 'normal';
  return {
    id: weekStart,
    version: 1,
    weekStart,
    weekEnd: validIsoDate(source.weekEnd) || addIsoDays(weekStart, 6),
    status: 'final',
    normalTarget,
    effectiveTarget,
    reductions: { plan, comeback },
    winningReason,
    finalizedAt: String(source.finalizedAt || '')
  };
}

export function normalizeWeeklyTargetSnapshots(items = []) {
  const byWeek = new Map();
  (Array.isArray(items) ? items : []).forEach(item => {
    const normalized = normalizeWeeklyTargetSnapshot(item);
    if (normalized) byWeek.set(normalized.weekStart, normalized);
  });
  return [...byWeek.values()].sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

export function effectiveWeeklyTargetForWeek({
  weekStart,
  normalTarget,
  snapshotEffectiveFrom = '',
  snapshots = [],
  planReduction = null,
  comebackReduction = null
} = {}) {
  const normalizedWeekStart = validIsoDate(weekStart);
  const normalizedNormalTarget = positiveSessionTarget(normalTarget, 1);
  const effectiveFrom = validIsoDate(snapshotEffectiveFrom);

  if (!normalizedWeekStart || !effectiveFrom || normalizedWeekStart < effectiveFrom) {
    return {
      target: normalizedNormalTarget,
      normalTarget: normalizedNormalTarget,
      source: 'legacy',
      isLegacy: true,
      snapshotMissing: false,
      snapshot: null,
      reductions: { plan: normalizeReduction(), comeback: normalizeReduction() }
    };
  }

  const snapshot = normalizeWeeklyTargetSnapshots(snapshots)
    .find(item => item.weekStart === normalizedWeekStart && item.status === 'final') || null;
  if (snapshot) {
    return {
      target: snapshot.effectiveTarget,
      normalTarget: snapshot.normalTarget,
      source: 'snapshot',
      isLegacy: false,
      snapshotMissing: false,
      snapshot,
      reductions: snapshot.reductions
    };
  }

  const plan = normalizeReduction(planReduction);
  const comeback = normalizeReduction(comebackReduction);
  const candidates = [
    { reason: 'normal', target: normalizedNormalTarget },
    ...(plan.active ? [{ reason: 'deload', target: plan.target }] : []),
    ...(comeback.active ? [{ reason: 'comeback', target: comeback.target }] : [])
  ];
  const minimum = Math.max(1, Math.min(...candidates.map(item => item.target)));
  const winningReductions = candidates.filter(item => item.reason !== 'normal' && item.target === minimum);
  const source = winningReductions.length > 1
    ? 'plan_and_comeback'
    : winningReductions[0]?.reason || 'normal';

  return {
    target: minimum,
    normalTarget: normalizedNormalTarget,
    source,
    isLegacy: false,
    snapshotMissing: true,
    snapshot: null,
    reductions: { plan, comeback }
  };
}

export function buildWeeklyTargetSnapshot({
  weekStart,
  normalTarget,
  snapshotEffectiveFrom,
  planReduction = null,
  comebackReduction = null,
  finalizedAt = ''
} = {}) {
  const decision = effectiveWeeklyTargetForWeek({
    weekStart,
    normalTarget,
    snapshotEffectiveFrom,
    snapshots: [],
    planReduction,
    comebackReduction
  });
  if (!validIsoDate(weekStart) || decision.isLegacy) return null;
  return normalizeWeeklyTargetSnapshot({
    id: weekStart,
    weekStart,
    weekEnd: addIsoDays(weekStart, 6),
    normalTarget: decision.normalTarget,
    effectiveTarget: decision.target,
    reductions: decision.reductions,
    winningReason: decision.source,
    finalizedAt
  });
}

export function missingWeeklyTargetSnapshotWeeks({
  snapshotEffectiveFrom,
  currentWeekStart,
  snapshots = [],
  maxWeeks = 520
} = {}) {
  const effectiveFrom = validIsoDate(snapshotEffectiveFrom);
  const current = validIsoDate(currentWeekStart);
  if (!effectiveFrom || !current || effectiveFrom >= current) return [];
  const existing = new Set(normalizeWeeklyTargetSnapshots(snapshots).map(item => item.weekStart));
  const missing = [];
  let cursor = effectiveFrom;
  const limit = Math.max(1, Math.min(1040, Math.round(Number(maxWeeks) || 520)));
  while (cursor < current && missing.length < limit) {
    if (!existing.has(cursor)) missing.push(cursor);
    cursor = addIsoDays(cursor, 7);
  }
  return missing;
}

export function weeklyContinuityOutcome({ sessions = 0, target = 1, freezeProtected = false } = {}) {
  const normalizedSessions = Math.max(0, Math.round(Number(sessions) || 0));
  const normalizedTarget = positiveSessionTarget(target, 1);
  const meetsTarget = normalizedSessions >= normalizedTarget;
  const protectedByFreeze = !meetsTarget && Boolean(freezeProtected);
  return {
    sessions: normalizedSessions,
    target: normalizedTarget,
    meetsTarget,
    protectedByFreeze,
    countsAsContinuity: meetsTarget || protectedByFreeze,
    source: meetsTarget ? 'training' : protectedByFreeze ? 'freeze' : 'missing'
  };
}

const PERIODIZED_PLAN_VERSION = 1;
const PLAN_STATUSES = new Set(['draft', 'active', 'completed', 'cancelled']);
const PLAN_FOCUSES = new Set(['base', 'threshold', 'custom']);
const PLAN_METRICS = new Set(['duration', 'sessions']);
const WEEK_TYPES = ['load', 'load', 'peak', 'deload'];
const CANONICAL_ROLES = new Set([
  'main_threshold', 'support_threshold', 'easy', 'long_easy', 'recovery',
  'x_workout', 'strength', 'mobility', 'technique', 'race', 'other'
]);

function plainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function finiteNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function clampNumber(value, min, max, fallback) {
  return Math.min(max, Math.max(min, finiteNumber(value, fallback)));
}

function rounded(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(finiteNumber(value) * factor) / factor;
}

function validMonday(value) {
  const iso = validIsoDate(value);
  return iso && new Date(`${iso}T12:00:00Z`).getUTCDay() === 1 ? iso : '';
}

function isoWeekStart(value) {
  const iso = validIsoDate(value);
  if (!iso) return '';
  const date = new Date(`${iso}T12:00:00Z`);
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - day + 1);
  return date.toISOString().slice(0, 10);
}

function normalizedRole(value, fallback = 'other') {
  const role = String(value || '').trim().toLowerCase();
  return CANONICAL_ROLES.has(role) ? role : fallback;
}

function uniqueRoles(values = [], limit = 4) {
  return [...new Set((Array.isArray(values) ? values : [])
    .map(value => normalizedRole(value, ''))
    .filter(Boolean))].slice(0, limit);
}

export function periodizedPlanRules(rules = DEFAULT_COACH_RULES) {
  const fallback = DEFAULT_COACH_RULES.thresholds.periodizedPlan;
  const source = plainObject(rules?.thresholds?.periodizedPlan)
    ? rules.thresholds.periodizedPlan
    : fallback;
  const fallbackFactors = fallback.blockFactors;
  const candidateFactors = Array.isArray(source.blockFactors) && source.blockFactors.length === 4
    ? source.blockFactors
    : fallbackFactors;
  const blockFactors = candidateFactors.map((factor, index) => {
    const safe = plainObject(factor) ? factor : fallbackFactors[index];
    const min = clampNumber(safe.min, 0.1, 2, fallbackFactors[index].min);
    const max = clampNumber(safe.max, min, 2, fallbackFactors[index].max);
    return { min, max };
  });
  const volumeRamp = plainObject(rules?.thresholds?.volumeRamp)
    ? rules.thresholds.volumeRamp
    : DEFAULT_COACH_RULES.thresholds.volumeRamp;
  return {
    baselineLookbackWeeks: Math.round(clampNumber(source.baselineLookbackWeeks, 4, 12, fallback.baselineLookbackWeeks)),
    minimumBaselineWeeks: Math.round(clampNumber(source.minimumBaselineWeeks, 2, 12, fallback.minimumBaselineWeeks)),
    durationCoverageThreshold: clampNumber(source.durationCoverageThreshold, 0, 1, fallback.durationCoverageThreshold),
    significantBaselineChangeFactor: clampNumber(source.significantBaselineChangeFactor, 0.01, 1, fallback.significantBaselineChangeFactor),
    blockFactors,
    maxWeeklyIncreaseFactor: clampNumber(
      volumeRamp.maxWeeklyIncreaseFactor,
      1,
      3,
      DEFAULT_COACH_RULES.thresholds.volumeRamp.maxWeeklyIncreaseFactor
    )
  };
}

export function derivePeriodizedPlanBaseline(completedItems = [], {
  startDate,
  metric = 'auto',
  continuityFreezes = [],
  rules = DEFAULT_COACH_RULES
} = {}) {
  const normalizedStart = validMonday(startDate);
  const config = periodizedPlanRules(rules);
  const rangeEnd = normalizedStart ? addIsoDays(normalizedStart, -1) : '';
  const rangeStart = normalizedStart ? addIsoDays(normalizedStart, -(config.baselineLookbackWeeks * 7)) : '';
  const illnessFreezes = (Array.isArray(continuityFreezes) ? continuityFreezes : [])
    .filter(item => plainObject(item)
      && ['sick', 'injury'].includes(String(item.reason || ''))
      && ['active', 'ended'].includes(String(item.status || 'active'))
      && validIsoDate(item.startDate)
      && validIsoDate(item.endDate));
  const candidateWeekStarts = Array.from({ length: config.baselineLookbackWeeks }, (_, index) => (
    normalizedStart ? addIsoDays(normalizedStart, -((config.baselineLookbackWeeks - index) * 7)) : ''
  )).filter(Boolean);
  const excludedWeeks = candidateWeekStarts
    .filter(weekStart => {
      const weekEnd = addIsoDays(weekStart, 6);
      return illnessFreezes.some(item => item.startDate <= weekEnd && item.endDate >= weekStart);
    })
    .map(weekStart => ({
      weekStart,
      weekEnd: addIsoDays(weekStart, 6),
      reasons: [...new Set(illnessFreezes
        .filter(item => item.startDate <= addIsoDays(weekStart, 6) && item.endDate >= weekStart)
        .map(item => item.reason))]
    }));
  const excludedWeekStarts = new Set(excludedWeeks.map(item => item.weekStart));
  const eligible = (Array.isArray(completedItems) ? completedItems : [])
    .filter(item => {
      const date = validIsoDate(item?.date);
      return date
        && rangeStart
        && date >= rangeStart
        && date <= rangeEnd
        && !excludedWeekStarts.has(isoWeekStart(date));
    });
  const durationCount = eligible.filter(item => completedDurationSeconds(item) > 0).length;
  const durationCoverage = eligible.length ? durationCount / eligible.length : 0;
  const requestedMetric = PLAN_METRICS.has(metric) ? metric : 'auto';
  const selectedMetric = requestedMetric === 'auto'
    ? durationCoverage >= config.durationCoverageThreshold ? 'duration' : 'sessions'
    : requestedMetric;
  const byWeek = new Map();
  eligible.forEach(item => {
    const weekStart = isoWeekStart(item.date);
    const summary = byWeek.get(weekStart) || { weekStart, sessions: 0, durationMinutes: 0, sessionsWithDuration: 0 };
    const seconds = completedDurationSeconds(item);
    summary.sessions += 1;
    summary.durationMinutes += seconds / 60;
    if (seconds > 0) summary.sessionsWithDuration += 1;
    byWeek.set(weekStart, summary);
  });
  const weeks = [...byWeek.values()].sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  const usableWeeks = selectedMetric === 'duration'
    ? weeks.filter(week => week.durationMinutes > 0)
    : weeks.filter(week => week.sessions > 0);
  const rawValue = usableWeeks.length
    ? usableWeeks.reduce((sum, week) => sum + (selectedMetric === 'duration' ? week.durationMinutes : week.sessions), 0) / usableWeeks.length
    : 0;
  const baselineValue = selectedMetric === 'sessions' ? Math.max(0, Math.round(rawValue)) : rounded(rawValue, 1);
  const enoughData = Boolean(
    normalizedStart
    && usableWeeks.length >= config.minimumBaselineWeeks
    && baselineValue > 0
    && (selectedMetric !== 'duration' || durationCoverage >= config.durationCoverageThreshold)
  );
  return {
    lookbackWeeks: config.baselineLookbackWeeks,
    minimumWeeks: config.minimumBaselineWeeks,
    metric: selectedMetric,
    baselineValue,
    sourceCoverage: rounded(selectedMetric === 'duration' ? durationCoverage : eligible.length ? 1 : 0, 2),
    enoughData,
    calculatedAt: '',
    range: { start: rangeStart, end: rangeEnd },
    itemCount: eligible.length,
    weekCount: usableWeeks.length,
    excludedWeekCount: excludedWeeks.length,
    excludedWeeks,
    weeks: usableWeeks.map(week => ({
      ...week,
      durationMinutes: rounded(week.durationMinutes, 1)
    }))
  };
}

export function applyPeriodizedComebackSafety({
  baseline = {},
  frame = {},
  comebackState = {},
  continuityFreezes = [],
  startDate = ''
} = {}) {
  const normalBaselineValue = Math.max(0, finiteNumber(baseline?.baselineValue));
  const metric = PLAN_METRICS.has(baseline?.metric || frame?.metric)
    ? (baseline.metric || frame.metric)
    : 'sessions';
  const activeFreeze = (Array.isArray(continuityFreezes) ? continuityFreezes : [])
    .filter(item => plainObject(item)
      && ['sick', 'injury'].includes(String(item.reason || ''))
      && String(item.status || 'active') === 'active'
      && validIsoDate(item.startDate)
      && validIsoDate(item.endDate))
    .sort((a, b) => String(b.endDate).localeCompare(String(a.endDate)))[0] || null;
  const comebackActive = Boolean(comebackState?.active);
  const active = comebackActive || Boolean(activeFreeze);
  const rawFactor = comebackActive ? finiteNumber(comebackState?.weekFactor, 1) : 1;
  const weekFactor = active ? clampNumber(rawFactor, 0.1, 1, 1) : 1;
  const adjustedBaselineValue = !active
    ? normalBaselineValue
    : metric === 'sessions' && finiteNumber(comebackState?.effectiveWeeklyTarget) > 0
      ? Math.max(1, Math.round(finiteNumber(comebackState.effectiveWeeklyTarget)))
      : metric === 'sessions'
        ? Math.max(1, Math.round(normalBaselineValue * weekFactor))
        : rounded(normalBaselineValue * weekFactor, 1);
  const weeks = (Array.isArray(frame?.weeks) ? frame.weeks : []).map((week, index) => {
    if (!active) return { ...week, planningState: 'normal', materializationState: 'available_when_enabled' };
    const scale = normalBaselineValue > 0 ? adjustedBaselineValue / normalBaselineValue : weekFactor;
    const scaledMin = metric === 'sessions'
      ? Math.max(1, Math.round(finiteNumber(week?.targetMin) * scale))
      : rounded(finiteNumber(week?.targetMin) * scale, 1);
    const scaledMax = metric === 'sessions'
      ? Math.max(scaledMin, Math.round(finiteNumber(week?.targetMax) * scale))
      : Math.max(scaledMin, rounded(finiteNumber(week?.targetMax) * scale, 1));
    if (index === 0) {
      const lowerFactor = normalBaselineValue > 0 && finiteNumber(week?.targetMin) > 0
        ? Math.min(1, finiteNumber(week.targetMin) / normalBaselineValue)
        : 0.95;
      const targetMinRaw = adjustedBaselineValue * lowerFactor;
      const targetMin = metric === 'sessions'
        ? Math.max(1, Math.min(adjustedBaselineValue, Math.round(targetMinRaw)))
        : rounded(Math.min(adjustedBaselineValue, targetMinRaw), 1);
      return {
        ...week,
        targetMin,
        targetMax: adjustedBaselineValue,
        planningState: 'controlled_return',
        materializationState: 'available_when_enabled'
      };
    }
    return {
      ...week,
      targetMin: scaledMin,
      targetMax: scaledMax,
      planningState: 'provisional_after_return',
      materializationState: comebackState?.recoveryDate ? 'available_when_enabled' : 'awaiting_recovery'
    };
  });
  return {
    active,
    status: active ? 'restricted_by_comeback' : 'normal',
    normalBaselineValue,
    adjustedBaselineValue,
    metric,
    weekFactor,
    percent: Math.round(weekFactor * 100),
    comebackState: comebackActive ? { ...comebackState } : null,
    activeFreeze: activeFreeze ? { ...activeFreeze } : null,
    recoveryRegistered: Boolean(comebackState?.recoveryDate),
    excludedWeekCount: Math.max(0, Math.round(finiteNumber(baseline?.excludedWeekCount))),
    excludedWeeks: Array.isArray(baseline?.excludedWeeks) ? baseline.excludedWeeks.map(item => ({ ...item })) : [],
    frame: { ...frame, baselineValue: adjustedBaselineValue, weeks },
    materializationPolicy: {
      weekOneAllowedWhenEnabled: true,
      laterWeeksRequireRecovery: true,
      laterWeeksAllowed: Boolean(comebackState?.recoveryDate)
    },
    startDate: validIsoDate(startDate)
  };
}

export function comparePeriodizedBaselines(current = {}, previous = {}, rules = DEFAULT_COACH_RULES) {
  const config = periodizedPlanRules(rules);
  const currentMetric = PLAN_METRICS.has(current?.metric) ? current.metric : '';
  const previousMetric = PLAN_METRICS.has(previous?.metric) ? previous.metric : '';
  if (!currentMetric || !previousMetric || currentMetric !== previousMetric) {
    return { significant: true, reason: 'metric_changed', changeFactor: null };
  }
  const oldValue = finiteNumber(previous?.baselineValue);
  const newValue = finiteNumber(current?.baselineValue);
  if (oldValue <= 0 || newValue <= 0) return { significant: true, reason: 'missing_baseline', changeFactor: null };
  const changeFactor = Math.abs(newValue - oldValue) / oldValue;
  return {
    significant: changeFactor > config.significantBaselineChangeFactor,
    reason: changeFactor > config.significantBaselineChangeFactor ? 'value_changed' : 'stable',
    changeFactor: rounded(changeFactor, 3),
    threshold: config.significantBaselineChangeFactor
  };
}

export function periodizedRolePolicy({ focus = 'base', slotCount = 3, customRoles = [], weekType = 'load' } = {}) {
  const count = Math.max(1, Math.min(4, Math.round(finiteNumber(slotCount, 3))));
  const normalizedFocus = PLAN_FOCUSES.has(focus) ? focus : 'custom';
  const defaults = normalizedFocus === 'threshold'
    ? ['main_threshold', 'easy', 'support_threshold', 'long_easy']
    : normalizedFocus === 'base'
      ? ['easy', 'easy', 'long_easy', 'easy']
      : uniqueRoles(customRoles, 4);
  const deloadDefaults = ['recovery', 'long_easy', 'mobility', 'recovery'];
  const source = weekType === 'deload' ? deloadDefaults : defaults;
  const roles = [];
  for (let index = 0; index < count; index += 1) roles.push(normalizedRole(source[index % source.length] || 'other'));
  return {
    focus: normalizedFocus,
    weekType: WEEK_TYPES.includes(weekType) ? weekType : 'load',
    slotCount: count,
    roles,
    priorityRoles: uniqueRoles(roles, 4)
  };
}

function normalizePlanSlot(input = {}, { weekStart, weekIndex, slotIndex } = {}) {
  const source = plainObject(input) ? input : {};
  const preferredDay = Math.max(1, Math.min(7, Math.round(finiteNumber(source.preferredDay, slotIndex + 1))));
  const date = validIsoDate(source.date) || (weekStart ? addIsoDays(weekStart, preferredDay - 1) : '');
  return {
    slotId: String(source.slotId || `w${weekIndex}-s${slotIndex + 1}`),
    role: normalizedRole(source.role),
    preferredDay,
    date,
    templateId: source.templateId ? String(source.templateId) : null
  };
}

export function buildFourWeekVolumeFrame({
  startDate,
  baselineValue,
  metric = 'sessions',
  slotsByWeek = [],
  focus = 'base',
  customRoles = [],
  rules = DEFAULT_COACH_RULES
} = {}) {
  const normalizedStart = validMonday(startDate);
  const normalizedMetric = PLAN_METRICS.has(metric) ? metric : 'sessions';
  const normalizedBaseline = Math.max(0, finiteNumber(baselineValue));
  const config = periodizedPlanRules(rules);
  const weeks = config.blockFactors.map((factor, index) => {
    const weekStart = normalizedStart ? addIsoDays(normalizedStart, index * 7) : '';
    const providedSlots = Array.isArray(slotsByWeek[index]) ? slotsByWeek[index].slice(0, 4) : [];
    const defaultCount = providedSlots.length || Math.max(1, Math.min(4, Math.round(normalizedMetric === 'sessions' ? normalizedBaseline || 3 : 3)));
    const rolePolicy = periodizedRolePolicy({ focus, slotCount: defaultCount, customRoles, weekType: WEEK_TYPES[index] });
    const slots = (providedSlots.length ? providedSlots : rolePolicy.roles.map(role => ({ role })))
      .map((slot, slotIndex) => normalizePlanSlot(slot, { weekStart, weekIndex: index + 1, slotIndex }));
    const rawMin = normalizedBaseline * factor.min;
    const rawMax = normalizedBaseline * factor.max;
    const targetMin = normalizedMetric === 'sessions' ? Math.max(1, Math.round(rawMin)) : rounded(rawMin, 1);
    const targetMax = normalizedMetric === 'sessions' ? Math.max(targetMin, Math.round(rawMax)) : Math.max(targetMin, rounded(rawMax, 1));
    return {
      weekStart,
      weekEnd: weekStart ? addIsoDays(weekStart, 6) : '',
      index: index + 1,
      type: WEEK_TYPES[index],
      metric: normalizedMetric,
      priorityRoles: uniqueRoles(slots.map(slot => slot.role), 4),
      targetMin,
      targetMax,
      slots,
      effectiveWeeklyTarget: index === 3 ? Math.max(1, slots.length) : null,
      evaluation: null
    };
  });
  return {
    metric: normalizedMetric,
    baselineValue: normalizedBaseline,
    factors: config.blockFactors.map(factor => ({ ...factor })),
    weeks
  };
}

export function validateProspectiveVolumeFrame({ frame = {}, volumeRamp = {}, rules = DEFAULT_COACH_RULES, override = false } = {}) {
  const metric = PLAN_METRICS.has(frame?.metric) ? frame.metric : '';
  const config = periodizedPlanRules(rules);
  const originalMin = Math.max(0, finiteNumber(frame?.targetMin));
  const originalMax = Math.max(originalMin, finiteNumber(frame?.targetMax));
  const base = {
    metric,
    originalTargetMin: originalMin,
    originalTargetMax: originalMax,
    proposedTargetMin: originalMin,
    proposedTargetMax: originalMax,
    guardrailMaxFactor: config.maxWeeklyIncreaseFactor,
    overrideAvailable: false,
    overrideApplied: false
  };
  if (!volumeRamp?.enoughData) {
    return {
      ...base,
      validationStatus: 'insufficient_data',
      outcome: null,
      message: 'Vi har ikke nok sammenlignbar historikk til å validere volumrammen ennå. Du kan opprette blokken, men vurderingssikkerheten er lav.'
    };
  }
  if (!metric || metric !== volumeRamp.metric) {
    return {
      ...base,
      validationStatus: 'metric_mismatch',
      outcome: null,
      message: `Volumrammen er satt i ${metric === 'duration' ? 'minutter' : 'antall økter'}, mens historikken akkurat nå vurderes i ${volumeRamp.metric === 'duration' ? 'minutter' : 'antall økter'}. Rammen kunne derfor ikke valideres uten å gjette.`
    };
  }
  const baseline = metric === 'duration'
    ? finiteNumber(volumeRamp?.baselineWeekly?.seconds) / 60
    : finiteNumber(volumeRamp?.baselineWeekly?.sessions);
  if (!(baseline > 0)) {
    return {
      ...base,
      validationStatus: 'insufficient_data',
      outcome: null,
      message: 'Vi har ikke nok sammenlignbar historikk til å validere volumrammen ennå. Du kan opprette blokken, men vurderingssikkerheten er lav.'
    };
  }
  const rawMaximum = baseline * config.maxWeeklyIncreaseFactor;
  const safeMaximum = metric === 'sessions'
    ? Math.max(1, Math.floor(rawMaximum))
    : Math.max(0.1, Math.floor(rawMaximum * 10) / 10);
  const exceeds = originalMax > safeMaximum;
  const adjustedMin = exceeds ? Math.min(originalMin, safeMaximum) : originalMin;
  const adjustedMax = exceeds ? safeMaximum : originalMax;
  const overrideApplied = Boolean(exceeds && override);
  return {
    ...base,
    validationStatus: 'validated',
    outcome: exceeds ? 'reduced_by_guardrail' : 'within_guardrail',
    baselineValue: rounded(baseline, 1),
    maximumWithinGuardrail: safeMaximum,
    proposedTargetMin: overrideApplied ? originalMin : adjustedMin,
    proposedTargetMax: overrideApplied ? originalMax : adjustedMax,
    overrideAvailable: exceeds,
    overrideApplied,
    ruleSourceAligned: !Number.isFinite(Number(volumeRamp?.maxFactor))
      || Math.abs(Number(volumeRamp.maxFactor) - config.maxWeeklyIncreaseFactor) < 0.000001,
    message: exceeds
      ? `Forslaget er justert fra ${originalMax} til ${safeMaximum} ${metric === 'duration' ? 'minutter' : 'økter'}. Den opprinnelige øvre rammen ville gitt raskere økning enn volumvakten anbefaler ut fra de siste ukene.`
      : 'Den øvre volumrammen er innenfor volumvaktens anbefalte grense.'
  };
}

export function normalizePeriodizedTrainingPlan(input = {}, { rules = DEFAULT_COACH_RULES } = {}) {
  const source = plainObject(input) ? input : {};
  const startDate = validMonday(source.startDate);
  const calibrationSource = plainObject(source.calibration) ? source.calibration : {};
  const metric = PLAN_METRICS.has(calibrationSource.metric || source.volumeFrame?.metric)
    ? (calibrationSource.metric || source.volumeFrame.metric)
    : 'sessions';
  const baselineValue = Math.max(0, finiteNumber(calibrationSource.baselineValue));
  const suppliedWeeks = Array.isArray(source.weeks) ? source.weeks : [];
  const slotsByWeek = Array.from({ length: 4 }, (_, index) => Array.isArray(suppliedWeeks[index]?.slots) ? suppliedWeeks[index].slots : []);
  const frame = buildFourWeekVolumeFrame({
    startDate,
    baselineValue,
    metric,
    slotsByWeek,
    focus: source.focus,
    customRoles: suppliedWeeks.flatMap(week => week?.priorityRoles || []),
    rules
  });
  const errors = [];
  if (!startDate) errors.push('startDate_must_be_iso_monday');
  if (!(baselineValue > 0)) errors.push('baseline_missing');
  if (suppliedWeeks.length && suppliedWeeks.length !== 4) errors.push('exactly_four_weeks_required');
  const requestedStatus = PLAN_STATUSES.has(source.status) ? source.status : 'draft';
  const status = errors.length ? 'draft' : requestedStatus;
  return {
    id: String(source.id || ''),
    version: PERIODIZED_PLAN_VERSION,
    type: 'manual_four_week',
    status,
    name: String(source.name || 'Fireukersblokk').trim() || 'Fireukersblokk',
    focus: PLAN_FOCUSES.has(source.focus) ? source.focus : 'custom',
    startDate,
    endDate: startDate ? addIsoDays(startDate, 27) : '',
    planRevision: Math.max(1, Math.round(finiteNumber(source.planRevision, 1))),
    createdAt: String(source.createdAt || ''),
    updatedAt: String(source.updatedAt || ''),
    activatedAt: String(source.activatedAt || ''),
    completedAt: String(source.completedAt || ''),
    snapshotPolicyVersion: 1,
    calibration: {
      lookbackWeeks: Math.max(4, Math.round(finiteNumber(calibrationSource.lookbackWeeks, periodizedPlanRules(rules).baselineLookbackWeeks))),
      metric,
      baselineValue,
      sourceCoverage: clampNumber(calibrationSource.sourceCoverage, 0, 1, 0),
      calculatedAt: String(calibrationSource.calculatedAt || ''),
      userConfirmed: Boolean(calibrationSource.userConfirmed)
    },
    volumeFrame: { metric, factors: frame.factors },
    weeks: frame.weeks,
    validation: { valid: errors.length === 0, errors },
    canMaterialize: errors.length === 0 && calibrationSource.userConfirmed === true
  };
}

export function normalizePeriodizedTrainingPlans(items = [], { rules = DEFAULT_COACH_RULES } = {}) {
  const byId = new Map();
  (Array.isArray(items) ? items : []).forEach(item => {
    const normalized = normalizePeriodizedTrainingPlan(item, { rules });
    if (normalized.id) byId.set(normalized.id, normalized);
  });
  return [...byId.values()].sort((a, b) => {
    const byStart = String(a.startDate || '').localeCompare(String(b.startDate || ''));
    return byStart || String(a.id || '').localeCompare(String(b.id || ''));
  });
}

function suggestionPrimaryRole(suggestion = {}) {
  return normalizedRole(Array.isArray(suggestion.roles) ? suggestion.roles[0] : suggestion.role, '');
}

export function blockAwareSuggestionMix(normalSuggestions = [], activeBlockContext = {}, count = 0) {
  const target = Math.max(0, Math.min(4, Math.round(finiteNumber(count))));
  if (!activeBlockContext?.active || !target) return (Array.isArray(normalSuggestions) ? normalSuggestions : []).slice(0, target);
  const priorities = uniqueRoles(activeBlockContext.priorityRoles || activeBlockContext.roles, 4);
  const remaining = [...(Array.isArray(normalSuggestions) ? normalSuggestions : [])];
  const selected = [];
  priorities.forEach(role => {
    if (selected.length >= target) return;
    const index = remaining.findIndex(suggestion => suggestionPrimaryRole(suggestion) === role);
    if (index >= 0) selected.push(remaining.splice(index, 1)[0]);
    else selected.push(suggestionForWorkoutRole(role));
  });
  return [...selected, ...remaining].slice(0, target);
}

export function periodizedSuggestionMix(normalSuggestions = [], {
  activeBlockContext = null,
  raceContext = null,
  count = normalSuggestions.length
} = {}) {
  return activeBlockContext?.active
    ? blockAwareSuggestionMix(normalSuggestions, activeBlockContext, count)
    : applyRaceContextToSuggestionMix(normalSuggestions, raceContext, count);
}

export function detectPeriodizedPlanConflicts(slots = [], existingPlannedItems = [], { planId = '' } = {}) {
  const items = Array.isArray(existingPlannedItems) ? existingPlannedItems : [];
  return (Array.isArray(slots) ? slots : []).map(slot => {
    const date = validIsoDate(slot?.date);
    const collisions = items.filter(item => validIsoDate(item?.date) === date);
    const blocking = collisions.filter(item => {
      const ref = plainObject(item?.planRef) ? item.planRef : null;
      return !ref || String(ref.planId || '') !== String(planId || '') || String(ref.slotId || '') !== String(slot?.slotId || '');
    });
    const manual = blocking.filter(item => !plainObject(item?.planRef));
    return {
      slotId: String(slot?.slotId || ''),
      date,
      status: blocking.length ? 'conflict' : 'available',
      conflictType: manual.length ? 'manual_workout' : blocking.length ? 'other_plan' : null,
      blockingItemIds: blocking.map(item => String(item?.id || '')).filter(Boolean),
      allowedActions: blocking.length ? ['choose_another_date', 'skip'] : ['create']
    };
  });
}

export function evaluatePlanWeek({
  planWeek = {},
  plannedItems = [],
  completedItems = [],
  roleCoverage = [],
  volumeRamp = {},
  bodyState = {},
  comebackState = {}
} = {}) {
  const slots = Array.isArray(planWeek?.slots) ? planWeek.slots : [];
  const completed = Array.isArray(completedItems) ? completedItems : [];
  const planned = Array.isArray(plannedItems) ? plannedItems : [];
  const coverage = Array.isArray(roleCoverage) ? roleCoverage : [];
  const requiredRoles = coverage.filter(item => item?.required !== false);
  const coveredRoles = requiredRoles.filter(item => ['completed', 'planned'].includes(item?.status));
  const bodyLevel = String(bodyState?.level || 'none');
  const safetyReasons = [
    ...(['active', 'caution', 'red'].includes(bodyLevel) ? ['body_signal'] : []),
    ...(volumeRamp?.status === 'high' ? ['volume_ramp'] : []),
    ...(comebackState?.active ? ['comeback'] : [])
  ];
  const completedSlotIds = new Set(completed.map(item => String(item?.planRef?.slotId || '')).filter(Boolean));
  const plannedSlotIds = new Set(planned.map(item => String(item?.planRef?.slotId || '')).filter(Boolean));
  const fulfilledSlots = slots.filter(slot => completedSlotIds.has(String(slot.slotId)) || plannedSlotIds.has(String(slot.slotId))).length;
  const completedSlots = slots.filter(slot => completedSlotIds.has(String(slot.slotId))).length;
  const allRolesCovered = requiredRoles.length === 0 || coveredRoles.length === requiredRoles.length;
  const status = safetyReasons.length
    ? 'safety_attention'
    : completedSlots >= slots.length && allRolesCovered
      ? 'completed'
      : fulfilledSlots >= Math.max(1, Math.ceil(slots.length / 2))
        ? 'on_track'
        : 'behind';
  return {
    weekStart: validIsoDate(planWeek?.weekStart),
    weekIndex: Math.max(1, Math.min(4, Math.round(finiteNumber(planWeek?.index, 1)))),
    weekType: WEEK_TYPES.includes(planWeek?.type) ? planWeek.type : 'load',
    status,
    slots: { total: slots.length, fulfilled: fulfilledSlots, completed: completedSlots },
    roles: { required: requiredRoles.length, covered: coveredRoles.length, allCovered: allRolesCovered },
    volume: {
      metric: PLAN_METRICS.has(planWeek?.metric) ? planWeek.metric : null,
      targetMin: finiteNumber(planWeek?.targetMin),
      targetMax: finiteNumber(planWeek?.targetMax),
      assessment: String(volumeRamp?.status || 'insufficient_data')
    },
    safety: { requiresAttention: safetyReasons.length > 0, reasons: safetyReasons },
    userModifiedCount: [...planned, ...completed].filter(item => item?.userModified === true).length,
    effectiveWeeklyTarget: planWeek?.type === 'deload' ? Math.max(1, slots.length) : null
  };
}
