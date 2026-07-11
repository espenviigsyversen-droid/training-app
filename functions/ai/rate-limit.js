"use strict";

const DEFAULT_LIMITS = Object.freeze({
  shortWindowMs: 10 * 60 * 1000,
  shortWindowMax: 10,
  dailyMax: 50
});

function utcDayKey(date) {
  return date.toISOString().slice(0, 10);
}

async function enforceRateLimit(db, uid, options = {}) {
  const now = options.now instanceof Date ? options.now : new Date();
  const limits = { ...DEFAULT_LIMITS, ...(options.limits || {}) };
  const ref = db.doc("aiUsage/" + uid);

  return db.runTransaction(async transaction => {
    const snap = await transaction.get(ref);
    const data = snap.exists ? snap.data() || {} : {};
    const nowMs = now.getTime();
    const currentDay = utcDayKey(now);
    const priorWindowStart = Number(data.windowStartMs || 0);
    const sameWindow = priorWindowStart > 0 && nowMs - priorWindowStart < limits.shortWindowMs;
    const windowStartMs = sameWindow ? priorWindowStart : nowMs;
    const windowCount = sameWindow ? Number(data.windowCount || 0) : 0;
    const sameDay = data.dayKey === currentDay;
    const dayCount = sameDay ? Number(data.dayCount || 0) : 0;

    if (windowCount >= limits.shortWindowMax) {
      return { allowed: false, code: "RATE_LIMITED", retryAfterMs: limits.shortWindowMs - (nowMs - windowStartMs) };
    }
    if (dayCount >= limits.dailyMax) {
      return { allowed: false, code: "DAILY_BUDGET_REACHED", retryAfterMs: null };
    }

    const nextWindowCount = windowCount + 1;
    const nextDayCount = dayCount + 1;
    transaction.set(ref, {
      dayKey: currentDay,
      dayCount: nextDayCount,
      windowStartMs,
      windowCount: nextWindowCount,
      updatedAt: now
    }, { merge: true });
    return {
      allowed: true,
      remainingShort: Math.max(0, limits.shortWindowMax - nextWindowCount),
      remainingToday: Math.max(0, limits.dailyMax - nextDayCount)
    };
  });
}

module.exports = { DEFAULT_LIMITS, enforceRateLimit, utcDayKey };
