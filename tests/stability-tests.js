const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { pathToFileURL } = require('url');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const app = read('app.js');
const index = read('index.html');
const styles = read('styles.css');
const serviceWorker = read('service-worker.js');
const appStateSource = read('app-state.js');
const plannerSource = read('domain-training-plan.js');
const repositorySource = read('training-repository.js');
const calendarUiSource = read('calendar-ui.js');
const workoutTemplateUiSource = read('workout-template-ui.js');
const exerciseLibraryUiSource = read('exercise-library-ui.js');
const exerciseDomainSource = read('domain-exercises.js');
const workoutCompletionUiSource = read('workout-completion-ui.js');
const workoutHistoryUiSource = read('workout-history-ui.js');
const aiCoachClient = read('ai-coach-client.js');
const aiCoachUi = read('ai-coach-ui.js');
const aiCoachBackend = read('functions/ai/ai-chat.js');
const aiCoachKeys = read('functions/ai/keys.js');
const aiCoachProvider = read('functions/ai/openai-provider.js');
const aiCoachPrompt = read('functions/ai/system-prompt.js');
const aiModelProfiles = read('functions/ai/model-profiles.js');
const aiPreferences = read('functions/ai/ai-preferences.js');
const functionsIndex = read('functions/index.js');
const chatPersistence = read('functions/ai/chat-persistence.js');
const firestoreRules = read('firestore.rules');
const coachRulesJson = JSON.parse(read('data/coach-rules.json'));

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

async function testAsync(name, fn) {
  try {
    await fn();
    console.log(`ok - ${name}`);
  } catch (err) {
    console.error(`not ok - ${name}`);
    console.error(err.message);
    process.exitCode = 1;
  }
}

