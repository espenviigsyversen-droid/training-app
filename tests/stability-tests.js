const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { pathToFileURL } = require('url');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const app = read('app.js');
const index = read('index.html');
const serviceWorker = read('service-worker.js');

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

(async () => {
  const domain = await import(pathToFileURL(path.join(root, 'domain-core.js')).href);
  const {
    assessTrafficLight,
    challengeProgress,
    challengeRemainingLabel,
    goldenZonePercentages,
    weekPlanDates,
    weekPlanDatesInRange
  } = domain;

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
    ['./index.html', './styles.css', './app.js', './domain-core.js', './manifest.json'].forEach(file => {
      assert.ok(serviceWorker.includes(file), `${file} is missing from service worker app shell`);
    });
  });

  test('challenge progress shows remaining distance', () => {
    const progress = challengeProgress(
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
    const progress = challengeProgress(
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
    assert.strictEqual(assessTrafficLight(5, 5, null, true), 'green');
    assert.strictEqual(assessTrafficLight(3, 4, null, true), 'yellow');
    assert.strictEqual(assessTrafficLight(2, 2, null, true), 'red');
    assert.strictEqual(assessTrafficLight(5, 5, null, false), 'red');
    assert.strictEqual(assessTrafficLight(5, 5, 67, true, 60), 'yellow');
    assert.strictEqual(assessTrafficLight(5, 5, 71, true, 60), 'red');
  });

  test('golden zone percentages match training levels', () => {
    assert.deepStrictEqual(goldenZonePercentages('experienced'), { lowPct: 0.80, highPct: 0.87 });
    assert.deepStrictEqual(goldenZonePercentages('intermediate'), { lowPct: 0.78, highPct: 0.85 });
    assert.deepStrictEqual(goldenZonePercentages('beginner'), { lowPct: 0.77, highPct: 0.84 });
  });

  test('week plan dates skip planned and blocked dates', () => {
    const dates = weekPlanDates(
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
    const dates = weekPlanDatesInRange(
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
})().catch(err => {
  console.error(err);
  process.exit(1);
});
