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
    formatRaceTime,
    goldenZonePercentages,
    hasStructuredIntervals,
    injuryAdjustedWorkoutAdvice,
    injurySignalSummary,
    combinedRaceResults,
    normalizeRaceGoal,
    normalizeRaceResult,
    normalizeRaceResultEntry,
    normalizeRaceResultEntries,
    normalizeStructuredWorkout,
    normalizeTemplate,
    parseNonNegativeInteger,
    parseRaceTimeToSeconds,
    personalBestSummary,
    raceHistoryForDistance,
    raceDistanceLabel,
    raceGoalCountdown,
    raceGoalPlan,
    raceReadinessSummary,
    structuredIntervalContext,
    structuredIntervalInsights,
    structuredWorkoutBreakdown,
    structuredWorkoutCompactText,
    structuredWorkoutRestSeconds,
    structuredWorkoutSummary,
    structuredWorkoutTotalSeconds,
    structuredWorkoutWorkSeconds,
    todayDecision,
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
    ['templates', 'planned', 'completed', 'wellness', 'challenges', 'blockedDays', 'raceResults'].forEach(collection => {
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

  test('dashboard renders today decision from domain logic', () => {
    assert.ok(index.includes('id="homeDecision"'), 'dashboard should include visible today decision element');
    assert.ok(app.includes('renderTodayDecision(buildTodayDecision(coachCtx, primaryItems, todayItems))'), 'dashboard should render today decision from coach context');
    assert.ok(app.includes('todayDecision({'), 'app wrapper should call the domain todayDecision function');
  });

  test('daily injury check-in is preserved and used by coach context', () => {
    const styles = read('styles.css');
    assert.ok(app.includes('injuryCheckin'), 'daily readiness should support injury check-ins');
    assert.ok(app.includes('function renderInjuryCheckinBlock'), 'traffic light should render injury follow-up when relevant');
    assert.ok(app.includes('window.saveInjuryCheckin'), 'injury check-in save handler is missing');
    assert.ok(app.includes('let injuryCheckinExpanded = false'), 'injury check-in should start collapsed on dashboard');
    assert.ok(app.includes('class="injury-checkin-compact"'), 'saved injury check-in should render compact summary by default');
    assert.ok(app.includes('window.expandInjuryCheckin'), 'compact injury check-in should be expandable');
    assert.ok(app.includes('injuryCheckinExpanded = false;'), 'saving or clearing injury check-in should collapse the form');
    assert.ok(app.includes('const hasTrafficResult = Boolean(readiness?.level && TRAFFIC_LIGHT_CONFIG[readiness.level])'), 'traffic light result should require a valid readiness level');
    assert.ok(app.includes('pruned[today] = { ...(existing[today] || {}), ...data };'), 'saving traffic light should preserve injury check-in for the same date');
    assert.ok(app.includes('[readiness.date]: { ...(state.settings.dailyReadiness?.[readiness.date] || {}), ...readiness }'), 'submitting traffic light should preserve same-day injury check-in');
    assert.ok(app.includes('dailyInjuryAsCompletedItems(today, 14)'), 'coach context should convert daily injury check-ins to signal items');
    assert.ok(app.includes('gradedPainContext(completedAndDailySignals, today)'), 'coach pain context should include daily injury check-ins');
    assert.ok(app.includes('Smerteoppfølging:'), 'coach basis should mention injury follow-up trend');
    assert.ok(app.includes('function improvingPainFollowup'), 'coach context should detect improving pain follow-up');
    assert.ok(app.includes('painImprovingAfterHigh: Boolean(painImproving)'), 'today decision should receive improving pain follow-up');
    assert.ok(index.includes('id="insightInjurySignalCard"'), 'insight injury signal card is missing');
    assert.ok(index.includes('id="homeInjuryWorkoutAdvice"'), 'dashboard injury workout advice container is missing');
    assert.ok(app.includes('renderInjurySignalInsight(today)'), 'insights should render injury signal summary');
    assert.ok(app.includes('injurySignalSummary(injurySignalEntriesUntil(today, 7))'), 'injury signal insight should use domain summary');
    assert.ok(app.includes('renderInjuryWorkoutAdvice(buildInjuryWorkoutAdvice(coachCtx, primaryItems))'), 'dashboard should render injury-adjusted workout advice');
    assert.ok(app.includes('injuryAdjustedWorkoutAdvice(summary, plannedWorkoutAdviceMeta(firstPlanned))'), 'app should use domain injury-adjusted workout advice');
    assert.ok(styles.includes('.injury-checkin-compact'), 'compact injury check-in styling is missing');
    assert.ok(styles.includes('.injury-checkin-card'), 'injury check-in card styling is missing');
    assert.ok(styles.includes('.injury-signal-card'), 'injury signal insight styling is missing');
    assert.ok(styles.includes('.injury-workout-advice'), 'injury workout advice styling is missing');
  });

  test('settings include internal structured interval feature flag', () => {
    assert.ok(app.includes('features: {'), 'settings features object is missing');
    assert.ok(app.includes('structuredIntervals: true'), 'structuredIntervals should be enabled in defaults');
    assert.ok(app.includes('features: normalizeFeatures(source.features)'), 'settings should normalize feature flags');
  });

  test('race role and purpose are available as first-class template metadata', () => {
    assert.ok(index.includes('<option value="race">Konkurranse / race</option>'), 'race role option is missing');
    assert.ok(index.includes('<option value="race">Konkurranse / testløp</option>'), 'race purpose option is missing');
    assert.ok(app.includes("race: 'Konkurranse / race'"), 'race role label is missing');
    assert.ok(app.includes("race: 'Konkurranse / testløp'"), 'race purpose label is missing');
    assert.ok(app.includes("name: '2 km race / testløp'"), '2 km race standard template is missing');
    assert.ok(app.includes("template.role === 'race'"), 'race role should count as hard workout');
    assert.ok(app.includes("template.purpose === 'race'"), 'race purpose should count as hard workout');
    assert.ok(app.includes("role === 'race' || purpose === 'race'"), 'race should not be treated as restorative');
  });

  test('race result UI and settings are wired into production files', () => {
    assert.ok(index.includes('id="completeRaceName"'), 'race result name field is missing');
    assert.ok(index.includes('id="completeRaceHours"'), 'race result hours field is missing');
    assert.ok(index.includes('id="completeRaceMinutes"'), 'race result minutes field is missing');
    assert.ok(index.includes('id="completeRaceSeconds"'), 'race result seconds field is missing');
    assert.ok(index.includes('id="insightPersonalBests"'), 'personal best insight element is missing');
    assert.ok(index.includes('id="setupRaceGoal"'), 'race goal setup section is missing');
    assert.ok(index.includes('id="raceGoalTargetHours"'), 'race goal target hours field is missing');
    assert.ok(index.includes('id="raceGoalTargetMinutes"'), 'race goal target minutes field is missing');
    assert.ok(index.includes('id="raceGoalTargetSeconds"'), 'race goal target seconds field is missing');
    assert.ok(index.includes('id="manualRaceDistance"'), 'manual race result distance field is missing');
    assert.ok(index.includes('id="manualRaceResultList"'), 'manual race result list is missing');
    assert.ok(app.includes('raceResult: normalizeRaceResult'), 'completed items should normalize raceResult');
    assert.ok(app.includes('raceResults: normalizeRaceResultEntries(input.raceResults)'), 'app state should normalize manual race results');
    assert.ok(app.includes("fsSet('raceResults'"), 'manual race results should be written to Firestore');
    assert.ok(app.includes("fsDelete('raceResults'"), 'manual race results should be deletable from Firestore');
    assert.ok(app.includes('personalBestSummary(items, state.raceResults)'), 'personal bests should include manual race results');
    assert.ok(app.includes('state.settings.raceGoal = normalizeRaceGoal'), 'race goal should be saved through normalized settings');
    assert.ok(app.includes('renderRaceInsights(today)'), 'insights should render race insights');
    assert.ok(app.includes('raceReadinessSummary(state.settings.raceGoal'), 'race goal insight should render race readiness');
    assert.ok(app.includes('raceGoalPlan('), 'race goal insight should render race plan');
    assert.ok(read('styles.css').includes('.race-plan'), 'race plan styles are missing');
  });

  test('personal best history modal is wired into production files', () => {
    const styles = read('styles.css');
    assert.ok(index.includes('id="personalBestHistoryModal"'), 'PB history modal is missing');
    assert.ok(index.includes('id="personalBestHistoryContent"'), 'PB history content container is missing');
    assert.ok(app.includes('openPersonalBestHistory'), 'PB cards should open history modal');
    assert.ok(app.includes('raceHistoryForDistance(completedRaceItems(), state.raceResults'), 'PB history should use combined production race data');
    assert.ok(app.includes('personalBestHistoryChart'), 'PB history chart renderer is missing');
    assert.ok(styles.includes('.pb-history-chart'), 'PB history chart styles are missing');
    assert.ok(styles.includes('.pb-history-row.best'), 'PB best row style is missing');
  });

  test('mobile race forms avoid horizontal overflow patterns', () => {
    const styles = read('styles.css');
    assert.ok(styles.includes('overflow-x: hidden'), 'styles should guard against horizontal page/modal overflow');
    assert.ok(styles.includes('minmax(0, 1fr)'), 'two-column grids should allow inputs to shrink on mobile');
    assert.ok(styles.includes('.modal *'), 'modal children should be allowed to shrink inside the viewport');
    assert.ok(styles.includes('#workoutDetailContent .tag'), 'workout detail tags should be constrained inside the modal');
    assert.ok(styles.includes('.modal .grid-2'), 'modal two-column fields should collapse on small screens');
    assert.ok(styles.includes('.setup-section .grid-2'), 'setup two-column fields should collapse on small screens');
    assert.ok(index.includes('id="raceGoalPanel"'), 'race goal setup should use compact accordion panel');
    assert.ok(index.includes('id="manualRacePanel"'), 'manual race setup should use compact accordion panel');
    assert.ok(app.includes("document.getElementById('manualRacePanel')"), 'PB edit shortcut should open the manual race panel');
  });

  test('race time parsing and formatting supports common race inputs', () => {
    assert.strictEqual(parseRaceTimeToSeconds('8:30'), 510);
    assert.strictEqual(parseRaceTimeToSeconds('1:05:00'), 3900);
    assert.strictEqual(formatRaceTime(510), '8:30');
    assert.strictEqual(formatRaceTime(3900), '1:05:00');
  });

  test('race results normalize safely and personal bests pick fastest result', () => {
    assert.strictEqual(normalizeRaceResult(null), null);
    assert.strictEqual(raceDistanceLabel(12), '12 km');
    const race = normalizeRaceResult({
      name: 'Testløp',
      distanceKm: '2',
      resultTime: '8:30',
      course: 'Bane'
    });
    assert.strictEqual(race.resultSeconds, 510);
    assert.strictEqual(race.countsAsPersonalBest, true);

    const summary = personalBestSummary([
      { id: 'a', date: '2026-05-01', raceResult: { name: '2 km vår', distanceKm: 2, resultSeconds: 520 } },
      { id: 'b', date: '2026-06-01', raceResult: { name: '2 km sommer', distanceKm: 2, resultSeconds: 505 } },
      { id: 'c', date: '2026-06-02', raceResult: { name: 'Ikke PB', distanceKm: 2, resultSeconds: 490, countsAsPersonalBest: false } }
    ]);
    const twoKm = summary.entries.find(entry => entry.key === '2k');
    assert.strictEqual(twoKm.best.name, '2 km sommer');
    assert.strictEqual(twoKm.best.resultSeconds, 505);
  });

  test('manual race results normalize safely and count toward personal bests', () => {
    assert.strictEqual(normalizeRaceResultEntry({ distanceKm: 2 }), null);
    const manual = normalizeRaceResultEntry({
      id: 123,
      date: '2026-04-01',
      name: 'Gammel 2 km',
      distanceKm: '2',
      resultSeconds: 498,
      course: 'Bane'
    });
    assert.strictEqual(manual.id, '123');
    assert.strictEqual(manual.source, 'manual');
    assert.strictEqual(manual.resultSeconds, 498);
    assert.strictEqual(normalizeRaceResultEntries([manual, null, { distanceKm: 5 }]).length, 1);

    const combined = combinedRaceResults(
      [{ id: 'logged', date: '2026-05-01', raceResult: { name: 'Logget 2 km', distanceKm: 2, resultSeconds: 520 } }],
      [manual]
    );
    assert.strictEqual(combined.length, 2);
    const summary = personalBestSummary(
      [{ id: 'logged', date: '2026-05-01', raceResult: { name: 'Logget 2 km', distanceKm: 2, resultSeconds: 520 } }],
      [manual]
    );
    const twoKm = summary.entries.find(entry => entry.key === '2k');
    assert.strictEqual(twoKm.best.name, 'Gammel 2 km');
    assert.strictEqual(twoKm.best.source, 'manual');
  });

  test('race history for distance returns sorted results and trend', () => {
    const history = raceHistoryForDistance(
      [
        { id: 'a', date: '2026-05-01', raceResult: { name: '2 km vår', distanceKm: 2, resultSeconds: 520 } },
        { id: 'b', date: '2026-06-01', raceResult: { name: '2 km sommer', distanceKm: 2, resultSeconds: 505 } }
      ],
      [
        { id: 'manual', date: '2026-04-01', name: 'Gammel 2 km', distanceKm: 2, resultSeconds: 530 }
      ],
      2
    );
    assert.strictEqual(history.label, '2 km');
    assert.strictEqual(history.results.length, 3);
    assert.strictEqual(history.results[0].name, 'Gammel 2 km');
    assert.strictEqual(history.latest.name, '2 km sommer');
    assert.strictEqual(history.best.name, '2 km sommer');
    assert.strictEqual(history.trendSeconds, -25);
  });

  test('race goal countdown supports 12 km target race', () => {
    const goal = normalizeRaceGoal({
      name: 'Halv-Birken',
      date: '2027-06-08',
      distanceKm: '12',
      targetTime: '1:05:00'
    });
    const countdown = raceGoalCountdown(goal, '2027-06-01');
    assert.strictEqual(countdown.name, 'Halv-Birken');
    assert.strictEqual(countdown.distanceKm, 12);
    assert.strictEqual(countdown.targetTimeSeconds, 3900);
    assert.strictEqual(countdown.daysLeft, 7);
    assert.strictEqual(countdown.label, '7 dager igjen');
  });

  test('race readiness suggests test when goal has no relevant result', () => {
    const readiness = raceReadinessSummary(
      { name: 'Halv-Birken', date: '2027-06-08', distanceKm: 12, targetTimeSeconds: 4800 },
      [],
      [],
      '2027-06-01'
    );
    assert.strictEqual(readiness.status, 'needs_test');
    assert.strictEqual(readiness.targetPaceSeconds, 400);
    assert.ok(readiness.nextStep.includes('testløp'));
  });

  test('race readiness compares latest relevant test pace against target pace', () => {
    const readiness = raceReadinessSummary(
      { name: 'Halv-Birken', date: '2027-06-08', distanceKm: 12, targetTimeSeconds: 4800 },
      [{ id: 'ten', date: '2026-06-01', raceResult: { name: '10 km test', distanceKm: 10, resultSeconds: 4200 } }],
      [],
      '2027-06-01'
    );
    assert.strictEqual(readiness.status, 'close');
    assert.strictEqual(readiness.latestRelevant.name, '10 km test');
    assert.strictEqual(readiness.targetPaceSeconds, 400);
    assert.strictEqual(readiness.projectedTargetSeconds, 5040);
    assert.strictEqual(readiness.paceGapSeconds, 20);
  });

  test('race goal plan gives phase and next test for target race', () => {
    const goal = { name: 'Halv-Birken', date: '2027-06-08', distanceKm: 12, targetTimeSeconds: 4800 };
    const readiness = raceReadinessSummary(goal, [], [], '2027-04-15');
    const plan = raceGoalPlan(goal, readiness, { hasSignal: false }, '2027-04-15');
    assert.strictEqual(plan.hasPlan, true);
    assert.strictEqual(plan.phase, 'test');
    assert.match(plan.phaseLabel, /Testfase/);
    assert.match(plan.nextTest, /5 km/);
    assert.match(plan.nextStep, /testløp|sammenlign/);
  });

  test('race goal plan enters taper and respects injury risk', () => {
    const goal = { name: 'Halv-Birken', date: '2027-06-08', distanceKm: 12, targetTimeSeconds: 4800 };
    const readiness = raceReadinessSummary(goal, [], [], '2027-06-03');
    const plan = raceGoalPlan(goal, readiness, { hasSignal: true, status: 'improving', statusLabel: 'Bedres' }, '2027-06-03');
    assert.strictEqual(plan.phase, 'taper');
    assert.match(plan.nextTest, /Ingen ny test/);
    assert.match(plan.risk, /aktivt skadesignal/);
  });

  test('calendar day modal refreshes after marking planned workout complete', () => {
    const normalCompleteFlow = app.match(/const completed = \{[\s\S]+?successMessage: 'Økt logget - bra jobba!'/)?.[0] || '';
    assert.ok(normalCompleteFlow.includes("if (item) item.status = 'done'"), 'planned workout should be marked done locally');
    assert.ok(normalCompleteFlow.includes('afterApply'), 'normal complete flow should refresh UI after local state update');
    assert.ok(normalCompleteFlow.includes('openCalendarDayModal(selectedCalendarDate)'), 'calendar day modal should be refreshed after completion');
  });

  test('completed workout detail has discreet confirmed delete action', () => {
    assert.ok(app.includes('btn-subtle-danger'), 'completed detail should include a discreet delete button');
    assert.ok(app.includes("'Slett fra logg'"), 'historical completed workouts should be deletable from detail view');
    assert.ok(app.includes('Er du sikker på at du vil slette denne historiske økten?'), 'delete action should require confirmation');
    assert.ok(app.includes("fsDelete('completed', completedId)"), 'delete action should remove completed workout from Firestore');
    assert.ok(app.includes('closeWorkoutDetailModal();'), 'detail modal should close after delete/undo apply');
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
    assert.strictEqual(hasStructuredIntervals(null), false);
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
    assert.strictEqual(hasStructuredIntervals(workout), true);
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

  test('structured interval context summarizes 7 14 28 days and latest workout', () => {
    const structuredWorkout = buildStructuredWorkout({
      repetitions: 20,
      workSeconds: 45,
      restSeconds: 15
    });
    const context = structuredIntervalContext([
      { date: '2026-04-20', name: 'For gammel', structuredWorkout },
      { date: '2026-04-30', name: 'Innen 28', structuredWorkout },
      { date: '2026-05-12', name: 'Innen 14', structuredWorkout },
      { date: '2026-05-22', name: 'Innen 7', structuredWorkout },
      { date: '2026-05-24', name: 'Siste', structuredWorkout },
      { date: '2026-05-24', name: 'Gammel rolig mal' }
    ], '2026-05-24');
    assert.strictEqual(context.last7.count, 2);
    assert.strictEqual(context.last14.count, 3);
    assert.strictEqual(context.last28.count, 4);
    assert.strictEqual(context.last28.totalWorkSeconds, 3600);
    assert.strictEqual(context.latest.date, '2026-05-24');
    assert.strictEqual(context.latest.name, 'Siste');
    assert.strictEqual(context.closeQualityDays, true);
  });

  test('coach context uses structured intervals as quality signal', () => {
    assert.ok(app.includes('structuredIntervalContext(completedWithTemplateContext, today)'), 'coach context should build structured interval context');
    assert.ok(app.includes('hasStructuredIntervals(template.structuredWorkout)'), 'hard workout classification should count structured intervals');
    assert.ok(app.includes('structuredIntervals?.last7.count >= 2'), 'coach note should detect recent structured interval load');
    assert.ok(app.includes('structuredIntervals.last14.totalWorkSeconds'), 'coach basis should include structured interval work time');
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

  test('today decision prioritizes red readiness and body signals', () => {
    const pain = todayDecision({ highestPainTier: 'high', hasPlannedToday: true, plannedWorkoutLabel: 'Terskel' });
    assert.strictEqual(pain.level, 'red');
    assert.match(pain.title, /Hvil|alternativ/);

    const improvingPain = todayDecision({
      highestPainTier: 'high',
      painImprovingAfterHigh: true,
      hasPlannedToday: true,
      plannedWorkoutLabel: 'Rolig tur'
    });
    assert.strictEqual(improvingPain.level, 'yellow');
    assert.match(improvingPain.title, /Forsiktig/);
    assert.match(improvingPain.reason, /bedre/);

    const red = todayDecision({ dailyReadinessLevel: 'red', hasPlannedToday: true, plannedWorkoutLabel: 'Rolig tur' });
    assert.strictEqual(red.level, 'red');
    assert.match(red.action, /Hvil|rolig/);
  });

  test('today decision gives actionable planned-workout advice', () => {
    const green = todayDecision({
      dailyReadinessLevel: 'green',
      hasPlannedToday: true,
      plannedWorkoutLabel: 'Støtteterskel'
    });
    assert.strictEqual(green.level, 'green');
    assert.match(green.title, /Støtteterskel/);

    const yellow = todayDecision({
      dailyReadinessLevel: 'yellow',
      hasPlannedToday: true,
      plannedWorkoutLabel: 'Intervall'
    });
    assert.strictEqual(yellow.level, 'yellow');
    assert.match(yellow.action, /Start kontrollert|lettere/);
  });

  test('today decision uses recent structured interval load conservatively', () => {
    const decision = todayDecision({
      structuredIntervalsLast7Count: 2,
      hasPlannedToday: true,
      plannedWorkoutLabel: 'Ny intervall'
    });
    assert.strictEqual(decision.level, 'yellow');
    assert.match(decision.title, /Rolig/);
    assert.match(decision.reason, /intervallarbeid/);
  });

  test('today decision falls back safely without training data', () => {
    const decision = todayDecision({});
    assert.strictEqual(decision.level, 'neutral');
    assert.match(decision.title, /Planlegg/);
  });

  test('injury signal summary recognizes improving pain trend', () => {
    const summary = injurySignalSummary([
      { date: '2026-06-07', painNow: 5, area: 'Venstre kne' },
      { date: '2026-06-08', painNow: 3, area: 'Venstre kne', trend: 'better' }
    ]);
    assert.strictEqual(summary.hasSignal, true);
    assert.strictEqual(summary.status, 'improving');
    assert.strictEqual(summary.statusLabel, 'Bedres');
    assert.strictEqual(summary.trendText, '5 -> 3');
    assert.strictEqual(summary.area, 'Venstre kne');
    assert.match(summary.suggestedAction, /rolig sykkel|svært rolig test/);
    assert.match(summary.releaseCriteria, /0-1\/10|smertefri/);
  });

  test('injury signal summary warns on worsening pain trend', () => {
    const summary = injurySignalSummary([
      { date: '2026-06-07', painNow: 2, area: 'Venstre kne' },
      { date: '2026-06-08', painNow: 4, area: 'Venstre kne', trend: 'worse' }
    ]);
    assert.strictEqual(summary.status, 'worse');
    assert.match(summary.recommendation, /Ikke løp hardt/);
    assert.match(summary.suggestedAction, /hvile|sykkel|gåtur/);
  });

  test('injury-adjusted workout advice suggests low-risk options', () => {
    const summary = injurySignalSummary([
      { date: '2026-06-07', painNow: 5, area: 'Venstre kne' },
      { date: '2026-06-08', painNow: 3, area: 'Venstre kne', trend: 'better' }
    ]);
    const advice = injuryAdjustedWorkoutAdvice(summary, {
      label: 'Støtteterskel 10x3',
      intensity: 'Terskel',
      role: 'support_threshold',
      purpose: 'threshold',
      load: 'moderate'
    });
    assert.strictEqual(advice.active, true);
    assert.match(advice.action, /alternativ trening|rolig test/);
    assert.match(advice.plannedWarning, /Flytt|bytt/);
    assert.ok(advice.options.includes('10-20 min rolig test'));
  });

  test('injury-adjusted workout advice blocks worsening pain from quality', () => {
    const summary = injurySignalSummary([
      { date: '2026-06-07', painNow: 3, area: 'Venstre kne' },
      { date: '2026-06-08', painNow: 5, area: 'Venstre kne', trend: 'worse' }
    ]);
    const advice = injuryAdjustedWorkoutAdvice(summary, { label: 'Intervall', intensity: 'Intervall', load: 'high' });
    assert.strictEqual(advice.active, true);
    assert.match(advice.action, /Hvile|alternativ/);
    assert.match(advice.plannedWarning, /Ikke gjennomfør/);
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
