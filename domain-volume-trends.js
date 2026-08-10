export const VOLUME_TREND_PERIOD_COUNT = 6;

const PERIODS = {
  week: { title: 'per uke', intro: 'uker' },
  month: { title: 'per måned', intro: 'måneder' },
  year: { title: 'per år', intro: 'år' }
};

function parseIsoDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function addUtcDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function addUtcMonths(date, months) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function addUtcYears(date, years) {
  return new Date(Date.UTC(date.getUTCFullYear() + years, 0, 1));
}

function startOfPeriod(date, period) {
  if (period === 'week') {
    const mondayOffset = (date.getUTCDay() + 6) % 7;
    return addUtcDays(date, -mondayOffset);
  }
  if (period === 'month') return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  return new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
}

function shiftPeriod(date, period, amount) {
  if (period === 'week') return addUtcDays(date, amount * 7);
  if (period === 'month') return addUtcMonths(date, amount);
  return addUtcYears(date, amount);
}

function endOfPeriod(start, period) {
  return addUtcDays(shiftPeriod(start, period, 1), -1);
}

function shortMonth(date, locale) {
  return new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' })
    .format(date)
    .replace('.', '');
}

function periodLabel(start, period, locale, isCurrent) {
  if (isCurrent) return 'Nå';
  if (period === 'week') {
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' })
      .format(start)
      .replace('.', '');
  }
  if (period === 'month') return shortMonth(start, locale);
  return String(start.getUTCFullYear());
}

function rangeLabel(periods, period, locale) {
  const first = parseIsoDate(periods[0]?.start);
  const last = parseIsoDate(periods[periods.length - 1]?.end);
  if (!first || !last) return '';

  if (period === 'year') return `${first.getUTCFullYear()}–${last.getUTCFullYear()}`;
  if (period === 'month') {
    const firstLabel = shortMonth(first, locale);
    const lastLabel = shortMonth(last, locale);
    return first.getUTCFullYear() === last.getUTCFullYear()
      ? `${firstLabel}–${lastLabel} ${last.getUTCFullYear()}`
      : `${firstLabel} ${first.getUTCFullYear()}–${lastLabel} ${last.getUTCFullYear()}`;
  }

  const formatter = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  });
  return `${formatter.format(first)}–${formatter.format(last)}`;
}

export function normalizeVolumeTrendPeriod(value) {
  return Object.prototype.hasOwnProperty.call(PERIODS, value) ? value : 'week';
}

export function normalizeVolumeTrendOffset(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.trunc(number)) : 0;
}

export function shiftVolumeTrendOffset(offset, direction) {
  const normalized = normalizeVolumeTrendOffset(offset);
  if (direction === 'past') return normalized + 1;
  if (direction === 'future') return Math.max(0, normalized - 1);
  return normalized;
}

export function buildVolumeTrendWindow({ period = 'week', today, offset = 0, locale = 'nb-NO' } = {}) {
  const normalizedPeriod = normalizeVolumeTrendPeriod(period);
  const normalizedOffset = normalizeVolumeTrendOffset(offset);
  const todayDate = parseIsoDate(today);
  if (!todayDate) throw new TypeError('today must be an ISO date');

  const currentStart = startOfPeriod(todayDate, normalizedPeriod);
  const anchorStart = shiftPeriod(currentStart, normalizedPeriod, -normalizedOffset);
  const periods = [];
  for (let index = VOLUME_TREND_PERIOD_COUNT - 1; index >= 0; index -= 1) {
    const start = shiftPeriod(anchorStart, normalizedPeriod, -index);
    const end = endOfPeriod(start, normalizedPeriod);
    const isCurrent = start.getTime() === currentStart.getTime();
    periods.push({
      start: toIsoDate(start),
      end: toIsoDate(end),
      label: periodLabel(start, normalizedPeriod, locale, isCurrent),
      isCurrent
    });
  }

  return {
    period: normalizedPeriod,
    count: VOLUME_TREND_PERIOD_COUNT,
    offset: normalizedOffset,
    canMoveForward: normalizedOffset > 0,
    title: PERIODS[normalizedPeriod].title,
    intro: normalizedOffset === 0
      ? `Siste ${VOLUME_TREND_PERIOD_COUNT} ${PERIODS[normalizedPeriod].intro}`
      : `${VOLUME_TREND_PERIOD_COUNT} ${PERIODS[normalizedPeriod].intro}`,
    rangeLabel: rangeLabel(periods, normalizedPeriod, locale),
    periods
  };
}
