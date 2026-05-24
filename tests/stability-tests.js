const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const app = read('app.js');
const index = read('index.html');
const serviceWorker = read('service-worker.js');

function addDays(dateIso, days) {
  const d = new Date(`${dateIso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatKm(km) {
  const value = Number(km) || 0;
  return `${value.toLocaleString('no-NO', { maximumFractionDigits: value < 10 ? 1 : 0 })} km`;
}

function challengeValueLabel(value, metric) {
  const number = Number(value) || 0;
  if (metric === 'hours') return `${number.toLocaleString('no-NO', { maximumFractionDigits: number < 10 ? 1 : 0 })} t`;
  if (metric === 'km') return formatKm(number);
  return `${Math.round(number)} økt${Math.round(number) === 1 ? '' : 'er'}`;
}

function challengeRemainingLabel(progress, metric) {
  if (progress.done) return 'Mål nådd';
  return `${challengeValueLabel(progress.remaining, metric)} igjen`;
}

function challengeProgressForTest(challenge, completed, today = '2026-05-24') {
  const items = completed.filter(item => {
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
  const expired = today > challenge.endDate && !done;
  const remaining = Math.max(0, target - current);
  const daysLeft = Math.max(0, Math.ceil((new Date(`${challenge.endDate}T12:00:00`) - new Date(`${today}T12:00:00`)) / 86400000));
  return { current, target, remaining, percent, done, expired, daysLeft, count: items.length };
}

function assessTrafficLightForTest(sleep, energy, restingHR, stairsOk, baseline = null) {
  if (stairsOk === false) return 'red';
  const avg = (sleep + energy) / 2;
  const hrDelta = (restingHR && baseline) ? Number(restingHR) - Number(baseline) : 0;
  if (avg <= 2 || hrDelta >= 10) return 'red';
  if (avg <= 3.5 || hrDelta >= 5) return 'yellow';
  return 'green';
}

function goldenZonePercentagesForTest(level) {
  if (level === 'experienced') return { lowPct: 0.80, highPct: 0.87 };
  if (level === 'intermediate') return { lowPct: 0.78, highPct: 0.85 };
  return { lowPct: 0.77, highPct: 0.84 };
}

function weekPlanDatesForTest(today, weekEnd, plannedThisWeek, blockedDays, count) {
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

function weekPlanDatesInRangeForTest(rangeStart, rangeEnd, plannedItems, blockedDays, count) {
  const occupiedDates = new Set(plannedItems.map(item => item.date));
  blockedDays.filter(day => day.date >= rangeStart && day.date <= rangeEnd).forEach(day => occupiedDates.add(day.date));
  const placed = new Set(occupiedDates);
  const isAdjacentToPlaced = date => placed.has(addDays(date, -1)) || placed.has(addDays(date, 1));
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

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (err) {
    console.error(`not ok - ${name}`);
    console.error(err.message);
    process.exitCode = 1;
  }
}

test('app version matches service worker cache version', () => {
  const appVersion = app.match(/APP_VERSION\s*=\s*'([^']+)'/)?.[1];
  const cacheVersion = serviceWorker.match(/CACHE_NAME\s*=\s*"treningsapp-([^"]+)"/)?.[1];
  assert.ok(appVersion, 'APP_VERSION was not found in app.js');
  assert.ok(cacheVersion, 'CACHE_NAME was not found in service-worker.js');
  assert.strictEqual(appVersion, cacheVersion);
});

test('all user data collections are included in replacement import', () => {
  const collections = app.match(/DATA_COLLECTIONS\s*=\s*\[([^\]]+)\]/)?.[1] || '';
  ['templates', 'planned', 'completed', 'wellness', 'challenges', 'blockedDays'].forEach(collection => {
    assert.ok(collections.includes(`'${collection}'`), `${collection} is missing from DATA_COLLECTIONS`);
  });
  assert.ok(app.includes('replaceFirestoreData(nextState)'), 'import does not call replaceFirestoreData(nextState)');
  assert.ok(app.includes('deleteOps'), 'replaceFirestoreData should delete existing docs before importing');
});

test('safe write wrapper is present and used by high-risk flows', () => {
  assert.ok(app.includes('async function safeStateWrite'), 'safeStateWrite is missing');
  const usageCount = (app.match(/safeStateWrite\(/g) || []).length;
  assert.ok(usageCount >= 10, `expected safeStateWrite to be used broadly, found ${usageCount}`);
});

test('local recovery snapshot can be saved and restored from UI', () => {
  assert.ok(app.includes('saveRecoverySnapshot'), 'saveRecoverySnapshot is missing');
  assert.ok(app.includes('restoreRecoverySnapshot'), 'restoreRecoverySnapshot is missing');
  assert.ok(index.includes('restoreRecoverySnapshot()'), 'recovery restore button is missing from index.html');
});

test('service worker caches required app shell files', () => {
  ['./index.html', './styles.css', './app.js', './manifest.json'].forEach(file => {
    assert.ok(serviceWorker.includes(file), `${file} is missing from service worker app shell`);
  });
});

test('challenge progress shows remaining distance', () => {
  const progress = challengeProgressForTest(
    { target: 80, metric: 'km', activity: 'all', startDate: '2026-05-01', endDate: '2026-05-31' },
    [
      { date: '2026-05-02', distanceKm: 20, type: 'Løping' },
      { date: '2026-05-10', distanceKm: 42, type: 'Løping' }
    ],
    '2026-05-20'
  );
  assert.strictEqual(progress.current, 62);
  assert.strictEqual(progress.remaining, 18);
  assert.strictEqual(challengeRemainingLabel(progress, 'km'), '18 km igjen');
});

test('challenge progress caps percent and says goal reached', () => {
  const progress = challengeProgressForTest(
    { target: 3, metric: 'sessions', activity: 'all', startDate: '2026-05-01', endDate: '2026-05-31' },
    [
      { date: '2026-05-02' },
      { date: '2026-05-10' },
      { date: '2026-05-12' },
      { date: '2026-05-18' }
    ]
  );
  assert.strictEqual(progress.percent, 100);
  assert.strictEqual(progress.done, true);
  assert.strictEqual(challengeRemainingLabel(progress, 'sessions'), 'Mål nådd');
});

test('traffic light follows red/yellow/green rules', () => {
  assert.strictEqual(assessTrafficLightForTest(5, 5, null, true), 'green');
  assert.strictEqual(assessTrafficLightForTest(3, 4, null, true), 'yellow');
  assert.strictEqual(assessTrafficLightForTest(2, 2, null, true), 'red');
  assert.strictEqual(assessTrafficLightForTest(5, 5, null, false), 'red');
  assert.strictEqual(assessTrafficLightForTest(5, 5, 67, true, 60), 'yellow');
  assert.strictEqual(assessTrafficLightForTest(5, 5, 71, true, 60), 'red');
});

test('golden zone percentages match training levels', () => {
  assert.deepStrictEqual(goldenZonePercentagesForTest('experienced'), { lowPct: 0.80, highPct: 0.87 });
  assert.deepStrictEqual(goldenZonePercentagesForTest('intermediate'), { lowPct: 0.78, highPct: 0.85 });
  assert.deepStrictEqual(goldenZonePercentagesForTest('beginner'), { lowPct: 0.77, highPct: 0.84 });
});

test('week plan dates skip planned and blocked dates', () => {
  const dates = weekPlanDatesForTest(
    '2026-05-18',
    '2026-05-24',
    [{ date: '2026-05-19' }],
    [{ date: '2026-05-21' }],
    3
  );
  assert.deepStrictEqual(dates, ['2026-05-23', '2026-05-20', '2026-05-22']);
  assert.ok(!dates.includes('2026-05-19'));
  assert.ok(!dates.includes('2026-05-21'));
});

test('next week plan dates prefer non-consecutive days and skip blocked days', () => {
  const dates = weekPlanDatesInRangeForTest(
    '2026-05-25',
    '2026-05-31',
    [{ date: '2026-05-27' }],
    [{ date: '2026-05-29' }],
    2
  );
  assert.deepStrictEqual(dates, ['2026-05-25', '2026-05-31']);
  assert.ok(!dates.includes('2026-05-27'));
  assert.ok(!dates.includes('2026-05-29'));
});

if (process.exitCode) process.exit(process.exitCode);
