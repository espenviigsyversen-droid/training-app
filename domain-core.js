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
