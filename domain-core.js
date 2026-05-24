export function addDays(dateIso, days) {
  const d = new Date(`${dateIso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function dateToISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function startOfWeek(dateIso) {
  const date = new Date(`${dateIso}T12:00:00`);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return dateToISO(date);
}

export function goldenZonePercentages(level) {
  if (level === 'experienced') return { lowPct: 0.80, highPct: 0.87 };
  if (level === 'intermediate') return { lowPct: 0.78, highPct: 0.85 };
  return { lowPct: 0.77, highPct: 0.84 };
}

export function assessTrafficLight(sleep, energy, restingHR, stairsOk, baselineRestingHR = null) {
  if (stairsOk === false) return 'red';
  const avg = (sleep + energy) / 2;
  const hrDelta = (restingHR && baselineRestingHR) ? Number(restingHR) - Number(baselineRestingHR) : 0;
  if (avg <= 2 || hrDelta >= 10) return 'red';
  if (avg <= 3.5 || hrDelta >= 5) return 'yellow';
  return 'green';
}

export function formatKm(km) {
  const value = Number(km) || 0;
  return `${value.toLocaleString('no-NO', { maximumFractionDigits: value < 10 ? 1 : 0 })} km`;
}

export function asArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}

export function normalizeStructuredWorkout(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const blocks = Array.isArray(value.blocks)
    ? value.blocks
        .filter(block => block && typeof block === 'object' && !Array.isArray(block))
        .map(normalizeStructuredWorkoutBlock)
        .filter(Boolean)
    : [];
  if (!blocks.length) return null;
  return {
    version: Number(value.version) || 1,
    blocks,
    note: typeof value.note === 'string' ? value.note : ''
  };
}

export function normalizeStructuredWorkoutBlock(block = {}) {
  const type = String(block.type || '').trim();
  if (type === 'warmup' || type === 'cooldown') {
    const durationSeconds = parseNonNegativeInteger(block.durationSeconds);
    if (!durationSeconds) return null;
    return {
      type,
      durationSeconds,
      note: String(block.note || '')
    };
  }
  if (type === 'interval') {
    const repetitions = parseNonNegativeInteger(block.repetitions);
    const workSeconds = parseNonNegativeInteger(block.workSeconds);
    const restSeconds = parseNonNegativeInteger(block.restSeconds);
    if (!repetitions || !workSeconds) return null;
    return {
      type,
      repetitions,
      workSeconds,
      restSeconds,
      restType: String(block.restType || ''),
      intensity: String(block.intensity || ''),
      note: String(block.note || '')
    };
  }
  return null;
}

export function buildStructuredWorkout(input = {}) {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const blocks = [];
  const warmupSeconds = parseNonNegativeInteger(source.warmupMinutes) * 60;
  const cooldownSeconds = parseNonNegativeInteger(source.cooldownMinutes) * 60;
  const repetitions = parseNonNegativeInteger(source.repetitions);
  const workSeconds = parseNonNegativeInteger(source.workSeconds);
  const restSeconds = parseNonNegativeInteger(source.restSeconds);

  if (warmupSeconds) blocks.push({ type: 'warmup', durationSeconds: warmupSeconds });
  if (repetitions && workSeconds) {
    blocks.push({
      type: 'interval',
      repetitions,
      workSeconds,
      restSeconds,
      restType: String(source.restType || ''),
      intensity: String(source.intensity || ''),
      note: String(source.intervalNote || '')
    });
  }
  if (cooldownSeconds) blocks.push({ type: 'cooldown', durationSeconds: cooldownSeconds });

  return normalizeStructuredWorkout({
    version: 1,
    blocks,
    note: String(source.note || '')
  });
}

export function structuredWorkoutWorkSeconds(structuredWorkout) {
  const workout = normalizeStructuredWorkout(structuredWorkout);
  if (!workout) return 0;
  return workout.blocks.reduce((sum, block) => {
    if (block.type !== 'interval') return sum;
    return sum + (block.repetitions * block.workSeconds);
  }, 0);
}

export function structuredWorkoutRestSeconds(structuredWorkout) {
  const workout = normalizeStructuredWorkout(structuredWorkout);
  if (!workout) return 0;
  return workout.blocks.reduce((sum, block) => {
    if (block.type !== 'interval') return sum;
    return sum + (block.repetitions * block.restSeconds);
  }, 0);
}

export function structuredWorkoutTotalSeconds(structuredWorkout) {
  const workout = normalizeStructuredWorkout(structuredWorkout);
  if (!workout) return 0;
  return workout.blocks.reduce((sum, block) => {
    if (block.type === 'warmup' || block.type === 'cooldown') return sum + block.durationSeconds;
    if (block.type === 'interval') {
      return sum + (block.repetitions * block.workSeconds) + (block.repetitions * block.restSeconds);
    }
    return sum;
  }, 0);
}

export function structuredWorkoutWarmupSeconds(structuredWorkout) {
  const workout = normalizeStructuredWorkout(structuredWorkout);
  if (!workout) return 0;
  return workout.blocks.reduce((sum, block) => (
    block.type === 'warmup' ? sum + block.durationSeconds : sum
  ), 0);
}

export function structuredWorkoutCooldownSeconds(structuredWorkout) {
  const workout = normalizeStructuredWorkout(structuredWorkout);
  if (!workout) return 0;
  return workout.blocks.reduce((sum, block) => (
    block.type === 'cooldown' ? sum + block.durationSeconds : sum
  ), 0);
}

export function structuredWorkoutIntervalBlocks(structuredWorkout) {
  const workout = normalizeStructuredWorkout(structuredWorkout);
  return workout ? workout.blocks.filter(block => block.type === 'interval') : [];
}

export function hasStructuredIntervals(structuredWorkout) {
  return structuredWorkoutIntervalBlocks(structuredWorkout)
    .some(block => block.repetitions > 0 && block.workSeconds > 0);
}

export function structuredWorkoutFromItem(item = {}) {
  if (!item || typeof item !== 'object') return null;
  return normalizeStructuredWorkout(item.structuredWorkout || item.templateSnapshot?.structuredWorkout);
}

export function compactDurationText(seconds) {
  const total = parseNonNegativeInteger(seconds);
  if (!total) return '0';
  if (total < 60) return String(total);
  const minutes = Math.floor(total / 60);
  const restSeconds = total % 60;
  return restSeconds ? `${minutes}:${String(restSeconds).padStart(2, '0')}` : `${minutes} min`;
}

export function structuredWorkoutCompactText(structuredWorkout) {
  const blocks = structuredWorkoutIntervalBlocks(structuredWorkout);
  if (!blocks.length) return '';
  return blocks.map(block => {
    const rest = block.restSeconds ? `/${compactDurationText(block.restSeconds)}` : '';
    return `${block.repetitions} x ${compactDurationText(block.workSeconds)}${rest}`;
  }).join(' + ');
}

export function structuredWorkoutBreakdown(structuredWorkout) {
  const workout = normalizeStructuredWorkout(structuredWorkout);
  if (!workout) return null;
  const interval = structuredWorkoutIntervalBlocks(workout)[0] || null;
  const restType = interval?.restType ? restTypeLabel(interval.restType) : '';
  const intensity = interval?.intensity ? structuredIntensityLabel(interval.intensity) : '';
  return {
    compact: structuredWorkoutCompactText(workout),
    warmupSeconds: structuredWorkoutWarmupSeconds(workout),
    workSeconds: structuredWorkoutWorkSeconds(workout),
    restSeconds: structuredWorkoutRestSeconds(workout),
    cooldownSeconds: structuredWorkoutCooldownSeconds(workout),
    totalSeconds: structuredWorkoutTotalSeconds(workout),
    restType,
    intensity,
    note: workout.note || interval?.note || ''
  };
}

export function structuredWorkoutSummary(structuredWorkout) {
  const breakdown = structuredWorkoutBreakdown(structuredWorkout);
  if (!breakdown) return '';
  const parts = [];
  if (breakdown.compact) parts.push(breakdown.compact);
  if (breakdown.warmupSeconds) parts.push(`oppvarming ${formatDurationWords(breakdown.warmupSeconds)}`);
  if (breakdown.workSeconds) parts.push(`arbeid ${formatDuration(breakdown.workSeconds)}`);
  if (breakdown.restSeconds) parts.push(`hvile ${formatDuration(breakdown.restSeconds)}`);
  if (breakdown.cooldownSeconds) parts.push(`nedjogg ${formatDurationWords(breakdown.cooldownSeconds)}`);
  if (breakdown.totalSeconds) parts.push(`totalt ${formatDuration(breakdown.totalSeconds)}`);
  if (breakdown.restType) parts.push(`hviletype ${breakdown.restType.toLowerCase()}`);
  if (breakdown.intensity) parts.push(`intensitet ${breakdown.intensity.toLowerCase()}`);
  if (breakdown.note) parts.push(breakdown.note);
  return parts.join(' · ');
}

export function structuredIntervalInsights(completedItems = [], todayIso = dateToISO(new Date())) {
  const startIso = addDays(todayIso, -27);
  const items = Array.isArray(completedItems) ? completedItems : [];
  const structuredItems = items
    .filter(item => item?.date >= startIso && item?.date <= todayIso)
    .map(item => ({
      ...item,
      structuredWorkout: structuredWorkoutFromItem(item)
    }))
    .filter(item => hasStructuredIntervals(item.structuredWorkout))
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

  const totalWorkSeconds = structuredItems.reduce((sum, item) => sum + structuredWorkoutWorkSeconds(item.structuredWorkout), 0);
  const totalRestSeconds = structuredItems.reduce((sum, item) => sum + structuredWorkoutRestSeconds(item.structuredWorkout), 0);
  const latest = structuredItems[0] || null;

  return {
    count: structuredItems.length,
    totalWorkSeconds,
    totalRestSeconds,
    latest: latest ? {
      date: latest.date || '',
      name: latest.name || latest.templateSnapshot?.name || 'Strukturert intervall',
      summary: structuredWorkoutSummary(latest.structuredWorkout)
    } : null
  };
}

export function structuredIntervalContext(completedItems = [], todayIso = dateToISO(new Date())) {
  const items = Array.isArray(completedItems) ? completedItems : [];
  const structuredItems = items
    .filter(item => item?.date && item.date <= todayIso)
    .map(item => ({
      ...item,
      structuredWorkout: structuredWorkoutFromItem(item)
    }))
    .filter(item => hasStructuredIntervals(item.structuredWorkout))
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

  const summarizeWindow = (days) => {
    const startIso = addDays(todayIso, -(days - 1));
    const inRange = structuredItems.filter(item => item.date >= startIso && item.date <= todayIso);
    return {
      days,
      count: inRange.length,
      totalWorkSeconds: inRange.reduce((sum, item) => sum + structuredWorkoutWorkSeconds(item.structuredWorkout), 0),
      totalRestSeconds: inRange.reduce((sum, item) => sum + structuredWorkoutRestSeconds(item.structuredWorkout), 0)
    };
  };

  const closeWindowStartIso = addDays(todayIso, -13);
  const datesAsc = [...new Set(
    structuredItems
      .filter(item => item.date >= closeWindowStartIso && item.date <= todayIso)
      .map(item => item.date)
  )].sort();
  const closeQualityDays = datesAsc.some((date, index) => {
    if (index === 0) return false;
    const previous = datesAsc[index - 1];
    const diff = (new Date(`${date}T12:00:00`) - new Date(`${previous}T12:00:00`)) / 86400000;
    return diff <= 2;
  });
  const latest = structuredItems[0] || null;

  return {
    last7: summarizeWindow(7),
    last14: summarizeWindow(14),
    last28: summarizeWindow(28),
    latest: latest ? {
      date: latest.date,
      name: latest.name || latest.templateSnapshot?.name || 'Strukturert intervall',
      summary: structuredWorkoutSummary(latest.structuredWorkout)
    } : null,
    closeQualityDays
  };
}

export function formatDurationWords(seconds) {
  const total = parseNonNegativeInteger(seconds);
  if (!total) return '';
  const minutes = Math.floor(total / 60);
  const remainingSeconds = total % 60;
  if (minutes && remainingSeconds) return `${minutes} min ${remainingSeconds} sek`;
  if (minutes) return `${minutes} min`;
  return `${remainingSeconds} sek`;
}

export function restTypeLabel(value) {
  return {
    float: 'Flyt',
    jog: 'Jogg',
    walk: 'Gange',
    standing: 'Stående',
    passive: 'Passiv'
  }[value] || value || 'Hvile';
}

export function structuredIntensityLabel(value) {
  return {
    easy: 'Rolig',
    threshold: 'Terskel',
    vo2: 'VO2 maks',
    hard: 'Hard',
    sprint: 'Sprint'
  }[value] || value || '';
}

export function normalizeTemplate(template = {}) {
  const source = template && typeof template === 'object' && !Array.isArray(template) ? template : {};
  return {
    ...source,
    id: String(source.id || ''),
    name: String(source.name || 'Uten navn'),
    type: String(source.type || 'Annet'),
    intensity: String(source.intensity || ''),
    role: String(source.role || ''),
    purpose: String(source.purpose || ''),
    load: String(source.load || ''),
    recommendedWhen: asArray(source.recommendedWhen),
    avoidWhen: asArray(source.avoidWhen),
    structure: String(source.structure || ''),
    structuredWorkout: normalizeStructuredWorkout(source.structuredWorkout)
  };
}

export function parseNonNegativeInteger(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function formatDuration(totalSeconds) {
  const secondsTotal = parseNonNegativeInteger(totalSeconds);
  if (!secondsTotal) return '';
  const hours = Math.floor(secondsTotal / 3600);
  const minutes = Math.floor((secondsTotal % 3600) / 60);
  const seconds = secondsTotal % 60;
  if (hours) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatPace(secondsPerKm) {
  const secondsTotal = parseNonNegativeInteger(secondsPerKm);
  if (!secondsTotal) return '';
  const minutes = Math.floor(secondsTotal / 60);
  const seconds = secondsTotal % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function calculatePaceMetrics(durationSeconds, distanceKm) {
  const seconds = parseNonNegativeInteger(durationSeconds);
  const distance = Number(String(distanceKm || '').replace(',', '.'));
  if (!seconds || !Number.isFinite(distance) || distance <= 0) {
    return { averageSpeedKmh: '', paceSecondsPerKm: '', paceDisplay: '' };
  }
  const averageSpeedKmh = distance / (seconds / 3600);
  const paceSecondsPerKm = Math.round(seconds / distance);
  return {
    averageSpeedKmh: averageSpeedKmh.toFixed(1),
    paceSecondsPerKm,
    paceDisplay: formatPace(paceSecondsPerKm)
  };
}

export function completedDurationSeconds(completed = {}) {
  if (completed.durationSeconds) return Number(completed.durationSeconds) || 0;
  if (completed.durationMinutes) return (Number(completed.durationMinutes) || 0) * 60;
  return 0;
}

export function formatClockDuration(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainingSeconds = total % 60;
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

export function challengeValueLabel(value, metric) {
  const number = Number(value) || 0;
  if (metric === 'hours') return `${number.toLocaleString('no-NO', { maximumFractionDigits: number < 10 ? 1 : 0 })} t`;
  if (metric === 'km') return formatKm(number);
  return `${Math.round(number)} økt${Math.round(number) === 1 ? '' : 'er'}`;
}

export function challengeRemainingLabel(progress, metric) {
  if (progress.done) return 'Mål nådd';
  return `${challengeValueLabel(progress.remaining, metric)} igjen`;
}

export function challengeProgress(challenge, completedItems = [], todayIso) {
  const items = completedItems.filter(item => {
    if (!item.date || item.date < challenge.startDate || item.date > challenge.endDate) return false;
    if (!challenge.activity || challenge.activity === 'all') return true;
    return (item.type || 'Annet') === challenge.activity;
  });
  const target = Number(challenge.target) || 0;
  let current = 0;
  if (challenge.metric === 'hours') current = items.reduce((sum, item) => sum + (Number(item.durationSeconds) || 0), 0) / 3600;
  else if (challenge.metric === 'sessions') current = items.length;
  else current = items.reduce((sum, item) => sum + (Number(item.distanceKm) || 0), 0);
  const percent = target ? Math.max(0, Math.min(100, (current / target) * 100)) : 0;
  const done = target > 0 && current >= target;
  const expired = todayIso > challenge.endDate && !done;
  const remaining = Math.max(0, target - current);
  const daysLeft = Math.max(0, Math.ceil((new Date(`${challenge.endDate}T12:00:00`) - new Date(`${todayIso}T12:00:00`)) / 86400000));
  return { current, target, remaining, percent, done, expired, daysLeft, count: items.length };
}

export function weekPlanDates(today, weekEnd, plannedThisWeek = [], blockedDays = [], count = 0) {
  const busyDates = new Set(plannedThisWeek.map(item => item.date));
  blockedDays.filter(day => day.date >= today && day.date <= weekEnd).forEach(day => busyDates.add(day.date));
  const dates = [];
  const preferredOffsets = count >= 3 ? [1, 3, 5, 2, 4, 6, 0] : count === 2 ? [1, 4, 2, 5, 3, 6, 0] : [1, 2, 3, 4, 5, 6, 0];
  preferredOffsets.forEach(offset => {
    const date = addDays(today, offset);
    if (date >= today && date <= weekEnd && !busyDates.has(date) && !dates.includes(date)) dates.push(date);
  });
  return dates.slice(0, count);
}

export function weekPlanDatesInRange(rangeStart, rangeEnd, plannedItems = [], blockedDays = [], count = 0) {
  const occupiedDates = new Set(plannedItems.map(item => item.date));
  blockedDays.filter(day => day.date >= rangeStart && day.date <= rangeEnd).forEach(day => occupiedDates.add(day.date));
  const placed = new Set(occupiedDates);

  function isAdjacentToPlaced(date) {
    return placed.has(addDays(date, -1)) || placed.has(addDays(date, 1));
  }

  const preferredOffsets = count >= 3 ? [0, 2, 4, 6, 1, 3, 5] : count === 2 ? [0, 3, 1, 4, 2, 5, 6] : [0, 1, 2, 3, 4, 5, 6];
  const dates = [];

  preferredOffsets.forEach(offset => {
    if (dates.length >= count) return;
    const date = addDays(rangeStart, offset);
    if (date >= rangeStart && date <= rangeEnd && !placed.has(date) && !isAdjacentToPlaced(date)) {
      dates.push(date);
      placed.add(date);
    }
  });

  if (dates.length < count) {
    preferredOffsets.forEach(offset => {
      if (dates.length >= count) return;
      const date = addDays(rangeStart, offset);
      if (date >= rangeStart && date <= rangeEnd && !placed.has(date)) {
        dates.push(date);
        placed.add(date);
      }
    });
  }

  return dates.slice(0, count);
}
