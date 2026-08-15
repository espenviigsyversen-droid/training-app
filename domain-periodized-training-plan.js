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