(async () => {
  const domain = await import(pathToFileURL(path.join(root, 'domain-core.js')).href);
  const coach = await import(pathToFileURL(path.join(root, 'domain-coach.js')).href);
  const goals = await import(pathToFileURL(path.join(root, 'domain-goals.js')).href);
  const fitness = await import(pathToFileURL(path.join(root, 'domain-fitness.js')).href);
  const coachRulesDomain = await import(pathToFileURL(path.join(root, 'domain-coach-rules.js')).href);
  const appStateDomain = await import(pathToFileURL(path.join(root, 'app-state.js')).href);
  const planner = await import(pathToFileURL(path.join(root, 'domain-training-plan.js')).href);
  const localStoreDomain = await import(pathToFileURL(path.join(root, 'local-state-store.js')).href);
  const workoutTemplateUiDomain = await import(pathToFileURL(path.join(root, 'workout-template-ui.js')).href);
  const exerciseDomain = await import(pathToFileURL(path.join(root, 'domain-exercises.js')).href);
  const exerciseLibraryUiDomain = await import(pathToFileURL(path.join(root, 'exercise-library-ui.js')).href);
  const workoutCompletionUiDomain = await import(pathToFileURL(path.join(root, 'workout-completion-ui.js')).href);
  const workoutHistoryUiDomain = await import(pathToFileURL(path.join(root, 'workout-history-ui.js')).href);
  const {
    assessTrafficLight,
    buildStructuredWorkout,
    calculatePaceMetrics,
    canonicalIntensityBalance,
    classifyWorkoutIntensityContext,
    completedDurationSeconds,
    challengeProgress,
    challengeRemainingLabel,
    dailyCoachSupport,
    formatClockDuration,
    formatDuration,
    formatPace,
    goldenZonePercentages,
    heartRateComplianceSummary,
    hasStructuredIntervals,
    injuryAdjustedWorkoutAdvice,
    injuryRecoveryGuidance,
    injurySignalSummary,
    normalizeStructuredWorkout,
    normalizeTemplate,
    parseNonNegativeInteger,
    structuredIntervalContext,
    structuredIntervalInsights,
    structuredWorkoutBreakdown,
    structuredWorkoutCompactText,
    structuredWorkoutRestSeconds,
    structuredWorkoutSummary,
    structuredWorkoutTotalSeconds,
    structuredWorkoutWorkSeconds,
    todayCompletedWorkoutFeedback,
    workoutHeartRateCompliance,
    weekPlanDates,
    weekPlanDatesInRange
  } = domain;
  const {
    buildAiCoachContext,
    coachDecisionEngine,
    coachDecisionBasis,
    comebackProtocol,
    continuityFreezeDays,
    continuityFreezeWeekSummary,
    homeHeroState,
    isDateFrozen,
    isWeekProtectedByFreeze,
    normalizeContinuityFreeze,
    normalizeContinuityFreezes,
    todayDecision,
    trainingVolumeRamp
  } = coach;
  const domainCoreExports = Object.keys(domain);
  const {
    filterWorkoutTemplates,
    sortWorkoutTemplates,
    workoutTemplateReadiness
  } = workoutTemplateUiDomain;
  const {
    createExercisePrescription,
    exercisePlanItems,
    exercisePlanSearchText,
    exercisePlanSummary,
    exercisePrescriptionLabel,
    normalizeExercise,
    normalizeExerciseLibrary,
    normalizeExercisePlan,
    normalizeExerciseUrl
  } = exerciseDomain;
  const { filterExercises } = exerciseLibraryUiDomain;
  const { durationSecondsFromParts } = workoutCompletionUiDomain;
  const { filterWorkoutHistory, workoutHistoryPeriodRange } = workoutHistoryUiDomain;
  const {
    combinedRaceResults,
    formatRaceTime,
    goalMilestones,
    goalMotivationSummary,
    goalProgressScore,
    normalizeRaceGoal,
    normalizeRaceResult,
    normalizeRaceResultEntry,
    normalizeRaceResultEntries,
    parseRaceTimeToSeconds,
    personalBestSummary,
    personalBestTrendLabel,
    personalBestTrendSummary,
    raceHistoryForDistance,
    raceDistanceLabel,
    raceGoalCountdown,
    raceGoalPlan,
    raceTestRecommendation,
    raceWeekPlanContext,
    raceReadinessSummary
  } = goals;
  const {
    DEFAULT_COACH_RULES,
    coachFrameworkFromRules,
    coachKnowledgeFromRules,
    getCoachRules,
    loadCoachRules,
    mergeCoachRules,
    resetCoachRules,
    resolveCoachRules,
    validateCoachRules
  } = coachRulesDomain;
  const {
    FITNESS_ASSESSMENT_VERSION,
    assessTrainingLevel,
    confirmedTrainingLevelProgress,
    normalizeTrainingLevelProgress,
    personalBestEvidence,
    vo2AgeBenchmark
  } = fitness;
  const {
    DEFAULT_SETTINGS,
    WORKOUT_ROLE_LABELS,
    createEmptyAppState,
    normalizeAppState,
    normalizeSettings
  } = appStateDomain;
  const {
    assembleWeekPlanSuggestions,
    buildWorkoutSuggestion,
    findSuggestedTemplate,
    normalWeekRoles,
    templateSuggestionScore
  } = planner;
  const { createLocalStateStore, isStorageQuotaError, snapshotByteLength } = localStoreDomain;

  const loadedRulesResult = await loadCoachRules('./data/coach-rules.json', async () => ({
    ok: true,
    json: async () => coachRulesJson
  }));
  const invalidJsonLoadResult = await loadCoachRules('./data/coach-rules.json', async () => ({
    ok: true,
    json: async () => {
      throw new Error('invalid JSON');
    }
  }));
  resetCoachRules();

  test('app version matches service worker cache version', () => {
    const appVersion = app.match(/APP_VERSION\s*=\s*'([^']+)'/)?.[1];
    const cacheVersion = serviceWorker.match(/CACHE_NAME\s*=\s*"treningsapp-([^"]+)"/)?.[1];
    assert.ok(appVersion, 'APP_VERSION was not found in app.js');
    assert.ok(cacheVersion, 'CACHE_NAME was not found in service-worker.js');
    assert.strictEqual(appVersion, cacheVersion);
  });

  test('v160 fitness module is cached and rendered from production logic', () => {
    assert.ok(serviceWorker.includes('"./domain-fitness.js"'), 'domain-fitness.js must be part of APP_SHELL');
    assert.ok(app.includes("from './domain-fitness.js'"), 'app must import the fitness domain module');
    assert.ok(index.includes('id="fitnessLevelAssessment"'), 'Insights fitness assessment container is missing');
    assert.ok(app.includes('renderTrainingLevelAssessment(coachCtx)'), 'Insights must render the assessment');
  });

  test('v160 VO2 benchmark uses age and sex specific HUNT reference', () => {
    const result = vo2AgeBenchmark({ vo2Max: 47.2, age: 45, sex: 'male' });
    assert.strictEqual(result.available, true);
    assert.strictEqual(result.mean, 47.2);
    assert.strictEqual(result.ageLabel, '40-49');
    assert.strictEqual(result.source.id, 'hunt3-vo2max-2013');
    assert.strictEqual(result.status, 'typical');
  });

  test('v160 VO2 benchmark has a safe fallback without profile data', () => {
    const result = vo2AgeBenchmark({ vo2Max: 45 });
    assert.strictEqual(result.available, false);
    assert.ok(result.reason.includes('alder'));
  });

  test('v160 personal best evidence rewards own repeated improvement', () => {
    const result = personalBestEvidence([
      { date: '2026-01-01', distanceKm: 5, resultSeconds: 1800 },
      { date: '2026-06-01', distanceKm: 5, resultSeconds: 1620 }
    ]);
    assert.strictEqual(result.repeatedDistanceCount, 1);
    assert.strictEqual(result.bestImprovement.improvementPercent, 10);
  });

  test('v160f twelve-week evidence is useful but cannot claim the highest maturity levels', () => {
    const completed = [];
    for (let week = 0; week < 12; week += 1) {
      const base = new Date(Date.UTC(2026, 6, 16 - week * 7));
      for (let session = 0; session < 3; session += 1) {
        const date = new Date(base);
        date.setUTCDate(date.getUTCDate() - session);
        completed.push({
          date: date.toISOString().slice(0, 10),
          intensityContext: session === 0 && week % 2 === 0 ? 'quality' : 'easy',
          rpe: session === 0 ? 6 : 4,
          painBefore: 0,
          painAfter: 0,
          durationSeconds: 2700
        });
      }
    }
    const result = assessTrainingLevel({
      todayIso: '2026-07-16',
      completed,
      vo2Max: 50,
      age: 45,
      sex: 'male',
      raceResults: [
        { date: '2025-09-01', distanceKm: 5, resultSeconds: 1800 },
        { date: '2026-06-01', distanceKm: 5, resultSeconds: 1650 }
      ],
      currentCoachLevel: 'building_beginner',
      progress: { highestTier: 'foundation', history: [] },
      volumeRamp: { status: 'stable' },
      comeback: { active: false },
      activeInjury: false
    });
    assert.strictEqual(result.level.rank, 3);
    assert.strictEqual(result.dimensions.length, 5);
    assert.strictEqual(result.eligibleForConfirmation, true);
    assert.strictEqual(result.confirmationLevel.rank, 2);
    assert.strictEqual(result.recommendedCoachLevel, result.confirmationLevel.coachLevel);
    assert.strictEqual(result.evidence.observedWeeks, 12);
  });

  test('v160f quality without RPE and post-workout response stays unknown', () => {
    const result = assessTrainingLevel({
      todayIso: '2026-07-16',
      completed: Array.from({ length: 18 }, (_, index) => ({
        date: new Date(Date.UTC(2026, 6, 16 - index * 3)).toISOString().slice(0, 10),
        intensityContext: index % 3 === 0 ? 'quality' : 'easy',
        rpe: null,
        feelingScore: null,
        painBefore: null,
        painAfter: null
      })),
      currentCoachLevel: 'building_beginner',
      progress: { highestTier: 'foundation', history: [] }
    });
    assert.ok(result.evidence.qualityCount > 0);
    assert.strictEqual(result.evidence.qualityEvidenceCount, 0);
    assert.strictEqual(result.evidence.controlledQualityCount, 0);
    assert.strictEqual(result.evidence.qualityCoverage, 0);
    assert.ok(result.dimensions.find(item => item.id === 'quality').summary.includes('uten nok signaldata'));
  });

  test('v160f level five requires long-term active weeks and documented quality', () => {
    const completed = [];
    for (let week = 0; week < 26; week += 1) {
      const base = new Date(Date.UTC(2026, 6, 16 - week * 7));
      for (let session = 0; session < 3; session += 1) {
        const date = new Date(base);
        date.setUTCDate(date.getUTCDate() - session);
        completed.push({
          date: date.toISOString().slice(0, 10),
          intensityContext: session === 0 ? 'quality' : 'easy',
          rpe: session === 0 ? 6 : 4,
          feelingScore: 4,
          painBefore: 0,
          painAfter: 0
        });
      }
    }
    const result = assessTrainingLevel({
      todayIso: '2026-07-16',
      completed,
      vo2Max: 55,
      age: 45,
      sex: 'male',
      raceResults: [
        { date: '2025-09-01', distanceKm: 5, resultSeconds: 1800 },
        { date: '2026-06-01', distanceKm: 5, resultSeconds: 1600 }
      ],
      currentCoachLevel: 'building_beginner',
      progress: { highestTier: 'foundation', history: [] },
      volumeRamp: { status: 'stable' },
      comeback: { active: false },
      activeInjury: false
    });
    assert.strictEqual(result.level.rank, 5);
    assert.ok(result.evidence.activeWeeks26 >= 20);
    assert.ok(result.evidence.observedWeeks >= 24);
    assert.strictEqual(result.confirmationLevel.rank, 2, 'confirmation must advance only one level');
  });

  test('v160 safety signals block promotion without removing achieved level', () => {
    const result = assessTrainingLevel({
      todayIso: '2026-07-16',
      completed: Array.from({ length: 24 }, (_, index) => ({
        date: new Date(Date.UTC(2026, 6, 16 - index * 3)).toISOString().slice(0, 10),
        intensityContext: index % 5 === 0 ? 'quality' : 'easy',
        rpe: 6,
        painBefore: 0,
        painAfter: 0
      })),
      vo2Max: 50,
      age: 45,
      sex: 'male',
      currentCoachLevel: 'building_beginner',
      progress: { highestTier: 'stable', history: [] },
      volumeRamp: { status: 'stable' },
      comeback: { active: false },
      activeInjury: true
    });
    assert.ok(result.safetyBlockers.includes('Aktivt kroppssignal'));
    assert.strictEqual(result.eligibleForConfirmation, false);
    assert.strictEqual(result.highestLevel.id, 'stable');
  });

  test('v160 confirmed progression is explicit, bounded and versioned', () => {
    const assessment = {
      todayIso: '2026-07-16',
      currentCoachLevel: 'building_beginner',
      recommendedCoachLevel: 'intermediate',
      level: { id: 'developing', rank: 3 },
      eligibleForConfirmation: true,
      coachUpgrade: true,
      summary: 'Nivå klart for bekreftelse.'
    };
    const progress = confirmedTrainingLevelProgress(assessment, { highestTier: 'stable', history: [] });
    assert.strictEqual(progress.version, FITNESS_ASSESSMENT_VERSION);
    assert.strictEqual(progress.highestTier, 'developing');
    assert.strictEqual(progress.history.length, 1);
    assert.strictEqual(progress.history[0].toCoachLevel, 'intermediate');
    assert.deepStrictEqual(normalizeTrainingLevelProgress(null), {
      version: FITNESS_ASSESSMENT_VERSION,
      highestTier: 'foundation',
      history: []
    });
  });

  test('v160f production UI separates calculated and confirmed level', () => {
    assert.ok(app.includes('Beregnet nivå'));
    assert.ok(app.includes('Bekreftet progresjon'));
    assert.ok(app.includes('Bekreft neste nivå'));
    assert.ok(styles.includes('.fitness-confirmed-level'));
  });

  test('v160g explains score, next-level gaps and one prioritized action', () => {
    const completed = [];
    for (let week = 0; week < 12; week += 1) {
      for (let session = 0; session < 3; session += 1) {
        const date = new Date(Date.UTC(2026, 6, 16 - week * 7 - session));
        completed.push({
          date: date.toISOString().slice(0, 10),
          intensityContext: session === 0 ? 'quality' : 'easy',
          rpe: session === 0 ? 6 : 4,
          feelingScore: 4,
          painBefore: 0,
          painAfter: 0
        });
      }
    }
    const result = assessTrainingLevel({
      todayIso: '2026-07-16',
      completed,
      vo2Max: 42,
      age: 45,
      sex: 'male',
      raceResults: [
        { date: '2025-09-01', distanceKm: 5, resultSeconds: 1800 },
        { date: '2026-06-01', distanceKm: 5, resultSeconds: 1650 }
      ],
      progress: { highestTier: 'developing', history: [] }
    });
    assert.strictEqual(result.level.rank, 3);
    assert.strictEqual(result.nextLevel.rank, 4);
    assert.ok(result.nextLevelRequirements.some(item => item.id === 'observation'));
    assert.strictEqual(result.recommendedNextStep.dimensionId, 'capacity');
    assert.ok(app.includes('/100 vurderingsgrunnlag'));
    assert.ok(app.includes('Poengsummen er ikke det samme som nivå'));
    assert.ok(app.includes('Dette mangler for nivå'));
    assert.ok(app.includes('Anbefalt neste steg'));
  });

  test('v155 chat persistence is backend-owned and excluded from training backup', () => {
    assert.ok(chatPersistence.includes('clientWritesAllowed: false'), 'chat persistence must remain backend-owned');
    assert.ok(chatPersistence.includes('trainingBackupIncludesChat: false'), 'chat must stay outside training backup');
    assert.ok(chatPersistence.includes('recursive-backend-only'), 'chat deletion policy must be recursive and backend-only');
    assert.ok(firestoreRules.includes('match /apiKeys/{userId}'), 'API key rule is missing');
    assert.ok(firestoreRules.includes('match /aiUsage/{userId}'), 'AI usage rule is missing');
    assert.ok(firestoreRules.includes('match /aiChatUsers/{userId}'), 'isolated AI chat root is missing');
    assert.ok(firestoreRules.includes('match /users/{userId}/{document=**}'), 'shared-project user rules must be preserved');
    assert.ok(firestoreRules.includes('match /families/{familyId}/{document=**}'), 'shared family app rules must be preserved');
    assert.ok(firestoreRules.includes('allow write: if false;'), 'chat and AI status writes must not be client-controlled');
  });

  test('all user data collections are included in replacement import', () => {
    ['exercises', 'templates', 'planned', 'completed', 'wellness', 'challenges', 'blockedDays', 'raceResults', 'continuityFreezes'].forEach(collection => {
      assert.ok(repositorySource.includes(`'${collection}'`), `${collection} is missing from TRAINING_DATA_COLLECTIONS`);
    });
    assert.ok(app.includes('replaceFirestoreData(nextState)'), 'import does not call replaceFirestoreData(nextState)');
    assert.ok(repositorySource.includes('deleteOperations'), 'repository replace should delete existing docs before importing');
    assert.ok(app.includes('trainingRepository.replace(nextState)'), 'app should delegate replacement import to the repository');
  });

  test('v164-v169 architecture modules own state, persistence, planning and focused UI rendering', () => {
    ['./app-state.js', './local-state-store.js', './training-repository.js', './domain-training-plan.js', './calendar-ui.js', './workout-template-ui.js', './workout-completion-ui.js', './workout-history-ui.js']
      .forEach(file => assert.ok(serviceWorker.includes(file), `${file} is missing from APP_SHELL`));
    assert.ok(app.includes("from './app-state.js'"), 'app-state module is not imported');
    assert.ok(app.includes("from './training-repository.js'"), 'training repository is not imported');
    assert.ok(app.includes("from './domain-training-plan.js'"), 'training planner is not imported');
    assert.ok(app.includes("from './calendar-ui.js'"), 'calendar controller is not imported');
    assert.ok(app.includes("from './workout-template-ui.js'"), 'workout template UI is not imported');
    assert.ok(app.includes("from './workout-completion-ui.js'"), 'workout completion UI is not imported');
    assert.ok(app.includes("from './workout-history-ui.js'"), 'workout history UI is not imported');
    assert.ok(repositorySource.includes('createTrainingRepository'), 'repository factory is missing');
    assert.ok(calendarUiSource.includes('createCalendarUi'), 'calendar UI factory is missing');
    assert.ok(workoutTemplateUiSource.includes('createWorkoutTemplateUi'), 'workout template UI factory is missing');
    assert.ok(workoutCompletionUiSource.includes('createWorkoutCompletionUi'), 'workout completion UI factory is missing');
    assert.ok…29449 tokens truncated…    goldenZoneModel: {
          ranges: [
            { level: 'beginner', lowPct: 0.77, highPct: 0.84 },
            { level: 'intermediate', lowPct: 0.78, highPct: 0.85 },
            { level: 'experienced', lowPct: 0.8, highPct: 0.87 }
          ]
        }
      },
      goals: { active: true, raceName: 'Halv-Birken', distanceKm: 12, score: 80, nextStep: 'Bygg rolig volum.' },
      continuity: { streakWeeks: 11, freezeActiveToday: true, weekProtected: false, freezeReason: 'Reise', freezeIsTraining: true },
      dataQuality: { missing: ['HRV'], stale: [], assumptions: [] }
    }, { generatedAt: '2026-07-11T10:00:00.000Z' });

    assert.strictEqual(context.schemaVersion, 2);
    assert.strictEqual(context.coachDecision.primarySignal, 'readiness_red');
    assert.ok(context.coachDecision.blockedActions.includes('hard_quality'));
    assert.ok(context.coachDecision.guardrails.length > 0);
    assert.strictEqual(context.trainingSummary.days7.sessions, 3);
    assert.strictEqual(context.trainingSummary.intensityBalance.verdict, 'too_hard');
    assert.strictEqual(context.profile.primaryFocus, 'running');
    assert.strictEqual(context.profile.levelLabel, 'Viderekommen');
    assert.strictEqual(context.profile.levelSource, 'user_configured');
    assert.deepStrictEqual(context.profile.goldenZone, { low: 147, high: 160, maxHeartRate: 190, lowPct: 0.78, highPct: 0.85, appliesTo: 'controlled_running_quality' });
    assert.strictEqual(context.coachKnowledge.concepts[0].id, 'golden_zone');
    assert.deepStrictEqual(context.coachKnowledge.goldenZoneModel.ranges[2], { level: 'experienced', lowPct: 0.8, highPct: 0.87 });
    assert.strictEqual(context.coachKnowledge.goldenZoneModel.dailyReadinessChangesRange, false);
    assert.ok(!Object.hasOwn(context.profile, 'name'));
    assert.strictEqual(context.continuity.freezeIsTraining, false);
    assert.deepStrictEqual(context.dataQuality.missing, ['HRV']);
  });

  test('AI coach context excludes identity, secrets, Firestore metadata and raw notes', () => {
    const context = buildAiCoachContext({
      uid: 'firebase-user-id',
      email: 'person@example.com',
      openAiKey: 'sk-secret',
      createdAt: 'private-metadata',
      coachDecision: { primarySignal: 'normal_plan', blockedActions: [], allowedActions: ['normal_plan'] },
      today: {
        date: '2026-07-11',
        plannedToday: {
          id: 'firestore-id',
          label: 'Rolig tur',
          notes: 'Dette notatet skal ikke sendes',
          createdAt: 'metadata',
          apiKey: 'secret'
        }
      },
      rawCompleted: [{ notes: 'full historikk' }],
      backup: { state: 'all data' }
    }, { generatedAt: '2026-07-11T10:00:00.000Z' });
    const serialized = JSON.stringify(context);

    ['firebase-user-id', 'person@example.com', 'sk-secret', 'firestore-id', 'Dette notatet', 'private-metadata', 'full historikk', 'all data'].forEach(secret => {
      assert.ok(!serialized.includes(secret), `AI context leaked excluded value: ${secret}`);
    });
  });

  test('AI coach context safely normalizes missing and malformed legacy input', () => {
    const context = buildAiCoachContext({
      coachDecision: null,
      today: { readiness: { sleep: 99, energy: -4, stairsOk: 'yes' } },
      trainingSummary: { days7: { sessions: -2, seconds: 'invalid' } },
      continuity: null
    }, { generatedAt: 'invalid-date' });

    assert.strictEqual(context.coachDecision.primarySignal, 'normal_plan');
    assert.strictEqual(context.today.readiness.sleepScore, 5);
    assert.strictEqual(context.today.readiness.energyScore, 1);
    assert.strictEqual(context.today.readiness.stairsOk, null);
    assert.strictEqual(context.trainingSummary.days7.sessions, 0);
    assert.strictEqual(context.continuity.freezeIsTraining, false);
    assert.strictEqual(context.generatedAt, '1970-01-01T00:00:00.000Z');
    assert.doesNotThrow(() => JSON.stringify(context));
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

  test('today decision lowers load during comeback and rapid volume growth', () => {
    const comeback = todayDecision({
      dailyReadinessLevel: 'green',
      hasPlannedToday: true,
      plannedWorkoutLabel: 'Intervall',
      comeback: {
        active: true,
        phase: 'return_week',
        explanation: 'Comeback-uke etter opphold.'
      }
    });
    assert.strictEqual(comeback.level, 'yellow');
    assert.match(comeback.title, /gradvis|comeback/i);
    assert.match(comeback.action, /roligere|kortere/);

    const volume = todayDecision({
      dailyReadinessLevel: 'green',
      hasPlannedToday: true,
      plannedWorkoutLabel: 'Terskel',
      volumeRamp: {
        status: 'high',
        explanation: 'Siste 7 dager ligger over normalen.'
      }
    });
    assert.strictEqual(volume.level, 'yellow');
    assert.match(volume.title, /volumet/);
    assert.match(volume.action, /rolig|kortere/);
  });

  test('daily coach support adds nutrition and adjustment for quality workout', () => {
    const support = dailyCoachSupport({
      decision: { level: 'green', action: 'Gjennomfør planlagt økt.' },
      planned: { label: 'Støtteterskel 10x3', intensity: 'Terskel', role: 'support_threshold', load: 'moderate' },
      hasPlannedToday: true,
      dailyReadinessLevel: 'green',
      racePhaseLabel: 'Basebygging'
    });
    assert.match(support.adjustment, /Støtteterskel|kontrollert/);
    assert.match(support.support, /karbohydrater|protein|drikk/i);
    assert.match(support.motivation, /basebygging|kontrollert/i);
  });

  test('daily coach support prioritizes low-risk choice with active injury', () => {
    const support = dailyCoachSupport({
      decision: { level: 'red', action: 'Ikke press gjennom høy smerte.' },
      planned: { label: 'Intervall', intensity: 'Intervall', role: 'race', load: 'high' },
      hasPlannedToday: true,
      injuryActive: true,
      injuryStatus: 'high'
    });
    assert.match(support.adjustment, /hvile|alternativ/i);
    assert.match(support.support, /Ikke bruk smerte som test/);
    assert.match(support.motivation, /kontinuiteten/);
  });

  test('completed workout feedback replaces pre-workout advice after a controlled easy session', () => {
    const feedback = todayCompletedWorkoutFeedback({
      completed: {
        label: 'Rolig Kort Tur',
        intensity: 'Restitusjon',
        role: 'recovery',
        loadLevel: 'low',
        loadLabel: 'Lav belastning',
        durationSeconds: 1805,
        distanceKm: 3.37,
        rpe: 5,
        execution: 'Som planlagt',
        painBefore: 0,
        painAfter: 1,
        painArea: 'Begge kne'
      }
    });

    assert.strictEqual(feedback.mode, 'post_workout');
    assert.strictEqual(feedback.kicker, 'Dagens vurdering');
    assert.strictEqual(feedback.level, 'green');
    assert.match(feedback.title, /Bra justert/);
    assert.match(feedback.reason, /Rolig Kort Tur/);
    assert.match(feedback.support.support, /karbohydrater|protein|Drikk|drikk/);
  });

  test('completed workout feedback celebrates controlled quality without pain increase', () => {
    const feedback = todayCompletedWorkoutFeedback({
      completed: {
        label: 'Støtteterskel 10x3',
        intensity: 'Terskel',
        role: 'support_threshold',
        loadLevel: 'moderate',
        loadLabel: 'Moderat belastning',
        durationSeconds: 2520,
        distanceKm: 6.2,
        rpe: 6,
        painBefore: 0,
        painAfter: 0
      }
    });

    assert.strictEqual(feedback.mode, 'post_workout');
    assert.strictEqual(feedback.level, 'green');
    assert.match(feedback.title, /Kvalitet.*kontrollert/);
    assert.match(feedback.support.motivation, /dagens viktigste treningsbidrag/);
  });

  test('completed workout feedback warns when pain increases after workout', () => {
    const feedback = todayCompletedWorkoutFeedback({
      completed: {
        label: 'Terskel',
        intensity: 'Terskel',
        loadLevel: 'moderate',
        durationSeconds: 2400,
        rpe: 7,
        painBefore: 1,
        painAfter: 5,
        painArea: 'Venstre kne'
      }
    });

    assert.strictEqual(feedback.mode, 'post_workout');
    assert.strictEqual(feedback.level, 'red');
    assert.match(feedback.title, /smerterespons/);
    assert.match(feedback.action, /Hold igjen|hvile/);
    assert.match(feedback.support.adjustment, /ikke bruk neste økt|Vent/i);
  });

  test('coach decision basis summarizes the most important decision inputs', () => {
    const basis = coachDecisionBasis({
      decision: { level: 'green', title: 'Bra justert økt', reason: 'Rolig økt med lav smerterespons.' },
      completedToday: { label: 'Rolig Kort Tur', painText: 'Smerte 0 -> 1 (Begge kne)', status: 'green' },
      dailyReadiness: { label: 'Gult lys', sleep: 4, energy: 3, stairs: 'trapp ok', status: 'yellow' },
      injury: { active: true, label: 'Bedres: Begge kne', detail: '5 -> 1/10', status: 'yellow' },
      week: { label: '1/3 økter', detail: '30:05 · 3,4 km denne uken', status: 'neutral' },
      loadTrend: { label: 'Comeback-uke', detail: 'Hold uka rundt 65 % av normalen.', status: 'yellow' },
      race: { label: 'Basebygging', detail: 'Mål-score 62/100', status: 'neutral' }
    });

    assert.ok(basis.length >= 5);
    assert.deepStrictEqual(basis[0].label, 'Beslutning');
    assert.ok(basis.some(item => item.label === 'I dag' && item.value.includes('Rolig Kort Tur')));
    assert.ok(basis.some(item => item.label === 'Kroppssignal' && item.detail.includes('5 -> 1')));
    assert.ok(basis.some(item => item.label === 'Belastningstrend' && item.value === 'Comeback-uke'));
    assert.ok(basis.some(item => item.label === 'Mål' && item.value.includes('Basebygging')));
  });

  test('coach decision basis falls back safely without data', () => {
    const basis = coachDecisionBasis({});
    assert.strictEqual(basis.length, 1);
    assert.strictEqual(basis[0].label, 'Grunnlag');
    assert.match(basis[0].value, /Ikke nok data/);
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

  test('home hero state detects hard planned workout conflict from readiness or intensity balance', () => {
    const conflict = homeHeroState({
      planned: { label: 'Intervall 8x3', intensity: 'Intervall', role: 'main_threshold', load: 'moderate' },
      hasPlannedToday: false,
      hasNextPlanned: true,
      dailyReadinessLevel: 'green',
      hardShare14: 83,
      decision: { level: 'green' }
    });
    assert.strictEqual(conflict.state, 'conflict');
    assert.strictEqual(conflict.level, 'yellow');
    assert.match(conflict.kicker, /Belastning/);
    assert.match(conflict.title, /Belastningen/);
    assert.match(conflict.body, /Bytt til rolig alternativ/);
    assert.match(conflict.reason, /intensitetsbalanse/);
    assert.ok(!conflict.reason.includes('dagsform gul'), conflict.reason);

    const redConflict = homeHeroState({
      planned: { label: 'Terskel', intensity: 'Terskel', load: 'high' },
      hasPlannedToday: true,
      hasNextPlanned: true,
      dailyReadinessLevel: 'red',
      decision: { level: 'red' }
    });
    assert.strictEqual(redConflict.state, 'conflict');
    assert.strictEqual(redConflict.level, 'red');
    assert.strictEqual(redConflict.primaryAction, 'swap_recovery');
  });

  test('home hero state supports post-workout, rest day and comeback states', () => {
    const completed = homeHeroState({
      completedToday: { label: 'Rolig Kort Tur', type: 'Løping' },
      decision: { level: 'green', title: 'Bra justert økt', reason: 'Rolig respons.' }
    });
    assert.strictEqual(completed.state, 'post_workout');
    assert.match(completed.kicker, /Fullført/);

    const rest = homeHeroState({
      planned: { label: 'Støtteterskel', intensity: 'Terskel' },
      hasPlannedToday: false,
      hasNextPlanned: true,
      nextDateLabel: 'i morgen',
      hardShare14: 20,
      decision: { level: 'green' }
    });
    assert.strictEqual(rest.state, 'rest_day');
    assert.match(rest.title, /overskudd/);

    const comeback = homeHeroState({
      daysSinceLast: 8,
      hasPlannedToday: false,
      hasNextPlanned: false,
      decision: { level: 'neutral' }
    });
    assert.strictEqual(comeback.state, 'comeback');
    assert.match(comeback.body, /8 dager/);
  });

  test('home hero treats quality during comeback or rapid volume growth as a conflict', () => {
    const comebackConflict = homeHeroState({
      planned: { label: 'Intervall', intensity: 'Intervall', role: 'main_threshold' },
      hasPlannedToday: true,
      hasNextPlanned: true,
      comeback: { active: true, phase: 'return_week', explanation: 'Comeback-uke.' },
      decision: { level: 'yellow' }
    });
    assert.strictEqual(comebackConflict.state, 'conflict');
    assert.match(comebackConflict.reason, /comeback/);

    const volumeConflict = homeHeroState({
      planned: { label: 'Terskel', intensity: 'Terskel', role: 'support_threshold' },
      hasPlannedToday: true,
      hasNextPlanned: true,
      volumeRamp: { status: 'high', explanation: 'Rask volumøkning.' },
      decision: { level: 'yellow' }
    });
    assert.strictEqual(volumeConflict.state, 'conflict');
    assert.match(volumeConflict.reason, /volum/);
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

  test('injury recovery guidance releases only after stable low pain', () => {
    const guidance = injuryRecoveryGuidance([
      { date: '2026-06-07', painNow: 5, area: 'Venstre kne' },
      { date: '2026-06-08', painNow: 1, area: 'Venstre kne', trend: 'better' },
      { date: '2026-06-09', painNow: 1, area: 'Venstre kne', trend: 'same' }
    ]);
    assert.strictEqual(guidance.active, true);
    assert.strictEqual(guidance.releaseStatus, 'release');
    assert.strictEqual(guidance.stableLowDays, 2);
    assert.match(guidance.nextSafeWorkout, /Rolig løpetur|kontrollert test/);
    assert.match(guidance.qualityGate, /Vent med terskel/);
  });

  test('injury recovery guidance holds back worsening pain', () => {
    const guidance = injuryRecoveryGuidance([
      { date: '2026-06-07', painNow: 2, area: 'Venstre kne' },
      { date: '2026-06-08', painNow: 4, area: 'Venstre kne', trend: 'worse' }
    ]);
    assert.strictEqual(guidance.releaseStatus, 'hold');
    assert.match(guidance.nextSafeWorkout, /Hvile|rolig sykkel|mobilitet/);
    assert.match(guidance.qualityGate, /utsettes/);
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

