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
    buildStructuredWorkout,
    calculatePaceMetrics,
    completedDurationSeconds,
    challengeProgress,
    challengeRemainingLabel,
    formatClockDuration,
    formatDuration,
    formatPace,
    goldenZonePercentages,
    normalizeStructuredWorkout,
    normalizeTemplate,
    parseNonNegativeInteger,
    structuredIntervalInsights,
    structuredWorkoutBreakdown,
    structuredWorkoutCompactText,
    structuredWorkoutRestSeconds,
    structuredWorkoutSummary,
    structuredWorkoutTotalSeconds,
    structuredWorkoutWorkSeconds,
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

  test('setup shows app version from app constants', () => {
    assert.ok(index.includes('id="appVersionInfo"'), 'visible app version element is missing from Setup');
    assert.ok(app.includes('const APP_CACHE_NAME = `treningsapp-${APP_VERSION}`'), 'cache display name should be derived from APP_VERSION');
    assert.ok(app.includes('Appversjon: ${APP_VERSION}'), 'visible app version should use APP_VERSION');
    assert.ok(app.includes('Cache: ${APP_CACHE_NAME}'), 'visible cache name should use APP_CACHE_NAME');
  });

  test('settings include internal structured interval feature flag', () => {
    assert.ok(app.includes('features: {'), 'settings features object is missing');
    assert.ok(app.includes('structuredIntervals: true'), 'structuredIntervals should be enabled in v103 defaults');
    assert.ok(app.includes('features: normalizeFeatures(source.features)'), 'settings should normalize feature flags');
  });

  test('calendar day modal refreshes after marking planned workout complete', () => {
    const normalCompleteFlow = app.match(/const completed = \{[\s\S]+?successMessage: 'Økt logget - bra jobba!'/)?.[0] || '';
    assert.ok(normalCompleteFlow.includes("if (item) item.status = 'done'"), 'planned workout should be marked done locally');
    assert.ok(normalCompleteFlow.includes('afterApply'), 'normal complete flow should refresh UI after local state update');
    assert.ok(normalCompleteFlow.includes('openCalendarDayModal(selectedCalendarDate)'), 'calendar day modal should be refreshed after completion');
  });

  test('duration and pace helpers come from domain core', () => {
    assert.strictEqual(parseNonNegativeInteger('12'), 12);
    assert.strictEqual(parseNonNegativeInteger('-1'), 0);
    assert.strictEqual(formatDuration(65), '1:05');
    assert.strictEqual(formatDuration(3661), '1:01:01');
    assert.strictEqual(formatPace(341), '5:41');
    assert.deepStrictEqual(calculatePaceMetrics(1800, '5'), {
      averageSpeedKmh: '10.0',
      paceSecondsPerKm: 360,
      paceDisplay: '6:00'
    });
    assert.deepStrictEqual(calculatePaceMetrics(0, '5'), {
      averageSpeedKmh: '',
      paceSecondsPerKm: '',
      paceDisplay: ''
    });
    assert.strictEqual(completedDurationSeconds({ durationSeconds: 2700 }), 2700);
    assert.strictEqual(completedDurationSeconds({ durationMinutes: 45 }), 2700);
    assert.strictEqual(formatClockDuration(3661), '1:01:01');
  });

  test('old templates normalize safely for future structured intervals', () => {
    const template = normalizeTemplate({
      id: 'legacy-1',
      name: 'Legacy terskel',
      type: 'Løping',
      intensity: 'Terskel',
      recommendedWhen: 'normal',
      avoidWhen: null,
      structure: '10 min oppvarming'
    });
    assert.strictEqual(template.id, 'legacy-1');
    assert.strictEqual(template.name, 'Legacy terskel');
    assert.strictEqual(template.type, 'Løping');
    assert.strictEqual(template.intensity, 'Terskel');
    assert.deepStrictEqual(template.recommendedWhen, ['normal']);
    assert.deepStrictEqual(template.avoidWhen, []);
    assert.strictEqual(template.structure, '10 min oppvarming');
    assert.strictEqual(template.structuredWorkout, null);
  });

  test('template normalizer supplies safe defaults and structured workout shape', () => {
    const template = normalizeTemplate({
      id: 123,
      recommendedWhen: ['normal', '', 'tired'],
      avoidWhen: 'pain',
      structuredWorkout: {
        version: 1,
        blocks: [
          { type: 'warmup', durationSeconds: 600 },
          null,
          { type: 'interval', repetitions: 20, workSeconds: 45, restSeconds: 15, restType: 'float', intensity: 'threshold' }
        ]
      }
    });
    assert.strictEqual(template.id, '123');
    assert.strictEqual(template.name, 'Uten navn');
    assert.strictEqual(template.type, 'Annet');
    assert.strictEqual(template.intensity, '');
    assert.strictEqual(template.role, '');
    assert.strictEqual(template.purpose, '');
    assert.strictEqual(template.load, '');
    assert.deepStrictEqual(template.recommendedWhen, ['normal', 'tired']);
    assert.deepStrictEqual(template.avoidWhen, ['pain']);
    assert.strictEqual(template.structure, '');
    assert.deepStrictEqual(template.structuredWorkout, {
      version: 1,
      blocks: [
        { type: 'warmup', durationSeconds: 600, note: '' },
        { type: 'interval', repetitions: 20, workSeconds: 45, restSeconds: 15, restType: 'float', intensity: 'threshold', note: '' }
      ],
      note: ''
    });
    assert.strictEqual(normalizeStructuredWorkout({ version: 1, blocks: [] }), null);
  });

  test('structured interval UI fields and summaries are wired into production files', () => {
    assert.ok(index.includes('id="templateStructuredEnabled"'), 'structured interval toggle is missing');
    assert.ok(index.includes('id="templateIntervalRepetitions"'), 'structured interval repetitions field is missing');
    assert.ok(index.includes('id="templateWorkSeconds"'), 'structured interval work seconds field is missing');
    assert.ok(app.includes('structuredWorkoutFromForm'), 'structured interval form wrapper is missing');
    assert.ok(app.includes('structuredWorkoutSummaryHtml(t.structuredWorkout)'), 'structured interval summary is not rendered for templates/planned workouts');
    assert.ok(app.includes("structuredWorkout: template?.structuredWorkout || null"), 'completed template snapshot should preserve structuredWorkout');
    assert.ok(index.includes('id="insightStructuredIntervalsCard"'), 'structured interval insight card is missing');
  });

  test('empty or invalid structured workouts fall back safely', () => {
    assert.strictEqual(normalizeStructuredWorkout(null), null);
    assert.strictEqual(normalizeStructuredWorkout({ version: 1, blocks: [] }), null);
    assert.strictEqual(normalizeStructuredWorkout({ version: 1, blocks: [{ type: 'interval', repetitions: 0, workSeconds: 45 }] }), null);
    assert.strictEqual(buildStructuredWorkout({ warmupMinutes: 0, repetitions: 0, workSeconds: 0 }), null);
    assert.strictEqual(structuredWorkoutSummary(null), '');
    assert.strictEqual(structuredWorkoutCompactText(null), '');
    assert.strictEqual(structuredWorkoutBreakdown(null), null);
  });

  test('20 x 45/15 structured interval calculates work and rest time', () => {
    const workout = buildStructuredWorkout({
      repetitions: 20,
      workSeconds: 45,
      restSeconds: 15,
      restType: 'float',
      intensity: 'threshold'
    });
    assert.strictEqual(structuredWorkoutCompactText(workout), '20 x 45/15');
    assert.strictEqual(structuredWorkoutWorkSeconds(workout), 900);
    assert.strictEqual(structuredWorkoutRestSeconds(workout), 300);
    assert.strictEqual(structuredWorkoutTotalSeconds(workout), 1200);
  });

  test('warmup interval cooldown total and formatting are readable', () => {
    const workout = buildStructuredWorkout({
      warmupMinutes: 15,
      repetitions: 20,
      workSeconds: 45,
      restSeconds: 15,
      restType: 'float',
      intensity: 'threshold',
      cooldownMinutes: 10,
      note: 'Hold kontroll'
    });
    assert.strictEqual(structuredWorkoutTotalSeconds(workout), 2700);
    assert.deepStrictEqual(structuredWorkoutBreakdown(workout), {
      compact: '20 x 45/15',
      warmupSeconds: 900,
      workSeconds: 900,
      restSeconds: 300,
      cooldownSeconds: 600,
      totalSeconds: 2700,
      restType: 'Flyt',
      intensity: 'Terskel',
      note: 'Hold kontroll'
    });
    const summary = structuredWorkoutSummary(workout);
    assert.ok(summary.includes('20 x 45/15'), summary);
    assert.ok(summary.includes('oppvarming 15 min'), summary);
    assert.ok(summary.includes('arbeid 15:00'), summary);
    assert.ok(summary.includes('hvile 5:00'), summary);
    assert.ok(summary.includes('nedjogg 10 min'), summary);
    assert.ok(summary.includes('totalt 45:00'), summary);
    assert.ok(summary.includes('hviletype flyt'), summary);
    assert.ok(summary.includes('intensitet terskel'), summary);
    assert.ok(summary.includes('Hold kontroll'), summary);
  });

  test('structured interval insight summarizes last 28 days', () => {
    const structuredWorkout = buildStructuredWorkout({
      warmupMinutes: 15,
      repetitions: 20,
      workSeconds: 45,
      restSeconds: 15,
      cooldownMinutes: 10
    });
    const insight = structuredIntervalInsights([
      { date: '2026-04-20', name: 'For gammel', structuredWorkout },
      { date: '2026-05-05', name: '45/15 terskel', structuredWorkout },
      { date: '2026-05-12', templateSnapshot: { name: 'Snapshot 45/15', structuredWorkout } },
      { date: '2026-05-13', name: 'Rolig tur' }
    ], '2026-05-24');
    assert.strictEqual(insight.count, 2);
    assert.strictEqual(insight.totalWorkSeconds, 1800);
    assert.strictEqual(insight.totalRestSeconds, 600);
    assert.strictEqual(insight.latest.date, '2026-05-12');
    assert.strictEqual(insight.latest.name, 'Snapshot 45/15');
    assert.ok(insight.latest.summary.includes('20 x 45/15'), insight.latest.summary);
  });

  test('backup import and local snapshot normalize without losing structuredWorkout', () => {
    assert.ok(app.includes('const nextState = normalizeAppState(imported)'), 'backup import should normalize app state');
    assert.ok(app.includes('state = normalizeAppState(snapshot.state)'), 'local snapshot should normalize app state');
    assert.ok(app.includes('state.templates = normalizeTemplates(state.templates)'), 'render should normalize templates before use');
    const importedTemplate = normalizeTemplate({
      id: 'structured-1',
      name: '45/15 terskel',
      structuredWorkout: buildStructuredWorkout({
        warmupMinutes: 15,
        repetitions: 20,
        workSeconds: 45,
        restSeconds: 15,
        cooldownMinutes: 10
      })
    });
    assert.strictEqual(importedTemplate.structuredWorkout.blocks.length, 3);
    assert.strictEqual(structuredWorkoutTotalSeconds(importedTemplate.structuredWorkout), 2700);
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
