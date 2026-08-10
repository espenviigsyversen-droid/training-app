import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
    import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut as fbSignOut }
      from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
    import { getFirestore, doc, collection, getDoc, getDocs, setDoc, deleteDoc, writeBatch, enableIndexedDbPersistence }
      from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
    import {
      addDays,
      assessTrafficLight as assessTrafficLightCore,
      calculatePaceMetrics,
      canonicalIntensityBalance,
      classifyWorkoutIntensityContext,
      completedDurationSeconds,
      buildStructuredWorkout,
      challengeProgress as challengeProgressCore,
      challengeRemainingLabel,
      challengeValueLabel,
      dateToISO,
      formatClockDuration,
      formatDuration,
      formatKm,
      formatPace,
      goldenZonePercentages,
      heartRateComplianceSummary,
      normalizeTemplate,
      parseNonNegativeInteger,
      dailyCoachSupport,
      hasStructuredIntervals,
      injuryAdjustedWorkoutAdvice,
      injuryRecoveryGuidance,
      injurySignalSummary,
      startOfWeek,
      structuredIntervalContext,
      structuredIntervalInsights,
      structuredWorkoutBreakdown,
      structuredWorkoutSummary,
      todayCompletedWorkoutFeedback,
      weekPlanDates as weekPlanDatesCore,
      weekPlanDatesInRange as weekPlanDatesInRangeCore
    } from './domain-core.js';
    import {
      buildAiCoachContext,
      coachDecisionEngine,
      coachDecisionBasis,
      continuityFreezeDays,
      continuityFreezeReasonLabel,
      continuityFreezeWeekSummary,
      comebackProtocol,
      homeHeroState,
      isDateFrozen,
      isWeekProtectedByFreeze,
      normalizeContinuityFreeze,
      normalizeContinuityFreezes,
      todayDecision,
      trainingVolumeRamp
    } from './domain-coach.js';
    import {
      formatRaceTime,
      goalMilestones,
      goalMotivationSummary,
      goalProgressScore,
      normalizeRaceGoal,
      normalizeRaceResult,
      normalizeRaceResultEntry,
      normalizeRaceResultEntries,
      personalBestSummary,
      personalBestTrendLabel,
      raceHistoryForDistance,
      raceDistanceLabel,
      raceGoalCountdown,
      raceGoalPlan,
      raceTestRecommendation,
      raceWeekPlanContext,
      raceReadinessSummary
    } from './domain-goals.js';
    import {
      coachFrameworkFromRules,
      coachKnowledgeFromRules,
      getCoachRules,
      loadCoachRules
    } from './domain-coach-rules.js';
    import { createAiCoachClient } from './ai-coach-client.js';
    import { createAiCoachUi } from './ai-coach-ui.js';
    import {
      assessTrainingLevel,
      confirmedTrainingLevelProgress,
      normalizeTrainingLevelProgress
    } from './domain-fitness.js';
    import {
      DEFAULT_SETTINGS as defaultSettings,
      PAIN_AREA_REGIONS,
      PAIN_AREA_SIDES,
      WORKOUT_ROLE_LABELS,
      createEmptyAppState,
      formatAreaLabel,
      freshDefaultSettings,
      normalizeAppState,
      normalizeFeatures,
      normalizeGoalNumber,
      normalizeGoals,
      normalizeInjuryCheckin,
      normalizePersonProfile,
      normalizeSettings,
      normalizeTemplates,
      normalizeTrainingProfile,
      normalizeWeekPlanRoles
    } from './app-state.js';
    import { createIndexedDbKeyValueStore, createLocalStateStore } from './local-state-store.js';
    import { createTrainingRepository } from './training-repository.js';
    import { createCalendarUi } from './calendar-ui.js';
    import { createWorkoutTemplateUi } from './workout-template-ui.js';
    import { createExerciseLibraryUi } from './exercise-library-ui.js';
    import { createWorkoutCompletionUi } from './workout-completion-ui.js';
    import { createWorkoutHistoryUi } from './workout-history-ui.js';
    import { buildWorkoutCoachAssessment } from './domain-workout-assessment.js';
    import {
      aiWorkoutAssessmentFingerprint,
      buildAiWorkoutAssessmentInput,
      isAiWorkoutAssessmentStale,
      normalizeAiWorkoutAssessment,
      storedAiWorkoutAssessment
    } from './domain-ai-workout-assessment.js';
    import { createHeartRateZonesUi } from './heart-rate-zones-ui.js';
    import { createTrainingImportUi } from './training-import-ui.js';
    import { normalizeExercise } from './domain-exercises.js';
    import {
      activeHeartRateZoneSet,
      assessHeartRateZoneCompliance,
      heartRateReferenceContext,
      heartRateZoneComplianceSummary,
      normalizeHeartRateZoneDistribution,
      normalizeHeartRateZoneSet,
      normalizeHeartRateZoneSets
    } from './domain-heart-rate-zones.js';
    import {
      applyRaceContextToSuggestionMix,
      assembleWeekPlanSuggestions,
      bakkenWeekRecipe as bakkenWeekRecipeCore,
      buildWorkoutSuggestion as buildWorkoutSuggestionCore,
      findSuggestedTemplate as findSuggestedTemplateCore,
      gentleBaseSuggestion,
      inferredWorkoutRole,
      nextWeekPlanSummary,
      normalWeekRoles as normalWeekRolesCore,
      recoverySuggestion,
      roleAwareSuggestions as roleAwareSuggestionsCore,
      roleCoverage as roleCoverageCore,
      suggestionForWorkoutRole,
      weekPlanSuggestionMix as weekPlanSuggestionMixCore,
      xWorkoutSuggestion
    } from './domain-training-plan.js';
    import {
      buildVolumeTrendWindow,
      normalizeVolumeTrendOffset,
      shiftVolumeTrendOffset
    } from './domain-volume-trends.js';
    import { comparableEasyRunFormInsight, yearToDatePerformanceInsights } from './domain-performance-insights.js';
    import {
      intensityBalanceInsightEvidence,
      sameEffortInsightEvidence,
      trainingLevelInsightEvidence,
      wellnessTrendInsightEvidence,
      zoneComplianceInsightEvidence
    } from './domain-insight-confidence.js';
    import { insightEvidenceDisclosureHtml } from './insight-confidence-ui.js';
    import { createTrainingInsightsUi } from './training-insights-ui.js';
    import { createWorkspaceSectionsUi } from './workspace-sections-ui.js';

const APP_VERSION = 'v176m';
    const APP_CACHE_NAME = `treningsapp-${APP_VERSION}`;

    const firebaseConfig = {
      apiKey: "AIzaSyAMPfQ9gX9rbuvcPsVjYVtq5IT_orjDBPs",
      authDomain: "home-tasks-app-18de3.firebaseapp.com",
      projectId: "home-tasks-app-18de3",
      storageBucket: "home-tasks-app-18de3.firebasestorage.app",
      messagingSenderId: "253720858709",
      appId: "1:253720858709:web:89609fc26d6ed9f9c384dc"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const aiCoachClient = createAiCoachClient(app, { region: 'europe-west1' });
    let aiCoachUi = null;
    enableIndexedDbPersistence(db).catch((err) => {
      console.warn('Firestore offline persistence unavailable:', err);
    });

    let currentUser = null;
    let hasPendingLocalWrites = false;
    let authResolved = false;
    let offlineSnapshotMode = false;
    const LOCAL_STATE_KEY = 'treningsapp:last-state:v1';
    let state = createEmptyAppState();
    const indexedDbSnapshotStore = createIndexedDbKeyValueStore({ indexedDB: window.indexedDB });
    const localStateStore = createLocalStateStore({
      storage: localStorage,
      fallbackStorage: indexedDbSnapshotStore,
      key: LOCAL_STATE_KEY,
      normalizeState: normalizeAppState
    });
    let localSnapshotStatus = { state: 'checking', backend: null, bytes: 0, savedAt: null };
    const trainingRepository = createTrainingRepository({
      db,
      getCurrentUser: () => currentUser,
      firestore: { collection, doc, getDoc, getDocs, setDoc, deleteDoc, writeBatch },
      normalizeState: normalizeAppState,
      defaultSettings: freshDefaultSettings
    });
    const trainingInsightsUi = createTrainingInsightsUi({
      escapeHtml,
      formatDate,
      formatClockDuration,
      onShowMissingActivitySetting: () => {
        const typeFilter = document.getElementById('historyFilter');
        const filter = document.getElementById('historyActivitySetting');
        if (typeFilter) typeFilter.value = 'Løping';
        if (filter) filter.value = 'missing';
        document.getElementById('historyFilterPanel')?.classList.remove('hidden');
        window.showTab('history');
      }
    });
    trainingInsightsUi.bind();
    const workspaceSectionsUi = createWorkspaceSectionsUi({ documentRef: document });
    workspaceSectionsUi.bind();
    let volumeTrendPeriod = 'week';
    let volumeTrendActivity = 'all';
    const volumeTrendOffsets = { week: 0, month: 0, year: 0 };
    let tlSelections = { sleep: null, energy: null, stairsOk: null };
    let injuryCheckinExpanded = false;
    let showAllPersonalBests = false;

    let COACH_FRAMEWORK = coachFrameworkFromRules(getCoachRules());
    loadCoachRules('./data/coach-rules.json').then(result => {
      COACH_FRAMEWORK = coachFrameworkFromRules(result.rules);
      if (!result.valid) {
        console.warn('Coach rules fallback active:', result.errors.join('; '));
      }
    });

    // ── Utilities ─────────────────────────────────────────────────────────────
    function uid(prefix) {
      return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    }

    function asArray(value) {
      if (Array.isArray(value)) return value.filter(Boolean);
      return value ? [value] : [];
    }

    function coachPrincipleText(ids = []) {
      return asArray(ids)
        .map(id => COACH_FRAMEWORK.principles[id])
        .filter(Boolean)
        .join(' ');
    }

    function coachPrincipleLine(ids = []) {
      const text = coachPrincipleText(ids);
      return text ? `Prinsipp: ${text}` : '';
    }

    function withCoachPrinciples(suggestion, ids = []) {
      return { ...suggestion, principleIds: [...asArray(suggestion.principleIds), ...asArray(ids)] };
    }

    function getCheckedValues(containerId) {
      return [...document.querySelectorAll(`#${containerId} input[type="checkbox"]:checked`)].map(input => input.value);
    }

    function setCheckedValues(containerId, values) {
      const selected = new Set(asArray(values));
      document.querySelectorAll(`#${containerId} input[type="checkbox"]`).forEach(input => {
        input.checked = selected.has(input.value);
      });
    }

    function todayISO() {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }

    function formatDate(iso) {
      if (!iso) return '';
      const d = new Date(`${iso}T12:00:00`);
      return d.toLocaleDateString('no-NO', { weekday: 'short', day: '2-digit', month: 'short' });
    }

    function formatShortDate(iso) {
      if (!iso) return '';
      const d = new Date(`${iso}T12:00:00`);
      return d.toLocaleDateString('no-NO', { day: 'numeric', month: 'short' }).replace('.', '');
    }

    function formatFullDate(iso) {
      if (!iso) return '';
      const d = new Date(`${iso}T12:00:00`);
      return d.toLocaleDateString('no-NO', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    function formatWeekRange(startIso, endIso) {
      return `${formatShortDate(startIso)}-${formatShortDate(endIso)}`;
    }

    function escapeHtml(str = '') {
      return String(str)
        .replaceAll('&','&amp;').replaceAll('<','&lt;')
        .replaceAll('>','&gt;').replaceAll('"','&quot;')
        .replaceAll("'",'&#039;');
    }

    function setSyncStatus(status) {
      const dot = document.getElementById('syncDot');
      const label = document.getElementById('syncLabel');
      if (!dot || !label) return;
      dot.className = 'sync-dot' + (
        status === 'syncing' ? ' syncing' :
        status === 'error' ? ' error' :
        status === 'offline' || status === 'pending' ? ' offline' : ''
      );
      const labels = {
        syncing: 'Synkroniserer...',
        error: 'Feil ved synk',
        offline: 'Offline',
        pending: 'Venter på synk',
        ok: 'Synkronisert'
      };
      label.textContent = labels[status] || labels.ok;
    }

    function refreshNetworkStatus() {
      if (!navigator.onLine) {
        setSyncStatus(hasPendingLocalWrites ? 'pending' : 'offline');
        return;
      }
      setSyncStatus(hasPendingLocalWrites ? 'syncing' : 'ok');
    }

    function setLocalSnapshotStatus(nextStatus) {
      localSnapshotStatus = { ...localSnapshotStatus, ...nextStatus };
      renderLocalSnapshotStatus();
    }

    function formatSnapshotSize(bytes) {
      if (!Number.isFinite(bytes) || bytes <= 0) return '';
      if (bytes < 1024) return `${bytes} B`;
      return `${(bytes / 1024).toFixed(bytes >= 1024 * 100 ? 0 : 1)} kB`;
    }

    async function saveLocalStateSnapshot() {
      try {
        const result = await localStateStore.writeSnapshotSafe(state);
        setLocalSnapshotStatus({ state: 'ok', ...result });
        return result;
      } catch (err) {
        console.warn('Could not save local state snapshot:', err);
        setLocalSnapshotStatus({ state: 'error', error: err?.message || 'Ukjent lagringsfeil' });
        return null;
      }
    }

    async function loadLocalStateSnapshot() {
      try {
        const snapshot = await localStateStore.readSnapshotSafe();
        if (!snapshot) {
          setLocalSnapshotStatus({ state: 'empty', backend: null, bytes: 0, savedAt: null });
          return null;
        }
        state = snapshot.state;
        setLocalSnapshotStatus({ state: 'ok', backend: snapshot.backend, bytes: snapshot.bytes, savedAt: snapshot.savedAt });
        return snapshot.savedAt || null;
      } catch (err) {
        console.warn('Could not load local state snapshot:', err);
        setLocalSnapshotStatus({ state: 'error', error: err?.message || 'Ukjent lesefeil' });
        return null;
      }
    }

    // ── Trafikklymodell ───────────────────────────────────────────────────────
    function loadDailyReadiness() {
      return state.settings?.dailyReadiness?.[todayISO()] || null;
    }

    function injuryTrendLabel(value) {
      return { better: 'Bedre', same: 'Lik', worse: 'Verre' }[value] || '';
    }

    function dailyInjuryCheckinsUntil(today = todayISO(), days = 7) {
      const cutoff = addDays(today, -(days - 1));
      const entries = Object.entries(state.settings?.dailyReadiness || {})
        .filter(([date, item]) => date >= cutoff && date <= today && item?.injuryCheckin)
        .map(([date, item]) => ({ date, ...normalizeInjuryCheckin(item.injuryCheckin), source: 'daily' }))
        .filter(item => item && item.painNow !== '');
      return entries.sort((a, b) => a.date.localeCompare(b.date));
    }

    function dailyInjuryAsCompletedItems(today = todayISO(), days = 7) {
      return dailyInjuryCheckinsUntil(today, days).map(item => ({
        id: `injury-${item.date}`,
        date: item.date,
        completedAt: '00:00:00.000Z',
        updatedAt: '00:00:00.000Z',
        bodyStatus: {
          painBefore: '',
          painAfter: item.painNow,
          areaRegion: item.areaRegion || '',
          areaSide: item.areaSide || '',
          area: item.area || '',
          adaptation: item.painNow >= 3 ? 'easier' : 'none',
          notes: item.note || ''
        }
      }));
    }

    function injurySignalEntriesUntil(today = todayISO(), days = 7) {
      const cutoff = addDays(today, -(days - 1));
      const completedSignals = state.completed
        .filter(item => item.date >= cutoff && item.date <= today && hasPainSignal(item))
        .map(item => ({
          date: item.date,
          painNow: Math.max(numberOrZero(item.bodyStatus?.painBefore), numberOrZero(item.bodyStatus?.painAfter)),
          area: item.bodyStatus?.area || '',
          trend: '',
          source: 'completed'
        }))
        .filter(item => Number(item.painNow) > 0);
      return [...completedSignals, ...dailyInjuryCheckinsUntil(today, days)]
        .sort((a, b) => {
          const dateSort = String(a.date || '').localeCompare(String(b.date || ''));
          if (dateSort) return dateSort;
          const sourceOrder = { completed: 1, daily: 2 };
          return (sourceOrder[a.source] || 0) - (sourceOrder[b.source] || 0);
        });
    }

    function latestPainReference(today = todayISO()) {
      const completedSignals = state.completed
        .filter(item => item.date <= today && hasPainSignal(item))
        .map(item => ({
          date: item.date,
          painNow: Math.max(numberOrZero(item.bodyStatus?.painBefore), numberOrZero(item.bodyStatus?.painAfter)),
          areaRegion: item.bodyStatus?.areaRegion || '',
          areaSide: item.bodyStatus?.areaSide || '',
          area: item.bodyStatus?.area || '',
          source: 'completed'
        }));
      const all = [...completedSignals, ...dailyInjuryCheckinsUntil(today, 7)]
        .filter(item => Number(item.painNow) > 0)
        .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
      return all[0] || null;
    }

    function shouldShowInjuryCheckin(today = todayISO()) {
      const latest = latestPainReference(today);
      if (!latest) return false;
      return new Date(`${today}T12:00:00`).getTime() - new Date(`${latest.date}T12:00:00`).getTime() <= 7 * 86400000;
    }

    async function saveDailyReadiness(data) {
      const today = todayISO();
      const cutoff = addDays(today, -6);
      const existing = state.settings.dailyReadiness || {};
      const pruned = Object.fromEntries(Object.entries(existing).filter(([date]) => date >= cutoff));
      pruned[today] = { ...(existing[today] || {}), ...data };
      state.settings.dailyReadiness = pruned;
      try {
        await fsSet('settings', 'preferences', state.settings);
      } catch (err) {
        console.error('Could not save daily readiness to Firestore:', err);
      }
    }

    function assessTrafficLight(sleep, energy, restingHR, stairsOk) {
      const baseline = latestMetric('restingHeartRate7d')?.restingHeartRate7d;
      return assessTrafficLightCore(sleep, energy, restingHR, stairsOk, baseline);
    }

    const TRAFFIC_LIGHT_CONFIG = {
      green:  { label: 'Grønt lys',  advice: 'Bra dagsform — gjennomfør planlagt økt som planlagt.' },
      yellow: { label: 'Gult lys',   advice: 'Litt sliten. Gjennomfør om du vil, men senk intensiteten fra det planlagte.' },
      red:    { label: 'Rødt lys',   advice: 'Dårlig dagsform. Hvil eller velg en rolig alternativ økt i dag.' }
    };

    function blockOfflineSnapshotWrite() {
      if (!offlineSnapshotMode) return false;
      setSyncStatus('offline');
      render();
      alert('Du er i offline-visning med siste lagrede kopi. Koble til nett for å endre eller logge økter trygt.');
      return true;
    }

    function revealOfflineStart(reason = '') {
      const message = document.getElementById('loadingMessage');
      const button = document.getElementById('offlineStartBtn');
      const hint = document.getElementById('loadingHint');
      if (!message || !button || !hint) return;
      message.textContent = navigator.onLine ? 'Oppstart tar litt tid' : 'Offline-modus';
      button.classList.remove('hidden');
      hint.classList.remove('hidden');
      hint.textContent = reason || (
        navigator.onLine
          ? 'Du kan prøve å åpne appen med data som allerede finnes på telefonen.'
          : 'Du er offline. Appen kan åpnes med siste lagrede kopi hvis appen har vært brukt på denne telefonen før.'
      );
    }

    window.startOfflineFallback = async function() {
      const loading = document.getElementById('loadingOverlay');
      const authScreen = document.getElementById('authScreen');
      const mainApp = document.getElementById('mainApp');
      const hint = document.getElementById('loadingHint');

      if (currentUser) {
        offlineSnapshotMode = false;
        loading.classList.add('hidden');
        authScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        setSyncStatus('offline');
        render();
        return;
      }

      const savedAt = await loadLocalStateSnapshot();
      if (savedAt) {
        offlineSnapshotMode = true;
        loading.classList.add('hidden');
        authScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        setSyncStatus('offline');
        const email = document.getElementById('settingsUserEmail');
        if (email) email.textContent = 'Offline-visning med siste lagrede kopi';
        render();
        showToast('Offline-visning åpnet', 'info');
        return;
      }

      const message = document.getElementById('loadingMessage');
      const button = document.getElementById('offlineStartBtn');
      if (message) message.textContent = 'Offline krever lagret innlogging';
      if (button) button.classList.add('hidden');
      if (hint) {
        hint.textContent = 'Fant ingen lagret appkopi på telefonen. Åpne appen én gang med nett, så blir offline-visning tilgjengelig neste gang.';
        hint.classList.remove('hidden');
      }
    };

    window.setTimeout(() => {
      if (!authResolved) revealOfflineStart();
    }, 4500);

    function showToast(message, type = 'success') {
      const existing = document.getElementById('toastNotification');
      if (existing) existing.remove();
      const toast = document.createElement('div');
      toast.id = 'toastNotification';
      toast.className = `toast ${type}`;
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 350);
      }, 2500);
    }

    window.showToast = showToast;

    const BLOCKED_DAY_REASONS = {
      unavailable: 'Ikke tilgjengelig',
      travel: 'Bortreist',
      work: 'Jobb',
      family: 'Familie',
      sick: 'Syk',
      recovery: 'Planlagt hvile',
      other: 'Annet'
    };

    function blockedDayForDate(dateIso) {
      return (state.blockedDays || []).find(day => day.date === dateIso) || null;
    }

    function isBlockedTrainingDate(dateIso) {
      return Boolean(blockedDayForDate(dateIso));
    }

    function blockedDayLabel(day) {
      if (!day) return '';
      return BLOCKED_DAY_REASONS[day.reason] || day.reason || BLOCKED_DAY_REASONS.unavailable;
    }

    function nextAvailableTrainingDate(dateIso, maxDays = 21) {
      let candidate = dateIso || todayISO();
      for (let i = 0; i <= maxDays; i++) {
        if (!isBlockedTrainingDate(candidate)) return candidate;
        candidate = addDays(candidate, 1);
      }
      return dateIso || todayISO();
    }

    function blockedDaysBetween(startIso, endIso) {
      return (state.blockedDays || [])
        .filter(day => day.date >= startIso && day.date <= endIso)
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    const WEEK_PLAN_PRESETS = {
      bakken_3: ['main_threshold', 'support_threshold', 'long_easy', 'x_workout'],
      bakken_4: ['main_threshold', 'support_threshold', 'long_easy', 'x_workout'],
      easy_build: ['long_easy', 'recovery', 'long_easy', 'mobility']
    };

    const BAKKEN_STANDARD_TEMPLATES = [
      {
        name: 'Rolig Kort Tur',
        type: 'Løping',
        intensity: 'Restitusjon',
        role: 'recovery',
        purpose: 'recovery',
        load: 'low',
        recommendedWhen: ['normal', 'tired', 'pain_adaptation'],
        avoidWhen: [],
        structure: '25-40 min veldig rolig løp\nHold hele økten under ca. 70 % av makspuls\nSkal føles lett og gi bedre bein etterpå'
      },
      {
        name: 'Rolig Langtur Base',
        type: 'Løping',
        intensity: 'Rolig',
        role: 'long_easy',
        purpose: 'base',
        load: 'low',
        recommendedWhen: ['normal', 'fresh_legs'],
        avoidWhen: ['pain'],
        structure: '60-75 min rolig løp\nHold igjen, gjerne under ca. 70 % av makspuls\nMålet er aerob base og lave skuldre'
      },
      {
        name: 'Gåtur Restitusjon',
        type: 'Gåtur',
        intensity: 'Restitusjon',
        role: 'recovery',
        purpose: 'recovery',
        load: 'low',
        recommendedWhen: ['tired', 'after_hard', 'pain_adaptation'],
        avoidWhen: [],
        structure: '30-60 min rolig gåtur\nBrukes for sirkulasjon, kontinuitet og lav belastning\nIkke ment som full løpsspesifikk stimulus alene'
      },
      {
        name: 'Hovedterskel 6x6',
        type: 'Løping',
        intensity: 'Terskel',
        role: 'main_threshold',
        purpose: 'threshold',
        load: 'moderate',
        recommendedWhen: ['fresh_legs', 'normal'],
        avoidWhen: ['pain'],
        structure: '10-15 min oppvarming\n6 x 6 min kontrollert terskel\n1 min rolig jogg/gange pause\n5-10 min nedjogg\nStart litt forsiktig og hold igjen'
      },
      {
        name: 'Hovedterskel 4x10',
        type: 'Løping',
        intensity: 'Terskel',
        role: 'main_threshold',
        purpose: 'threshold',
        load: 'moderate',
        recommendedWhen: ['fresh_legs'],
        avoidWhen: ['heavy_legs'],
        structure: '10-15 min oppvarming\n4 x 10 min kontrollert terskel\n90 sek rolig pause\n5-10 min nedjogg\nBrukes når kroppen tåler litt lengre drag'
      },
      {
        name: 'Terskel 5x5 Progressiv',
        type: 'Løping',
        intensity: 'Terskel',
        role: 'main_threshold',
        purpose: 'threshold',
        load: 'moderate',
        recommendedWhen: ['normal', 'fresh_legs'],
        avoidWhen: ['many_hard'],
        structure: '10-15 min oppvarming\n5 x 5 min terskel\n90 sek pause\nProgressivt fra litt under terskel til kontrollert terskel\n5-10 min nedjogg'
      },
      {
        name: 'Støtteterskel 10x3',
        type: 'Løping',
        intensity: 'Terskel',
        role: 'support_threshold',
        purpose: 'threshold',
        load: 'moderate',
        recommendedWhen: ['normal', 'fresh_legs'],
        avoidWhen: ['pain'],
        structure: '10-15 min oppvarming\n10 x 3 min kontrollert terskel\n1 min rolig pause\n5-10 min nedjogg\nKortere drag med god kontroll'
      },
      {
        name: 'Støtteterskel 12x2',
        type: 'Løping',
        intensity: 'Terskel',
        role: 'support_threshold',
        purpose: 'threshold',
        load: 'moderate',
        recommendedWhen: ['normal', 'fresh_legs'],
        avoidWhen: ['heavy_legs'],
        structure: '10-15 min oppvarming\n12 x 2 min kontrollert terskel\n45-60 sek pause\n5-10 min nedjogg\nFin når du vil ha kvalitet uten for lange drag'
      },
      {
        name: '45/15 Terskel Kontrollert',
        type: 'Løping',
        intensity: 'Terskel',
        role: 'support_threshold',
        purpose: 'threshold',
        load: 'moderate',
        recommendedWhen: ['normal', 'fresh_legs'],
        avoidWhen: ['many_hard'],
        structure: '10-15 min oppvarming\n15-25 x 45 sek kontrollert terskel / 15 sek rolig\n5-10 min nedjogg\nSkal være rytmisk, ikke sprint'
      },
      {
        name: '30x1 Terskel',
        type: 'Løping',
        intensity: 'Terskel',
        role: 'support_threshold',
        purpose: 'threshold',
        load: 'moderate',
        recommendedWhen: ['normal'],
        avoidWhen: ['pain'],
        structure: '10-15 min oppvarming\n30 x 1 min terskel\n30-45 sek rolig pause\n5-10 min nedjogg\nMye kontrollert terskeltid med korte drag'
      },
      {
        name: 'Pyramide Terskel 3-6-9-6-3',
        type: 'Løping',
        intensity: 'Terskel',
        role: 'x_workout',
        purpose: 'threshold',
        load: 'moderate',
        recommendedWhen: ['fresh_legs', 'bonus'],
        avoidWhen: ['many_hard'],
        structure: '10-15 min oppvarming\n3-6-9-6-3 min kontrollert terskel\n90 sek rolig pause\nValgfritt 5 x 20/20 lett og kontrollert til slutt\n5-10 min nedjogg'
      },
      {
        name: 'Nedtrapping Terskel 10-8-6-4-2-1',
        type: 'Løping',
        intensity: 'Terskel',
        role: 'x_workout',
        purpose: 'threshold',
        load: 'moderate',
        recommendedWhen: ['fresh_legs', 'bonus'],
        avoidWhen: ['heavy_legs'],
        structure: '10-15 min oppvarming\n10-8-6-4-2-1 min kontrollert terskel\n1-2 min rolig pause\nLitt raskere på kortere drag, men fortsatt kontroll\n5-10 min nedjogg'
      },
      {
        name: 'Lett Fartslek Kontrollert',
        type: 'Løping',
        intensity: 'Tempo',
        role: 'x_workout',
        purpose: 'threshold',
        load: 'moderate',
        recommendedWhen: ['normal', 'bonus'],
        avoidWhen: ['pain'],
        structure: '10-15 min rolig\n8-12 x 1 min kontrollert fart / 1 min rolig\n10 min rolig\nFokus på flyt, ikke maksimal fart'
      },
      {
        name: 'Motbakke Kontrollert',
        type: 'Løping',
        intensity: 'Tempo',
        role: 'x_workout',
        purpose: 'technique',
        load: 'moderate',
        recommendedWhen: ['fresh_legs', 'bonus'],
        avoidWhen: ['pain'],
        structure: '10-15 min oppvarming\n8-10 x 45-60 sek kontrollert motbakke\nGå/jogg rolig ned som pause\n5-10 min nedjogg\nKun når legg/fot kjennes bra'
      },
      {
        name: '2 km race / testløp',
        type: 'Løping',
        intensity: 'Anaerob',
        role: 'race',
        purpose: 'race',
        load: 'high',
        recommendedWhen: ['fresh_legs', 'bonus'],
        avoidWhen: ['pain', 'heavy_legs', 'many_hard', 'low_hrv'],
        structure: '15-20 min rolig oppvarming\n3-5 stigningsløp med god pause\n2 km konkurranse/testløp\n10-15 min rolig nedjogg\nLogg som race, ikke som vanlig intervalløkt'
      },
      {
        name: 'Styrke Vedlikehold',
        type: 'Styrke',
        intensity: 'Styrke',
        role: 'strength',
        purpose: 'strength',
        load: 'low',
        recommendedWhen: ['normal', 'bonus'],
        avoidWhen: ['heavy_legs'],
        structure: '30-45 min styrke\nHold igjen på bein hvis løpskvalitet kommer snart\nFokus på stabilitet, kontroll og skadeforebygging'
      },
      {
        name: 'Mobilitet / Yoga Restitusjon',
        type: 'Mobilitet',
        intensity: 'Restitusjon',
        role: 'mobility',
        purpose: 'mobility',
        load: 'low',
        recommendedWhen: ['tired', 'after_hard', 'pain_adaptation'],
        avoidWhen: [],
        structure: '20-40 min rolig mobilitet eller yoga\nFokus på hofter, legger, bakside lår og pust\nSkal kjennes bedre etterpå enn før'
      }
    ];

    function uniqueValues(values) {
      return [...new Set(values.filter(Boolean))];
    }

    // ── Firestore ─────────────────────────────────────────────────────────────
    async function loadFromFirestore() {
      if (!navigator.onLine) setSyncStatus(hasPendingLocalWrites ? 'pending' : 'offline');
      else setSyncStatus('syncing');
      try {
        state = await trainingRepository.load();
        offlineSnapshotMode = false;
        await saveLocalStateSnapshot();
        if (navigator.onLine) {
          hasPendingLocalWrites = false;
          setSyncStatus('ok');
        } else {
          setSyncStatus(hasPendingLocalWrites ? 'pending' : 'offline');
        }
      } catch (err) {
        console.error('Firestore load error:', err);
        setSyncStatus(navigator.onLine ? 'error' : 'offline');
      }
      try {
        render();
      } catch (err) {
        console.error('App render error:', err);
      }
    }

    async function fsSet(colName, id, data) {
      if (blockOfflineSnapshotWrite()) throw new Error('Offline snapshot is read-only');
      const wasOffline = !navigator.onLine;
      if (wasOffline) {
        hasPendingLocalWrites = true;
        setSyncStatus('pending');
      } else {
        setSyncStatus('syncing');
      }
      try {
        await trainingRepository.set(colName, id, data);
        if (wasOffline || !navigator.onLine) {
          hasPendingLocalWrites = true;
          setSyncStatus('pending');
        } else {
          setSyncStatus('ok');
        }
        await saveLocalStateSnapshot();
      } catch (err) {
        console.error('Firestore write error:', err);
        setSyncStatus('error');
        throw err;
      }
    }

    async function fsDelete(colName, id) {
      if (blockOfflineSnapshotWrite()) throw new Error('Offline snapshot is read-only');
      const wasOffline = !navigator.onLine;
      if (wasOffline) {
        hasPendingLocalWrites = true;
        setSyncStatus('pending');
      } else {
        setSyncStatus('syncing');
      }
      try {
        await trainingRepository.remove(colName, id);
        if (wasOffline || !navigator.onLine) {
          hasPendingLocalWrites = true;
          setSyncStatus('pending');
        } else {
          setSyncStatus('ok');
        }
        await saveLocalStateSnapshot();
      } catch (err) {
        console.error('Firestore delete error:', err);
        setSyncStatus('error');
        throw err;
      }
    }

    async function fsBatchSet(colName, items) {
      if (!items.length) return;
      if (blockOfflineSnapshotWrite()) throw new Error('Offline snapshot is read-only');
      const wasOffline = !navigator.onLine;
      if (wasOffline) {
        hasPendingLocalWrites = true;
        setSyncStatus('pending');
      } else {
        setSyncStatus('syncing');
      }
      try {
        await trainingRepository.batchSet(colName, items);
        if (wasOffline || !navigator.onLine) {
          hasPendingLocalWrites = true;
          setSyncStatus('pending');
        } else {
          setSyncStatus('ok');
        }
        await saveLocalStateSnapshot();
      } catch (err) {
        console.error('Firestore batch error:', err);
        setSyncStatus('error');
        throw err;
      }
    }

    async function saveRecoverySnapshot(reason) {
      try {
        const result = await localStateStore.writeRecoverySafe(cloneAppState(), reason);
        setLocalSnapshotStatus({ state: 'ok', ...result });
        return result;
      } catch (err) {
        console.warn('Could not save recovery snapshot:', err);
        setLocalSnapshotStatus({ state: 'error', error: err?.message || 'Kunne ikke lagre gjenopprettingskopi' });
        return null;
      }
    }

    async function loadRecoverySnapshot() {
      try {
        return await localStateStore.readRecoverySafe();
      } catch (err) {
        console.warn('Could not load recovery snapshot:', err);
        return null;
      }
    }

    async function replaceFirestoreData(nextState) {
      if (blockOfflineSnapshotWrite()) throw new Error('Offline snapshot is read-only');
      setSyncStatus('syncing');
      await trainingRepository.replace(nextState);
      await saveLocalStateSnapshot();
      setSyncStatus('ok');
    }

    function cloneAppState() {
      if (typeof structuredClone === 'function') return structuredClone(state);
      return JSON.parse(JSON.stringify(state));
    }

    function restoreAppState(snapshot) {
      state = snapshot;
      void saveLocalStateSnapshot();
      render();
      if (document.getElementById('calendarDayModal')?.classList.contains('active') && selectedCalendarDate()) {
        openCalendarDayModal(selectedCalendarDate());
      }
    }

    async function safeStateWrite({ apply, write, successMessage = 'Lagret', errorMessage = 'Kunne ikke lagre endringen', afterApply }) {
      const snapshot = cloneAppState();
      try {
        apply();
        await saveLocalStateSnapshot();
        render();
        if (typeof afterApply === 'function') afterApply();
        await write();
        showToast(successMessage);
      } catch (err) {
        console.error(errorMessage, err);
        restoreAppState(snapshot);
        setSyncStatus(navigator.onLine ? 'error' : 'offline');
        showToast(`${errorMessage}. Endringen er rullet tilbake.`, 'error');
      }
    }

    function freezeReasonOptionLabel(reason) {
      return continuityFreezeReasonLabel(reason);
    }

    function freezeRangesOverlap(a, b) {
      return a.startDate <= b.endDate && a.endDate >= b.startDate;
    }

    function activeContinuityFreezes() {
      return normalizeContinuityFreezes(state.continuityFreezes).filter(item => item.status === 'active');
    }

    function activeContinuityFreezeForDate(dateIso) {
      return activeContinuityFreezes().find(item => item.startDate <= dateIso && item.endDate >= dateIso) || null;
    }

    window.renderFreezePeriodPreview = function() {
      const preview = document.getElementById('freezePeriodPreview');
      if (!preview) return;
      const startDate = document.getElementById('freezeStartDate')?.value || '';
      const endDate = document.getElementById('freezeEndDate')?.value || '';
      preview.textContent = startDate && endDate
        ? `Valgt periode: ${formatFullDate(startDate)} - ${formatFullDate(endDate)}`
        : 'Velg fra- og til-dato.';
    };

    function renderContinuityFreezeList() {
      const list = document.getElementById('continuityFreezeList');
      if (!list) return;
      const items = normalizeContinuityFreezes(state.continuityFreezes)
        .slice()
        .sort((a, b) => String(b.startDate || '').localeCompare(String(a.startDate || '')));
      list.innerHTML = items.length
        ? `
          <h3>Lagrede fryskort</h3>
          ${items.map(item => {
            const active = item.status === 'active';
            return `
              <div class="freeze-item ${active ? 'active' : 'archived'}">
                <div>
                  <strong>${escapeHtml(freezeReasonOptionLabel(item.reason))}</strong>
                  <small>${escapeHtml(formatShortDate(item.startDate))} - ${escapeHtml(formatShortDate(item.endDate))} · ${active ? 'aktiv' : 'arkivert'}</small>
                  ${item.note ? `<p>${escapeHtml(item.note)}</p>` : ''}
                  <p class="small-note">Dette beskytter kontinuiteten, men teller ikke som trening.</p>
                </div>
                <div class="item-actions">
                  ${active ? `<button class="btn-soft" onclick="archiveContinuityFreeze('${escapeHtml(item.id)}')">Arkiver</button>` : ''}
                  <button class="btn-soft danger" onclick="deleteContinuityFreeze('${escapeHtml(item.id)}')">Slett</button>
                </div>
              </div>`;
          }).join('')}`
        : '<p class="small-note">Ingen fryskort er registrert ennå.</p>';
    }

    window.openContinuityFreezeModal = function() {
      const today = todayISO();
      const start = document.getElementById('freezeStartDate');
      const end = document.getElementById('freezeEndDate');
      const reason = document.getElementById('freezeReason');
      const note = document.getElementById('freezeNote');
      if (start && !start.value) start.value = today;
      if (end && !end.value) end.value = today;
      if (reason && !reason.value) reason.value = 'sick';
      if (note) note.value = note.value || '';
      renderFreezePeriodPreview();
      renderContinuityFreezeList();
      document.getElementById('continuityFreezeModal')?.classList.add('active');
    };

    window.closeContinuityFreezeModal = function() {
      document.getElementById('continuityFreezeModal')?.classList.remove('active');
    };

    window.saveContinuityFreeze = async function() {
      const rules = getCoachRules();
      const startDate = document.getElementById('freezeStartDate')?.value || '';
      const endDate = document.getElementById('freezeEndDate')?.value || '';
      const reason = document.getElementById('freezeReason')?.value || 'sick';
      const note = document.getElementById('freezeNote')?.value || '';
      if (!startDate || !endDate) return alert('Velg fra- og til-dato.');
      if (endDate < startDate) return alert('Til-dato må være samme dag eller etter fra-dato.');
      const maxDays = Math.max(1, Math.round(Number(rules?.thresholds?.streakFreeze?.maxDaysPerFreeze) || 14));
      const frozenDays = continuityFreezeDays([{ id: 'draft', startDate, endDate, reason, note, status: 'active' }], startDate, endDate, { rules });
      if (frozenDays.length > maxDays) return alert(`Et fryskort kan maks dekke ${maxDays} dager i v1.`);
      const monthKey = startDate.slice(0, 7);
      const maxPerMonth = Math.max(1, Math.round(Number(rules?.thresholds?.streakFreeze?.maxActiveFreezesPerMonth) || 2));
      const sameMonthActive = activeContinuityFreezes().filter(item => item.startDate.slice(0, 7) === monthKey).length;
      if (sameMonthActive >= maxPerMonth) {
        return alert(`Du har allerede ${maxPerMonth} aktive fryskort denne måneden.`);
      }
      const now = new Date().toISOString();
      const draft = normalizeContinuityFreeze({
        id: uid('freeze'),
        startDate,
        endDate,
        reason,
        note,
        source: 'manual',
        status: 'active',
        createdAt: now,
        updatedAt: now
      }, { rules });
      if (!draft) return alert(reason === 'other' ? 'Legg inn et kort notat når årsaken er Annet.' : 'Fryskortet mangler gyldig informasjon.');
      const overlaps = activeContinuityFreezes().some(item => freezeRangesOverlap(item, draft));
      if (overlaps && !confirm('Perioden overlapper et annet aktivt fryskort. Fortsette?')) return;
      await safeStateWrite({
        apply: () => { state.continuityFreezes = normalizeContinuityFreezes([...(state.continuityFreezes || []), draft]); },
        write: () => fsSet('continuityFreezes', draft.id, draft),
        afterApply: () => {
          document.getElementById('freezeNote').value = '';
          renderFreezePeriodPreview();
          renderContinuityFreezeList();
        },
        successMessage: 'Fryskort lagret',
        errorMessage: 'Kunne ikke lagre fryskort'
      });
    };

    window.archiveContinuityFreeze = async function(id) {
      const freeze = normalizeContinuityFreezes(state.continuityFreezes).find(item => item.id === id);
      if (!freeze) return;
      if (!confirm('Arkivere dette fryskortet? Da beskytter det ikke lenger kontinuiteten.')) return;
      const updated = { ...freeze, status: 'archived', updatedAt: new Date().toISOString() };
      await safeStateWrite({
        apply: () => { state.continuityFreezes = normalizeContinuityFreezes(state.continuityFreezes).map(item => item.id === id ? updated : item); },
        write: () => fsSet('continuityFreezes', id, updated),
        afterApply: renderContinuityFreezeList,
        successMessage: 'Fryskort arkivert',
        errorMessage: 'Kunne ikke arkivere fryskort'
      });
    };

    window.deleteContinuityFreeze = async function(id) {
      const freeze = normalizeContinuityFreezes(state.continuityFreezes).find(item => item.id === id);
      if (!freeze) return;
      if (!confirm('Slette dette fryskortet permanent?')) return;
      await safeStateWrite({
        apply: () => { state.continuityFreezes = normalizeContinuityFreezes(state.continuityFreezes).filter(item => item.id !== id); },
        write: () => fsDelete('continuityFreezes', id),
        afterApply: renderContinuityFreezeList,
        successMessage: 'Fryskort slettet',
        errorMessage: 'Kunne ikke slette fryskort'
      });
    };

    // ── Auth ──────────────────────────────────────────────────────────────────
    document.getElementById('googleSignInBtn').addEventListener('click', async () => {
      try {
        await signInWithPopup(auth, new GoogleAuthProvider());
      } catch (err) {
        alert('Innlogging feilet: ' + err.message);
      }
    });

    async function doSignOut() {
      if (!confirm('Logg ut?')) return;
      await fbSignOut(auth);
    }

    document.getElementById('signOutBtn').addEventListener('click', doSignOut);
    document.getElementById('signOutBtn2').addEventListener('click', doSignOut);

    window.addEventListener('offline', () => {
      setSyncStatus(hasPendingLocalWrites ? 'pending' : 'offline');
    });

    window.addEventListener('online', async () => {
      if (!currentUser) {
        setSyncStatus('ok');
        return;
      }
      setSyncStatus('syncing');
      try {
        await loadFromFirestore();
        hasPendingLocalWrites = false;
        setSyncStatus('ok');
      } catch (err) {
        console.error('Online refresh error:', err);
        setSyncStatus('error');
      }
    });

    onAuthStateChanged(auth, async (user) => {
      authResolved = true;
      const loading = document.getElementById('loadingOverlay');
      const authScreen = document.getElementById('authScreen');
      const mainApp = document.getElementById('mainApp');

      if (user) {
        currentUser = user;
        offlineSnapshotMode = false;
        loading.classList.add('hidden');
        authScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        renderUserAvatar(user);
        document.getElementById('settingsUserEmail').textContent = `Innlogget som: ${user.email}`;
        await loadFromFirestore();
      } else {
        const savedAt = !navigator.onLine ? await loadLocalStateSnapshot() : null;
        if (savedAt) {
          currentUser = null;
          offlineSnapshotMode = true;
          loading.classList.add('hidden');
          authScreen.classList.add('hidden');
          mainApp.classList.remove('hidden');
          setSyncStatus('offline');
          const email = document.getElementById('settingsUserEmail');
          if (email) email.textContent = 'Offline-visning med siste lagrede kopi';
          render();
          return;
        }
        currentUser = null;
        offlineSnapshotMode = false;
        state = createEmptyAppState(state.settings);
        loading.classList.add('hidden');
        authScreen.classList.remove('hidden');
        mainApp.classList.add('hidden');
      }
    });

    function renderUserAvatar(user) {
      const btn = document.getElementById('userAvatarBtn');
      if (user.photoURL) {
        btn.innerHTML = `<img src="${escapeHtml(user.photoURL)}" class="user-avatar" id="avatarImg" alt="Bruker" />`;
        btn.querySelector('#avatarImg').addEventListener('click', toggleUserMenu);
      } else {
        const initials = (user.displayName || user.email || '?').slice(0,1).toUpperCase();
        btn.innerHTML = `<div class="user-avatar-placeholder" id="avatarPlaceholder">${escapeHtml(initials)}</div>`;
        btn.querySelector('#avatarPlaceholder').addEventListener('click', toggleUserMenu);
      }
      document.getElementById('userMenuName').textContent = user.displayName || '';
      document.getElementById('userMenuEmail').textContent = user.email || '';
    }

    function toggleUserMenu() {
      document.getElementById('userMenu').classList.toggle('hidden');
    }

    document.addEventListener('click', (e) => {
      const menu = document.getElementById('userMenu');
      const avatarBtn = document.getElementById('userAvatarBtn');
      if (menu && avatarBtn && !menu.contains(e.target) && !avatarBtn.contains(e.target)) {
        menu.classList.add('hidden');
      }
    });

    // ── Tabs ──────────────────────────────────────────────────────────────────
    window.openSetupSection = function(section = 'overview') {
      const overview = document.getElementById('setupOverview');
      const sections = {
        activityTypes: document.getElementById('setupActivityTypes'),
        intensities: document.getElementById('setupIntensities'),
        challenges: document.getElementById('setupChallenges'),
        goals: document.getElementById('setupGoals'),
        raceGoal: document.getElementById('setupRaceGoal'),
        trainingProfile: document.getElementById('setupTrainingProfile'),
        personProfile: document.getElementById('setupPersonProfile'),
        heartRateZones: document.getElementById('setupHeartRateZones'),
        wellness: document.getElementById('setupWellness'),
        garminImport: document.getElementById('setupGarminImport'),
        ai: document.getElementById('setupAi'),
        data: document.getElementById('setupData'),
        danger: document.getElementById('setupDanger')
      };
      Object.values(sections).forEach(el => el?.classList.add('hidden'));
      if (section === 'overview' || !sections[section]) {
        overview?.classList.remove('hidden');
      } else {
        overview?.classList.add('hidden');
        sections[section].classList.remove('hidden');
      }
      if (section === 'ai') ensureAiCoachUi().refreshStatus();
      document.getElementById('settings')?.scrollIntoView({ block: 'start' });
    };

    function scrollAppToTop() {
      window.requestAnimationFrame(() => {
        const scrollTarget = document.scrollingElement || document.documentElement || document.body;
        scrollTarget.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      });
    }

    window.showTab = function(tabId, btn = null) {
      const previousTab = document.querySelector('.tab.active')?.id || '';
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.getElementById(tabId).classList.add('active');
      document.getElementById('mainApp')?.classList.toggle('chat-mode', tabId === 'aiCoach');
      const navBtn = btn || document.querySelector(`nav button[data-tab="${tabId}"]`);
      const isMainNavTab = Boolean(navBtn);
      if (navBtn) {
        document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
        navBtn.classList.add('active');
      } else if (tabId === 'settings') {
        document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
      }
      document.getElementById('userMenu').classList.add('hidden');
      if (tabId === 'settings' && btn) openSetupSection('overview');
      render();
      if (isMainNavTab || previousTab === tabId) scrollAppToTop();
    };

    window.openSetupFromHeader = function() {
      showTab('settings');
      openSetupSection('overview');
      scrollAppToTop();
    };

    function ensureAiCoachUi() {
      if (aiCoachUi) return aiCoachUi;
      aiCoachUi = createAiCoachUi({
        client: aiCoachClient,
        appVersion: APP_VERSION,
        buildContext: buildCurrentAiCoachContext,
        navigate: tabId => {
          showTab(tabId);
          scrollAppToTop();
        },
        openSettings: () => {
          showTab('settings');
          openSetupSection('ai');
          scrollAppToTop();
        }
      });
      aiCoachUi.bind();
      return aiCoachUi;
    }

    window.openAiCoach = function() {
      ensureAiCoachUi().open();
    };

    window.openPlan = function(dateIso = '', allowBlocked = false) {
      showTab('plan');
      const requestedDate = dateIso || document.getElementById('planDate').value || todayISO();
      const date = !allowBlocked && isBlockedTrainingDate(requestedDate)
        ? nextAvailableTrainingDate(requestedDate)
        : requestedDate;
      document.getElementById('planDate').value = date;
      if (date !== requestedDate) showToast('Valgt dato er ikke treningsdag, så neste ledige dato er valgt', 'info');
    };

    window.openLibrary = function() {
      showTab('library');
    };

    // ── Settings ──────────────────────────────────────────────────────────────
    async function saveSettings() {
      try {
        state.settings = normalizeSettings(state.settings);
        await fsSet('settings', 'preferences', state.settings);
        render();
      } catch (err) {
        console.error('saveSettings failed:', err);
        showToast('Kunne ikke lagre innstillinger — sjekk tilkobling');
      }
    }

    window.addSettingOption = async function(kind) {
      const inputId = kind === 'activityTypes' ? 'newActivityType' : 'newIntensity';
      const input = document.getElementById(inputId);
      const value = input.value.trim();
      if (!value) return alert('Skriv inn et navn først.');
      const values = state.settings[kind] || [];
      if (values.some(v => v.toLowerCase() === value.toLowerCase())) {
        return alert('Dette valget finnes allerede.');
      }
      state.settings[kind] = [...values, value];
      input.value = '';
      await saveSettings();
    };

    window.deleteSettingOption = async function(kind, value) {
      const values = state.settings[kind] || [];
      if (values.length <= 1) return alert('Du må ha minst ett valg i listen.');
      if (!confirm(`Fjerne "${value}" fra listen? Eksisterende øktmaler blir ikke endret.`)) return;
      state.settings[kind] = values.filter(v => v !== value);
      await saveSettings();
    };

    window.saveTrainingGoals = async function() {
      state.settings.goals = normalizeGoals({
        weeklySessionsTarget: document.getElementById('weeklySessionsTarget').value,
        weeklyStretchSessionsTarget: document.getElementById('weeklyStretchSessionsTarget').value,
        weeklyHoursTarget: document.getElementById('weeklyHoursTarget').value,
        weeklyKmTarget: document.getElementById('weeklyKmTarget').value
      });
      await saveSettings();
      showToast('Treningsmål lagret');
    };

    window.saveRaceGoal = async function() {
      state.settings.raceGoal = normalizeRaceGoal({
        name: document.getElementById('raceGoalName').value,
        date: document.getElementById('raceGoalDate').value,
        distanceKm: document.getElementById('raceGoalDistance').value,
        targetTimeSeconds: getDurationSecondsFromFields('raceGoalTargetHours', 'raceGoalTargetMinutes', 'raceGoalTargetSeconds'),
        note: document.getElementById('raceGoalNote').value
      });
      await saveSettings();
      showToast('Mål-løp lagret');
    };

    window.clearRaceGoal = async function() {
      if (!confirm('Tømme mål-løp?')) return;
      state.settings.raceGoal = normalizeRaceGoal({});
      await saveSettings();
      showToast('Mål-løp tømt');
    };

    function manualRaceResultFormData() {
      const editingId = document.getElementById('manualRaceEditingId').value;
      return normalizeRaceResultEntry({
        id: editingId || uid('race'),
        date: document.getElementById('manualRaceDate').value,
        name: document.getElementById('manualRaceName').value,
        distanceKm: document.getElementById('manualRaceDistance').value,
        resultSeconds: getDurationSecondsFromFields('manualRaceHours', 'manualRaceMinutes', 'manualRaceSeconds'),
        course: document.getElementById('manualRaceCourse').value,
        note: document.getElementById('manualRaceNote').value,
        countsAsPersonalBest: true,
        source: 'manual',
        createdAt: editingId ? state.raceResults.find(item => item.id === editingId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    window.saveManualRaceResult = async function() {
      const result = manualRaceResultFormData();
      if (!result?.distanceKm || !result?.resultSeconds || !result?.date) {
        return alert('Legg inn dato, distanse og resultattid.');
      }
      const editingId = document.getElementById('manualRaceEditingId').value;
      await safeStateWrite({
        apply: () => {
          if (editingId) {
            const index = state.raceResults.findIndex(item => item.id === editingId);
            if (index >= 0) state.raceResults[index] = result;
          } else {
            state.raceResults.push(result);
          }
        },
        write: () => fsSet('raceResults', result.id, result),
        successMessage: editingId ? 'Race-resultat oppdatert' : 'Race-resultat lagret',
        errorMessage: 'Kunne ikke lagre race-resultat'
      });
      clearManualRaceResultForm();
    };

    window.editManualRaceResult = function(id) {
      const result = state.raceResults.find(item => item.id === id);
      if (!result) return;
      openManualRaceResultForm(result.distanceKm);
      document.getElementById('manualRaceEditingId').value = result.id;
      document.getElementById('manualRaceDistance').value = result.distanceKm || '';
      document.getElementById('manualRaceDate').value = result.date || '';
      setDurationFieldsFromSeconds('manualRaceHours', 'manualRaceMinutes', 'manualRaceSeconds', result.resultSeconds || 0);
      document.getElementById('manualRaceName').value = result.name || '';
      document.getElementById('manualRaceCourse').value = result.course || '';
      document.getElementById('manualRaceNote').value = result.note || '';
      document.getElementById('manualRaceSubmitBtn').textContent = 'Lagre endringer';
      document.getElementById('manualRaceCancelBtn').classList.remove('hidden');
    };

    window.deleteManualRaceResult = async function(id) {
      const result = state.raceResults.find(item => item.id === id);
      if (!result) return;
      if (!confirm(`Slette race-resultatet ${formatRaceTime(result.resultSeconds)} på ${raceDistanceLabel(result.distanceKm)}?`)) return;
      await safeStateWrite({
        apply: () => { state.raceResults = state.raceResults.filter(item => item.id !== id); },
        write: () => fsDelete('raceResults', id),
        successMessage: 'Race-resultat slettet',
        errorMessage: 'Kunne ikke slette race-resultat'
      });
    };

    window.clearManualRaceResultForm = function() {
      document.getElementById('manualRaceEditingId').value = '';
      ['manualRaceDistance', 'manualRaceDate', 'manualRaceHours', 'manualRaceMinutes', 'manualRaceSeconds', 'manualRaceName', 'manualRaceCourse', 'manualRaceNote']
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
      document.getElementById('manualRaceSubmitBtn').textContent = 'Lagre resultat';
      document.getElementById('manualRaceCancelBtn').classList.add('hidden');
    };

    window.openManualRaceResultForm = function(distanceKm = '') {
      showTab('settings');
      openSetupSection('raceGoal');
      const manualPanel = document.getElementById('manualRacePanel');
      if (manualPanel) manualPanel.open = true;
      if (distanceKm) document.getElementById('manualRaceDistance').value = distanceKm;
      const field = document.getElementById('manualRaceDistance');
      field?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      field?.focus();
    };

    window.saveTrainingProfile = async function() {
      state.settings.trainingProfile = normalizeTrainingProfile({
        primaryFocus: document.getElementById('profilePrimaryFocus').value,
        level: document.getElementById('profileLevel').value,
        philosophy: document.getElementById('profilePhilosophy').value,
        priority: document.getElementById('profilePriority').value,
        trainingFocus: document.getElementById('profileRunningPhase').value,
        weekPlanPreset: document.getElementById('profileWeekPlanPreset').value,
        weekPlanRoles: [1, 2, 3, 4].map(index => document.getElementById(`profileWeekRole${index}`)?.value || '')
      });
      await saveSettings();
      showToast('Treningsprofil lagret');
    };

    window.applyWeekPlanPreset = function(preset) {
      const roles = WEEK_PLAN_PRESETS[preset];
      if (!roles) return;
      roles.forEach((role, index) => {
        const select = document.getElementById(`profileWeekRole${index + 1}`);
        if (select) select.value = role;
      });
    };

    window.markWeekPlanCustom = function() {
      const preset = document.getElementById('profileWeekPlanPreset');
      if (preset) preset.value = 'custom';
    };

    window.savePersonProfile = async function() {
      state.settings.personProfile = normalizePersonProfile({
        name: document.getElementById('personName').value.trim(),
        birthYear: document.getElementById('personBirthYear').value,
        sex: document.getElementById('personSex').value,
        heightCm: document.getElementById('personHeightCm').value,
        weightKg: document.getElementById('personWeightKg').value,
        maxHeartRate: document.getElementById('personMaxHeartRate').value,
        thresholdHeartRate: document.getElementById('personThresholdHeartRate').value
      });
      await saveSettings();
      showToast('Personprofil lagret');
    };

    let heartRateZonesUi = null;

    function getHeartRateZonesUi() {
      if (!heartRateZonesUi) {
        heartRateZonesUi = createHeartRateZonesUi({
          getState: () => state,
          escapeHtml,
          formatDate
        });
      }
      return heartRateZonesUi;
    }

    window.clearHeartRateZoneForm = function() {
      getHeartRateZonesUi().clearForm();
    };

    window.editHeartRateZoneSet = function(id) {
      const zoneSet = (state.heartRateZoneSets || []).find(item => item.id === id);
      if (!zoneSet) return;
      getHeartRateZonesUi().fillForm(zoneSet);
      document.getElementById('heartRateZoneSetName')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    };

    window.saveHeartRateZoneSet = async function() {
      const result = getHeartRateZonesUi().readForm();
      if (!result.ok) return alert(result.error);
      const now = new Date().toISOString();
      const existing = (state.heartRateZoneSets || []).find(item => item.id === result.editingId);
      const saved = normalizeHeartRateZoneSet({
        ...result.data,
        id: result.editingId || uid('heart-rate-zones'),
        createdAt: existing?.createdAt || now,
        updatedAt: now
      });
      const current = normalizeHeartRateZoneSets(state.heartRateZoneSets);
      const next = current
        .filter(item => item.id !== saved.id)
        .map(item => saved.active ? { ...item, active: false, updatedAt: now } : item)
        .concat(saved);
      const changed = next.filter(item => {
        const previous = current.find(candidate => candidate.id === item.id);
        return !previous || JSON.stringify(previous) !== JSON.stringify(item);
      });
      await safeStateWrite({
        apply: () => {
          state.heartRateZoneSets = normalizeHeartRateZoneSets(next);
        },
        write: () => Promise.all(changed.map(item => fsSet('heartRateZoneSets', item.id, item))),
        afterApply: () => getHeartRateZonesUi().clearForm(),
        successMessage: saved.active ? 'Pulssoner lagret og aktivert' : 'Pulssoner lagret',
        errorMessage: 'Kunne ikke lagre pulssonene'
      });
    };

    window.activateHeartRateZoneSet = async function(id) {
      const current = normalizeHeartRateZoneSets(state.heartRateZoneSets);
      const selected = current.find(item => item.id === id);
      if (!selected || selected.active) return;
      const now = new Date().toISOString();
      const next = current.map(item => ({ ...item, active: item.id === id, updatedAt: now }));
      const changed = next.filter(item => {
        const previous = current.find(candidate => candidate.id === item.id);
        return previous?.active !== item.active;
      });
      await safeStateWrite({
        apply: () => {
          state.heartRateZoneSets = normalizeHeartRateZoneSets(next);
        },
        write: () => Promise.all(changed.map(item => fsSet('heartRateZoneSets', item.id, item))),
        successMessage: `${selected.name} er nå aktiv`,
        errorMessage: 'Kunne ikke aktivere pulssonene'
      });
    };

    window.deleteHeartRateZoneSet = async function(id) {
      const zoneSet = (state.heartRateZoneSets || []).find(item => item.id === id);
      if (!zoneSet) return;
      const warning = zoneSet.active
        ? 'Dette er den aktive pulssoneprofilen. Sletter du den, har appen ingen aktive testsoner. Fortsette?'
        : `Slette pulssoneprofilen «${zoneSet.name}»?`;
      if (!confirm(warning)) return;
      await safeStateWrite({
        apply: () => {
          state.heartRateZoneSets = (state.heartRateZoneSets || []).filter(item => item.id !== id);
        },
        write: () => fsDelete('heartRateZoneSets', id),
        afterApply: () => getHeartRateZonesUi().clearForm(),
        successMessage: 'Pulssoneprofil slettet',
        errorMessage: 'Kunne ikke slette pulssoneprofilen'
      });
    };

    window.clearWellnessForm = function() {
      document.getElementById('wellnessEditingId').value = '';
      document.getElementById('wellnessDate').value = todayISO();
      document.getElementById('wellnessVo2Max').value = '';
      document.getElementById('wellnessHrv7d').value = '';
      document.getElementById('wellnessRestingHr7d').value = '';
      document.getElementById('wellnessSubmitBtn').textContent = 'Lagre måling';
      document.getElementById('cancelEditWellnessBtn').classList.add('hidden');
    };

    window.saveWellnessMeasurement = async function() {
      const date = document.getElementById('wellnessDate').value || todayISO();
      const vo2Max = normalizeGoalNumber(document.getElementById('wellnessVo2Max').value, '');
      const hrv7d = normalizeGoalNumber(document.getElementById('wellnessHrv7d').value, '');
      const restingHeartRate7d = normalizeGoalNumber(document.getElementById('wellnessRestingHr7d').value, '');
      if (vo2Max === '' && hrv7d === '' && restingHeartRate7d === '') return alert('Legg inn VO2 Max, HRV, hvilepuls eller flere av disse.');

      const editingId = document.getElementById('wellnessEditingId').value;
      const measurement = {
        id: editingId || uid('wellness'),
        date,
        vo2Max,
        hrv7d,
        restingHeartRate7d,
        createdAt: editingId ? state.wellness.find(item => item.id === editingId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      clearWellnessForm();
      await safeStateWrite({
        apply: () => {
          if (editingId) {
            const index = state.wellness.findIndex(item => item.id === editingId);
            if (index >= 0) state.wellness[index] = measurement;
          } else {
            state.wellness.push(measurement);
          }
          state.wellness.sort((a, b) => b.date.localeCompare(a.date));
        },
        write: () => fsSet('wellness', measurement.id, measurement),
        successMessage: editingId ? 'Formmåling oppdatert' : 'Formmåling lagret',
        errorMessage: 'Kunne ikke lagre formmålingen'
      });
    };

    window.editWellnessMeasurement = function(id) {
      const item = state.wellness.find(entry => entry.id === id);
      if (!item) return;
      document.getElementById('wellnessEditingId').value = item.id;
      document.getElementById('wellnessDate').value = item.date || todayISO();
      document.getElementById('wellnessVo2Max').value = item.vo2Max || '';
      document.getElementById('wellnessHrv7d').value = item.hrv7d || '';
      document.getElementById('wellnessRestingHr7d').value = item.restingHeartRate7d || '';
      document.getElementById('wellnessSubmitBtn').textContent = 'Lagre endringer';
      document.getElementById('cancelEditWellnessBtn').classList.remove('hidden');
      showTab('settings');
    };

    window.deleteWellnessMeasurement = async function(id) {
      const item = state.wellness.find(entry => entry.id === id);
      if (!item) return;
      if (!confirm(`Slette formmåling fra ${formatDate(item.date)}?`)) return;
      await safeStateWrite({
        apply: () => { state.wellness = state.wellness.filter(entry => entry.id !== id); },
        write: () => fsDelete('wellness', id),
        successMessage: 'Formmåling slettet',
        errorMessage: 'Kunne ikke slette formmålingen'
      });
    };

    // ── Templates ─────────────────────────────────────────────────────────────
    function setSelectOptions(selectId, values, selectedValue = '') {
      const select = document.getElementById(selectId);
      const options = selectedValue && !values.includes(selectedValue) ? [...values, selectedValue] : values;
      select.innerHTML = options.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
      if (selectedValue) select.value = selectedValue;
    }

    let workoutTemplateUi = null;
    let exerciseLibraryUi = null;

    function getWorkoutTemplateUi() {
      if (!workoutTemplateUi) {
        workoutTemplateUi = createWorkoutTemplateUi({
          getState: () => state,
          buildStructuredWorkout,
          structuredWorkoutBreakdown,
          structuredWorkoutSummary,
          parseNonNegativeInteger,
          formatDuration,
          escapeHtml,
          uniqueValues,
          getCheckedValues,
          setCheckedValues,
          setSelectOptions,
          roleLabel: templateRoleLabel,
          purposeLabel: templatePurposeLabel,
          loadLabel: templateLoadLabel
        });
      }
      return workoutTemplateUi;
    }

    function templateSelectOptions(options = {}) {
      return getWorkoutTemplateUi().selectOptions(options);
    }

    function structuredWorkoutSummaryHtml(structuredWorkout) {
      return getWorkoutTemplateUi().structuredWorkoutSummaryHtml(structuredWorkout);
    }

    function exercisePlanSummaryHtml(exercisePlan) {
      return getWorkoutTemplateUi().exercisePlanSummaryHtml(exercisePlan);
    }

    function getExerciseLibraryUi() {
      if (!exerciseLibraryUi) {
        exerciseLibraryUi = createExerciseLibraryUi({
          getState: () => state,
          escapeHtml
        });
      }
      return exerciseLibraryUi;
    }

    function renderStructuredWorkoutPreview() {
      getWorkoutTemplateUi().renderStructuredWorkoutPreview();
    }

    window.toggleStructuredWorkoutFields = function() {
      getWorkoutTemplateUi().toggleStructuredWorkoutFields();
    };

    window.toggleTemplateStrengthFields = function() {
      getWorkoutTemplateUi().toggleStrengthFields();
    };

    window.addTemplateStrengthExercise = function() {
      getWorkoutTemplateUi().addStrengthExercise();
    };

    window.addTemplateExercise = function(type) {
      getWorkoutTemplateUi().addExercise(type);
    };

    window.updateTemplateStrengthExercise = function(index, field, value) {
      getWorkoutTemplateUi().updateStrengthExercise(index, field, value);
    };

    window.removeTemplateStrengthExercise = function(index) {
      getWorkoutTemplateUi().removeStrengthExercise(index);
    };

    window.updateTemplateExercise = function(type, index, field, value) {
      getWorkoutTemplateUi().updateExercise(type, index, field, value);
    };

    window.removeTemplateExercise = function(type, index) {
      getWorkoutTemplateUi().removeExercise(type, index);
    };

    window.saveExercise = async function() {
      const form = getExerciseLibraryUi().readForm();
      if (!form.ok) return alert(form.error);
      const now = new Date().toISOString();
      const existing = form.editingId
        ? state.exercises.find(exercise => exercise.id === form.editingId)
        : null;
      if (form.editingId && !existing) return alert('Fant ikke øvelsen.');
      const exercise = normalizeExercise({
        ...existing,
        ...form.data,
        id: form.editingId || uid('exercise'),
        createdAt: existing?.createdAt || now,
        updatedAt: now
      });
      getExerciseLibraryUi().clearForm();
      await safeStateWrite({
        apply: () => {
          const index = state.exercises.findIndex(item => item.id === exercise.id);
          if (index >= 0) state.exercises[index] = exercise;
          else state.exercises.push(exercise);
        },
        write: () => fsSet('exercises', exercise.id, exercise),
        successMessage: form.editingId ? 'Øvelse oppdatert' : 'Øvelse lagret',
        errorMessage: 'Kunne ikke lagre øvelsen'
      });
    };

    window.editExercise = function(id) {
      const exercise = state.exercises.find(item => item.id === id);
      if (!exercise) return;
      getWorkoutTemplateUi().setWorkspace('exercises');
      getExerciseLibraryUi().fillForm(exercise);
    };

    window.cancelEditExercise = function() {
      getExerciseLibraryUi().clearForm();
    };

    window.setTrainingLibraryView = function(view) {
      const selected = getWorkoutTemplateUi().setWorkspace(view);
      if (selected === 'exercises') getExerciseLibraryUi().renderLibrary();
    };

    window.openNewTemplateForm = function() {
      getWorkoutTemplateUi().startNewForm();
    };

    window.openNewExerciseForm = function() {
      getWorkoutTemplateUi().setWorkspace('exercises');
      getExerciseLibraryUi().startNewForm();
    };

    window.deleteExercise = async function(id) {
      if (!confirm('Slette øvelsen fra biblioteket? Eksisterende øktmaler beholder sitt lagrede snapshot.')) return;
      await safeStateWrite({
        apply: () => { state.exercises = state.exercises.filter(item => item.id !== id); },
        write: () => fsDelete('exercises', id),
        successMessage: 'Øvelse slettet',
        errorMessage: 'Kunne ikke slette øvelsen'
      });
    };

    window.saveTemplate = async function() {
      const form = getWorkoutTemplateUi().readForm();
      if (!form.ok) return alert(form.error);
      const { editingId, data: templateData } = form;
      let savedTemplate = null;
      if (editingId) {
        const idx = state.templates.findIndex(t => t.id === editingId);
        if (idx === -1) return alert('Fant ikke øktmalen.');
        savedTemplate = { ...state.templates[idx], ...templateData, updatedAt: new Date().toISOString() };
      } else {
        savedTemplate = { id: uid('template'), ...templateData, createdAt: todayISO() };
      }
      savedTemplate = normalizeTemplate(savedTemplate);
      getWorkoutTemplateUi().clearForm();
      await safeStateWrite({
        apply: () => {
          if (editingId) {
            const idx = state.templates.findIndex(t => t.id === editingId);
            if (idx >= 0) state.templates[idx] = savedTemplate;
          } else {
            state.templates.push(savedTemplate);
          }
        },
        write: () => fsSet('templates', savedTemplate.id, savedTemplate),
        successMessage: editingId ? 'Øktmal oppdatert' : 'Øktmal lagret',
        errorMessage: 'Kunne ikke lagre øktmalen'
      });
    };

    window.editTemplate = function(id) {
      const t = state.templates.find(t => t.id === id);
      if (!t) return;
      getWorkoutTemplateUi().fillForm(t);
    };

    window.cancelEditTemplate = function() { getWorkoutTemplateUi().clearForm(); };

    window.deleteTemplate = async function(id) {
      if (!confirm('Slette denne øktmalen? Planlagte økter blir ikke slettet.')) return;
      await safeStateWrite({
        apply: () => { state.templates = state.templates.filter(t => t.id !== id); },
        write: () => fsDelete('templates', id),
        successMessage: 'Øktmal slettet',
        errorMessage: 'Kunne ikke slette øktmalen'
      });
    };

    window.addBakkenStandardTemplates = async function() {
      if (blockOfflineSnapshotWrite()) {
        alert('Standardmaler kan ikke legges inn mens appen kun viser lagret offline-kopi. Åpne appen med nett først.');
        return;
      }
      const existingKeys = new Set(state.templates.map(t => `${String(t.name || '').trim().toLowerCase()}|${String(t.type || '').trim().toLowerCase()}`));
      const now = new Date().toISOString();
      const templatesToAdd = BAKKEN_STANDARD_TEMPLATES
        .filter(template => !existingKeys.has(`${template.name.toLowerCase()}|${template.type.toLowerCase()}`))
        .map(template => normalizeTemplate({
          id: uid('template'),
          ...template,
          standardSource: 'bakken_v1',
          createdAt: todayISO(),
          updatedAt: now
        }));

      if (!templatesToAdd.length) {
        showToast('Alle standardmalene finnes allerede');
        return;
      }

      if (!confirm(`Legge inn ${templatesToAdd.length} Bakken-inspirerte standardmaler i øktbiblioteket? Eksisterende maler beholdes.`)) return;

      const newTypes = uniqueValues(templatesToAdd.map(t => t.type).filter(type => !state.settings.activityTypes.includes(type)));
      const newIntensities = uniqueValues(templatesToAdd.map(t => t.intensity).filter(intensity => !state.settings.intensities.includes(intensity)));
      if (newTypes.length || newIntensities.length) {
        state.settings = {
          ...state.settings,
          activityTypes: uniqueValues([...state.settings.activityTypes, ...newTypes]),
          intensities: uniqueValues([...state.settings.intensities, ...newIntensities])
        };
        await fsSet('settings', 'preferences', state.settings);
      }

      state.templates.push(...templatesToAdd);
      render();
      await Promise.all(templatesToAdd.map(template => fsSet('templates', template.id, template)));
      showToast(`${templatesToAdd.length} standardmaler lagt inn`);
    };

    // ── Plan ──────────────────────────────────────────────────────────────────
    window.toggleRepeatOptions = function() {
      const repeat = document.getElementById('planRepeat').value;
      const weeksWrapper = document.getElementById('planRepeatWeeksWrapper');
      if (weeksWrapper) weeksWrapper.style.display = repeat === 'none' ? 'none' : '';
      document.getElementById('planRepeatWeeks').disabled = repeat === 'none';
      document.getElementById('customRepeatWrapper').classList.toggle('hidden', repeat !== 'custom');
    };

    window.addPlannedWorkout = async function() {
      const templateId = document.getElementById('planTemplate').value;
      const date = document.getElementById('planDate').value;
      const notes = document.getElementById('planNotes').value.trim();
      const repeat = document.getElementById('planRepeat').value;
      const repeatWeeks = Number(document.getElementById('planRepeatWeeks').value || 1);
      const customInterval = Number(document.getElementById('planRepeatInterval').value || 1);

      if (!templateId) return alert('Du må først lage eller velge en øktmal.');
      if (!date) return alert('Velg dato.');
      const blockedDate = blockedDayForDate(date);
      if (repeat === 'none' && blockedDate && !confirm(`${formatDate(date)} er markert som ikke treningsdag (${blockedDayLabel(blockedDate)}). Planlegge økt likevel?`)) return;

      let intervalWeeks = 0;
      if (repeat === 'weekly') intervalWeeks = 1;
      if (repeat === 'biweekly') intervalWeeks = 2;
      if (repeat === 'custom') intervalWeeks = Math.max(1, customInterval);

      const plannedGroupId = uid('group');
      const workoutsToAdd = [];
      const templateSnapshot = templateSnapshotFromTemplate(getTemplate(templateId));

      if (repeat === 'none') {
        workoutsToAdd.push({ id: uid('planned'), templateId, templateSnapshot, date, status: 'planned', notes, repeatGroupId: null, createdAt: todayISO() });
      } else {
        if (!repeatWeeks || repeatWeeks < 1) return alert('Velg antall uker frem i tid.');
        for (let weekOffset = 0; weekOffset <= repeatWeeks; weekOffset += intervalWeeks) {
          const plannedDate = addDays(date, weekOffset * 7);
          if (isBlockedTrainingDate(plannedDate)) continue;
          workoutsToAdd.push({
            id: uid('planned'), templateId, templateSnapshot, date: plannedDate,
            status: 'planned', notes, repeatGroupId: plannedGroupId,
            repeatRule: { type: repeat, intervalWeeks, totalWeeks: repeatWeeks },
            createdAt: todayISO()
          });
        }
      }
      if (!workoutsToAdd.length) return alert('Alle datoene i repetisjonen er markert som ikke treningsdager.');

      document.getElementById('planNotes').value = '';
      document.getElementById('planRepeat').value = 'none';
      document.getElementById('planRepeatWeeks').value = 8;
      document.getElementById('planRepeatInterval').value = 1;
      toggleRepeatOptions();
      await safeStateWrite({
        apply: () => { state.planned.push(...workoutsToAdd); },
        write: () => fsBatchSet('planned', workoutsToAdd),
        successMessage: workoutsToAdd.length > 1 ? `${workoutsToAdd.length} økter planlagt` : 'Økt planlagt',
        errorMessage: 'Kunne ikke planlegge økten'
      });
    };

    window.deletePlanned = async function(id) {
      if (!confirm('Slette planlagt økt?')) return;
      await safeStateWrite({
        apply: () => { state.planned = state.planned.filter(p => p.id !== id); },
        write: () => fsDelete('planned', id),
        afterApply: () => {
          if (document.getElementById('calendarDayModal')?.classList.contains('active') && selectedCalendarDate()) {
            openCalendarDayModal(selectedCalendarDate());
          }
          if (document.getElementById('workoutDetailModal')?.classList.contains('active')) {
            closeWorkoutDetailModal();
          }
        },
        successMessage: 'Planlagt økt slettet',
        errorMessage: 'Kunne ikke slette planlagt økt'
      });
    };

    // ── Reschedule ────────────────────────────────────────────────────────────
    function daysBetween(oldDate, newDate) {
      return Math.round((new Date(`${newDate}T12:00:00`) - new Date(`${oldDate}T12:00:00`)) / 86400000);
    }

    window.openRescheduleModal = function(plannedId) {
      const p = state.planned.find(p => p.id === plannedId);
      if (!p) return;
      document.getElementById('reschedulePlannedId').value = plannedId;
      document.getElementById('rescheduleOldDate').value = p.date;
      document.getElementById('rescheduleNewDate').value = p.date;
      document.getElementById('rescheduleShiftFollowing').checked = true;
      document.getElementById('rescheduleModal').classList.add('active');
    };

    window.closeRescheduleModal = function() {
      document.getElementById('rescheduleModal').classList.remove('active');
    };

    window.rescheduleWorkout = async function() {
      const plannedId = document.getElementById('reschedulePlannedId').value;
      const oldDate = document.getElementById('rescheduleOldDate').value;
      const newDate = document.getElementById('rescheduleNewDate').value;
      const shiftFollowing = document.getElementById('rescheduleShiftFollowing').checked;
      const planned = state.planned.find(p => p.id === plannedId);
      if (!planned) return alert('Fant ikke økten.');
      if (!newDate) return alert('Velg ny dato.');
      const blockedDate = blockedDayForDate(newDate);
      if (blockedDate && !confirm(`${formatDate(newDate)} er markert som ikke treningsdag (${blockedDayLabel(blockedDate)}). Flytte økten dit likevel?`)) return;

      const diffDays = daysBetween(oldDate, newDate);
      if (diffDays === 0) { closeRescheduleModal(); return; }

      closeRescheduleModal();
      const toUpdate = [];
      await safeStateWrite({
        apply: () => {
          if (shiftFollowing) {
            state.planned.forEach(p => {
              if (p.status !== 'done' && p.date >= oldDate) {
                p.date = addDays(p.date, diffDays);
                p.updatedAt = new Date().toISOString();
                toUpdate.push(p);
              }
            });
          } else {
            const item = state.planned.find(p => p.id === plannedId);
            if (item) {
              item.date = newDate;
              item.updatedAt = new Date().toISOString();
              toUpdate.push(item);
            }
          }
        },
        write: () => fsBatchSet('planned', toUpdate),
        successMessage: 'Økt flyttet',
        errorMessage: 'Kunne ikke flytte økten'
      });
    };

    // ── Complete ──────────────────────────────────────────────────────────────
    let workoutCompletionUi = null;

    function getWorkoutCompletionUi() {
      if (!workoutCompletionUi) {
        workoutCompletionUi = createWorkoutCompletionUi({
          getState: () => state,
          calculatePaceMetrics,
          formatDuration,
          formatAreaLabel,
          heartRateReferenceForZoneSet,
          normalizeRaceResult,
          trainingEffectCategory
        });
      }
      return workoutCompletionUi;
    }

    function clearCompleteForm() {
      getWorkoutCompletionUi().clearForm();
    }

    function renderCompleteGoldenZoneHint() {
      getWorkoutCompletionUi().renderGoldenZoneHint();
    }

    function setCompleteModalMode(mode) {
      getWorkoutCompletionUi().setMode(mode);
    }

    function completedFormData() {
      return getWorkoutCompletionUi().readFormData();
    }

    function getDurationSecondsFromForm() {
      return getWorkoutCompletionUi().durationFromForm();
    }

    function getDurationSecondsFromFields(hoursId, minutesId, secondsId) {
      const hours = parseNonNegativeInteger(document.getElementById(hoursId)?.value);
      const minutes = parseNonNegativeInteger(document.getElementById(minutesId)?.value);
      const seconds = parseNonNegativeInteger(document.getElementById(secondsId)?.value);
      return (hours * 3600) + (Math.min(minutes, 59) * 60) + Math.min(seconds, 59);
    }

    function setDurationFormFromSeconds(totalSeconds) {
      getWorkoutCompletionUi().setDuration(totalSeconds);
    }

    function setDurationFieldsFromSeconds(hoursId, minutesId, secondsId, totalSeconds) {
      const secondsTotal = parseNonNegativeInteger(totalSeconds);
      const hours = Math.floor(secondsTotal / 3600);
      const minutes = Math.floor((secondsTotal % 3600) / 60);
      const seconds = secondsTotal % 60;
      document.getElementById(hoursId).value = hours || '';
      document.getElementById(minutesId).value = minutes || '';
      document.getElementById(secondsId).value = seconds || '';
    }

    function updatePacePreview() {
      getWorkoutCompletionUi().updatePacePreview();
    }

    function completedDurationLabel(completed) {
      if (completed.durationSeconds) return formatDuration(completed.durationSeconds);
      if (completed.durationDisplay) return completed.durationDisplay;
      if (completed.durationMinutes) return `${completed.durationMinutes} min`;
      return '';
    }

    function completedPaceMetrics(completed) {
      if (completed.averageSpeedKmh || completed.paceDisplay) {
        return {
          averageSpeedKmh: completed.averageSpeedKmh || '',
          paceDisplay: completed.paceDisplay || ''
        };
      }
      return calculatePaceMetrics(
        completed.durationSeconds || (completed.durationMinutes ? Number(completed.durationMinutes) * 60 : 0),
        completed.distanceKm
      );
    }

    function heartRateReferenceForZoneSet(zoneSet = null) {
      const personProfile = normalizePersonProfile(state.settings.personProfile);
      const trainingProfile = normalizeTrainingProfile(state.settings.trainingProfile);
      return heartRateReferenceContext({
        zoneSet: zoneSet || activeHeartRateZoneSet(state.heartRateZoneSets),
        maxHeartRate: personProfile.maxHeartRate,
        thresholdHeartRate: personProfile.thresholdHeartRate,
        trainingLevel: trainingProfile.level,
        rules: getCoachRules()
      });
    }

    function heartRateReferenceForCompleted(completed = {}) {
      const distribution = normalizeHeartRateZoneDistribution(completed.heartRateZoneDistribution);
      return heartRateReferenceForZoneSet(distribution?.zoneSetSnapshot || null);
    }

    function executionLabel(value) {
      const labels = {
        as_planned: 'Som planlagt',
        shorter: 'Kortere',
        easier: 'Lettere',
        harder: 'Hardere',
        changed: 'Endret',
        aborted: 'Avbrutt'
      };
      return labels[value] || '';
    }

    function feelingLabel(value) {
      const labels = {
        '1': 'Veldig tung',
        '2': 'Tung',
        '3': 'OK',
        '4': 'Bra',
        '5': 'Veldig bra'
      };
      return labels[value] ? `${value}/5 - ${labels[value]}` : '';
    }

    function scale5Label(value, labels) {
      if (!value) return '';
      return `${value}/5 (${labels[value] || 'OK'})`;
    }

    function painScaleLabel(value) {
      if (value === '' || value === null || value === undefined) return '';
      const num = Number(value);
      let label = 'moderat';
      if (num === 0) label = 'ingen';
      else if (num <= 2) label = 'lett';
      else if (num <= 4) label = 'merkbar';
      else if (num <= 6) label = 'moderat';
      else if (num <= 8) label = 'høy';
      else label = 'svært høy';
      return `${value}/10 (${label})`;
    }

    function readinessLabel(readiness = {}) {
      const energyLabels = { '1': 'lav', '2': 'litt lav', '3': 'OK', '4': 'bra', '5': 'høy' };
      const legsLabels = { '1': 'tunge', '2': 'litt tunge', '3': 'OK', '4': 'bra', '5': 'lette' };
      const sleepLabels = { '1': 'dårlig', '2': 'litt dårlig', '3': 'OK', '4': 'bra', '5': 'god' };
      const stressLabels = { '1': 'lavt', '2': 'litt lavt', '3': 'OK', '4': 'høyt', '5': 'veldig høyt' };
      const parts = [
        readiness.energy ? `Energi ${scale5Label(readiness.energy, energyLabels)}` : null,
        readiness.legs ? `Ben ${scale5Label(readiness.legs, legsLabels)}` : null,
        readiness.sleep ? `Søvn ${scale5Label(readiness.sleep, sleepLabels)}` : null,
        readiness.stress ? `Stress ${scale5Label(readiness.stress, stressLabels)}` : null
      ].filter(Boolean);
      return parts.join(' · ');
    }

    function adaptationLabel(value) {
      const labels = {
        none: 'Ingen',
        shorter: 'Kortere',
        easier: 'Roligere',
        alternative: 'Alternativ økt',
        aborted: 'Avbrutt'
      };
      return labels[value] || '';
    }

    function bodyStatusLabel(bodyStatus = {}) {
      const parts = [
        bodyStatus.painBefore ? `Smerte før ${painScaleLabel(bodyStatus.painBefore)}` : null,
        bodyStatus.painAfter ? `Smerte etter ${painScaleLabel(bodyStatus.painAfter)}` : null,
        bodyStatus.area ? `Område: ${bodyStatus.area}` : null,
        bodyStatus.adaptation && bodyStatus.adaptation !== 'none' ? `Tilpasning: ${adaptationLabel(bodyStatus.adaptation)}` : null
      ].filter(Boolean);
      return parts.join(' · ');
    }

    function trainingEffectInfo(type) {
      const effects = {
        recovery: { label: 'Recovery', category: 'low_aerobic', categoryLabel: 'Low Aerobic', className: 'effect-low' },
        base: { label: 'Base', category: 'low_aerobic', categoryLabel: 'Low Aerobic', className: 'effect-low' },
        tempo: { label: 'Tempo', category: 'high_aerobic', categoryLabel: 'High Aerobic', className: 'effect-high' },
        threshold: { label: 'Threshold', category: 'high_aerobic', categoryLabel: 'High Aerobic', className: 'effect-high' },
        vo2_max: { label: 'VO2 Max', category: 'high_aerobic', categoryLabel: 'High Aerobic', className: 'effect-high' },
        anaerobic_capacity: { label: 'Anaerobic Capacity', category: 'anaerobic', categoryLabel: 'Anaerobic', className: 'effect-anaerobic' },
        sprint: { label: 'Sprint', category: 'anaerobic', categoryLabel: 'Anaerobic', className: 'effect-anaerobic' }
      };
      return effects[type] || null;
    }

    function trainingEffectCategory(type) {
      return trainingEffectInfo(type)?.category || '';
    }

    function trainingEffectTag(type) {
      const info = trainingEffectInfo(type);
      if (!info) return '';
      return `<span class="tag ${info.className}">${escapeHtml(info.label)}</span>`;
    }

    function numberOrZero(value) {
      return Number(String(value || '').replace(',', '.')) || 0;
    }

    function heartRateLoadSignals(completed, profile = normalizePersonProfile(state.settings.personProfile)) {
      const avgHr = numberOrZero(completed.avgHeartRate);
      const workoutMaxHr = numberOrZero(completed.maxHeartRate);
      const profileMaxHr = numberOrZero(profile.maxHeartRate);
      const thresholdHr = numberOrZero(profile.thresholdHeartRate);
      const rpe = numberOrZero(completed.rpe);
      const reasons = [];
      let score = 0;
      let highPulse = false;
      let calmPulse = false;

      if (avgHr && thresholdHr) {
        const thresholdPct = avgHr / thresholdHr;
        if (thresholdPct >= 1.02) {
          score += 3;
          highPulse = true;
          reasons.push(`snittpuls ${Math.round(thresholdPct * 100)}% av terskel`);
        } else if (thresholdPct >= 0.97) {
          score += 2;
          highPulse = true;
          reasons.push(`snittpuls tett på terskel (${Math.round(thresholdPct * 100)}%)`);
        } else if (thresholdPct >= 0.92) {
          score += 1;
          reasons.push(`snittpuls kontrollert høy (${Math.round(thresholdPct * 100)}% terskel)`);
        } else if (thresholdPct <= 0.82 && rpe > 0 && rpe <= 3) {
          score -= 1;
          calmPulse = true;
          reasons.push('lav puls og lav RPE');
        }
      } else if (avgHr && profileMaxHr) {
        const maxPct = avgHr / profileMaxHr;
        if (maxPct >= 0.88) {
          score += 2;
          highPulse = true;
          reasons.push(`snittpuls ${Math.round(maxPct * 100)}% av maks`);
        } else if (maxPct >= 0.82) {
          score += 1;
          reasons.push(`snittpuls ${Math.round(maxPct * 100)}% av maks`);
        } else if (maxPct <= 0.72 && rpe > 0 && rpe <= 3) {
          score -= 1;
          calmPulse = true;
          reasons.push('lav puls og lav RPE');
        }
      }

      if (workoutMaxHr && profileMaxHr) {
        const maxPct = workoutMaxHr / profileMaxHr;
        if (maxPct >= 0.95) {
          score += 1;
          highPulse = true;
          reasons.push(`makspuls nær maks (${Math.round(maxPct * 100)}%)`);
        } else if (maxPct >= 0.90) {
          reasons.push(`makspuls høy (${Math.round(maxPct * 100)}% maks)`);
        }
      }

      return { score, reasons, highPulse, calmPulse };
    }

    function completedIntensityContext(completed, profile = normalizePersonProfile(state.settings.personProfile)) {
      const template = completedTemplate(completed);
      const effectCategory = completed.trainingEffectCategory || trainingEffectCategory(completed.trainingEffectType);
      return classifyWorkoutIntensityContext({
        completed,
        template,
        profile,
        effectCategory
      });
    }

    function heartRateZoneComplianceForCompleted(completed) {
      const profile = normalizePersonProfile(state.settings.personProfile);
      return assessHeartRateZoneCompliance({
        distribution: completed?.heartRateZoneDistribution,
        completed,
        template: completedTemplate(completed),
        profile,
        rules: getCoachRules(),
        intensityContext: completedIntensityContext(completed, profile)
      });
    }

    function heartRateZoneComplianceForItems(items = []) {
      return heartRateZoneComplianceSummary(items, {
        resolveTemplate: completedTemplate,
        profile: normalizePersonProfile(state.settings.personProfile),
        rules: getCoachRules()
      });
    }

    function completedItemsForIntensityDomain(items = []) {
      return items.map(completed => ({
        ...completed,
        template: completedTemplate(completed)
      }));
    }

    function canonicalBalanceForCompleted(items, today = todayISO(), windowDays) {
      return canonicalIntensityBalance(completedItemsForIntensityDomain(items), {
        todayIso: today,
        windowDays,
        profile: normalizePersonProfile(state.settings.personProfile),
        rules: getCoachRules()
      });
    }

    function heartRateComplianceForCompleted(items, today = todayISO(), windowDays) {
      return heartRateComplianceSummary(completedItemsForIntensityDomain(items), {
        todayIso: today,
        windowDays,
        profile: normalizePersonProfile(state.settings.personProfile),
        trainingLevel: normalizeTrainingProfile(state.settings.trainingProfile).level,
        rules: getCoachRules()
      });
    }

    function completedLoadAssessment(completed) {
      const effectCategory = completed.trainingEffectCategory || trainingEffectCategory(completed.trainingEffectType);
      const personProfile = normalizePersonProfile(state.settings.personProfile);
      const rpe = numberOrZero(completed.rpe);
      const feeling = numberOrZero(completed.feelingScore);
      const painBefore = numberOrZero(completed.bodyStatus?.painBefore);
      const painAfter = numberOrZero(completed.bodyStatus?.painAfter);
      const elevationGain = numberOrZero(completed.elevationGainM);
      const incline = numberOrZero(completed.treadmillInclinePercent);
      const distance = numberOrZero(completed.distanceKm);
      const elevationPerKm = distance ? elevationGain / distance : 0;
      const adaptation = completed.bodyStatus?.adaptation || '';
      const reasons = [];
      let score = 0;

      if (effectCategory === 'anaerobic') {
        score += 4;
        reasons.push('Garmin-effekt anaerob');
      } else if (effectCategory === 'high_aerobic') {
        score += 3;
        reasons.push('Garmin-effekt høy aerob');
      } else if (effectCategory === 'low_aerobic') {
        score += 1;
        reasons.push('Garmin-effekt lav aerob');
      }

      const hrSignals = heartRateLoadSignals(completed, personProfile);
      score += hrSignals.score;
      reasons.push(...hrSignals.reasons);

      if (rpe >= 8) {
        score += 4;
        reasons.push(`RPE ${completed.rpe}/10`);
      } else if (rpe >= 6) {
        score += 2;
        reasons.push(`RPE ${completed.rpe}/10`);
      } else if (rpe > 0) {
        reasons.push(`RPE ${completed.rpe}/10`);
      }

      if (feeling && feeling <= 2) {
        score += 1;
        reasons.push('føltes tung');
      }

      if (painAfter >= 4 || painAfter > painBefore + 1) {
        score += 2;
        reasons.push('smerte økte/betydelig');
      } else if (painBefore || painAfter) {
        reasons.push('smerte registrert');
      }

      if (['shorter', 'easier', 'alternative', 'aborted'].includes(adaptation)) {
        score += 1;
        reasons.push(`tilpasning: ${adaptationLabel(adaptation).toLowerCase()}`);
      }

      if (incline >= 4 || elevationPerKm >= 20 || elevationGain >= 150) {
        score += 1;
        reasons.push(incline >= 4 ? `${completed.treadmillInclinePercent}% møllestigning` : `${completed.elevationGainM} hm`);
      }

      const intensityContext = completedIntensityContext(completed, personProfile);
      if (intensityContext.highPulseBase && score >= 6) {
        score = 5;
        reasons.push('baseøkt med høy puls - ikke hard kvalitet');
      }

      let level = 'low';
      let label = 'Lav belastning';
      if (score >= 6) {
        level = 'high';
        label = 'Høy belastning';
      } else if (score >= 3) {
        level = 'moderate';
        label = 'Moderat belastning';
      }

      if ((incline >= 4 || elevationPerKm >= 20 || elevationGain >= 150) && level !== 'low') {
        label += ' - bakke/stigning påvirker';
      }
      if ((painAfter >= 4 || painAfter > painBefore + 1) && level !== 'low') {
        label += ' - følg med på kroppen';
      }
      if (hrSignals.highPulse && level !== 'low') {
        label += ' - høy pulsbelastning';
      }
      if (intensityContext.highPulseBase && level !== 'low') {
        label = 'Moderat belastning - base med høy puls';
      }
      if (hrSignals.calmPulse && level === 'low') {
        label = 'Lav belastning - rolig pulsrespons';
      }

      const reason = reasons.length
        ? reasons.slice(0, 4).join(' · ')
        : 'Mangler nok intensitetsdata for tydelig vurdering.';
      return { level, label, reason, intensityContext };
    }

    function loadAssessmentHtml(completed) {
      const assessment = completedLoadAssessment(completed);
      return `
        <div class="load-assessment ${assessment.level}">
          <span class="tag load-${assessment.level}">Belastning: ${escapeHtml(assessment.label)}</span>
          <p>${escapeHtml(assessment.reason)}</p>
        </div>`;
    }

    function latestCompletedWorkout(items = state.completed) {
      return [...items].sort((a, b) => {
        const dateCompare = String(b.date || '').localeCompare(String(a.date || ''));
        if (dateCompare) return dateCompare;
        return String(b.completedAt || b.updatedAt || '').localeCompare(String(a.completedAt || a.updatedAt || ''));
      })[0] || null;
    }

    function lastWorkoutCoachNote(completed, profile) {
      if (!completed) return '';
      const template = completedTemplate(completed);
      const assessment = completedLoadAssessment(completed);
      return buildWorkoutCoachAssessment({
        completed,
        template,
        loadAssessment: assessment,
        zoneCompliance: heartRateZoneComplianceForCompleted(completed),
        trainingProfile: profile
      }).text;
    }

    function weeklyTrainingStatus(weekItems, weekSummary, goals, profile) {
      const loadCounts = weekItems.reduce((counts, item) => {
        const level = completedLoadAssessment(item).level;
        counts[level] += 1;
        return counts;
      }, { low: 0, moderate: 0, high: 0 });
      const adaptationCount = weekItems.filter(item => {
        const adaptation = item.bodyStatus?.adaptation || '';
        return adaptation && adaptation !== 'none';
      }).length;
      const painCount = weekItems.filter(item => item.bodyStatus?.painBefore || item.bodyStatus?.painAfter || item.bodyStatus?.area).length;
      const bodySignals = painCount + adaptationCount;
      const runningBakkenFocus = profile.primaryFocus === 'running' && profile.philosophy === 'bakken_threshold';
      let level = 'good';
      let label = 'På plan';
      let note = 'Uken ser balansert ut så langt. Fortsett å styre neste økt etter dagsform.';

      if (!weekItems.length) {
        level = 'calm';
        label = 'Bygg rolig';
        note = 'Ingen utførte økter denne uken ennå. Start med én gjennomførbar økt før du vurderer mer belastning.';
      } else if (bodySignals >= 2) {
        level = 'caution';
        label = 'Vær forsiktig';
        note = 'Flere kroppssignaler eller tilpasninger er registrert. Hold neste økt rolig eller alternativ hvis samme område fortsatt kjennes.';
      } else if (loadCounts.high >= 2 || (runningBakkenFocus && loadCounts.high >= 1 && loadCounts.low === 0)) {
        level = 'caution';
        label = 'Nok hardt';
        note = runningBakkenFocus
          ? 'For Bakken-inspirert løpsfokus bør hard belastning pakkes inn i rolig volum og friske bein.'
          : 'Det er nok høy belastning denne uken til at neste økt gjerne kan være rolig eller kontrollert.';
      } else if (weekSummary.sessions >= goals.weeklySessionsTarget) {
        level = 'good';
        label = 'På plan';
        note = 'Ukesmålet er nådd. Eventuelle ekstra økter bør være bonus og styres av overskudd.';
      } else if (loadCounts.low >= 1 && loadCounts.high === 0) {
        level = 'calm';
        label = 'Bygg rolig';
        note = 'Du bygger kontinuitet med kontrollert belastning. En kvalitetsøkt kan vurderes hvis kroppen kjennes fin.';
      }

      return { label, level, note, loadCounts, painCount, adaptationCount, bodySignals };
    }

    function weeklySignalLabel(status) {
      const parts = [];
      if (status.painCount) parts.push(`${status.painCount} smerte`);
      if (status.adaptationCount) parts.push(`${status.adaptationCount} tilpasning`);
      return parts.length ? parts.join(' · ') : 'Ingen';
    }

    function hasPainSignal(item) {
      return Boolean(item.bodyStatus?.painBefore || item.bodyStatus?.painAfter || item.bodyStatus?.area);
    }

    function gradedPainContext(completedItems, today) {
      const sorted = sortedCompletedItems(completedItems);
      const todayMs = new Date(`${today}T12:00:00`).getTime();
      const DECAY_DAYS = { low: 3, moderate: 5, high: 7 };
      const tierOrder = { high: 3, moderate: 2, low: 1 };

      function painTier(score) {
        if (score >= 5) return 'high';
        if (score >= 3) return 'moderate';
        if (score >= 1) return 'low';
        return null;
      }

      const painItems = sorted.filter(hasPainSignal);
      if (!painItems.length) return { activePain: [], resolvedRecently: [], highestTier: null };

      const evaluated = painItems.map(item => {
        const score = Math.max(
          numberOrZero(item.bodyStatus?.painBefore),
          numberOrZero(item.bodyStatus?.painAfter)
        );
        const tier = painTier(score);
        if (!tier) return null;
        const itemMs = new Date(`${item.date}T12:00:00`).getTime();
        const daysAgo = Math.round((todayMs - itemMs) / 86400000);
        if (daysAgo > DECAY_DAYS[tier]) return null;
        const sortVal = workoutSortValue(item);
        const clearedByClean = sorted.some(w =>
          workoutSortValue(w) > sortVal &&
          !numberOrZero(w.bodyStatus?.painBefore) &&
          !numberOrZero(w.bodyStatus?.painAfter)
        );
        return { item, score, tier, daysAgo, area: item.bodyStatus?.area || '', clearedByClean };
      }).filter(Boolean);

      const activePain = evaluated.filter(p => !p.clearedByClean);
      const resolvedRecently = evaluated.filter(p => p.clearedByClean);
      const highestTier = activePain.length
        ? activePain.reduce((best, p) => (tierOrder[p.tier] > tierOrder[best] ? p.tier : best), activePain[0].tier)
        : null;

      return { activePain, resolvedRecently, highestTier };
    }

    function hasAdaptationSignal(item) {
      const adaptation = item.bodyStatus?.adaptation || '';
      return Boolean(adaptation && adaptation !== 'none');
    }

    function workoutSortValue(item) {
      return `${item.date || ''}T${item.completedAt || item.updatedAt || ''}`;
    }

    function sortedCompletedItems(items) {
      return [...items].sort((a, b) => workoutSortValue(a).localeCompare(workoutSortValue(b)));
    }

    function bodySignalState(items) {
      const sorted = sortedCompletedItems(items);
      const signalItems = sorted.filter(item => hasPainSignal(item) || hasAdaptationSignal(item));
      const latest = sorted[sorted.length - 1] || null;
      const latestSignal = signalItems[signalItems.length - 1] || null;
      if (!latestSignal) {
        return { level: 'none', signalItems, cleanAfter: [], latest, latestSignal };
      }

      const latestSignalSort = workoutSortValue(latestSignal);
      const afterSignal = sorted.filter(item => workoutSortValue(item) > latestSignalSort);
      const cleanAfter = afterSignal.filter(item => !hasPainSignal(item) && !hasAdaptationSignal(item));
      const painBefore = numberOrZero(latestSignal.bodyStatus?.painBefore);
      const painAfter = numberOrZero(latestSignal.bodyStatus?.painAfter);
      const area = (latestSignal.bodyStatus?.area || '').trim().toLowerCase();
      const sameAreaSignals = area
        ? signalItems.filter(item => (item.bodyStatus?.area || '').trim().toLowerCase() === area).length
        : 0;
      const latestHasSignal = latest && workoutSortValue(latest) === latestSignalSort;
      const worseningPain = painAfter >= 4 || painAfter > painBefore + 1;
      const repeatedSameArea = sameAreaSignals >= 2 && cleanAfter.length < 2;

      const maxPainScore = Math.max(painBefore, painAfter);
      const isMildPain = maxPainScore <= 2 && !repeatedSameArea;

      let level = 'resolved';
      if (latestHasSignal && worseningPain) level = 'active';
      else if (latestHasSignal && isMildPain) level = 'cooling';
      else if (latestHasSignal || repeatedSameArea) level = 'caution';
      else if (cleanAfter.length >= 2) level = 'resolved';
      else if (cleanAfter.length === 1) level = 'cooling';

      return { level, signalItems, cleanAfter, latest, latestSignal, painBefore, painAfter, maxPainScore, area, repeatedSameArea };
    }

    function weeklyBodySignalNote(items) {
      if (!items.length) return '';
      const areas = [...new Set(items.map(item => item.bodyStatus?.area).filter(Boolean).map(area => area.trim()))];
      const adapted = items.filter(hasAdaptationSignal).length;
      const pain = items.filter(hasPainSignal).length;
      if (areas.length) {
        return `Følg spesielt med på ${areas.slice(0, 2).join(' og ')} før neste økt. Velg rolig eller alternativ trening hvis samme område fortsatt kjennes.`;
      }
      if (pain && adapted) return 'Det finnes både smerte og tilpasning denne uken. Bruk neste økt til å bekrefte at kroppen responderer fint.';
      if (adapted) return 'En eller flere økter ble tilpasset. Det er nyttig informasjon for å styre progresjon uten å presse for hardt.';
      return 'Smerte er registrert denne uken. Se etter mønster før du øker belastningen videre.';
    }

    function renderWeeklyBodySignals(weekItems) {
      const signalItems = weekItems
        .filter(item => hasPainSignal(item) || hasAdaptationSignal(item))
        .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
      const card = document.getElementById('insightBodySignalsCard');
      const list = document.getElementById('insightBodySignals');
      const note = document.getElementById('insightBodySignalsNote');
      if (!card || !list || !note) return;
      if (!signalItems.length) {
        card.style.display = 'none';
        list.innerHTML = '';
        note.textContent = '';
        return;
      }
      card.style.display = '';
      note.textContent = weeklyBodySignalNote(signalItems);
      list.innerHTML = signalItems.map(item => {
        const template = completedTemplate(item);
        const body = item.bodyStatus || {};
        const chips = [
          hasPainSignal(item) ? 'Smerte' : null,
          hasAdaptationSignal(item) ? adaptationLabel(body.adaptation) : null
        ].filter(Boolean);
        const details = [
          body.area ? `Område: ${body.area}` : null,
          body.painBefore ? `Før: ${painScaleLabel(body.painBefore)}` : null,
          body.painAfter ? `Etter: ${painScaleLabel(body.painAfter)}` : null,
          hasAdaptationSignal(item) ? `Tilpasning: ${adaptationLabel(body.adaptation)}` : null
        ].filter(Boolean);
        return `
          <div class="body-signal-item">
            <div class="body-signal-top">
              <div>
                <strong>${escapeHtml(template.name)}</strong>
                <span>${escapeHtml(formatDate(item.date))}</span>
              </div>
              <div class="body-signal-tags">
                ${chips.map(chip => `<span>${escapeHtml(chip)}</span>`).join('')}
              </div>
            </div>
            <p>${escapeHtml(details.join(' · ') || 'Kroppssignal registrert.')}</p>
            ${body.notes ? `<p class="body-signal-note">${escapeHtml(body.notes)}</p>` : ''}
            <button class="btn-soft" onclick="openWorkoutDetail('${item.id}')">Se detaljer</button>
          </div>`;
      }).join('');
    }

    function renderWeeklyTrainingStatus(weekItems, weekSummary, goals, profile) {
      const status = weeklyTrainingStatus(weekItems, weekSummary, goals, profile);
      const total = Math.max(1, weekItems.length);
      const lowPct = (status.loadCounts.low / total) * 100;
      const moderatePct = (status.loadCounts.moderate / total) * 100;
      const highPct = (status.loadCounts.high / total) * 100;
      document.getElementById('insightWeeklyStatus').innerHTML = `
        <div class="weekly-status ${status.level}">
          <div class="weekly-status-top">
            <span class="tag weekly-${status.level}">${escapeHtml(status.label)}</span>
            <span>${escapeHtml(weekSummary.sessions)} økt${weekSummary.sessions === 1 ? '' : 'er'} · ${escapeHtml(formatClockDuration(weekSummary.seconds))}</span>
          </div>
          <div class="weekly-load-stack" aria-label="Fordeling av belastning">
            <span class="weekly-load-low" style="width:${lowPct}%"></span>
            <span class="weekly-load-moderate" style="width:${moderatePct}%"></span>
            <span class="weekly-load-high" style="width:${highPct}%"></span>
          </div>
          <div class="weekly-status-grid">
            <div><strong>${status.loadCounts.low}</strong><span>Lav belastning</span></div>
            <div><strong>${status.loadCounts.moderate}</strong><span>Moderat</span></div>
            <div><strong>${status.loadCounts.high}</strong><span>Høy belastning</span></div>
            <div><strong>${status.bodySignals}</strong><span>Kroppssignaler</span></div>
          </div>
          <p><strong>Neste steg:</strong> ${escapeHtml(status.note)}</p>
        </div>`;
    }

    window.openCompleteModal = function(plannedId) {
      clearCompleteForm();
      setCompleteModalMode('create');
      document.getElementById('completePlannedId').value = plannedId;
      renderCompleteGoldenZoneHint();
      const hint = document.getElementById('completePainHint');
      if (hint) {
        const gp = gradedPainContext(state.completed.filter(c => c.date <= todayISO()), todayISO());
        if (gp.activePain.length) {
          const p = [...gp.activePain].sort((a, b) => b.score - a.score)[0];
          const dayStr = p.daysAgo === 0 ? 'i dag' : p.daysAgo === 1 ? 'i går' : `for ${p.daysAgo} dager siden`;
          const loc = p.area ? ` i ${p.area}` : '';
          hint.textContent = `Du hadde vondt${loc} (${p.score}/10) ${dayStr}. Logg smerte nedenfor om det fortsatt kjennes noe.`;
          hint.hidden = false;
        } else {
          hint.hidden = true;
        }
      }
      document.getElementById('completeModal').classList.add('active');
    };

    window.openHistoricalCompleteModal = function() {
      clearCompleteForm();
      setCompleteModalMode('historical');
      document.getElementById('completeDate').value = todayISO();
      document.getElementById('completeTemplate').value = state.templates[0]?.id || '';
      renderCompleteGoldenZoneHint();
      document.getElementById('completeModal').classList.add('active');
    };

    window.closeCompleteModal = function() {
      document.getElementById('completeModal').classList.remove('active');
      clearCompleteForm();
      setCompleteModalMode('create');
    };

    window.editCompleted = function(completedId) {
      const completed = state.completed.find(c => c.id === completedId);
      if (!completed) return;

      clearCompleteForm();
      setCompleteModalMode('edit');
      getWorkoutCompletionUi().fillForm({ ...completed, date: completed.date || todayISO() });
      renderCompleteGoldenZoneHint();
      document.getElementById('completeModal').classList.add('active');
    };

    window.completeWorkout = async function() {
      let formData;
      try {
        formData = completedFormData();
      } catch (error) {
        alert(error?.message || 'Kontroller pulssonefordelingen.');
        return;
      }
      const editingId = document.getElementById('editingCompletedId').value;
      if (editingId) {
        const completedIndex = state.completed.findIndex(c => c.id === editingId);
        if (completedIndex === -1) return;
        const date = document.getElementById('completeDate').value || state.completed[completedIndex].date;
        const templateId = document.getElementById('completeTemplate').value || state.completed[completedIndex].templateId;
        const manualName = document.getElementById('completeManualName').value.trim();
        const existingCompleted = state.completed[completedIndex];
        const preservedSnapshot = templateId === existingCompleted.templateId && existingCompleted.templateSnapshot
          ? templateSnapshotFromTemplate(existingCompleted.templateSnapshot, manualName)
          : completedTemplateSnapshot(templateId, manualName);

        const updatedCompleted = {
          ...existingCompleted,
          date,
          templateId,
          manualName,
          templateSnapshot: preservedSnapshot,
          ...formData,
          updatedAt: new Date().toISOString()
        };

        closeCompleteModal();
        await safeStateWrite({
          apply: () => {
            const index = state.completed.findIndex(c => c.id === editingId);
            if (index >= 0) state.completed[index] = updatedCompleted;
          },
          write: () => fsSet('completed', editingId, updatedCompleted),
          afterApply: () => {
            if (selectedCalendarDate() && document.getElementById('calendarDayModal').classList.contains('active')) {
              openCalendarDayModal(selectedCalendarDate());
            }
          },
          successMessage: 'Økt oppdatert',
          errorMessage: 'Kunne ikke oppdatere økten'
        });
        return;
      }

      const plannedId = document.getElementById('completePlannedId').value;
      const planned = state.planned.find(p => p.id === plannedId);
      if (!planned) {
        const date = document.getElementById('completeDate').value;
        const templateId = document.getElementById('completeTemplate').value;
        const manualName = document.getElementById('completeManualName').value.trim();
        if (!date) return alert('Velg dato for økten.');
        if (!templateId && !manualName) return alert('Velg en øktmal eller skriv inn eget øktnavn.');
        const completed = {
          id: uid('completed'),
          plannedWorkoutId: '',
          templateId,
          manualName,
          templateSnapshot: completedTemplateSnapshot(templateId, manualName),
          date,
          ...formData,
          completedAt: new Date().toISOString(),
          source: 'manual'
        };
        closeCompleteModal();
        await safeStateWrite({
          apply: () => { state.completed.push(completed); },
          write: () => fsSet('completed', completed.id, completed),
          successMessage: 'Historisk økt lagret',
          errorMessage: 'Kunne ikke lagre historisk økt'
        });
        return;
      }
      const completed = {
        id: uid('completed'),
        plannedWorkoutId: plannedId,
        templateId: planned.templateId,
        manualName: '',
        templateSnapshot: planned.templateSnapshot || completedTemplateSnapshot(planned.templateId, ''),
        date: planned.date,
        ...formData,
        completedAt: new Date().toISOString()
      };
      closeCompleteModal();
      await safeStateWrite({
        apply: () => {
          const item = state.planned.find(p => p.id === plannedId);
          if (item) item.status = 'done';
          state.completed.push(completed);
        },
        write: () => {
          const updatedPlanned = state.planned.find(p => p.id === plannedId) || { ...planned, status: 'done' };
          return Promise.all([fsSet('planned', plannedId, updatedPlanned), fsSet('completed', completed.id, completed)]);
        },
        afterApply: () => {
          if (document.getElementById('calendarDayModal')?.classList.contains('active') && selectedCalendarDate()) {
            openCalendarDayModal(selectedCalendarDate());
          }
        },
        successMessage: 'Økt logget - bra jobba!',
        errorMessage: 'Kunne ikke loggføre økten'
      });
    };

    window.undoComplete = async function(completedId) {
      const completed = state.completed.find(c => c.id === completedId);
      if (!completed) return;
      const template = completedTemplate(completed);
      const planned = state.planned.find(p => p.id === completed.plannedWorkoutId);
      const confirmText = planned
        ? `Er du sikker på at du vil angre utført økt?\n\n${template.name} flyttes tilbake til planlagt økt.`
        : `Er du sikker på at du vil slette denne historiske økten?\n\n${template.name} fjernes fra historikken.`;
      if (!confirm(confirmText)) return;
      await safeStateWrite({
        apply: () => {
          if (planned) {
            const item = state.planned.find(p => p.id === planned.id);
            if (item) item.status = 'planned';
          }
          state.completed = state.completed.filter(c => c.id !== completedId);
        },
        write: () => {
          const ops = [fsDelete('completed', completedId)];
          const updatedPlanned = planned ? state.planned.find(p => p.id === planned.id) : null;
          if (updatedPlanned) ops.push(fsSet('planned', updatedPlanned.id, updatedPlanned));
          return Promise.all(ops);
        },
        afterApply: () => {
          if (document.getElementById('calendarDayModal')?.classList.contains('active') && selectedCalendarDate()) {
            openCalendarDayModal(selectedCalendarDate());
          }
        },
        successMessage: planned ? 'Økt flyttet tilbake til planlagt' : 'Historisk økt slettet',
        errorMessage: 'Kunne ikke angre økten'
      });
    };

    let workoutDetailTrigger = null;

    window.closeWorkoutDetailModal = function() {
      const modal = document.getElementById('workoutDetailModal');
      if (!modal?.classList.contains('active')) return;
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      if (workoutDetailTrigger?.isConnected) workoutDetailTrigger.focus?.();
      workoutDetailTrigger = null;
    };

    // ── Render helpers ────────────────────────────────────────────────────────
    function getTemplate(id) {
      return state.templates.find(t => t.id === id) || { name: 'Slettet øktmal', type: 'Annet', intensity: '', role: '', purpose: '', load: '', recommendedWhen: [], avoidWhen: [], structure: '', sourceUrl: '', structuredWorkout: null, exercisePlan: null };
    }

    function templateSnapshotFromTemplate(template, manualName = '') {
      const normalized = normalizeTemplate(template || {});
      return normalizeTemplate({
        ...normalized,
        id: normalized.id || '',
        name: manualName || normalized.name || 'Historisk økt'
      });
    }

    function completedTemplateSnapshot(templateId, manualName) {
      const template = state.templates.find(t => t.id === templateId);
      return templateSnapshotFromTemplate(template || { name: manualName || 'Historisk økt' }, manualName);
    }

    function plannedTemplate(planned) {
      const liveTemplate = state.templates.find(t => t.id === planned?.templateId);
      if (!planned?.templateSnapshot) return liveTemplate || getTemplate(planned?.templateId);
      return {
        ...(liveTemplate || {}),
        ...normalizeTemplate(planned.templateSnapshot),
        id: planned.templateId || planned.templateSnapshot.id || ''
      };
    }

    function completedTemplate(completed) {
      const template = state.templates.find(t => t.id === completed.templateId);
      if (completed.templateSnapshot) {
        return {
          ...(template || {}),
          ...normalizeTemplate(completed.templateSnapshot),
          id: completed.templateId || completed.templateSnapshot.id || '',
          name: completed.manualName || completed.templateSnapshot.name || template?.name || 'Historisk økt'
        };
      }
      if (template) return { ...template, name: completed.manualName || template.name };
      return {
        name: completed.manualName || completed.templateSnapshot?.name || 'Historisk økt',
        type: completed.templateSnapshot?.type || 'Annet',
        intensity: completed.templateSnapshot?.intensity || '',
        role: completed.templateSnapshot?.role || '',
        purpose: completed.templateSnapshot?.purpose || '',
        load: completed.templateSnapshot?.load || '',
        structure: completed.templateSnapshot?.structure || '',
        sourceUrl: completed.templateSnapshot?.sourceUrl || '',
        structuredWorkout: completed.templateSnapshot?.structuredWorkout || null,
        exercisePlan: completed.templateSnapshot?.exercisePlan || null
      };
    }

    async function commitGarminImport(plan) {
      if (!currentUser || offlineSnapshotMode || !navigator.onLine) {
        throw new Error('Garmin-import krever innlogging og nettforbindelse.');
      }
      const previousState = cloneAppState();
      const recoverySaved = await saveRecoverySnapshot('before-garmin-import');
      if (!recoverySaved) throw new Error('Kunne ikke opprette lokal gjenopprettingskopi. Importen er avbrutt.');
      const replaceById = (items, updates) => {
        const result = new Map((items || []).map(item => [item.id, item]));
        (updates || []).forEach(item => result.set(item.id, item));
        return [...result.values()];
      };
      try {
        setSyncStatus('syncing');
        state.completed = replaceById(state.completed, plan.completedItems);
        state.planned = replaceById(state.planned, plan.plannedItems);
        state = normalizeAppState(state);
        await saveLocalStateSnapshot();
        render();
        const repositoryResult = await trainingRepository.importActivities(plan);
        await saveLocalStateSnapshot();
        setSyncStatus('ok');
        return { stats: plan.stats, repositoryResult };
      } catch (err) {
        const committed = Number(err?.importResult?.committedOperations) || 0;
        if (committed > 0) {
          await loadFromFirestore();
          throw new Error(`Importen stoppet etter ${committed} lagrede operasjoner. Appen er lastet på nytt fra Firestore; kontroller resultatet før du prøver igjen.`);
        }
        restoreAppState(previousState);
        setSyncStatus(navigator.onLine ? 'error' : 'offline');
        throw new Error('Importen kunne ikke lagres. Lokale endringer er rullet tilbake.');
      }
    }

    let trainingImportUi = null;

    function getTrainingImportUi() {
      if (!trainingImportUi) {
        trainingImportUi = createTrainingImportUi({
          getState: () => state,
          resolveTemplate: item => plannedTemplate(item),
          commitImport: commitGarminImport,
          createId: uid,
          canWrite: () => Boolean(currentUser && navigator.onLine && !offlineSnapshotMode)
        });
      }
      return trainingImportUi;
    }

    let workoutHistoryUi = null;

    function getWorkoutHistoryUi() {
      if (!workoutHistoryUi) {
        workoutHistoryUi = createWorkoutHistoryUi({
          getState: () => state,
          escapeHtml,
          formatDate,
          formatRaceTime,
          raceDistanceLabel,
          normalizeRaceResult,
          normalizeTrainingProfile,
          completedTemplate,
          completedDurationLabel,
          completedPaceMetrics,
          completedLoadAssessment,
          executionLabel,
          feelingLabel,
          readinessLabel,
          bodyStatusLabel,
          trainingEffectInfo,
          trainingEffectCategory,
          heartRateReferenceForCompleted,
          heartRateZoneCompliance: heartRateZoneComplianceForCompleted,
          structuredWorkoutSummaryHtml,
          exercisePlanSummaryHtml,
          templateCalendarKind,
          uniqueValues,
          aiAssessmentState: completed => {
            const assessment = normalizeAiWorkoutAssessment(completed.aiCoachAssessment);
            const fingerprint = aiWorkoutAssessmentFingerprint(workoutAiAssessmentInput(completed));
            return { assessment, stale: isAiWorkoutAssessmentStale(assessment, fingerprint) };
          },
          todayISO
        });
      }
      return workoutHistoryUi;
    }

    window.openWorkoutDetail = function(completedId) {
      const completed = state.completed.find(c => c.id === completedId);
      if (!completed) return;
      const modal = document.getElementById('workoutDetailModal');
      const wasOpen = modal.classList.contains('active');
      if (!wasOpen) workoutDetailTrigger = document.activeElement;
      document.getElementById('workoutDetailContent').innerHTML = getWorkoutHistoryUi().detailHtml(completed);
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      if (!wasOpen) modal.querySelector('.detail-modal').scrollTop = 0;
      modal.querySelector('[data-workout-detail-close]')?.focus();
    };

    document.getElementById('workoutDetailModal')?.addEventListener('click', event => {
      if (event.target === event.currentTarget) window.closeWorkoutDetailModal();
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && document.getElementById('workoutDetailModal')?.classList.contains('active')) {
        window.closeWorkoutDetailModal();
      }
    });

    const pendingAiWorkoutAssessments = new Set();

    function workoutAiAssessmentInput(completed) {
      const template = completedTemplate(completed);
      return buildAiWorkoutAssessmentInput({
        completed,
        template,
        loadAssessment: completedLoadAssessment(completed),
        zoneCompliance: heartRateZoneComplianceForCompleted(completed)
      });
    }

    window.requestAiWorkoutAssessment = async function(completedId) {
      const completed = state.completed.find(item => item.id === completedId);
      if (!completed || pendingAiWorkoutAssessments.has(completedId)) return;
      pendingAiWorkoutAssessments.add(completedId);
      const button = document.querySelector(`.ai-workout-assessment-btn[data-workout-id="${CSS.escape(completedId)}"]`);
      const originalLabel = button?.textContent || '';
      if (button) {
        button.disabled = true;
        button.textContent = 'Vurderer økten …';
      }
      try {
        const workout = workoutAiAssessmentInput(completed);
        const inputFingerprint = aiWorkoutAssessmentFingerprint(workout);
        const result = await aiCoachClient.assessWorkout({
          workout,
          context: buildCurrentAiCoachContext()
        });
        if (!result?.ok) {
          alert(result?.message || 'AI-coachen kunne ikke vurdere økten. Prøv igjen senere.');
          return;
        }
        const assessment = storedAiWorkoutAssessment(result.assessment, inputFingerprint);
        if (!assessment) {
          alert('AI-coachen ga et ufullstendig svar. Ingen vurdering ble lagret.');
          return;
        }
        const updatedCompleted = { ...completed, aiCoachAssessment: assessment, updatedAt: new Date().toISOString() };
        await safeStateWrite({
          apply: () => {
            state.completed = state.completed.map(item => item.id === completedId ? updatedCompleted : item);
          },
          write: () => fsSet('completed', completedId, updatedCompleted),
          afterApply: () => window.openWorkoutDetail(completedId),
          successMessage: 'AI-vurdering lagret',
          errorMessage: 'Kunne ikke lagre AI-vurderingen'
        });
      } finally {
        pendingAiWorkoutAssessments.delete(completedId);
        if (button?.isConnected) {
          button.disabled = false;
          button.textContent = originalLabel;
        }
      }
    };

    function workoutCard(planned, options = {}) {
      const t = plannedTemplate(planned);
      const kind = templateCalendarKind(t);
      const chips = templateCalendarChips(t);
      return `
        <div class="workout-card calendar-workout-card calendar-kind-${escapeHtml(kind.key)}">
          <div class="workout-top">
            <div>
              <h3 class="workout-title">${escapeHtml(t.name)}</h3>
              <div class="meta">${formatDate(planned.date)} · ${escapeHtml(t.type)} · ${escapeHtml(t.intensity || '')}</div>
            </div>
            <span class="tag ${planned.status === 'done' ? 'done' : 'planned'}">${planned.status === 'done' ? 'Utført' : 'Planlagt'}</span>
          </div>
          ${chips ? `<div class="calendar-context-row">${chips}</div>` : ''}
          ${t.structure ? `<p class="meta" style="white-space:pre-line;">${escapeHtml(t.structure)}</p>` : ''}
          ${structuredWorkoutSummaryHtml(t.structuredWorkout)}
          ${exercisePlanSummaryHtml(t.exercisePlan)}
          ${t.sourceUrl ? `<p><a class="template-source-link" href="${escapeHtml(t.sourceUrl)}" target="_blank" rel="noopener noreferrer">Åpne øktdemonstrasjon</a></p>` : ''}
          ${planned.notes ? `<p class="meta"><strong>Notat:</strong> ${escapeHtml(planned.notes)}</p>` : ''}
          <div class="button-row">
            ${planned.status !== 'done' ? `<button class="btn-success" onclick="openCompleteModal('${planned.id}')">Marker utført</button>` : ''}
            ${planned.status !== 'done' ? `<button class="btn-soft" onclick="openRescheduleModal('${planned.id}')">Endre dato</button>` : ''}
            ${options.canDelete ? `<button class="btn-soft" onclick="deletePlanned('${planned.id}')">Slett</button>` : ''}
          </div>
        </div>`;
    }

    function labelFromMap(value, map) {
      return value ? (map[value] || value) : '';
    }

    function templatePurposeLabel(value) {
      return labelFromMap(value, {
        base: 'Aerob base',
        threshold: 'Terskel/kvalitet',
        vo2max: 'VO2 maks',
        recovery: 'Restitusjon',
        strength: 'Styrke',
        muscle_growth: 'Muskelvekst',
        mobility: 'Mobilitet',
        technique: 'Teknikk/ferdighet',
        race: 'Konkurranse / testløp',
        other: 'Annet formål'
      });
    }

    function templateRoleLabel(value) {
      return labelFromMap(value, WORKOUT_ROLE_LABELS);
    }

    function templateLoadLabel(value) {
      return labelFromMap(value, {
        low: 'Lav belastning',
        moderate: 'Moderat belastning',
        high: 'Høy belastning'
      });
    }

    function templateCalendarKind(template = {}, suggestion = {}) {
      const role = template.role || asArray(suggestion.roles)[0] || '';
      const purpose = template.purpose || asArray(suggestion.purposes)[0] || '';
      const intensity = template.intensity || asArray(suggestion.intensities)[0] || '';
      const type = template.type || asArray(suggestion.types)[0] || '';
      const load = template.load || asArray(suggestion.loads)[0] || '';
      const text = [role, purpose, intensity, type, template.name, suggestion.title, suggestion.detail].filter(Boolean).join(' ').toLowerCase();
      if (role === 'race' || purpose === 'race' || /race|testløp|konkurranse/.test(text)) {
        return { key: 'race', label: 'Race/test' };
      }
      if (role === 'recovery' || purpose === 'recovery' || intensity === 'Restitusjon') {
        return { key: 'recovery', label: 'Recovery' };
      }
      if (role === 'main_threshold' || role === 'support_threshold' || purpose === 'threshold' || ['Terskel', 'Intervall', 'Tempo', 'Anaerob'].includes(intensity)) {
        return { key: 'quality', label: 'Kvalitet' };
      }
      if (role === 'strength' || purpose === 'strength' || purpose === 'muscle_growth' || type === 'Styrke' || intensity === 'Styrke') {
        return { key: 'strength', label: 'Styrke' };
      }
      if (role === 'mobility' || purpose === 'mobility' || ['Sykling', 'Ski', 'Gåtur', 'Mobilitet'].includes(type)) {
        return { key: 'alternative', label: 'Alternativ' };
      }
      if (role === 'long_easy' || purpose === 'base' || intensity === 'Rolig' || load === 'low') {
        return { key: 'easy', label: 'Rolig' };
      }
      return { key: 'neutral', label: 'Økt' };
    }

    function templateCalendarChips(template = {}, suggestion = {}) {
      const kind = templateCalendarKind(template, suggestion);
      const role = template.role || asArray(suggestion.roles)[0] || '';
      const purpose = template.purpose || asArray(suggestion.purposes)[0] || '';
      const load = template.load || asArray(suggestion.loads)[0] || '';
      const chips = [
        { label: kind.label, className: `kind-${kind.key}` },
        role ? { label: templateRoleLabel(role), className: 'role' } : null,
        purpose && purpose !== role ? { label: templatePurposeLabel(purpose), className: 'purpose' } : null,
        load ? { label: templateLoadLabel(load), className: `load-${load}` } : null
      ].filter(item => item && item.label);
      return chips.slice(0, 4).map(chip => `<span class="calendar-context-chip ${escapeHtml(chip.className)}">${escapeHtml(chip.label)}</span>`).join('');
    }

    function calendarEntryClass(status, template = {}) {
      const kind = templateCalendarKind(template);
      return `${status} calendar-kind-${kind.key}`;
    }

    window.setTemplateCoachFilter = function(filter) {
      getWorkoutTemplateUi().setCoachFilter(filter);
    };

    window.renderTemplateLibrary = function() {
      getWorkoutTemplateUi().renderLibrary();
    };

    window.renderExerciseLibrary = function() {
      getExerciseLibraryUi().renderLibrary();
      getWorkoutTemplateUi().renderStrengthRows();
    };

    function completedCard(c) {
      const t = completedTemplate(c);
      const durationLabel = completedDurationLabel(c);
      const trainingEffect = trainingEffectTag(c.trainingEffectType);
      const assessment = completedLoadAssessment(c);
      const pace = completedPaceMetrics(c);
      const metrics = [
        durationLabel || null,
        c.distanceKm ? `${c.distanceKm} km` : null,
        pace.paceDisplay ? `${pace.paceDisplay} min/km` : null,
        c.raceResult?.resultSeconds ? `Race ${formatRaceTime(c.raceResult.resultSeconds)}` : null,
        c.avgHeartRate ? `${c.avgHeartRate} bpm snitt` : null,
        c.rpe ? `RPE ${c.rpe}/10` : null
      ].filter(Boolean).join(' · ');
      const bodySignal = c.bodyStatus?.painBefore || c.bodyStatus?.painAfter || (c.bodyStatus?.adaptation && c.bodyStatus.adaptation !== 'none');
      return `
        <div class="workout-card">
          <div class="workout-top">
            <div>
              <h3 class="workout-title">${escapeHtml(t.name)}</h3>
              <div class="meta">${formatDate(c.date)} · ${escapeHtml(t.type)} · ${escapeHtml(t.intensity || '')}</div>
            </div>
            <span class="tag done">Utført</span>
          </div>
          ${metrics ? `<p class="meta">${escapeHtml(metrics)}</p>` : ''}
          <div class="compact-tags">
            ${c.raceResult ? '<span class="tag race-tag">Race</span>' : ''}
            ${trainingEffect}
            <span class="tag load-${assessment.level}">${escapeHtml(assessment.label)}</span>
            ${bodySignal ? '<span class="tag body-signal">Kroppssignal</span>' : ''}
          </div>
          <div class="button-row">
            <button class="btn-primary" onclick="openWorkoutDetail('${c.id}')">Detaljer</button>
            <button class="btn-primary" onclick="editCompleted('${c.id}')">Rediger</button>
            <button class="btn-soft" onclick="undoComplete('${c.id}')">${c.plannedWorkoutId ? 'Angre utført' : 'Slett'}</button>
          </div>
        </div>`;
    }

    window.toggleHistoryFilters = function() {
      const panel = document.getElementById('historyFilterPanel');
      if (panel) panel.classList.toggle('hidden');
    };

    // ── Calendar ──────────────────────────────────────────────────────────────
    let calendarUi = null;

    function ensureCalendarUi() {
      if (!calendarUi) {
        calendarUi = createCalendarUi({
          getState: () => state,
          todayISO,
          formatDate,
          escapeHtml,
          getTemplate,
          plannedTemplate,
          completedTemplate,
          calendarKind: templateCalendarKind,
          calendarEntryClass,
          blockedDayForDate,
          blockedDayLabel,
          blockedReasons: BLOCKED_DAY_REASONS,
          workoutCard,
          completedCard
        });
      }
      return calendarUi;
    }

    function selectedCalendarDate() {
      return calendarUi?.getSelectedDate() || '';
    }

    function renderCalendar() {
      ensureCalendarUi().render();
    }

    window.renderCalendar = renderCalendar;
    window.changeCalendarMonth = direction => ensureCalendarUi().changeMonth(direction);
    window.openCalendarDayModal = dateIso => ensureCalendarUi().openDay(dateIso);
    window.closeCalendarDayModal = () => ensureCalendarUi().closeDay();

    window.toggleBlockedTrainingDay = async function(checked) {
      const date = selectedCalendarDate() || todayISO();
      if (checked) {
        const existing = blockedDayForDate(date);
        const blockedDay = {
          id: date,
          date,
          reason: existing?.reason || 'unavailable',
          note: existing?.note || '',
          createdAt: existing?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await safeStateWrite({
          apply: () => {
            state.blockedDays = [...(state.blockedDays || []).filter(day => day.date !== date), blockedDay];
          },
          write: () => fsSet('blockedDays', blockedDay.id, blockedDay),
          afterApply: () => openCalendarDayModal(date),
          successMessage: 'Dagen er markert som ikke treningsdag',
          errorMessage: 'Kunne ikke markere dagen'
        });
        return;
      }

      const existing = blockedDayForDate(date);
      if (!existing) return;
      await safeStateWrite({
        apply: () => { state.blockedDays = (state.blockedDays || []).filter(day => day.date !== date); },
        write: () => fsDelete('blockedDays', existing.id || date),
        afterApply: () => openCalendarDayModal(date),
        successMessage: 'Dagen er åpnet for trening igjen',
        errorMessage: 'Kunne ikke åpne dagen for trening'
      });
    };

    window.updateBlockedTrainingDay = async function() {
      const date = selectedCalendarDate() || todayISO();
      const existing = blockedDayForDate(date);
      if (!existing) return;
      const reason = document.getElementById('calendarBlockedReason')?.value || 'unavailable';
      const note = document.getElementById('calendarBlockedNote')?.value.trim() || '';
      const updated = { ...existing, id: existing.id || date, date, reason, note, updatedAt: new Date().toISOString() };
      await safeStateWrite({
        apply: () => {
          state.blockedDays = (state.blockedDays || []).map(day => day.date === date ? updated : day);
        },
        write: () => fsSet('blockedDays', updated.id, updated),
        afterApply: () => openCalendarDayModal(date),
        successMessage: 'Ikke-treningsdag oppdatert',
        errorMessage: 'Kunne ikke oppdatere ikke-treningsdag'
      });
    };

    window.planFromCalendarDay = function() {
      const date = selectedCalendarDate() || todayISO();
      const blocked = blockedDayForDate(date);
      if (blocked && !confirm(`${formatDate(date)} er markert som ikke treningsdag (${blockedDayLabel(blocked)}). Planlegge økt likevel?`)) return;
      closeCalendarDayModal();
      openPlan(date, Boolean(blocked));
    };

    function renderSettingsList(kind, elementId) {
      const values = state.settings[kind] || [];
      document.getElementById(elementId).innerHTML = values.map(value => `
        <div class="settings-item">
          <span>${escapeHtml(value)}</span>
          <button class="btn-soft" onclick="deleteSettingOption('${kind}', decodeURIComponent('${encodeURIComponent(value)}'))">Fjern</button>
        </div>`).join('');
    }

    function renderTrainingGoals() {
      const goals = normalizeGoals(state.settings.goals);
      document.getElementById('weeklySessionsTarget').value = goals.weeklySessionsTarget;
      document.getElementById('weeklyStretchSessionsTarget').value = goals.weeklyStretchSessionsTarget;
      document.getElementById('weeklyHoursTarget').value = goals.weeklyHoursTarget;
      document.getElementById('weeklyKmTarget').value = goals.weeklyKmTarget;
    }

    function renderRaceGoalSettings() {
      const goal = normalizeRaceGoal(state.settings.raceGoal);
      document.getElementById('raceGoalName').value = goal.name;
      document.getElementById('raceGoalDate').value = goal.date;
      document.getElementById('raceGoalDistance').value = goal.distanceKm;
      setDurationFieldsFromSeconds('raceGoalTargetHours', 'raceGoalTargetMinutes', 'raceGoalTargetSeconds', goal.targetTimeSeconds || 0);
      document.getElementById('raceGoalNote').value = goal.note;
    }

    function renderManualRaceResultList() {
      const list = document.getElementById('manualRaceResultList');
      if (!list) return;
      const items = normalizeRaceResultEntries(state.raceResults)
        .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
      list.innerHTML = items.length
        ? items.map(item => `
          <div class="settings-item race-result-item">
            <span>
              <strong>${escapeHtml(raceDistanceLabel(item.distanceKm))} · ${escapeHtml(formatRaceTime(item.resultSeconds))}</strong>
              <small>${escapeHtml([formatDate(item.date), item.name, item.course].filter(Boolean).join(' · '))}</small>
            </span>
            <div class="item-actions">
              <button class="btn-soft" onclick="editManualRaceResult('${item.id}')">Rediger</button>
              <button class="btn-soft" onclick="deleteManualRaceResult('${item.id}')">Slett</button>
            </div>
          </div>`).join('')
        : '<p class="small-note">Ingen manuelle race-resultater registrert ennå.</p>';
    }

    function renderTrainingProfile() {
      const profile = normalizeTrainingProfile(state.settings.trainingProfile);
      document.getElementById('profilePrimaryFocus').value = profile.primaryFocus;
      document.getElementById('profileLevel').value = profile.level;
      document.getElementById('profilePhilosophy').value = profile.philosophy;
      document.getElementById('profilePriority').value = profile.priority;
      document.getElementById('profileRunningPhase').value = profile.trainingFocus;
      document.getElementById('profileWeekPlanPreset').value = profile.weekPlanPreset;
      profile.weekPlanRoles.forEach((role, index) => {
        const select = document.getElementById(`profileWeekRole${index + 1}`);
        if (select) select.value = role;
      });
    }

    function renderPersonProfile() {
      const profile = normalizePersonProfile(state.settings.personProfile);
      document.getElementById('personName').value = profile.name;
      document.getElementById('personBirthYear').value = profile.birthYear;
      document.getElementById('personSex').value = profile.sex;
      document.getElementById('personHeightCm').value = profile.heightCm;
      document.getElementById('personWeightKg').value = profile.weightKg;
      document.getElementById('personMaxHeartRate').value = profile.maxHeartRate;
      document.getElementById('personThresholdHeartRate').value = profile.thresholdHeartRate;
    }

    function formatMetricValue(value, decimals = 0) {
      if (value === '' || value === null || value === undefined) return '-';
      return Number(value).toLocaleString('no-NO', { maximumFractionDigits: decimals });
    }

    function sortedWellness() {
      return [...(state.wellness || [])].sort((a, b) => b.date.localeCompare(a.date));
    }

    function latestMetric(metric) {
      return sortedWellness().find(item => item[metric] !== '' && item[metric] !== null && item[metric] !== undefined);
    }

    function metricTrend(metric) {
      const items = sortedWellness().filter(item => item[metric] !== '' && item[metric] !== null && item[metric] !== undefined);
      if (items.length < 2) return { label: 'Ingen trend ennå', delta: 0 };
      const latest = Number(items[0][metric]);
      const previous = Number(items[1][metric]);
      const delta = latest - previous;
      if (Math.abs(delta) < 0.5) return { label: 'Stabil', delta };
      return { label: delta > 0 ? `Opp ${formatMetricValue(delta, 1)}` : `Ned ${formatMetricValue(Math.abs(delta), 1)}`, delta };
    }

    function tlScaleButtons(field, selected) {
      return [1, 2, 3, 4, 5].map(n =>
        `<button type="button" class="tl-btn${selected === n ? ' selected' : ''}" onclick="setTlValue('${field}', ${n})" aria-label="${field} ${n}">${n}</button>`
      ).join('');
    }

    function renderTrafficLightForm() {
      const s = tlSelections;
      const hasHrBaseline = !!latestMetric('restingHeartRate7d');
      const hrBlock = hasHrBaseline
        ? `<div class="tl-hr-row">
            <label>Hvilepuls i dag</label>
            <input id="tlRestingHr" type="number" min="30" max="120" step="1" placeholder="bpm" inputmode="numeric" aria-label="Hvilepuls i dag" />
            <span class="small-note" style="margin:0;">(valgfritt)</span>
          </div>`
        : `<p class="small-note" style="margin:6px 0 10px;">Logg hvilepuls under Helse for å aktivere hvilepuls-indikatoren.</p>`;
      const stairsBtns = [
        `<button type="button" class="tl-btn${s.stairsOk === true ? ' selected' : ''}" onclick="setTlValue('stairsOk', true)">Ja</button>`,
        `<button type="button" class="tl-btn${s.stairsOk === false ? ' selected red' : ''}" onclick="setTlValue('stairsOk', false)">Nei</button>`
      ].join('');
      return `
        <div class="tl-row">
          <label>Søvn i natt</label>
          <div class="tl-scale">${tlScaleButtons('sleep', s.sleep)}</div>
          <div class="tl-scale-labels"><span>Dårlig</span><span>Bra</span></div>
        </div>
        <div class="tl-row">
          <label>Energinivå nå</label>
          <div class="tl-scale">${tlScaleButtons('energy', s.energy)}</div>
          <div class="tl-scale-labels"><span>Utmattet</span><span>Pigg</span></div>
        </div>
        <div class="tl-row" style="align-items:center;">
          <label style="flex:1;">Trapp uten å bli andpusten?</label>
          <div class="tl-scale" style="gap:6px;">${stairsBtns}</div>
          <span class="small-note" style="margin:0;width:70px;text-align:right;">(valgfritt)</span>
        </div>
        ${hrBlock}
        <button class="btn-primary btn-full" onclick="submitTrafficLight()" ${s.sleep && s.energy ? '' : 'disabled'}>Sjekk dagsform</button>`;
    }

    function renderTrafficLightResult(readiness) {
      const cfg = TRAFFIC_LIGHT_CONFIG[readiness.level];
      return `
        <div class="traffic-light-display">
          <span class="traffic-dot-lg ${readiness.level}"></span>
          <div>
            <strong>${escapeHtml(cfg.label)}</strong>
            <p class="small-note" style="margin-top:4px;">${escapeHtml(cfg.advice)}</p>
          </div>
        </div>
        <button class="btn-soft" style="margin-top:10px;font-size:0.82rem;padding:7px 12px;" onclick="resetTrafficLight()">Endre</button>`;
    }

    function injuryAreaOptions(selectedRegion = '', selectedSide = '') {
      const regionOptions = [
        '<option value="">Kroppsdel</option>',
        ...Object.entries(PAIN_AREA_REGIONS).map(([value, label]) => `<option value="${value}" ${value === selectedRegion ? 'selected' : ''}>${escapeHtml(label)}</option>`)
      ].join('');
      const sideOptions = [
        '<option value="">Side</option>',
        ...Object.entries(PAIN_AREA_SIDES).map(([value, label]) => `<option value="${value}" ${value === selectedSide ? 'selected' : ''}>${escapeHtml(label)}</option>`)
      ].join('');
      return { regionOptions, sideOptions };
    }

    function injuryFollowupLine(checkins) {
      if (!checkins.length) return '';
      const scores = checkins.map(item => item.painNow).filter(value => value !== '').join(' -> ');
      const latest = checkins[checkins.length - 1];
      const loc = latest.area ? ` i ${latest.area}` : '';
      return `Trend${loc}: ${scores}/10.`;
    }

    function injuryCheckinSummaryText(checkin, latest, recent) {
      const source = checkin || latest || {};
      const area = source.area ? `${source.area} ` : '';
      const pain = source.painNow !== '' && source.painNow !== undefined ? `${source.painNow}/10` : '';
      const trend = checkin?.trend ? ` · ${injuryTrendLabel(checkin.trend).toLowerCase()}` : '';
      if (checkin) return `Smerte: ${area}${pain}${trend}`;
      return injuryFollowupLine(recent) || `Følg opp smerte${area ? `: ${area}` : ''}${pain ? pain : ''}`;
    }

    function renderInjuryCheckinBlock(readiness) {
      const today = todayISO();
      if (!shouldShowInjuryCheckin(today)) return '';
      const latest = latestPainReference(today) || {};
      const checkin = normalizeInjuryCheckin(readiness?.injuryCheckin) || null;
      const current = checkin || {
        painNow: '',
        areaRegion: latest.areaRegion || '',
        areaSide: latest.areaSide || '',
        area: latest.area || '',
        trend: '',
        note: ''
      };
      const { regionOptions, sideOptions } = injuryAreaOptions(current.areaRegion, current.areaSide);
      const recent = dailyInjuryCheckinsUntil(today, 7);
      const statusLine = injuryFollowupLine(recent) || (latest.painNow ? `Siste smerte: ${latest.painNow}/10${latest.area ? ` i ${latest.area}` : ''}.` : '');
      if (!injuryCheckinExpanded) {
        const summary = injuryCheckinSummaryText(checkin, latest, recent);
        return `
          <div class="injury-checkin-compact">
            <div>
              <strong>Oppfølging av smerte</strong>
              <span>${escapeHtml(summary)}</span>
            </div>
            <button class="btn-soft" onclick="expandInjuryCheckin()">${checkin ? 'Endre' : 'Registrer'}</button>
          </div>`;
      }
      return `
        <div class="injury-checkin-card">
          <div class="injury-checkin-top">
            <strong>Oppfølging av smerte</strong>
            ${statusLine ? `<span>${escapeHtml(statusLine)}</span>` : ''}
          </div>
          <div class="grid-2">
            <div><label>Smerte nå</label><input id="injuryPainNow" type="number" min="0" max="10" step="1" inputmode="numeric" placeholder="0-10" value="${escapeHtml(current.painNow)}" /></div>
            <div>
              <label>Utvikling</label>
              <select id="injuryTrend">
                <option value="">Velg</option>
                <option value="better" ${current.trend === 'better' ? 'selected' : ''}>Bedre</option>
                <option value="same" ${current.trend === 'same' ? 'selected' : ''}>Lik</option>
                <option value="worse" ${current.trend === 'worse' ? 'selected' : ''}>Verre</option>
              </select>
            </div>
          </div>
          <div class="grid-2">
            <div><label>Kroppsdel</label><select id="injuryAreaRegion">${regionOptions}</select></div>
            <div><label>Side</label><select id="injuryAreaSide">${sideOptions}</select></div>
          </div>
          <textarea id="injuryNote" placeholder="Kort notat, f.eks. vondt i trapper eller bedre etter hvile">${escapeHtml(current.note)}</textarea>
          <div class="button-row">
            <button class="btn-primary" onclick="saveInjuryCheckin()">Lagre smerte</button>
            ${checkin ? '<button class="btn-soft" onclick="clearInjuryCheckin()">Tøm</button>' : ''}
            <button class="btn-soft" onclick="collapseInjuryCheckin()">Lukk</button>
          </div>
        </div>`;
    }

    function renderTrafficLight() {
      const container = document.getElementById('trafficLightContent');
      if (!container) return;
      const readiness = loadDailyReadiness();
      const hasTrafficResult = Boolean(readiness?.level && TRAFFIC_LIGHT_CONFIG[readiness.level]);
      container.innerHTML = `${hasTrafficResult ? renderTrafficLightResult(readiness) : renderTrafficLightForm()}${renderInjuryCheckinBlock(readiness)}`;
    }

    window.setTlValue = function(field, value) {
      tlSelections[field] = value;
      renderTrafficLight();
    };

    window.expandInjuryCheckin = function() {
      injuryCheckinExpanded = true;
      renderTrafficLight();
    };

    window.collapseInjuryCheckin = function() {
      injuryCheckinExpanded = false;
      renderTrafficLight();
    };

    window.submitTrafficLight = async function() {
      const { sleep, energy, stairsOk } = tlSelections;
      if (!sleep || !energy) return;
      const restingHR = Number(document.getElementById('tlRestingHr')?.value) || null;
      const level = assessTrafficLight(sleep, energy, restingHR, stairsOk);
      const readiness = { date: todayISO(), sleep, energy, restingHR, stairsOk, level };
      tlSelections = { sleep: null, energy: null, stairsOk: null };
      state.settings.dailyReadiness = {
        ...(state.settings.dailyReadiness || {}),
        [readiness.date]: { ...(state.settings.dailyReadiness?.[readiness.date] || {}), ...readiness }
      };
      renderTrafficLight();
      render();
      await saveDailyReadiness(readiness);
    };

    window.resetTrafficLight = async function() {
      const today = todayISO();
      const existingInjury = state.settings.dailyReadiness?.[today]?.injuryCheckin || null;
      if (state.settings.dailyReadiness) {
        if (existingInjury) state.settings.dailyReadiness[today] = { date: today, injuryCheckin: existingInjury };
        else delete state.settings.dailyReadiness[today];
      }
      tlSelections = { sleep: null, energy: null, stairsOk: null };
      renderTrafficLight();
      render();
      try { await fsSet('settings', 'preferences', state.settings); }
      catch (err) { console.error('Could not reset daily readiness:', err); }
    };

    window.saveInjuryCheckin = async function() {
      const today = todayISO();
      const painNow = document.getElementById('injuryPainNow')?.value ?? '';
      const areaRegion = document.getElementById('injuryAreaRegion')?.value || '';
      const areaSide = document.getElementById('injuryAreaSide')?.value || '';
      const injuryCheckin = normalizeInjuryCheckin({
        painNow,
        areaRegion,
        areaSide,
        area: formatAreaLabel(areaRegion, areaSide),
        trend: document.getElementById('injuryTrend')?.value || '',
        note: document.getElementById('injuryNote')?.value || ''
      });
      if (!injuryCheckin || injuryCheckin.painNow === '') {
        return alert('Legg inn smerte nå fra 0 til 10.');
      }
      state.settings.dailyReadiness = {
        ...(state.settings.dailyReadiness || {}),
        [today]: {
          ...(state.settings.dailyReadiness?.[today] || { date: today }),
          date: today,
          injuryCheckin
        }
      };
      injuryCheckinExpanded = false;
      render();
      try {
        await fsSet('settings', 'preferences', state.settings);
        showToast('Smerteoppfølging lagret');
      } catch (err) {
        console.error('Could not save injury check-in:', err);
        showToast('Kunne ikke lagre smerteoppfølging', 'error');
      }
    };

    window.clearInjuryCheckin = async function() {
      const today = todayISO();
      if (state.settings.dailyReadiness?.[today]) {
        delete state.settings.dailyReadiness[today].injuryCheckin;
      }
      injuryCheckinExpanded = false;
      render();
      try {
        await fsSet('settings', 'preferences', state.settings);
      } catch (err) {
        console.error('Could not clear injury check-in:', err);
      }
    };

    function renderDashboardWellness() {
      const latestVo2 = latestMetric('vo2Max');
      const latestHrv = latestMetric('hrv7d');
      const latestRestingHr = latestMetric('restingHeartRate7d');
      document.getElementById('homeVo2Max').textContent = latestVo2 ? formatMetricValue(latestVo2.vo2Max, 1) : '-';
      document.getElementById('homeHrv').textContent = latestHrv ? `${formatMetricValue(latestHrv.hrv7d)} ms` : '-';
      document.getElementById('homeRestingHr').textContent = latestRestingHr ? `${formatMetricValue(latestRestingHr.restingHeartRate7d)} bpm` : '-';
      const latestDates = [latestVo2?.date, latestHrv?.date, latestRestingHr?.date].filter(Boolean).sort();
      const latestDate = latestDates[latestDates.length - 1];
      document.getElementById('homeWellnessNote').textContent = latestVo2 || latestHrv
        ? `Sist oppdatert ${formatDate(latestDate)}. Følg trend over tid, ikke enkeltmålinger alene.`
        : 'Legg inn VO2 Max og HRV fra Garmin under Setup for å følge formutvikling.';
    }

    function renderWellnessList() {
      const items = sortedWellness().slice(0, 8);
      const list = document.getElementById('wellnessList');
      list.innerHTML = items.length ? items.map(item => `
        <div class="settings-item">
          <span>${escapeHtml(formatDate(item.date))} · VO2 ${escapeHtml(formatMetricValue(item.vo2Max, 1))} · HRV ${escapeHtml(formatMetricValue(item.hrv7d))} ms · Hvilepuls ${escapeHtml(formatMetricValue(item.restingHeartRate7d))} bpm</span>
          <span style="display:flex;gap:6px;">
            <button class="btn-soft" onclick="editWellnessMeasurement('${item.id}')">Rediger</button>
            <button class="btn-soft" onclick="deleteWellnessMeasurement('${item.id}')">Fjern</button>
          </span>
        </div>`).join('') : '<div class="empty">Ingen formmålinger enda.</div>';
      if (!document.getElementById('wellnessDate').value) document.getElementById('wellnessDate').value = todayISO();
    }

    function wellnessTrendRow(label, metric, suffix = '') {
      const latest = latestMetric(metric);
      const trend = metricTrend(metric);
      const value = latest ? `${formatMetricValue(latest[metric], metric === 'vo2Max' ? 1 : 0)}${suffix}` : '-';
      return `
        <div class="week-row">
          <div class="week-row-top">
            <span>${escapeHtml(label)}</span>
            <span>${escapeHtml(value)} · ${escapeHtml(trend.label)}</span>
          </div>
          <p class="small-note">${latest ? `Siste måling ${formatDate(latest.date)}` : 'Ingen måling registrert ennå.'}</p>
        </div>`;
    }

    function trendSvg(points, mode = 'bar') {
      const values = points.map(point => Number(point.value) || 0);
      const max = Math.max(...values, 1);
      const min = mode === 'line' ? Math.min(...values) : 0;
      const range = Math.max(1, max - min);
      const width = 320;
      const height = 112;
      const padX = 16;
      const padY = 14;
      const innerW = width - (padX * 2);
      const innerH = height - (padY * 2);

      if (!points.length) {
        return `<div class="trend-empty">Ingen data ennå</div>`;
      }

      if (mode === 'line') {
        const coords = points.map((point, index) => {
          const x = points.length === 1 ? width / 2 : padX + ((index / (points.length - 1)) * innerW);
          const y = padY + ((max - (Number(point.value) || 0)) / range) * innerH;
          return { x, y, point };
        });
        const polyline = coords.map(coord => `${coord.x.toFixed(1)},${coord.y.toFixed(1)}`).join(' ');
        const dots = coords.map(coord => `<circle cx="${coord.x.toFixed(1)}" cy="${coord.y.toFixed(1)}" r="3.5"><title>${escapeHtml(coord.point.label)}: ${escapeHtml(coord.point.display)}</title></circle>`).join('');
        return `
          <svg class="trend-chart line" viewBox="0 0 ${width} ${height}" role="img" aria-label="Trendgraf">
            <line x1="${padX}" y1="${height - padY}" x2="${width - padX}" y2="${height - padY}"></line>
            <polyline points="${polyline}"></polyline>
            ${dots}
          </svg>`;
      }

      const gap = 7;
      const barW = Math.max(10, (innerW - (gap * Math.max(0, points.length - 1))) / points.length);
      const bars = points.map((point, index) => {
        const value = Number(point.value) || 0;
        const barH = Math.max(value > 0 ? 7 : 2, (value / max) * innerH);
        const x = padX + index * (barW + gap);
        const y = height - padY - barH;
        return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${barH.toFixed(1)}" rx="5"><title>${escapeHtml(point.label)}: ${escapeHtml(point.display)}</title></rect>`;
      }).join('');
      return `
        <svg class="trend-chart bar" viewBox="0 0 ${width} ${height}" role="img" aria-label="Trendgraf">
          <line x1="${padX}" y1="${height - padY}" x2="${width - padX}" y2="${height - padY}"></line>
          ${bars}
        </svg>`;
    }

    function trendCard(title, points, formatter, mode = 'bar', note = '', options = {}) {
      const latest = points[points.length - 1];
      const previous = points[points.length - 2];
      const latestDisplay = latest ? formatter(latest.value) : '-';
      const delta = latest && previous ? (Number(latest.value) || 0) - (Number(previous.value) || 0) : 0;
      const deltaText = latest && previous && Math.abs(delta) > 0.05
        ? `${delta > 0 ? 'Opp' : 'Ned'} ${formatter(Math.abs(delta))}`
        : latest && previous ? 'Stabil' : 'Ingen trend ennå';
      const latestPrefix = options.latestPrefix || 'Nå';
      const previousPrefix = options.previousPrefix || 'Forrige';
      const summaryItems = latest && previous
        ? [`${latestPrefix}: ${latestDisplay}`, `${previousPrefix}: ${formatter(previous.value)}`, deltaText]
        : latest ? [`${latestPrefix}: ${latestDisplay}`, deltaText] : [deltaText];
      const displayPoints = points.map(point => ({ ...point, display: formatter(point.value) }));
      return `
        <div class="trend-card">
          <div class="trend-card-top">
            <strong>${escapeHtml(title)}</strong>
            <span class="trend-summary">${summaryItems.map(item => `<em>${escapeHtml(item)}</em>`).join('')}</span>
          </div>
          ${trendSvg(displayPoints, mode)}
          <div class="trend-labels">
            ${displayPoints.map(point => `
              <div>
                <span>${escapeHtml(point.label)}</span>
                <strong>${escapeHtml(point.display)}</strong>
              </div>`).join('')}
          </div>
          ${note ? `<p class="small-note">${escapeHtml(note)}</p>` : ''}
        </div>`;
    }

    function wellnessTrendPoints(metric) {
      return sortedWellness()
        .filter(item => item[metric] !== '' && item[metric] !== null && item[metric] !== undefined)
        .slice(0, 8)
        .reverse()
        .map(item => ({
          date: item.date,
          label: formatShortDate(item.date),
          value: Number(item[metric]) || 0
        }));
    }

    function renderWellnessInsights() {
      const points = {
        vo2Max: wellnessTrendPoints('vo2Max'),
        hrv7d: wellnessTrendPoints('hrv7d'),
        restingHeartRate7d: wellnessTrendPoints('restingHeartRate7d')
      };
      const dates = Object.values(points).flat().map(item => item.date).filter(Boolean).sort();
      const evidence = wellnessTrendInsightEvidence(points, { from: dates[0] || '', to: dates.at(-1) || '' });
      document.getElementById('insightWellnessTrend').innerHTML = [
        trendCard('VO2 Max', points.vo2Max, value => formatMetricValue(value, 1), 'line'),
        trendCard('HRV 7d', points.hrv7d, value => `${formatMetricValue(value)} ms`, 'line'),
        trendCard('Hvilepuls 7d', points.restingHeartRate7d, value => `${formatMetricValue(value)} bpm`, 'line', 'Lavere hvilepuls kan være positivt, men vurder sammen med HRV og dagsform.')
      ].join('') + insightEvidenceDisclosureHtml(evidence, { escapeHtml, formatDate });
    }

    function homeLoadLabel(weekItems, profile) {
      const summary = summarizeTrainingEffects(weekItems);
      if (!summary.total) return weekItems.length ? 'Mangler data' : 'Ingen';
      const high = summary.categories.high_aerobic.count;
      const anaerobic = summary.categories.anaerobic.count;
      const low = summary.categories.low_aerobic.count;
      const runningBakkenFocus = profile.primaryFocus === 'running' && profile.philosophy === 'bakken_threshold';
      if (anaerobic >= 1) return runningBakkenFocus ? 'Hard' : 'Høy';
      if (high >= 2 && low === 0) return 'Kvalitet';
      if (high >= 1 && low >= 1) return 'Balansert';
      if (low >= 1 && high === 0) return 'Rolig';
      return 'Kontrollert';
    }

    function findSuggestedTemplate(suggestion, excludedTemplateIds = []) {
      return findSuggestedTemplateCore(state.templates || [], suggestion, excludedTemplateIds, {
        roleLabels: WORKOUT_ROLE_LABELS
      });
    }

    function buildWorkoutSuggestion(today, weekSummary, weekItems, last14Days, profile) {
      return buildWorkoutSuggestionCore({
        weekSummary,
        effectSummary: summarizeTrainingEffects(weekItems),
        bodyState: bodySignalState(last14Days),
        profile,
        goals: normalizeGoals(state.settings.goals)
      });
    }

    function renderWorkoutSuggestion(today, weekSummary, weekItems, last14Days, profile) {
      const suggestion = buildWorkoutSuggestion(today, weekSummary, weekItems, last14Days, profile);
      const template = findSuggestedTemplate(suggestion);
      const tomorrow = nextAvailableTrainingDate(addDays(today, 1));
      const templateCoachMeta = template
        ? [templatePurposeLabel(template.purpose), templateLoadLabel(template.load)].filter(Boolean).join(' · ')
        : '';
      const templateMeta = template
        ? `<div class="suggestion-template"><span>Passende mal</span><strong>${escapeHtml(template.name)}</strong><small>${escapeHtml([template.type, template.intensity, templateCoachMeta].filter(Boolean).join(' · '))}</small></div>`
        : '<div class="suggestion-template"><span>Passende mal</span><strong>Ingen tydelig match</strong><small>Lag gjerne en mal som matcher forslaget.</small></div>';
      const principleLine = coachPrincipleText(suggestion.principleIds);
      document.getElementById('homeWorkoutSuggestion').innerHTML = `
        <div class="suggestion-card">
          <div class="suggestion-kicker">Neste smarte valg</div>
          <h3>${escapeHtml(suggestion.title)}</h3>
          <p class="suggestion-main">${escapeHtml(suggestion.detail)}</p>
          <p class="suggestion-reason">${escapeHtml(suggestion.note)}</p>
          ${principleLine ? `<p class="suggestion-principle">${escapeHtml(principleLine)}</p>` : ''}
          ${templateMeta}
          <div class="button-row">
            ${template ? `<button class="btn-primary" onclick="planSuggestedWorkout('${template.id}', '${tomorrow}')">Planlegg</button>` : ''}
            <button class="btn-soft" onclick="${template ? `openPlan('${tomorrow}')` : 'openLibrary()'}">${template ? 'Velg annen' : 'Lag øktmal'}</button>
          </div>
        </div>`;
    }

    function itemWorkoutRole(item) {
      const isCompleted = state.completed.some(entry => entry.id === item.id);
      return inferredWorkoutRole(isCompleted ? completedTemplate(item) : plannedTemplate(item));
    }

    function itemsWithWorkoutRole(items = []) {
      return items.map(item => ({ ...item, workoutRole: itemWorkoutRole(item) }));
    }

    function normalWeekRoles(profile, goals = normalizeGoals(state.settings.goals)) {
      return normalWeekRolesCore(profile, goals, defaultSettings.trainingProfile.weekPlanRoles);
    }

    function roleCoverage(rolePlan, completedItems = [], plannedItems = []) {
      return roleCoverageCore(rolePlan, itemsWithWorkoutRole(completedItems), itemsWithWorkoutRole(plannedItems));
    }

    function roleAwareSuggestions(count, bodyState, weekSummary, weekItems, profile, goals, completedItems = [], plannedItems = []) {
      return roleAwareSuggestionsCore(
        count,
        bodyState,
        weekItems,
        profile,
        goals,
        itemsWithWorkoutRole(completedItems),
        itemsWithWorkoutRole(plannedItems),
        {
          defaultRoles: defaultSettings.trainingProfile.weekPlanRoles,
          getLoadLevel: item => completedLoadAssessment(item).level
        }
      );
    }

    function bakkenWeekRecipe(count, bodyState, weekSummary, weekItems, profile = normalizeTrainingProfile(state.settings.trainingProfile)) {
      return bakkenWeekRecipeCore(count, bodyState, weekItems, profile, {
        defaultRoles: defaultSettings.trainingProfile.weekPlanRoles,
        getLoadLevel: item => completedLoadAssessment(item).level
      });
    }

    function weekPlanSuggestionMix(mainSuggestion, remainingCount, profile) {
      return weekPlanSuggestionMixCore(mainSuggestion, remainingCount, profile, {
        defaultRoles: defaultSettings.trainingProfile.weekPlanRoles,
        getLoadLevel: item => completedLoadAssessment(item).level
      });
    }

    function weekPlanDates(today, weekEnd, plannedThisWeek, count) {
      return weekPlanDatesCore(today, weekEnd, plannedThisWeek, blockedDaysBetween(today, weekEnd), count);
    }

    function weekPlanDatesInRange(rangeStart, rangeEnd, plannedItems, count) {
      return weekPlanDatesInRangeCore(rangeStart, rangeEnd, plannedItems, blockedDaysBetween(rangeStart, rangeEnd), count);
    }

    function buildWeekPlanSuggestions(today, weekEnd, plannedThisWeek, weekSummary, weekItems, last14Days, profile, remainingAfterPlanned, raceContext = null) {
      if (remainingAfterPlanned <= 0) return [];
      const mainSuggestion = buildWorkoutSuggestion(today, weekSummary, weekItems, last14Days, profile);
      const bodyState = bodySignalState(last14Days);
      const baseMix = profile.primaryFocus === 'running' && profile.philosophy === 'bakken_threshold'
        ? roleAwareSuggestions(remainingAfterPlanned, bodyState, weekSummary, weekItems, profile, normalizeGoals(state.settings.goals), weekItems, plannedThisWeek)
        : weekPlanSuggestionMix(mainSuggestion, remainingAfterPlanned, profile);
      const suggestions = applyRaceContextToSuggestionMix(baseMix, raceContext, remainingAfterPlanned);
      const dates = weekPlanDates(today, weekEnd, plannedThisWeek, suggestions.length);
      return assembleWeekPlanSuggestions(suggestions, dates, state.templates || [], {
        roleLabels: WORKOUT_ROLE_LABELS
      });
    }

    function buildNextWeekPlanSuggestions(nextWeekStart, nextWeekEnd, plannedNextWeek, weekSummary, weekItems, last14Days, profile, goals, raceContext = null) {
      const target = Math.max(1, Number(goals.weeklySessionsTarget) || 3);
      const remaining = Math.max(0, target - plannedNextWeek.length);
      if (remaining <= 0) return [];
      const mainSuggestion = buildWorkoutSuggestion(todayISO(), weekSummary, weekItems, last14Days, profile);
      const bodyState = bodySignalState(last14Days);
      const baseMix = profile.primaryFocus === 'running' && profile.philosophy === 'bakken_threshold'
        ? roleAwareSuggestions(remaining, bodyState, weekSummary, weekItems, profile, goals, [], plannedNextWeek)
        : weekPlanSuggestionMix(mainSuggestion, remaining, profile);
      const suggestions = applyRaceContextToSuggestionMix(baseMix, raceContext, remaining);
      const dates = weekPlanDatesInRange(nextWeekStart, nextWeekEnd, plannedNextWeek, suggestions.length);
      return assembleWeekPlanSuggestions(suggestions, dates, state.templates || [], {
        roleLabels: WORKOUT_ROLE_LABELS
      });
    }

    function roleStatusLabel(status) {
      return {
        completed: 'Utført',
        planned: 'Planlagt',
        missing: 'Mangler',
        optional: 'Valgfri'
      }[status] || 'Mangler';
    }

    function roleStatusMeta(item) {
      if (item.completed) return formatDate(item.completed.date);
      if (item.planned) return formatDate(item.planned.date);
      return item.required ? 'Bør dekkes' : 'Bonus';
    }

    function weekRoleStatusHtml(coverage) {
      return `
        <div class="week-role-grid">
          ${coverage.map(item => {
            const clickable = item.status === 'missing' && item.required;
            return `
            <div class="week-role-chip ${item.status}${clickable ? ' clickable' : ''}"
              ${clickable ? `onclick="planForRole('${item.role}')" title="Trykk for å planlegge ${escapeHtml(WORKOUT_ROLE_LABELS[item.role] || '')}"` : ''}>
              <span>${escapeHtml(WORKOUT_ROLE_LABELS[item.role] || 'Økt')}</span>
              <strong>${escapeHtml(roleStatusLabel(item.status))}${clickable ? ' →' : ''}</strong>
              <small>${escapeHtml(roleStatusMeta(item))}</small>
            </div>`;
          }).join('')}
        </div>`;
    }

    window.planForRole = function(role) {
      const suggestion = suggestionForWorkoutRole(role);
      const template = findSuggestedTemplate(suggestion);
      showTab('plan');
      const dateEl = document.getElementById('planDate');
      if (dateEl && !dateEl.value) dateEl.value = nextAvailableTrainingDate(addDays(todayISO(), 1));
      if (template) {
        const select = document.getElementById('planTemplate');
        if (select) select.value = template.id;
      }
    };

    function suggestionRoleReason(suggestion, template) {
      const role = template?.role || asArray(suggestion.roles)[0] || '';
      const roleLabel = WORKOUT_ROLE_LABELS[role] || '';
      if (!roleLabel) return suggestion.note || '';
      if (role === 'recovery' || role === 'mobility') return `${roleLabel}: valgt for lav risiko og bedre totalbelastning.`;
      if (role === 'x_workout') return `${roleLabel}: valgfri variasjon hvis kroppen har overskudd.`;
      return `${roleLabel}: dekker en rolle i normaluka.`;
    }

    function suggestedWeekPlanItem(suggestion, template, dateIso, index) {
      const meta = template
        ? [template.type, template.intensity, templateLoadLabel(template.load)].filter(Boolean).join(' · ')
        : suggestion.detail;
      const reason = suggestionRoleReason(suggestion, template);
      const kind = templateCalendarKind(template || {}, suggestion);
      const title = template ? template.name : suggestion.title;
      const chips = templateCalendarChips(template || {}, suggestion);
      return `
        <div class="week-plan-item suggested week-plan-kind-${escapeHtml(kind.key)}">
          <div>
            <div class="week-plan-item-head">
              <strong>${escapeHtml(formatDate(dateIso))}</strong>
              <small>Forslag</small>
            </div>
            <span class="week-plan-title">${escapeHtml(title)}</span>
            ${meta ? `<small class="week-plan-meta">${escapeHtml(meta)}</small>` : ''}
            ${chips ? `<div class="week-plan-chip-row">${chips}</div>` : ''}
            ${reason ? `<small class="week-plan-reason">${escapeHtml(reason)}</small>` : ''}
          </div>
          ${template
            ? `<button class="btn-primary" onclick="planSuggestedWorkout('${template.id}', '${dateIso}', 'Ukeplan forslag ${index + 1}. Juster etter dagsform.')">Planlegg</button>`
            : `<button class="btn-soft" onclick="openPlan('${dateIso}')">Velg</button>`}
        </div>`;
    }

    function plannedWeekItem(item) {
      const template = plannedTemplate(item);
      const kind = templateCalendarKind(template);
      const chips = templateCalendarChips(template);
      return `
        <div class="week-plan-item planned week-plan-kind-${escapeHtml(kind.key)}">
          <div>
            <div class="week-plan-item-head">
              <strong>${escapeHtml(formatDate(item.date))}</strong>
              <small>Planlagt</small>
            </div>
            <span class="week-plan-title">${escapeHtml(template.name)}</span>
            <small class="week-plan-meta">${escapeHtml([template.type, template.intensity].filter(Boolean).join(' · '))}</small>
            ${chips ? `<div class="week-plan-chip-row">${chips}</div>` : ''}
            ${item.notes ? `<small class="week-plan-reason">${escapeHtml(item.notes)}</small>` : ''}
          </div>
          <button class="btn-soft" onclick="openPlan('${item.date}')">Endre</button>
        </div>`;
    }

    function buildRaceWeekPlanContext(today) {
      const goal = state.settings.raceGoal;
      const last7Start = addDays(today, -6);
      const last28Start = addDays(today, -27);
      const last7 = summarizeCompleted(state.completed.filter(item => item.date >= last7Start && item.date <= today));
      const last28 = summarizeCompleted(state.completed.filter(item => item.date >= last28Start && item.date <= today));
      const injurySummary = injurySignalSummary(injurySignalEntriesUntil(today, 7));
      const readiness = raceReadinessSummary(goal, completedRaceItems(), state.raceResults, today);
      const plan = raceGoalPlan(goal, readiness, injurySummary, today);
      const testRecommendation = raceTestRecommendation({ goal, readiness, plan, injurySummary, last7, last28 }, today);
      return raceWeekPlanContext({ goal, readiness, plan, testRecommendation, injurySummary, last7, last28 }, today);
    }

    function raceWeekPlanContextHtml(raceContext) {
      if (!raceContext?.active) return '';
      return `
        <div class="week-race-context ${escapeHtml(raceContext.phase || 'base')}">
          <div>
            <span>Mål-løp i ukeplan</span>
            <strong>${escapeHtml(raceContext.title || 'Mål-løp')}</strong>
            <small>${escapeHtml(raceContext.summary || '')}</small>
          </div>
          <p>${escapeHtml(raceContext.note || '')}</p>
        </div>`;
    }

    function renderWeekPlan(today, weekSummary, weekItems, last14Days, profile, goals, plannedActive) {
      const container = document.getElementById('homeWeekPlan');
      if (!container) return;
      const weekStart = startOfWeek(today);
      const weekEnd = addDays(weekStart, 6);
      const nextWeekStart = addDays(weekStart, 7);
      const nextWeekEnd = addDays(nextWeekStart, 6);
      const plannedThisWeek = plannedActive
        .filter(item => item.date >= today && item.date <= weekEnd)
        .sort((a, b) => a.date.localeCompare(b.date));
      const plannedNextWeek = plannedActive
        .filter(item => item.date >= nextWeekStart && item.date <= nextWeekEnd)
        .sort((a, b) => a.date.localeCompare(b.date));
      const completedCount = weekSummary.sessions;
      const plannedCount = plannedThisWeek.length;
      const remainingAfterPlanned = Math.max(0, goals.weeklySessionsTarget - completedCount - plannedCount);
      const status = weeklyTrainingStatus(weekItems, weekSummary, goals, profile);
      const bodyState = bodySignalState(last14Days);
      const raceContext = buildRaceWeekPlanContext(today);
      const nextRaceContext = raceContext?.active && remainingAfterPlanned > 0
        ? { ...raceContext, allowRaceTest: false, testSuggestion: null }
        : raceContext;
      const suggestedItems = buildWeekPlanSuggestions(today, weekEnd, plannedThisWeek, weekSummary, weekItems, last14Days, profile, remainingAfterPlanned, raceContext);
      const suggestedNextWeek = buildNextWeekPlanSuggestions(nextWeekStart, nextWeekEnd, plannedNextWeek, weekSummary, weekItems, last14Days, profile, goals, nextRaceContext);
      const rolePlan = normalWeekRoles(profile, goals);
      const currentRoleCoverage = roleCoverage(rolePlan, weekItems, plannedThisWeek);
      const nextRoleCoverage = roleCoverage(rolePlan, [], plannedNextWeek);
      const suggestionDates = suggestedItems.map(item => item.date);
      const nextWeekDates = suggestedNextWeek.map(item => item.date);
      const mainSuggestion = suggestedItems[0]?.suggestion || buildWorkoutSuggestion(today, weekSummary, weekItems, last14Days, profile);
      const nextMainSuggestion = suggestedNextWeek[0]?.suggestion || mainSuggestion;
      const missingCurrentRoles = currentRoleCoverage.filter(item => item.status === 'missing').map(item => WORKOUT_ROLE_LABELS[item.role]).filter(Boolean);
      const missingNextRoles = nextRoleCoverage.filter(item => item.status === 'missing').map(item => WORKOUT_ROLE_LABELS[item.role]).filter(Boolean);
      const planSummary = completedCount >= goals.weeklySessionsTarget
        ? 'Ukesmålet er nådd. Eventuelle ekstraøkter bør være bonus og styres av overskudd.'
        : plannedCount
          ? `${completedCount}/${goals.weeklySessionsTarget} utført og ${plannedCount} planlagt. ${remainingAfterPlanned} åpne økt${remainingAfterPlanned === 1 ? '' : 'er'} igjen.`
          : `${completedCount}/${goals.weeklySessionsTarget} utført. Appen foreslår neste steg for å gjøre uka gjennomførbar.`;
      const roleSummary = missingCurrentRoles.length
        ? `Mangler i normaluka: ${missingCurrentRoles.join(', ')}.`
        : 'Normaluka er dekket med utførte eller planlagte økter.';
      const nextSummary = nextWeekPlanSummary(plannedNextWeek, suggestedNextWeek, goals, status, bodyState);
      const nextRoleSummary = missingNextRoles.length
        ? `Neste uke mangler foreløpig: ${missingNextRoles.join(', ')}.`
        : 'Neste uke dekker rollene i normaluka.';
      const suggestedNextRoles = new Set(suggestedNextWeek.flatMap(item => asArray(item.suggestion?.roles || [])));
      const skippedNextRoles = nextRoleCoverage
        .filter(item => item.status === 'missing' && item.required && !suggestedNextRoles.has(item.role))
        .map(item => WORKOUT_ROLE_LABELS[item.role]).filter(Boolean);
      const skippedRoleNote = skippedNextRoles.length && (bodyState.level === 'cooling' || bodyState.level === 'caution')
        ? `${skippedNextRoles.join(' og ')} er ikke foreslått denne uken fordi coachen starter rolig etter registrert kroppssignal. Trykk på "Mangler →"-chipen for å legge det inn manuelt hvis du føler deg klar.`
        : '';
      const actionLine = suggestedItems.length
        ? `${suggestedItems.length} forslag for resten av uka`
        : remainingAfterPlanned <= 0
          ? 'Uka er dekket'
          : 'Planlegg manuelt';
      const nextActionLine = suggestedNextWeek.length
        ? `${suggestedNextWeek.length} forslag for neste uke`
        : plannedNextWeek.length
          ? 'Neste uke er dekket'
          : 'Planlegg neste uke manuelt';

      container.innerHTML = `
        <div class="week-plan-card ${status.level}">
          <div class="week-plan-top">
            <span class="tag weekly-${status.level}">${escapeHtml(status.label)}</span>
            <strong>${escapeHtml(completedCount)} utført · ${escapeHtml(plannedCount)} planlagt</strong>
          </div>
          <div class="week-plan-action-line">${escapeHtml(actionLine)}</div>
          <p>${escapeHtml(planSummary)}</p>
          ${raceWeekPlanContextHtml(raceContext)}
          <p class="week-plan-role-summary">${escapeHtml(roleSummary)}</p>
          ${weekRoleStatusHtml(currentRoleCoverage)}
          <div class="week-plan-list">
            ${plannedThisWeek.slice(0, 3).map(plannedWeekItem).join('')}
            ${suggestedItems.map((item, index) => suggestedWeekPlanItem(item.suggestion, item.template, item.date, index)).join('')}
          </div>
          ${suggestedItems.length ? `<p class="week-plan-note">${escapeHtml(mainSuggestion.note)}</p>` : ''}
          <div class="button-row">
            ${suggestedItems.some(item => item.template) ? `<button class="btn-primary" onclick="planWeekSuggestions('current')">Legg inn forslag</button>` : ''}
            <button class="btn-soft" onclick="openPlan('${suggestionDates[0] || addDays(today, 1)}')">Planlegg selv</button>
            <button class="btn-soft" onclick="showTab('calendar')">Se kalender</button>
          </div>
          <div class="week-plan-divider"></div>
          <div class="week-plan-top">
            <span class="tag">Neste uke</span>
            <strong>${escapeHtml(formatWeekRange(nextWeekStart, nextWeekEnd))}</strong>
          </div>
          <div class="week-plan-action-line">${escapeHtml(nextActionLine)}</div>
          <p>${escapeHtml(nextSummary)}</p>
          <p class="week-plan-role-summary">${escapeHtml(nextRoleSummary)}</p>
          ${weekRoleStatusHtml(nextRoleCoverage)}
          <div class="week-plan-list">
            ${plannedNextWeek.slice(0, 3).map(plannedWeekItem).join('')}
            ${suggestedNextWeek.map((item, index) => suggestedWeekPlanItem(item.suggestion, item.template, item.date, index)).join('')}
          </div>
          ${suggestedNextWeek.length ? `<p class="week-plan-note">${escapeHtml(nextMainSuggestion.note)}</p>` : ''}
          ${skippedRoleNote ? `<p class="week-plan-skipped-note">${escapeHtml(skippedRoleNote)}</p>` : ''}
          <div class="button-row">
            ${suggestedNextWeek.some(item => item.template) ? `<button class="btn-primary" onclick="planWeekSuggestions('next')">Legg inn neste uke</button>` : ''}
            <button class="btn-soft" onclick="openPlan('${nextWeekDates[0] || nextWeekStart}')">Planlegg selv</button>
          </div>
        </div>`;
      window.currentWeekPlanSuggestions = suggestedItems;
      window.nextWeekPlanSuggestions = suggestedNextWeek;
    }

    window.planSuggestedWorkout = function(templateId, dateIso, note = 'Foreslått av coach-assistenten. Juster etter dagsform.') {
      openPlan(dateIso || addDays(todayISO(), 1));
      document.getElementById('planTemplate').value = templateId;
      document.getElementById('planNotes').value = note;
      showToast('Forslag lagt klart i planlegging');
    };

    window.planWeekSuggestions = async function(scope = 'current') {
      const source = scope === 'next' ? window.nextWeekPlanSuggestions : window.currentWeekPlanSuggestions;
      const suggestions = (source || []).filter(item => item.template && item.date);
      if (!suggestions.length) return alert('Ingen forslag med øktmal er klare ennå.');
      if (!confirm(`Legge inn ${suggestions.length} foreslåtte økt${suggestions.length === 1 ? '' : 'er'} i kalenderen?`)) return;
      const workoutsToAdd = suggestions.map((item, index) => ({
        id: uid('planned'),
        templateId: item.template.id,
        templateSnapshot: templateSnapshotFromTemplate(item.template),
        date: item.date,
        status: 'planned',
        notes: `${scope === 'next' ? 'Neste uke' : 'Ukeplan'} forslag ${index + 1}: ${item.suggestion.title}. Juster etter dagsform.`,
        repeatGroupId: null,
        createdAt: todayISO()
      }));
      await safeStateWrite({
        apply: () => { state.planned.push(...workoutsToAdd); },
        write: () => fsBatchSet('planned', workoutsToAdd),
        successMessage: workoutsToAdd.length === 1 ? 'Forslag lagt i kalender' : `${workoutsToAdd.length} forslag lagt i kalender`,
        errorMessage: 'Kunne ikke legge inn forslagene'
      });
    };

    function readinessChipHtml(readiness) {
      const level = readiness?.level && TRAFFIC_LIGHT_CONFIG[readiness.level] ? readiness.level : 'neutral';
      const label = level === 'neutral' ? 'Sjekk dagsform' : TRAFFIC_LIGHT_CONFIG[level].label;
      return `<span class="readiness-dot ${level}"></span>${escapeHtml(label)}`;
    }

    function heroIntensityHtml(ctx) {
      const balance = ctx.intensityBalance14;
      if (!balance?.classifiedCount) return '';
      const lowPct = balance.easyShare;
      const hardPct = balance.hardShare;
      const status = balance.status;
      const label = balance.label;
      return `
        <div class="hero-intensity-top">
          <span>Intensitetsbalanse · ${balance.windowDays} dager</span>
          <strong class="${status}">${escapeHtml(label)}</strong>
        </div>
        <div class="hero-intensity-track" aria-label="${escapeHtml(balance.explanation)}">
          <div class="easy" style="width:${lowPct}%;"></div>
          <div class="hard" style="width:${hardPct}%;"></div>
        </div>
        <div class="hero-intensity-labels">
          <span>Rolig/base ${lowPct}%</span>
          <span>Hard ${hardPct}%</span>
        </div>`;
    }

    function heroWorkoutDetailHtml(primaryItems = [], completedToday = null) {
      if (completedToday) return completedDetailMiniHtml(completedToday);
      if (!primaryItems.length) return `<div class="empty">Ingen økter planlagt. Gå til Kalender for å legge inn neste økt.</div>`;
      return primaryItems.map(p => workoutCard(p)).join('');
    }

    function completedDetailMiniHtml(completed) {
      const template = completedTemplate(completed);
      const duration = completedDurationLabel(completed);
      const pace = completedPaceMetrics(completed);
      const metrics = [
        duration,
        completed.distanceKm ? `${completed.distanceKm} km` : '',
        pace.paceDisplay ? `${pace.paceDisplay} min/km` : '',
        completed.rpe ? `RPE ${completed.rpe}/10` : ''
      ].filter(Boolean).join(' · ');
      return `
        <div class="hero-completed-mini">
          <span class="tag done">Utført</span>
          <strong>${escapeHtml(template.name || completed.manualName || 'Økt')}</strong>
          ${metrics ? `<p>${escapeHtml(metrics)}</p>` : ''}
          <button class="btn-soft" onclick="openWorkoutDetail('${completed.id}')">Se detaljer</button>
        </div>`;
    }

    function compactGoalCardText(value, maxLength = 132) {
      const text = String(value || '').trim();
      if (!text) return '';
      const firstSentence = text.split('. ')[0] || text;
      const compact = firstSentence.length >= 36 ? firstSentence : text;
      return compact.length > maxLength ? `${compact.slice(0, maxLength - 3).trim()}...` : compact;
    }

    function heroHardShare14(ctx) {
      return Number(ctx.intensityBalance14?.hardShare || 0);
    }

    function heroStateForContext(ctx, primaryItems = [], todayItems = [], decision = {}) {
      const completedToday = ctx.completedToday?.[ctx.completedToday.length - 1] || null;
      const completedMeta = completedToday ? completedWorkoutAdviceMeta(completedToday) : null;
      const firstPlanned = primaryItems[0] || null;
      const template = firstPlanned ? plannedTemplate(firstPlanned) : null;
      const nextDateLabel = firstPlanned?.date && firstPlanned.date !== ctx.today ? formatDate(firstPlanned.date).toLowerCase() : '';
      return homeHeroState({
        completedToday: completedMeta,
        planned: template ? {
          label: template.name,
          type: template.type,
          intensity: template.intensity,
          role: template.role,
          purpose: template.purpose,
          load: template.load
        } : {},
        hasPlannedToday: todayItems.length > 0,
        hasNextPlanned: Boolean(firstPlanned),
        nextDateLabel,
        decision,
        dailyReadinessLevel: ctx.dailyReadiness?.level || '',
        injuryActive: Boolean(ctx.injurySummary7?.hasSignal),
        injuryStatus: ctx.injurySummary7?.status || '',
        hardShare14: heroHardShare14(ctx),
        rules: getCoachRules(),
        daysSinceLast: ctx.daysSinceLast,
        comeback: ctx.comeback,
        volumeRamp: ctx.volumeRamp
      });
    }

    function heroSwapSuggestion(heroState) {
      if (!heroState || heroState.state !== 'conflict') return null;
      return heroState.primaryAction === 'swap_recovery'
        ? recoverySuggestion('Dagsform eller kroppssignal tilsier lav risiko i dag.')
        : gentleBaseSuggestion('Intensitetsbalansen tilsier rolig støtte før mer kvalitet.');
    }

    function heroSwapOption(heroState, planned) {
      const suggestion = heroSwapSuggestion(heroState);
      if (!suggestion || !planned) return null;
      const template = findSuggestedTemplate(suggestion, [planned.templateId]);
      return template ? { suggestion, template } : { suggestion, template: null };
    }

    function heroActionsHtml(heroState, firstPlanned, completedToday) {
      if (heroState.state === 'post_workout' && completedToday) {
        return `<button class="btn-success" onclick="openWorkoutDetail('${completedToday.id}')">Se økten</button>`;
      }
      if (heroState.state === 'conflict' && firstPlanned) {
        const option = heroSwapOption(heroState, firstPlanned);
        return `
          ${option?.template
            ? `<button class="btn-primary" onclick="swapHeroPlannedWorkout('${firstPlanned.id}', '${heroState.primaryAction}')">Bytt til ${escapeHtml(option.template.name)}</button>`
            : `<button class="btn-primary" onclick="openPlan('${firstPlanned.date}', true)">Velg rolig alternativ</button>`}
          <button class="btn-soft" onclick="openRescheduleModal('${firstPlanned.id}')">Endre dato</button>`;
      }
      if (heroState.state === 'rest_day' && firstPlanned) {
        return `
          <button class="btn-soft" onclick="openCalendarDayModal('${firstPlanned.date}')">Se neste økt</button>
          <button class="btn-primary" onclick="openPlan('${ctxSafeDate(firstPlanned.date)}', true)">Legg til rolig økt</button>`;
      }
      if (heroState.state === 'comeback') {
        return firstPlanned
          ? `<button class="btn-primary" onclick="openPlan('${ctxSafeDate(firstPlanned.date)}', true)">Velg lett start</button>
             <button class="btn-soft" onclick="openRescheduleModal('${firstPlanned.id}')">Endre plan</button>`
          : `<button class="btn-primary" onclick="openPlan('${todayISO()}')">Planlegg lett start</button>`;
      }
      if (firstPlanned) {
        return `<button class="btn-success" onclick="openCompleteModal('${firstPlanned.id}')">Marker utført</button>
          <button class="btn-soft" onclick="openRescheduleModal('${firstPlanned.id}')">Endre dato</button>`;
      }
      return `<button class="btn-primary" onclick="showTab('plan')">Planlegg økt</button>`;
    }

    function ctxSafeDate(dateIso) {
      return dateIso || todayISO();
    }

    window.swapHeroPlannedWorkout = async function(plannedId, action = 'swap_easy') {
      const planned = state.planned.find(item => item.id === plannedId);
      if (!planned) return alert('Fant ikke den planlagte økten.');
      const currentTemplate = plannedTemplate(planned);
      const suggestion = action === 'swap_recovery'
        ? recoverySuggestion('Byttet fra hard økt fordi dagsform eller kroppssignal tilsier lav risiko.')
        : gentleBaseSuggestion('Byttet fra hard økt fordi intensitetsbalansen tilsier mer rolig støtte.');
      const alternative = findSuggestedTemplate(suggestion, [planned.templateId]);
      if (!alternative) {
        openPlan(planned.date, true);
        showToast('Fant ingen tydelig rolig mal. Velg alternativ selv.', 'info');
        return;
      }
      if (!confirm(`Bytte ${currentTemplate.name || 'planlagt økt'} til ${alternative.name}?`)) return;
      await safeStateWrite({
        apply: () => {
          const item = state.planned.find(entry => entry.id === plannedId);
          if (!item) return;
          item.templateId = alternative.id;
          item.templateSnapshot = templateSnapshotFromTemplate(alternative);
          item.notes = [item.notes, 'Byttet fra heltekortet fordi dagsform/belastning tilsa lettere økt.']
            .filter(Boolean).join('\n');
          item.updatedAt = new Date().toISOString();
        },
        write: () => {
          const updated = state.planned.find(entry => entry.id === plannedId);
          return fsSet('planned', plannedId, updated);
        },
        afterApply: () => {
          if (document.getElementById('calendarDayModal')?.classList.contains('active') && selectedCalendarDate()) {
            openCalendarDayModal(selectedCalendarDate());
          }
        },
        successMessage: `Byttet til ${alternative.name}`,
        errorMessage: 'Kunne ikke bytte økten'
      });
    };

    function renderHomeHero(ctx, primaryItems, todayItems, decision) {
      const readinessChip = document.getElementById('homeReadinessChip');
      const heroDate = document.getElementById('homeHeroDate');
      const heroMain = document.getElementById('homeHeroMain');
      const heroActions = document.getElementById('homeHeroActions');
      const heroIntensity = document.getElementById('homeHeroIntensity');
      const heroPreparation = document.getElementById('homeHeroPreparation');
      const primaryWorkout = document.getElementById('homePrimaryWorkout');
      if (!heroMain || !heroActions || !primaryWorkout) return;

      const completedToday = ctx.completedToday?.[ctx.completedToday.length - 1] || null;
      const firstPlanned = primaryItems[0] || null;
      const template = firstPlanned ? plannedTemplate(firstPlanned) : null;
      const isPostWorkout = Boolean(completedToday && decision?.mode === 'post_workout');
      const completedMeta = completedToday ? completedWorkoutAdviceMeta(completedToday) : null;
      const heroState = heroStateForContext(ctx, primaryItems, todayItems, decision);
      const heroCard = heroMain.closest('.dashboard-hero-card');
      const title = heroState.state === 'planned' && template?.name ? template.name : heroState.title;
      const eyebrow = heroState.state === 'planned' && firstPlanned
        ? `${todayItems.length ? 'Dagens økt' : 'Neste økt'} · ${formatDate(firstPlanned.date)}${template?.type ? ` · ${template.type}` : ''}`
        : heroState.kicker;
      const reason = heroState.body || decision?.action || decision?.reason || 'Velg neste steg ut fra dagsform og plan.';
      const heroLevel = ['green', 'yellow', 'red', 'neutral'].includes(heroState.level) ? heroState.level : 'neutral';

      if (readinessChip) {
        const level = ctx.dailyReadiness?.level && TRAFFIC_LIGHT_CONFIG[ctx.dailyReadiness.level] ? ctx.dailyReadiness.level : 'neutral';
        readinessChip.className = `readiness-chip ${level}`;
        readinessChip.innerHTML = readinessChipHtml(ctx.dailyReadiness);
      }
      if (heroDate) heroDate.textContent = formatDate(ctx.today);
      if (heroCard) heroCard.className = `card dashboard-hero-card hero-state-${heroState.state} hero-level-${heroLevel}`;
      heroMain.innerHTML = `
        <span>${escapeHtml(eyebrow)}</span>
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(reason)}</p>
        ${heroState.reason ? `<small class="home-hero-state-reason">${escapeHtml(heroState.reason)}</small>` : ''}`;

      heroActions.innerHTML = heroActionsHtml(heroState, firstPlanned, completedToday);

      heroIntensity.innerHTML = heroIntensityHtml(ctx);
      heroPreparation.innerHTML = `
        <div class="hero-prep-note">
          <strong>${escapeHtml(decision?.support?.adjustment || decision?.title || 'Forberedelse')}</strong>
          <p>${escapeHtml(decision?.support?.support || decision?.reason || 'Sjekk dagsform og juster ved kroppssignal.')}</p>
        </div>`;
      primaryWorkout.innerHTML = heroWorkoutDetailHtml(primaryItems, isPostWorkout ? completedToday : null);
    }

    function renderHomeGoalCard(ctx) {
      const el = document.getElementById('homeGoalCard');
      if (!el) return;
      const last7 = summarizeCompleted(ctx.last7Days || []);
      const last28 = summarizeCompleted(ctx.last28Days || []);
      const previous7Start = addDays(ctx.today, -13);
      const previous7End = addDays(ctx.today, -7);
      const previous28Start = addDays(ctx.today, -34);
      const previous28End = addDays(ctx.today, -7);
      const previous7 = summarizeCompleted((state.completed || []).filter(item => item.date >= previous7Start && item.date <= previous7End));
      const previous28 = summarizeCompleted((state.completed || []).filter(item => item.date >= previous28Start && item.date <= previous28End));
      const summary = goalMotivationSummary({
        goal: state.settings.raceGoal,
        readiness: ctx.raceReadiness,
        plan: ctx.racePlan,
        injurySummary: ctx.injurySummary7,
        last7,
        last28,
        previous7,
        previous28
      }, ctx.today);
      const milestones = goalMilestones({
        goal: state.settings.raceGoal,
        readiness: ctx.raceReadiness,
        plan: ctx.racePlan,
        injurySummary: ctx.injurySummary7,
        last7,
        last28
      }, ctx.today);
      const score = summary.score || {};
      const countdown = ctx.raceReadiness?.countdown || raceGoalCountdown(state.settings.raceGoal, ctx.today);
      if (!summary.hasGoal || !countdown) {
        const emptyStep = compactGoalCardText(summary.action || 'Legg inn mål-løp eller kortsiktig challenge.');
        el.innerHTML = `
          <div class="dashboard-mini-head"><span>Mål-løp</span></div>
          <strong class="dashboard-mini-title">${escapeHtml(summary.title || 'Velg et mål å jobbe mot')}</strong>
          <p class="dashboard-mini-note">${escapeHtml(summary.subtitle || 'Et konkret mål gjør rådene mer motiverende.')}</p>
          <div class="home-goal-empty-step">
            <span>Neste steg</span>
            <strong>${escapeHtml(emptyStep)}</strong>
          </div>
          <button class="btn-soft btn-full" onclick="showTab('goals')">Åpne mål</button>`;
        return;
      }

      const meta = [
        raceDistanceLabel(countdown.distanceKm),
        countdown.targetTimeSeconds ? `mål ${formatRaceTime(countdown.targetTimeSeconds)}` : ''
      ].filter(Boolean).join(' · ');
      const percent = Math.max(0, Math.min(100, Number(score.percent || 0)));
      const weeksLeft = ctx.racePlan?.weeksLeft !== null && ctx.racePlan?.weeksLeft !== undefined
        ? `${ctx.racePlan.weeksLeft} uke${ctx.racePlan.weeksLeft === 1 ? '' : 'r'} igjen`
        : countdown.label;
      const trend = score.trend || null;
      const trendHtml = trend
        ? `<span class="home-goal-trend ${escapeHtml(trend.status || 'neutral')}">${escapeHtml(trend.label)}</span>`
        : `<span class="home-goal-trend neutral">Trend kommer</span>`;
      const nextMilestone = (milestones || []).find(item => ['current', 'blocked'].includes(item.status))
        || (milestones || []).find(item => item.status !== 'done')
        || (milestones || [])[0]
        || null;
      const phaseFocus = ctx.racePlan?.focus
        ? ctx.racePlan.focus.split('.')[0]
        : summary.motivation || '';
      const phaseText = ctx.racePlan?.phaseLabel || score.label || 'Målperiode';
      const nextStepText = compactGoalCardText(summary.action || score.nextImprovement || 'Bygg videre kontrollert.');
      el.innerHTML = `
        <div class="dashboard-mini-head">
          <span>Mål-løp</span>
          <button class="btn-soft btn-icon" onclick="showTab('goals')" aria-label="Åpne mål">›</button>
        </div>
        <strong class="dashboard-mini-title">${escapeHtml(countdown.name || 'Mål-løp')}</strong>
        <p class="dashboard-mini-note">${escapeHtml([weeksLeft, meta].filter(Boolean).join(' · '))}</p>
        <div class="home-goal-score ${escapeHtml(score.status || 'neutral')}">
          <strong>${percent}</strong><span>/100 mål-score</span>
          ${trendHtml}
        </div>
        <div class="home-goal-score-bar"><span style="width:${percent}%"></span></div>
        <div class="home-goal-phase ${escapeHtml(ctx.racePlan?.phase || 'neutral')}">
          <span>${escapeHtml(phaseText)}</span>
          ${phaseFocus ? `<p>${escapeHtml(phaseFocus)}.</p>` : ''}
        </div>
        ${nextMilestone ? `
          <div class="home-goal-milestone ${escapeHtml(nextMilestone.status || 'upcoming')}">
            <span>Neste milepæl${nextMilestone.tag ? ` · ${escapeHtml(nextMilestone.tag)}` : ''}</span>
            <strong>${escapeHtml(nextMilestone.title)}</strong>
          </div>` : ''}
        <div class="home-goal-next-step">
          <span>Neste steg</span>
          <strong>${escapeHtml(nextStepText)}</strong>
        </div>`;
    }

    function renderHomeContinuityCard(ctx, weekStart, weekSummary) {
      const el = document.getElementById('homeContinuityCard');
      if (!el) return;
      const target = Math.max(1, Number(ctx.goals?.weeklySessionsTarget || 1));
      const streak = calculateWeeklyStreak(weekStart, target);
      const remaining = Math.max(0, target - (weekSummary.sessions || 0));
      const weeks = buildContinuityWeeks(weekStart);
      const currentFreeze = continuityFreezeWeekSummary(weekStart, state.continuityFreezes, { rules: getCoachRules() });
      const todayFreeze = activeContinuityFreezeForDate(ctx.today || todayISO());
      const chips = weeks.map((week, index) => {
        const sessions = week.summary.sessions || 0;
        const protectedWeek = weekProtectedByFreeze(week.start);
        const status = sessions >= target ? 'done' : protectedWeek ? 'protected' : sessions > 0 ? 'partial' : 'empty';
        const isCurrent = index === weeks.length - 1;
        const title = protectedWeek && sessions < target
          ? `${formatWeekRange(week.start, week.end)}: fryskort beskytter uka`
          : `${formatWeekRange(week.start, week.end)}: ${sessions}/${target}`;
        return `<span class="home-continuity-dot ${status} ${isCurrent ? 'current' : ''}" title="${escapeHtml(title)}"></span>`;
      }).join('');
      const note = remaining === 0
        ? 'Denne uken teller. Videre trening er bonus og bør styres av overskudd.'
        : currentFreeze.protected
        ? 'Fryskort beskytter denne uken. Det teller ikke som trening.'
        : todayFreeze
        ? 'Fryskortet gjelder i dag. Uken teller fortsatt etter vanlig mål.'
        : `${remaining} økt${remaining === 1 ? '' : 'er'} igjen for at denne uken skal telle.`;
      const freezeStatusHtml = currentFreeze.protected
        ? `<div class="home-freeze-status protected"><strong>Kontinuitet beskyttet denne uken</strong><span>${escapeHtml(currentFreeze.reasonLabels.join(', ') || 'Fryskort')} · Teller ikke som trening.</span></div>`
        : todayFreeze
        ? `<div class="home-freeze-status today"><strong>Fryskort aktivt i dag: ${escapeHtml(freezeReasonOptionLabel(todayFreeze.reason))}</strong><span>Teller ikke som trening.</span></div>`
        : '';
      el.innerHTML = `
        <div class="dashboard-mini-head">
          <span>Kontinuitet</span>
          <button class="btn-soft btn-icon" onclick="openContinuityFreezeModal()" aria-label="Frys periode">+</button>
        </div>
        <div class="home-continuity-main"><strong>${streak}</strong><span>uker på rad</span></div>
        <div class="home-continuity-strip">${chips}</div>
        ${freezeStatusHtml}
        <p class="dashboard-mini-note">${escapeHtml(note)}</p>`;
    }

    function homeRaceHighlight() {
      const summary = personalBestSummary(completedRaceItems(), state.raceResults);
      if (!summary.raceResults.length) return null;
      const improving = summary.entries
        .map(entry => ({ ...entry, trend: entry.history?.trend || entry.trend || {} }))
        .filter(entry => entry.history?.latest && entry.trend?.latestIsBest && Number(entry.trend.trendSeconds) < 0)
        .sort((a, b) => Math.abs(Number(b.trend.trendSeconds || 0)) - Math.abs(Number(a.trend.trendSeconds || 0)))[0] || null;
      if (improving) {
        const latest = improving.history.latest;
        return {
          kicker: 'Siste høydepunkt',
          title: `Ny ${improving.label} PB: ${formatRaceTime(latest.resultSeconds)}`,
          meta: `${formatDate(latest.date)} · ${latest.name || latest.workoutName || 'Race'}`,
          note: `${formatRaceTime(Math.abs(Number(improving.trend.trendSeconds)))} raskere fra første til siste registrerte resultat.`
        };
      }

      const latest = summary.latest;
      const entry = summary.entries.find(item => Math.abs(Number(item.km) - Number(latest.distanceKm)) < 0.02);
      const latestIsBest = Boolean(entry?.best && Number(entry.best.resultSeconds) === Number(latest.resultSeconds));
      return {
        kicker: 'Siste høydepunkt',
        title: `${latestIsBest ? 'PB' : 'Siste test'} ${raceDistanceLabel(latest.distanceKm)}: ${formatRaceTime(latest.resultSeconds)}`,
        meta: `${formatDate(latest.date)} · ${latest.name || latest.workoutName || 'Race'}`,
        note: latestIsBest ? 'Dette er beste registrerte tid på distansen.' : 'Flere resultater gjør utviklingen tydeligere over tid.'
      };
    }

    function renderHomeHighlightCard() {
      const el = document.getElementById('homeHighlightCard');
      if (!el) return;
      const highlight = homeRaceHighlight();
      if (!highlight) {
        el.innerHTML = `
          <div class="dashboard-mini-head"><span>Siste høydepunkt</span></div>
          <strong class="dashboard-mini-title">Ingen race/test ennå</strong>
          <p class="dashboard-mini-note">Når du logger testløp eller PB, vises fremgangen her.</p>
          <button class="btn-soft btn-full" onclick="showTab('goals')">Legg til resultat</button>`;
        return;
      }
      el.innerHTML = `
        <div class="dashboard-mini-head">
          <span>${escapeHtml(highlight.kicker)}</span>
          <button class="btn-soft btn-icon" onclick="showTab('goals')" aria-label="Åpne mål">›</button>
        </div>
        <strong class="dashboard-mini-title">${escapeHtml(highlight.title)}</strong>
        <p class="dashboard-mini-note">${escapeHtml(highlight.meta)}</p>
        <p class="dashboard-mini-note">${escapeHtml(highlight.note)}</p>`;
    }

    function renderHomeMotivation(ctx, weekStart, weekSummary) {
      renderHomeGoalCard(ctx);
      renderHomeContinuityCard(ctx, weekStart, weekSummary);
      renderHomeHighlightCard();
    }

    function renderHomeWeekStatus(today, weekStart, weekSummary, weekItems, goals, profile, freezeSummary = null) {
      const ring = document.getElementById('homeWeekRing');
      const days = document.getElementById('homeWeekDays');
      const timeEl = document.getElementById('homeWeekTime');
      const kmEl = document.getElementById('homeWeekKm');
      const loadEl = document.getElementById('homeWeekLoad');
      const noteEl = document.getElementById('homeWeekNote');
      const target = Math.max(1, Number(goals.weeklySessionsTarget) || 1);
      const sessionPercent = Math.max(0, Math.min(100, (weekSummary.sessions / target) * 100));
      const remaining = Math.max(0, target - weekSummary.sessions);
      const protectedWeek = Boolean(freezeSummary?.protected);
      const todayFreeze = activeContinuityFreezeForDate(today);
      const ringStatus = weekSummary.sessions >= target ? 'done' : protectedWeek ? 'protected' : weekSummary.sessions > 0 ? 'partial' : 'empty';

      if (ring) {
        ring.className = `home-week-ring ${ringStatus}`;
        ring.style.setProperty('--week-ring-percent', `${sessionPercent * 3.6}deg`);
        ring.innerHTML = `<strong>${weekSummary.sessions}/${target}</strong><span>økter</span>`;
      }
      if (timeEl) timeEl.textContent = formatClockDuration(weekSummary.seconds);
      if (kmEl) kmEl.textContent = formatKm(weekSummary.km);
      if (loadEl) loadEl.textContent = homeLoadLabel(weekItems, profile);
      if (noteEl) {
        noteEl.textContent = weekSummary.sessions >= target
          ? 'Ukesmålet er nådd. Videre trening bør styres av overskudd og dagsform.'
          : protectedWeek
          ? 'Uka er beskyttet av fryskort. Det teller ikke som trening, men kontinuiteten brytes ikke.'
          : todayFreeze
          ? 'Fryskort aktivt i dag. Uken teller fortsatt etter vanlig mål.'
          : `${remaining} økt${remaining === 1 ? '' : 'er'} igjen til ukesmålet.`;
      }
      if (days) {
        const maxDaySeconds = Math.max(1, ...Array.from({ length: 7 }, (_, index) => {
          const date = addDays(weekStart, index);
          return summarizeCompleted(weekItems.filter(item => item.date === date)).seconds;
        }));
        days.innerHTML = Array.from({ length: 7 }, (_, index) => {
          const date = addDays(weekStart, index);
          const daySummary = summarizeCompleted(weekItems.filter(item => item.date === date));
          const height = daySummary.sessions ? Math.max(24, Math.round((daySummary.seconds / maxDaySeconds) * 58)) : 8;
          const isToday = date === today;
          const label = ['m', 't', 'o', 't', 'f', 'l', 's'][index];
          const frozen = !daySummary.sessions && isDateFrozen(date, state.continuityFreezes, { rules: getCoachRules() });
          return `
            <div class="home-week-day ${daySummary.sessions ? 'active' : frozen ? 'frozen' : 'empty'} ${isToday ? 'today' : ''}" title="${escapeHtml(formatDate(date))}: ${daySummary.sessions} økt${daySummary.sessions === 1 ? '' : 'er'}${frozen ? ' · fryskort' : ''}">
              <span class="home-week-day-bar" style="height:${height}px"></span>
              <small>${escapeHtml(label)}</small>
            </div>`;
        }).join('');
      }
    }

    function renderDashboardSummary(today, todayItems, upcomingItems, plannedActive = []) {
      const goals = normalizeGoals(state.settings.goals);
      const profile = normalizeTrainingProfile(state.settings.trainingProfile);
      const weekStart = startOfWeek(today);
      const weekEnd = addDays(weekStart, 6);
      const weekItems = state.completed.filter(c => c.date >= weekStart && c.date <= weekEnd);
      const weekSummary = summarizeCompleted(weekItems);
      const last14Start = addDays(today, -13);
      const last14Days = state.completed.filter(c => c.date >= last14Start && c.date <= today);
      const last14DaysForSignals = [...last14Days, ...dailyInjuryAsCompletedItems(today, 14)];
      const nextDate = upcomingItems[0]?.date;
      const nextDateItems = nextDate ? upcomingItems.filter(p => p.date === nextDate) : [];
      const primaryItems = todayItems.length ? todayItems : nextDateItems;

      const coachCtx = buildCoachContext();
      const effectiveGoals = coachCtx.comeback?.active
        ? { ...goals, weeklySessionsTarget: coachCtx.effectiveWeeklyTarget }
        : goals;
      const freezeSummary = continuityFreezeWeekSummary(weekStart, state.continuityFreezes, { rules: getCoachRules() });
      renderHomeWeekStatus(today, weekStart, weekSummary, weekItems, effectiveGoals, profile, freezeSummary);
      const todayDecisionResult = buildTodayDecision(coachCtx, primaryItems, todayItems);
      renderHomeHero(coachCtx, primaryItems, todayItems, todayDecisionResult);
      renderHomeMotivation(coachCtx, weekStart, weekSummary);
      renderTodayDecision(todayDecisionResult);
      document.getElementById('homeCoachNote').textContent = buildCoachNote(coachCtx);
      renderInjuryWorkoutAdvice(buildInjuryWorkoutAdvice(coachCtx, primaryItems));
      renderHomeCoachBasis(buildHomeCoachBasis(coachCtx, todayDecisionResult, firstPlannedFromPrimary(primaryItems)));
      renderWeekPlan(today, weekSummary, weekItems, last14DaysForSignals, profile, effectiveGoals, plannedActive);
    }

    function firstPlannedFromPrimary(primaryItems = []) {
      return primaryItems[0] || null;
    }

    function improvingPainFollowup(ctx) {
      const latestCheckin = ctx.injuryCheckins14?.[ctx.injuryCheckins14.length - 1] || null;
      if (!latestCheckin || latestCheckin.trend !== 'better') return null;
      if (latestCheckin.date !== ctx.today) return null;
      const currentScore = Number(latestCheckin.painNow);
      if (!Number.isFinite(currentScore) || currentScore < 1 || currentScore > 3) return null;
      const area = String(latestCheckin.area || '').trim().toLowerCase();
      const previousHigh = (ctx.gradedPain?.activePain || []).find(item => {
        if (item.tier !== 'high' || item.daysAgo <= 0) return false;
        const itemArea = String(item.area || '').trim().toLowerCase();
        return !area || !itemArea || area === itemArea;
      });
      if (!previousHigh || previousHigh.score <= currentScore) return null;
      return {
        area: latestCheckin.area || previousHigh.area || '',
        previousScore: previousHigh.score,
        currentScore,
        daysAgo: previousHigh.daysAgo
      };
    }

    function buildTodayDecision(ctx, primaryItems = [], todayItems = []) {
      const firstPlanned = primaryItems[0] || ctx.nextPlanned || null;
      const template = firstPlanned ? plannedTemplate(firstPlanned) : null;
      const painImproving = improvingPainFollowup(ctx);
      const plannedMeta = plannedWorkoutAdviceMeta(firstPlanned);
      const tomorrowMeta = plannedWorkoutAdviceMeta(ctx.tomorrowPlanned);
      const decisionEngineInput = {
        rules: getCoachRules(),
        dailyReadinessLevel: ctx.dailyReadiness?.level || null,
        highestPainTier: ctx.gradedPain?.highestTier || null,
        painImprovingAfterHigh: Boolean(painImproving),
        injuryActive: Boolean(ctx.injurySummary7?.hasSignal),
        injuryStatus: ctx.injurySummary7?.status || '',
        planned: plannedMeta,
        tomorrowPlanned: tomorrowMeta,
        plannedWorkoutLabel: template?.name || '',
        hasPlannedToday: todayItems.length > 0,
        hasNextPlanned: Boolean(firstPlanned),
        comeback: ctx.comeback,
        volumeRamp: ctx.volumeRamp,
        intensityBalance: ctx.intensityBalance14,
        continuityFreezeToday: isDateFrozen(ctx.today, state.continuityFreezes, { rules: getCoachRules() })
      };
      const decisionPackage = coachDecisionEngine(decisionEngineInput);
      let decision = todayDecision({
        dailyReadinessLevel: ctx.dailyReadiness?.level || null,
        highestPainTier: ctx.gradedPain?.highestTier || null,
        painImprovingAfterHigh: Boolean(painImproving),
        bodySignals14Adaptation: ctx.bodySignals14?.adaptation || 0,
        plannedWorkoutLabel: template?.name || '',
        hasPlannedToday: todayItems.length > 0,
        hasNextPlanned: Boolean(firstPlanned),
        daysSinceLast: ctx.daysSinceLast,
        comeback: ctx.comeback,
        volumeRamp: ctx.volumeRamp,
        structuredIntervalsLast7Count: ctx.structuredIntervals?.last7?.count || 0,
        structuredIntervalsCloseQualityDays: Boolean(ctx.structuredIntervals?.closeQualityDays),
        weekSessions: ctx.weekSummary?.sessions || 0,
        weeklyTarget: ctx.effectiveWeeklyTarget || ctx.goals?.weeklySessionsTarget || 0
      });
      if (decisionPackage.primarySignal === 'intensity_balance') {
        decision = {
          level: 'yellow',
          title: 'Bygg rolig støtte',
          action: 'Prioriter rolig trening eller restitusjon i dag.',
          reason: decisionPackage.summary || 'Intensitetsbalansen trenger mer rolig volum.'
        };
      } else if (decisionPackage.primarySignal === 'tomorrow_quality') {
        decision = {
          level: 'green',
          title: 'Hold dagen lett før kvalitet',
          action: 'Velg hvile, mobilitet eller svært rolig aktivitet i dag.',
          reason: decisionPackage.summary || 'Kvalitet i morgen bør møtes med friske bein.'
        };
      }
      const enrichedDecision = {
        ...decision,
        coachDecision: decisionPackage,
        support: dailyCoachSupport({
          decision,
          planned: plannedMeta,
          hasPlannedToday: todayItems.length > 0,
          dailyReadinessLevel: ctx.dailyReadiness?.level || null,
          injuryActive: Boolean(ctx.injurySummary7?.hasSignal),
          injuryStatus: ctx.injurySummary7?.status || '',
          goalScorePercent: ctx.goalScore?.percent || 0,
          goalScoreLabel: ctx.goalScore?.label || '',
          racePhaseLabel: ctx.racePlan?.phaseLabel || '',
          weekSessions: ctx.weekSummary?.sessions || 0,
          weeklyTarget: ctx.effectiveWeeklyTarget || ctx.goals?.weeklySessionsTarget || 0
        })
      };
      const latestTodayCompleted = ctx.completedToday?.[ctx.completedToday.length - 1] || null;
      const completedFeedback = latestTodayCompleted
        ? todayCompletedWorkoutFeedback({
            completed: completedWorkoutAdviceMeta(latestTodayCompleted),
            decision: enrichedDecision,
            injurySummary: ctx.injurySummary7,
            dailyReadinessLevel: ctx.dailyReadiness?.level || null
          })
        : null;
      return completedFeedback
        ? {
            ...completedFeedback,
            coachDecision: coachDecisionEngine({ ...decisionEngineInput, completedFeedback })
          }
        : enrichedDecision;
    }

    function buildCompletedTodayCoachNote(ctx) {
      const completed = ctx.completedToday?.[ctx.completedToday.length - 1] || null;
      if (!completed) return '';
      const meta = completedWorkoutAdviceMeta(completed);
      const feedback = todayCompletedWorkoutFeedback({ completed: meta });
      if (!feedback) return '';
      const painBefore = numberOrZero(meta.painBefore);
      const painAfter = numberOrZero(meta.painAfter);
      const painPart = painBefore || painAfter
        ? ` Smerte gikk fra ${painBefore}/10 før til ${painAfter}/10 etter${meta.painArea ? ` i ${meta.painArea}` : ''}.`
        : '';
      if (feedback.level === 'red') {
        return `Du har allerede gjennomført ${meta.label} i dag, men responsen krever forsiktighet.${painPart} Resten av dagen bør handle om ro, mat/drikke og ny smertevurdering i morgen. ${coachPrincipleLine(['body_signals_first', 'recovery_is_training'])}`;
      }
      if (painAfter > 0 || painBefore > 0) {
        return `Du har allerede gjennomført ${meta.label} i dag, og responsen ser kontrollert ut.${painPart} Det er positivt, men bruk resten av dagen til restitusjon og følg med på om smerten holder seg lav. ${coachPrincipleLine(['body_signals_first'])}`;
      }
      return `Du har allerede gjennomført ${meta.label} i dag. Vurderingen nå er ikke om du bør trene mer, men om økten støtter kontinuiteten: fyll på mat/drikke, la kroppen hente seg inn og bruk neste økt som neste datapunkt. ${coachPrincipleLine(['recovery_is_training', 'repeatable_week'])}`;
    }

    function completedWorkoutAdviceMeta(completed) {
      if (!completed) return null;
      const template = completedTemplate(completed);
      const assessment = completedLoadAssessment(completed);
      return {
        label: template.name || completed.manualName || 'dagens økt',
        type: template.type || '',
        intensity: template.intensity || '',
        role: template.role || '',
        purpose: template.purpose || '',
        load: template.load || '',
        loadLevel: assessment.level || '',
        loadLabel: assessment.label || '',
        durationSeconds: completedDurationSeconds(completed),
        distanceKm: completed.distanceKm || '',
        rpe: completed.rpe || '',
        execution: executionLabel(completed.execution),
        painBefore: completed.bodyStatus?.painBefore || 0,
        painAfter: completed.bodyStatus?.painAfter || 0,
        painArea: completed.bodyStatus?.area || '',
        adaptation: completed.bodyStatus?.adaptation || ''
      };
    }

    function plannedWorkoutAdviceMeta(planned) {
      if (!planned) return {};
      const template = plannedTemplate(planned);
      return {
        label: template.name || '',
        intensity: template.intensity || '',
        role: template.role || '',
        purpose: template.purpose || '',
        load: template.load || ''
      };
    }

    function buildInjuryWorkoutAdvice(ctx, primaryItems = []) {
      const firstPlanned = primaryItems[0] || ctx.nextPlanned || null;
      const summary = injurySignalSummary(injurySignalEntriesUntil(ctx.today, 7));
      return injuryAdjustedWorkoutAdvice(summary, plannedWorkoutAdviceMeta(firstPlanned));
    }

    function renderInjuryWorkoutAdvice(advice) {
      const el = document.getElementById('homeInjuryWorkoutAdvice');
      if (!el) return;
      if (!advice?.active) {
        el.innerHTML = '';
        return;
      }
      el.innerHTML = `
        <div class="injury-workout-advice">
          <span>${escapeHtml(advice.title)}</span>
          <strong>${escapeHtml(advice.action)}</strong>
          ${advice.plannedWarning ? `<p>${escapeHtml(advice.plannedWarning)}</p>` : `<p>${escapeHtml(advice.reason)}</p>`}
          <div class="advice-chip-row">
            ${advice.options.map(option => `<small>${escapeHtml(option)}</small>`).join('')}
          </div>
        </div>`;
    }

    function renderTodayDecision(decision) {
      const el = document.getElementById('homeDecision');
      if (!el || !decision) return;
      const level = ['green', 'yellow', 'red', 'neutral'].includes(decision.level) ? decision.level : 'neutral';
      const support = decision.support || {};
      const kicker = decision.kicker || 'Dagens beslutning';
      el.className = `today-decision ${level}`;
      el.innerHTML = `
        <span>${escapeHtml(kicker)}</span>
        <strong>${escapeHtml(decision.title)}</strong>
        <p>${escapeHtml(decision.action)}</p>
        <small>${escapeHtml(decision.reason)}</small>
        ${support.adjustment || support.support || support.motivation ? `
          <div class="today-support-grid">
            ${support.adjustment ? `<div><span>Gjør nå</span><p>${escapeHtml(support.adjustment)}</p></div>` : ''}
            ${support.support ? `<div><span>Støtte</span><p>${escapeHtml(support.support)}</p></div>` : ''}
            ${support.motivation ? `<div><span>Hvorfor</span><p>${escapeHtml(support.motivation)}</p></div>` : ''}
          </div>` : ''}`;
    }

    function buildHomeCoachBasis(ctx, decision, primaryPlanned = null) {
      const completedToday = ctx.completedToday?.[ctx.completedToday.length - 1] || null;
      const completedMeta = completedToday ? completedWorkoutAdviceMeta(completedToday) : null;
      const planned = primaryPlanned || ctx.nextPlanned || null;
      const plannedTemplateValue = planned ? plannedTemplate(planned) : null;
      const readinessConfig = ctx.dailyReadiness?.level ? TRAFFIC_LIGHT_CONFIG[ctx.dailyReadiness.level] : null;
      const injury = ctx.injurySummary7?.hasSignal ? ctx.injurySummary7 : null;
      const weekSessions = ctx.weekSummary?.sessions || 0;
      const weeklyTarget = ctx.effectiveWeeklyTarget || ctx.goals?.weeklySessionsTarget || 0;
      const weekStatus = weeklyTarget && weekSessions >= weeklyTarget ? 'green' : weekSessions > 0 ? 'neutral' : 'yellow';
      const loadTrend = ctx.comeback?.active
        ? {
            label: ctx.comeback.label,
            detail: ctx.comeback.explanation,
            status: 'yellow'
          }
        : ctx.volumeRamp?.enoughData
        ? {
            label: ctx.volumeRamp.label,
            detail: ctx.volumeRamp.explanation,
            status: ctx.volumeRamp.status === 'high' ? 'yellow' : ctx.volumeRamp.status === 'stable' ? 'green' : 'neutral'
          }
        : null;
      const metricParts = [
        ctx.latestHrv?.hrv7d ? `HRV ${ctx.latestHrv.hrv7d} ms` : '',
        ctx.latestRestingHr?.restingHeartRate7d ? `hvilepuls ${ctx.latestRestingHr.restingHeartRate7d} bpm` : '',
        ctx.goldenZone ? `gylne sonen ${ctx.goldenZone.low}-${ctx.goldenZone.high} bpm` : ''
      ].filter(Boolean);

      return coachDecisionBasis({
        decision,
        completedToday: completedMeta ? {
          label: completedMeta.label,
          loadLabel: completedMeta.loadLabel,
          painText: completedMeta.painBefore || completedMeta.painAfter
            ? `Smerte ${completedMeta.painBefore || 0} -> ${completedMeta.painAfter || 0}${completedMeta.painArea ? ` (${completedMeta.painArea})` : ''}`
            : completedMeta.loadLabel,
          status: decision?.level || completedMeta.loadLevel || 'neutral'
        } : null,
        planned: plannedTemplateValue ? {
          label: plannedTemplateValue.name,
          hasPlannedToday: planned?.date === ctx.today,
          detail: [
            plannedTemplateValue.type,
            plannedTemplateValue.intensity,
            planned?.date && planned.date !== ctx.today ? formatDate(planned.date) : ''
          ].filter(Boolean).join(' · '),
          status: planned?.date === ctx.today ? 'green' : 'neutral'
        } : null,
        dailyReadiness: readinessConfig ? {
          label: readinessConfig.label,
          sleep: ctx.dailyReadiness?.sleep || '',
          energy: ctx.dailyReadiness?.energy || '',
          stairs: ctx.dailyReadiness?.stairsOk === true ? 'trapp ok' : ctx.dailyReadiness?.stairsOk === false ? 'trapp stopp' : '',
          status: ctx.dailyReadiness?.level || 'neutral'
        } : null,
        injury: injury ? {
          active: true,
          label: `${injury.statusLabel}${injury.area ? `: ${injury.area}` : ''}`,
          detail: injury.trendText ? `${injury.trendText}/10. ${injury.suggestedAction}` : injury.suggestedAction,
          status: ['worse', 'high'].includes(injury.status) ? 'red' : ['improving', 'caution'].includes(injury.status) ? 'yellow' : 'green'
        } : null,
        week: {
          label: `${weekSessions}/${weeklyTarget || '-'} økter`,
          detail: `${formatClockDuration(ctx.weekSummary?.seconds || 0)} · ${formatKm(ctx.weekSummary?.km || 0)} denne uken${ctx.comeback?.active ? ' · redusert comeback-mål' : ''}`,
          status: weekStatus
        },
        loadTrend,
        intensity: ctx.intensityBalance14 ? {
          label: ctx.intensityBalance14.label,
          detail: ctx.intensityBalance14.explanation,
          status: ctx.intensityBalance14.status
        } : null,
        race: ctx.racePlan?.phaseLabel || ctx.goalScore?.percent ? {
          label: ctx.racePlan?.phaseLabel || `Mål-score ${ctx.goalScore.percent}/100`,
          detail: ctx.goalScore?.percent ? `Mål-score ${ctx.goalScore.percent}/100${ctx.goalScore.label ? ` (${ctx.goalScore.label})` : ''}` : '',
          status: ctx.goalScore?.status || 'neutral'
        } : null,
        intervals: ctx.structuredIntervals?.last14?.count ? {
          label: `${ctx.structuredIntervals.last14.count} strukturerte intervalløkter siste 14 dager`,
          detail: `${formatDuration(ctx.structuredIntervals.last14.totalWorkSeconds)} arbeid${ctx.structuredIntervals.latest?.date ? `, siste ${formatDate(ctx.structuredIntervals.latest.date)}` : ''}`,
          status: ctx.structuredIntervals.last7?.count >= 2 ? 'yellow' : 'neutral'
        } : null,
        metrics: metricParts.length ? {
          label: metricParts.join(' · '),
          detail: [
            ctx.heartRateCompliance14?.easyViolationCount
              ? `${ctx.heartRateCompliance14.easyViolationCount} rolig/base med høy puls`
              : '',
            ctx.heartRateCompliance14?.qualityViolationCount
              ? `${ctx.heartRateCompliance14.qualityViolationCount} kvalitet over kontrollert sone`
              : ''
          ].filter(Boolean).join(' · '),
          status: (ctx.heartRateCompliance14?.easyViolationCount || ctx.heartRateCompliance14?.qualityViolationCount) ? 'yellow' : 'neutral'
        } : null
      });
    }

    function renderHomeCoachBasis(items = []) {
      const el = document.getElementById('homeCoachBasis');
      if (!el) return;
      const safeItems = Array.isArray(items) ? items : [];
      el.innerHTML = safeItems.map(item => `
        <div class="coach-basis-item ${['green', 'yellow', 'red', 'neutral'].includes(item.status) ? item.status : 'neutral'}">
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.value)}</strong>
          ${item.detail ? `<p>${escapeHtml(item.detail)}</p>` : ''}
        </div>`).join('');
    }

    function renderHistoryFilterOptions() {
      getWorkoutHistoryUi().renderFilterOptions();
    }

    function filteredCompletedHistory() {
      return getWorkoutHistoryUi().filtered();
    }

    function renderHistoryFilterSummary(completed) {
      getWorkoutHistoryUi().renderSummary(completed);
    }

    function formatHoursFromSeconds(seconds) {
      const total = Number(seconds) || 0;
      const hours = total / 3600;
      if (!hours) return '0 t';
      return `${hours.toLocaleString('no-NO', { maximumFractionDigits: hours < 10 ? 1 : 0 })} t`;
    }

    function isHardWorkout(completed) {
      const template = completedTemplate(completed);
      const context = completedIntensityContext(completed);
      return context.countsAsHardQuality
        || context.countsAsHardLoad
        || hasStructuredIntervals(template.structuredWorkout);
    }

    function summarizeCompleted(items) {
      return items.reduce((summary, completed) => {
        summary.sessions += 1;
        summary.seconds += completedDurationSeconds(completed);
        summary.km += Number(completed.distanceKm) || 0;
        if (isHardWorkout(completed)) summary.hard += 1;
        if (completed.bodyStatus?.painBefore || completed.bodyStatus?.painAfter || completed.bodyStatus?.area) summary.pain += 1;
        return summary;
      }, { sessions: 0, seconds: 0, km: 0, hard: 0, pain: 0 });
    }

    function progressRow(label, current, target, suffix = '') {
      if (!target) return '';
      const percent = Math.max(0, Math.min(100, (current / target) * 100));
      const currentText = suffix ? `${current.toLocaleString('no-NO', { maximumFractionDigits: 1 })} ${suffix}` : String(current);
      const targetText = suffix ? `${target.toLocaleString('no-NO', { maximumFractionDigits: 1 })} ${suffix}` : String(target);
      return `
        <div class="progress-row">
          <div class="progress-label"><span>${escapeHtml(label)}</span><span>${escapeHtml(currentText)} / ${escapeHtml(targetText)}</span></div>
          <div class="progress-track"><div class="progress-fill" style="width:${percent}%;"></div></div>
        </div>`;
    }

    function challengeMetricLabel(metric) {
      return { km: 'Kilometer', hours: 'Timer', sessions: 'Økter' }[metric] || 'Mål';
    }

    function challengeProgress(challenge) {
      const completedItems = state.completed.map(completed => ({
        ...completed,
        type: completedTemplate(completed).type || 'Annet',
        durationSeconds: completedDurationSeconds(completed)
      }));
      return challengeProgressCore(challenge, completedItems, todayISO());
    }

    function challengeStatusLabel(challenge, progress) {
      if (progress.done) return 'Fullført';
      if (challenge.status === 'paused') return 'Pause';
      if (progress.expired) return 'Utløpt';
      return 'Aktiv';
    }

    function challengePaceInfo(challenge, progress, today = todayISO()) {
      const start = new Date(`${challenge.startDate}T12:00:00`);
      const end = new Date(`${challenge.endDate}T12:00:00`);
      const now = new Date(`${today}T12:00:00`);
      const totalDays = Math.max(1, Math.round((end - start) / 86400000) + 1);
      const elapsedDays = now < start ? 0 : now > end ? totalDays : Math.round((now - start) / 86400000) + 1;
      const expectedPercent = Math.max(0, Math.min(100, (elapsedDays / totalDays) * 100));
      const expectedCurrent = (Number(progress.target) || 0) * expectedPercent / 100;
      const gap = (Number(progress.current) || 0) - expectedCurrent;
      const status = progress.done
        ? 'done'
        : progress.expired
        ? 'behind'
        : progress.percent + 2 >= expectedPercent
        ? 'on-track'
        : 'behind';
      const label = status === 'done' ? 'Mål nådd' : status === 'on-track' ? 'I rute' : 'Bak takt';
      const note = status === 'done'
        ? 'Challenge fullført.'
        : status === 'on-track'
        ? `Forventet nå: ${challengeValueLabel(expectedCurrent, challenge.metric)}.`
        : `${challengeValueLabel(Math.abs(gap), challenge.metric)} bak forventet takt.`;
      return { expectedPercent, expectedCurrent, gap, status, label, note };
    }

    function challengeCard(challenge, compact = false) {
      const progress = challengeProgress(challenge);
      const activity = challenge.activity === 'all' ? 'Alle aktiviteter' : challenge.activity;
      const status = challengeStatusLabel(challenge, progress);
      const statusClass = progress.done ? 'done' : progress.expired ? 'expired' : challenge.status === 'paused' ? 'paused' : 'active';
      return `
        <div class="challenge-card ${statusClass}">
          <div class="challenge-top">
            <div>
              <h3>${escapeHtml(challenge.name)}</h3>
              <span>${escapeHtml(challengeMetricLabel(challenge.metric))} · ${escapeHtml(activity)} · ${escapeHtml(formatShortDate(challenge.startDate))}-${escapeHtml(formatShortDate(challenge.endDate))}</span>
            </div>
            <strong>${Math.round(progress.percent)}%</strong>
          </div>
          <div class="progress-track"><div class="progress-fill ${progress.done ? 'done' : progress.current > 0 ? 'partial' : 'empty'}" style="width:${progress.percent}%;"></div></div>
          <div class="challenge-meta">
            <span>${escapeHtml(challengeValueLabel(progress.current, challenge.metric))} / ${escapeHtml(challengeValueLabel(progress.target, challenge.metric))} · ${escapeHtml(challengeRemainingLabel(progress, challenge.metric))}</span>
            <span>${escapeHtml(status)}${status === 'Aktiv' ? ` · ${progress.daysLeft} dager igjen` : ''}</span>
          </div>
          ${compact ? '' : `
            <div class="button-row">
              <button class="btn-soft" onclick="editChallenge('${challenge.id}')">Rediger</button>
              <button class="btn-soft" onclick="deleteChallenge('${challenge.id}')">Slett</button>
            </div>`}
        </div>`;
    }

    function sortedChallenges() {
      return [...(state.challenges || [])].sort((a, b) => {
        const aProgress = challengeProgress(a);
        const bProgress = challengeProgress(b);
        const aRank = aProgress.done ? 2 : aProgress.expired ? 3 : a.status === 'paused' ? 1 : 0;
        const bRank = bProgress.done ? 2 : bProgress.expired ? 3 : b.status === 'paused' ? 1 : 0;
        return aRank - bRank || String(a.endDate || '').localeCompare(String(b.endDate || ''));
      });
    }

    function renderChallengeActivityOptions() {
      const select = document.getElementById('challengeActivity');
      if (!select) return;
      const selected = select.value || 'all';
      const values = ['all', ...uniqueValues([...(state.settings.activityTypes || []), ...state.templates.map(t => t.type || 'Annet')])];
      select.innerHTML = values.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value === 'all' ? 'Alle aktiviteter' : value)}</option>`).join('');
      select.value = values.includes(selected) ? selected : 'all';
    }

    function renderChallenges() {
      const list = document.getElementById('challengeList');
      if (!list) return;
      const challenges = sortedChallenges();
      const active = challenges.filter(challenge => {
        const progress = challengeProgress(challenge);
        return challenge.status !== 'paused' && !progress.done && !progress.expired;
      });

      const mini = document.getElementById('homeChallengeMini');
      if (mini) {
        if (active.length) {
          const c = active[0];
          const p = challengeProgress(c);
          const pace = challengePaceInfo(c, p);
          const fillClass = p.done ? 'done' : p.current > 0 ? pace.status : 'empty';
          mini.innerHTML = `
            <div class="challenge-mini">
              <div class="challenge-mini-top">
                <div>
                  <span>${escapeHtml(c.name)}</span>
                  <small>${escapeHtml(challengeMetricLabel(c.metric))} · ${escapeHtml(c.activity === 'all' ? 'Alle aktiviteter' : c.activity)}</small>
                </div>
                <strong>${Math.round(p.percent)}%</strong>
              </div>
              <div class="challenge-mini-track">
                <div class="progress-track"><div class="progress-fill ${fillClass}" style="width:${p.percent}%;"></div></div>
                <span class="challenge-expected-marker" style="left:${pace.expectedPercent}%"></span>
              </div>
              <div class="challenge-mini-meta">
                <span>${escapeHtml(challengeValueLabel(p.current, c.metric))} / ${escapeHtml(challengeValueLabel(p.target, c.metric))} · ${escapeHtml(challengeRemainingLabel(p, c.metric))}</span>
                <strong class="challenge-pace ${pace.status}">${escapeHtml(pace.label)}</strong>
              </div>
              <p class="small-note">${escapeHtml(pace.note)} ${p.daysLeft ? `${p.daysLeft} dager igjen.` : ''}</p>
            </div>`;
        } else {
          mini.innerHTML = '';
        }
      }

      if (!challenges.length) {
        list.innerHTML = `<div class="empty">Ingen challenges enda. Lag et kortsiktig mål for ekstra motivasjon.</div>`;
        return;
      }
      const activeIds = new Set(active.map(challenge => challenge.id));
      const previous = challenges.filter(challenge => !activeIds.has(challenge.id));
      const activeHtml = active.length
        ? active.map(challenge => challengeCard(challenge)).join('')
        : '<div class="empty compact-empty">Ingen aktive challenges.</div>';
      const previousHtml = previous.length
        ? `<details class="challenge-history"><summary><span>Tidligere challenges</span><small>${previous.length}</small></summary><div>${previous.map(challenge => challengeCard(challenge)).join('')}</div></details>`
        : '';
      list.innerHTML = `${activeHtml}${previousHtml}`;
    }

    function defaultChallengeDates() {
      const today = todayISO();
      const start = `${today.slice(0, 8)}01`;
      const endDate = new Date(`${start}T12:00:00`);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
      return { start, end: dateToISO(endDate) };
    }

    window.clearChallengeForm = function() {
      const dates = defaultChallengeDates();
      document.getElementById('challengeEditingId').value = '';
      document.getElementById('challengeName').value = '';
      document.getElementById('challengeTarget').value = '';
      document.getElementById('challengeMetric').value = 'km';
      document.getElementById('challengeActivity').value = 'all';
      document.getElementById('challengeStartDate').value = dates.start;
      document.getElementById('challengeEndDate').value = dates.end;
      document.getElementById('challengeStatus').value = 'active';
      document.getElementById('challengeSubmitBtn').textContent = 'Lagre challenge';
      document.getElementById('challengeCancelBtn').classList.add('hidden');
    };

    window.saveChallenge = async function() {
      const editingId = document.getElementById('challengeEditingId').value;
      const name = document.getElementById('challengeName').value.trim();
      const target = Number(document.getElementById('challengeTarget').value);
      const metric = document.getElementById('challengeMetric').value;
      const activity = document.getElementById('challengeActivity').value;
      const startDate = document.getElementById('challengeStartDate').value;
      const endDate = document.getElementById('challengeEndDate').value;
      const status = document.getElementById('challengeStatus').value;
      if (!name) return alert('Gi challengen et navn først.');
      if (!Number.isFinite(target) || target <= 0) return alert('Legg inn et mål større enn 0.');
      if (!startDate || !endDate || endDate < startDate) return alert('Velg en gyldig periode.');
      const challenge = {
        id: editingId || uid('challenge'),
        name,
        target,
        metric,
        activity,
        startDate,
        endDate,
        status,
        createdAt: editingId ? state.challenges.find(item => item.id === editingId)?.createdAt || todayISO() : todayISO(),
        updatedAt: new Date().toISOString()
      };
      clearChallengeForm();
      await safeStateWrite({
        apply: () => {
          if (editingId) {
            const index = state.challenges.findIndex(item => item.id === editingId);
            if (index >= 0) state.challenges[index] = challenge;
          } else {
            state.challenges.push(challenge);
          }
        },
        write: () => fsSet('challenges', challenge.id, challenge),
        successMessage: editingId ? 'Challenge oppdatert' : 'Challenge lagret',
        errorMessage: 'Kunne ikke lagre challenge'
      });
    };

    window.editChallenge = function(id) {
      const challenge = state.challenges.find(item => item.id === id);
      if (!challenge) return;
      document.getElementById('challengeEditingId').value = challenge.id;
      document.getElementById('challengeName').value = challenge.name || '';
      document.getElementById('challengeTarget').value = challenge.target || '';
      document.getElementById('challengeMetric').value = challenge.metric || 'km';
      document.getElementById('challengeActivity').value = challenge.activity || 'all';
      document.getElementById('challengeStartDate').value = challenge.startDate || todayISO();
      document.getElementById('challengeEndDate').value = challenge.endDate || todayISO();
      document.getElementById('challengeStatus').value = challenge.status || 'active';
      document.getElementById('challengeSubmitBtn').textContent = 'Lagre endringer';
      document.getElementById('challengeCancelBtn').classList.remove('hidden');
      showTab('settings');
      openSetupSection('challenges');
      document.getElementById('challengeName').scrollIntoView({ block: 'center', behavior: 'smooth' });
    };

    window.deleteChallenge = async function(id) {
      const challenge = state.challenges.find(item => item.id === id);
      if (!challenge) return;
      if (!confirm(`Slette challengen "${challenge.name}"?`)) return;
      await safeStateWrite({
        apply: () => { state.challenges = state.challenges.filter(item => item.id !== id); },
        write: () => fsDelete('challenges', id),
        successMessage: 'Challenge slettet',
        errorMessage: 'Kunne ikke slette challenge'
      });
    };

    function weekSummaryForStart(startIso) {
      const endIso = addDays(startIso, 6);
      const items = state.completed.filter(c => c.date >= startIso && c.date <= endIso);
      return { start: startIso, end: endIso, summary: summarizeCompleted(items) };
    }

    function buildContinuityWeeks(currentWeekStart) {
      const weeks = [];
      for (let i = 7; i >= 0; i--) {
        weeks.push(weekSummaryForStart(addDays(currentWeekStart, -(i * 7))));
      }
      return weeks;
    }

    function weekProtectedByFreeze(weekStart) {
      return isWeekProtectedByFreeze(weekStart, state.continuityFreezes, { rules: getCoachRules() });
    }

    function weekMeetsContinuityTarget(week, weeklyTarget) {
      return (week.summary.sessions || 0) >= weeklyTarget || weekProtectedByFreeze(week.start);
    }

    function calculateWeeklyStreak(currentWeekStart, weeklyTarget) {
      let streak = 0;
      let cursor = currentWeekStart;
      const currentWeek = weekSummaryForStart(cursor);
      if (weekMeetsContinuityTarget(currentWeek, weeklyTarget)) {
        streak += 1;
        cursor = addDays(cursor, -7);
      } else {
        cursor = addDays(cursor, -7);
      }

      while (true) {
        const week = weekSummaryForStart(cursor);
        if (!weekMeetsContinuityTarget(week, weeklyTarget)) break;
        streak += 1;
        cursor = addDays(cursor, -7);
      }
      return streak;
    }

    function renderContinuity(weekSummary, goals, weekStart) {
      const target = goals.weeklySessionsTarget;
      const streak = calculateWeeklyStreak(weekStart, target);
      const remaining = Math.max(0, target - weekSummary.sessions);
      const freezeSummary = continuityFreezeWeekSummary(weekStart, state.continuityFreezes, { rules: getCoachRules() });
      const currentStatus = weekSummary.sessions >= target
        ? 'I mål'
        : freezeSummary.protected
        ? 'Beskyttet'
        : `${weekSummary.sessions}/${target}`;

      document.getElementById('insightStreakWeeks').textContent = streak;
      document.getElementById('insightCurrentWeekStatus').textContent = currentStatus;

      const weeks = buildContinuityWeeks(weekStart);
      document.getElementById('insightContinuityWeeks').innerHTML = weeks.map((week, index) => {
        const sessions = week.summary.sessions;
        const protectedWeek = weekProtectedByFreeze(week.start);
        const status = sessions >= target ? 'done' : protectedWeek ? 'protected' : sessions > 0 ? 'partial' : 'empty';
        const isCurrent = index === weeks.length - 1;
        const distance = weeks.length - 1 - index;
        const weekLabel = isCurrent ? 'Denne uken' : distance === 1 ? 'Forrige' : `-${distance} uker`;
        const label = sessions >= target ? 'OK' : protectedWeek ? 'Frys' : `${sessions}/${target}`;
        return `
          <div class="continuity-chip ${status} ${isCurrent ? 'current' : ''}" title="${escapeHtml(formatDate(week.start))} - ${escapeHtml(formatDate(week.end))}">
            <span class="continuity-week-label">${escapeHtml(weekLabel)}</span>
            <strong>${escapeHtml(label)}</strong>
            <span>${sessions >= target ? 'i mål' : protectedWeek ? 'beskyttet' : `${sessions} økt${sessions === 1 ? '' : 'er'}`}</span>
            <small>${escapeHtml(formatWeekRange(week.start, week.end))}</small>
          </div>`;
      }).join('');

      document.getElementById('insightContinuityNote').textContent = weekSummary.sessions >= target
        ? 'Denne uken teller som en kontinuitetsuke. Videre trening er bonus og bør styres av overskudd.'
        : freezeSummary.protected
        ? 'Denne uken er beskyttet av fryskort. Det teller ikke som trening, men kontinuiteten brytes ikke.'
        : `${remaining} økt${remaining === 1 ? '' : 'er'} igjen for at denne uken skal telle i kontinuiteten.`;
    }

    function recentWeekSummaries(weekStart, count = 8) {
      const weeks = [];
      for (let i = count - 1; i >= 0; i--) {
        const start = addDays(weekStart, -(i * 7));
        const end = addDays(start, 6);
        const items = state.completed.filter(c => c.date >= start && c.date <= end);
        weeks.push({ start, end, summary: summarizeCompleted(items) });
      }
      return weeks;
    }

    function completedActivityType(item) {
      if (item.templateSnapshot?.type) return item.templateSnapshot.type;
      if (item.type) return item.type;
      return templateForCompleted(item).type || 'Annet';
    }

    function volumeActivityOptions() {
      const configured = asArray(state.settings.activityTypes);
      const used = state.completed.map(completedActivityType).filter(Boolean);
      return [...new Set([...configured, ...used])].sort((a, b) => a.localeCompare(b, 'no'));
    }

    function filteredVolumeItems(start, end) {
      return state.completed.filter(item => {
        const inRange = item.date >= start && item.date <= end;
        const activityMatch = volumeTrendActivity === 'all' || completedActivityType(item) === volumeTrendActivity;
        return inRange && activityMatch;
      });
    }

    function volumePeriods() {
      const windowModel = buildVolumeTrendWindow({
        period: volumeTrendPeriod,
        today: todayISO(),
        offset: volumeTrendOffsets[volumeTrendPeriod]
      });
      return {
        ...windowModel,
        periods: windowModel.periods.map(period => ({
          ...period,
          summary: summarizeCompleted(filteredVolumeItems(period.start, period.end))
        }))
      };
    }

    function renderVolumeActivityFilter() {
      const select = document.getElementById('volumeActivityFilter');
      if (!select) return;
      const options = volumeActivityOptions();
      if (volumeTrendActivity !== 'all' && !options.includes(volumeTrendActivity)) volumeTrendActivity = 'all';
      select.innerHTML = [
        '<option value="all">Alle aktiviteter</option>',
        ...options.map(type => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`)
      ].join('');
      select.value = volumeTrendActivity;
    }

    function formatSessionCount(value) {
      const sessions = Math.round(Number(value) || 0);
      return `${sessions} økt${sessions === 1 ? '' : 'er'}`;
    }

    function renderVolumeTrends() {
      const controls = {
        week: document.getElementById('volumePeriodWeek'),
        month: document.getElementById('volumePeriodMonth'),
        year: document.getElementById('volumePeriodYear')
      };
      Object.entries(controls).forEach(([period, button]) => {
        if (button) button.classList.toggle('active', volumeTrendPeriod === period);
      });
      renderVolumeActivityFilter();

      const { periods, title, intro, rangeLabel, canMoveForward, offset } = volumePeriods();
      const activityLabel = volumeTrendActivity === 'all' ? 'alle aktiviteter' : volumeTrendActivity;
      const visibleSummary = summarizeCompleted(periods.flatMap(period => filteredVolumeItems(period.start, period.end)));
      document.getElementById('insightVolumeIntro').textContent =
        `${intro} for ${activityLabel}. Bytt mellom uke, måned og år eller flytt tidsvinduet for å se utviklingen.`;
      const range = document.getElementById('volumeWindowLabel');
      const next = document.getElementById('volumeWindowNext');
      const reset = document.getElementById('volumeWindowReset');
      if (range) range.textContent = rangeLabel;
      if (next) next.disabled = !canMoveForward;
      if (reset) reset.hidden = offset === 0;
      document.getElementById('insightVolumeSummary').innerHTML = `
        <div class="insight-stat"><strong>${escapeHtml(formatSessionCount(visibleSummary.sessions))}</strong><span>Totalt</span></div>
        <div class="insight-stat"><strong>${escapeHtml(formatClockDuration(visibleSummary.seconds))}</strong><span>Tid</span></div>
        <div class="insight-stat"><strong>${escapeHtml(formatKm(visibleSummary.km))}</strong><span>Kilometer</span></div>`;

      const sessionPoints = periods.map(period => ({ label: period.label, value: period.summary.sessions }));
      const timePoints = periods.map(period => ({ label: period.label, value: period.summary.seconds }));
      const kmPoints = periods.map(period => ({ label: period.label, value: period.summary.km }));
      const cardOptions = {
        latestPrefix: periods.at(-1)?.label || 'Nå',
        previousPrefix: periods.at(-2)?.label || 'Forrige'
      };

      document.getElementById('insightVolumeTrends').innerHTML = [
        trendCard(`Økter ${title}`, sessionPoints, formatSessionCount, 'bar', '', cardOptions),
        trendCard(`Tid ${title}`, timePoints, value => formatClockDuration(value), 'bar', '', cardOptions),
        trendCard(`Kilometer ${title}`, kmPoints, value => formatKm(value), 'bar', '', cardOptions)
      ].join('');
    }

    window.setVolumePeriod = function(period) {
      if (!['week', 'month', 'year'].includes(period)) return;
      volumeTrendPeriod = period;
      renderVolumeTrends();
    };

    window.setVolumeActivityFilter = function(activityType) {
      volumeTrendActivity = activityType || 'all';
      renderVolumeTrends();
    };

    window.shiftVolumeWindow = function(direction) {
      volumeTrendOffsets[volumeTrendPeriod] = shiftVolumeTrendOffset(
        volumeTrendOffsets[volumeTrendPeriod],
        direction
      );
      renderVolumeTrends();
    };

    window.resetVolumeWindow = function() {
      volumeTrendOffsets[volumeTrendPeriod] = normalizeVolumeTrendOffset(0);
      renderVolumeTrends();
    };

    function templateForCompleted(item) {
      return completedTemplate(item);
    }

    function isWalkingCompleted(item) {
      const template = templateForCompleted(item);
      const type = String(template.type || '').toLowerCase();
      return type.includes('gå') || type.includes('walk');
    }

    function isRunningCompleted(item) {
      const template = templateForCompleted(item);
      const type = String(template.type || '').toLowerCase();
      return type.includes('løp') || type.includes('lop') || type.includes('run');
    }

    function isRestorativeCompleted(item) {
      const template = templateForCompleted(item);
      const type = String(template.type || '').toLowerCase();
      const intensity = String(template.intensity || '').toLowerCase();
      const purpose = String(template.purpose || '').toLowerCase();
      const role = String(template.role || '').toLowerCase();
      if (role === 'race' || purpose === 'race') return false;
      return (
        isWalkingCompleted(item) ||
        type.includes('mobilitet') ||
        type.includes('yoga') ||
        intensity.includes('restitusjon') ||
        purpose === 'recovery' ||
        purpose === 'mobility' ||
        item.trainingEffectType === 'recovery'
      );
    }

    function summarizeTrainingEffects(items) {
      const summary = {
        total: 0,
        seconds: 0,
        missing: 0,
        activity: {
          walkingCount: 0,
          restorativeCount: 0,
          lowRunningCount: 0,
          highPulseBaseCount: 0
        },
        categories: {
          low_aerobic: { label: 'Low Aerobic', shortLabel: 'Rolig', className: 'low', count: 0, seconds: 0 },
          high_aerobic: { label: 'High Aerobic', shortLabel: 'Moderat', className: 'high', count: 0, seconds: 0 },
          anaerobic: { label: 'Anaerobic', shortLabel: 'Hard', className: 'anaerobic', count: 0, seconds: 0 }
        }
      };

      items.forEach(item => {
        const category = item.trainingEffectCategory || trainingEffectCategory(item.trainingEffectType);
        if (!category || !summary.categories[category]) {
          summary.missing += 1;
          return;
        }
        const seconds = completedDurationSeconds(item);
        summary.total += 1;
        summary.seconds += seconds;
        summary.categories[category].count += 1;
        summary.categories[category].seconds += seconds;
        if (isWalkingCompleted(item)) summary.activity.walkingCount += 1;
        if (isRestorativeCompleted(item)) summary.activity.restorativeCount += 1;
        if (category === 'low_aerobic' && isRunningCompleted(item)) summary.activity.lowRunningCount += 1;
        if (completedIntensityContext(item).highPulseBase) summary.activity.highPulseBaseCount += 1;
      });

      return summary;
    }

    function profileLabel(value, fallback = '') {
      const labels = {
        running: 'Løping',
        general_fitness: 'Generell form',
        strength: 'Styrke',
        ski: 'Ski',
        mixed: 'Blandet trening',
        bakken_threshold: 'Bakken-inspirert terskel',
        polarized: 'Polarisert',
        general_health: 'Generell helse',
        flexible: 'Fleksibel',
        injury_free_progression: 'Skadefri progresjon',
        consistency: 'Kontinuitet',
        performance: 'Prestasjon',
        volume: 'Volum',
        base_threshold: 'Base / grunntrening',
        threshold_development: 'Kontrollert terskel / kapasitet',
        competition_prep: 'Konkurranseforberedelse',
        muscle_growth: 'Muskelvekst / bulking',
        max_strength: 'Maksimal styrke',
        technique_skill: 'Teknikk / ferdighet',
        injury_rebuild: 'Skadefri oppbygging',
        maintenance: 'Vedlikehold',
        mixed_focus: 'Blandet fokus'
      };
      return labels[value] || fallback || value || '';
    }

    function intensityProfileText(profile) {
      const framework = profile.philosophy === 'bakken_threshold' ? ` · ${COACH_FRAMEWORK.name}` : '';
      return `Basert på Garmin Primær treningseffekt. Tolkes mot ${profileLabel(profile.primaryFocus)} · ${profileLabel(profile.philosophy)}${framework}.`;
    }

    function categoryShare(summary, key) {
      const category = summary.categories[key];
      if (!category) return 0;
      if (summary.seconds > 0) return category.seconds / summary.seconds;
      if (summary.total > 0) return category.count / summary.total;
      return 0;
    }

    function intensityCategoryRows(summary) {
      const categories = Object.values(summary.categories);
      const basis = summary.seconds > 0 ? 'seconds' : 'count';
      const totalBasis = basis === 'seconds' ? summary.seconds : summary.total;
      return categories.map(category => {
        const value = category[basis];
        const percent = totalBasis ? Math.round((value / totalBasis) * 100) : 0;
        const detail = basis === 'seconds'
          ? `${category.count} økt${category.count === 1 ? '' : 'er'} · ${formatClockDuration(category.seconds)}`
          : `${category.count} økt${category.count === 1 ? '' : 'er'}`;
        return `
          <div class="intensity-quick-row">
            <span class="intensity-dot ${category.className}"></span>
            <strong>${escapeHtml(category.shortLabel)} ${percent}%</strong>
            <span>${escapeHtml(detail)}</span>
          </div>`;
      }).join('');
    }

    function intensityCompactContext(summary) {
      const low = Math.round(categoryShare(summary, 'low_aerobic') * 100);
      const high = Math.round(categoryShare(summary, 'high_aerobic') * 100);
      const anaerobic = Math.round(categoryShare(summary, 'anaerobic') * 100);
      if (!summary.total && summary.missing) return `${summary.missing} økt${summary.missing === 1 ? '' : 'er'} mangler Garmin-valg siste 4 uker.`;
      if (!summary.total) return '4 uker: Ingen Garmin-klassifiserte økter ennå.';
      return `4 uker: ${low}% rolig · ${high}% moderat · ${anaerobic}% hard`;
    }

    function intensityBalanceCard(items, profile, contextSummary, balance) {
      const summary = summarizeTrainingEffects(items);
      const categories = Object.values(summary.categories);
      const basis = summary.seconds > 0 ? 'seconds' : 'count';
      const totalBasis = basis === 'seconds' ? summary.seconds : summary.total;
      const stack = totalBasis
        ? categories.map(category => {
          const value = category[basis];
          const width = Math.max(0, (value / totalBasis) * 100);
          return `<div class="intensity-segment ${category.className}" style="width:${width}%;"></div>`;
        }).join('')
        : '';

      const missingText = summary.missing
        ? `<p class="small-note">${summary.missing} økt${summary.missing === 1 ? '' : 'er'} mangler Garmin-valg.</p>`
        : '';
      const registered = summary.total
        ? `${summary.total} registrert${summary.total === 1 ? '' : 'e'} med Garmin-valg`
        : summary.missing ? `${summary.missing} mangler Garmin-valg` : 'Ingen Garmin-valg ennå';

      return `
        <div class="intensity-card">
          <div class="intensity-header">
            <span>Siste ${balance.windowDays} dager</span>
            <span>${escapeHtml(registered)}</span>
          </div>
          <strong class="intensity-verdict">${escapeHtml(balance.label)}</strong>
          <p class="intensity-coach-line">${escapeHtml(balance.explanation)}</p>
          <div class="intensity-stack">${stack}</div>
          <div class="intensity-quick-grid">${intensityCategoryRows(summary)}</div>
          <p class="intensity-context-line">${escapeHtml(intensityCompactContext(contextSummary))}</p>
          ${missingText}
        </div>`;
    }

    function renderIntensityBalance(today, profile) {
      const windowDays = Number(getCoachRules().thresholds.intensityBalance.windowDays) || 14;
      const windowStart = addDays(today, -(windowDays - 1));
      const last28Start = addDays(today, -27);
      const windowItems = state.completed.filter(c => c.date >= windowStart && c.date <= today);
      const last28Items = state.completed.filter(c => c.date >= last28Start && c.date <= today);
      const last28Summary = summarizeTrainingEffects(last28Items);
      const balance = canonicalBalanceForCompleted(windowItems, today, windowDays);
      document.getElementById('insightIntensityProfile').textContent = intensityProfileText(profile);
      const evidence = intensityBalanceInsightEvidence(balance, { from: windowStart, to: today });
      document.getElementById('insightIntensityBalance').innerHTML = intensityBalanceCard(windowItems, profile, last28Summary, balance)
        + insightEvidenceDisclosureHtml(evidence, { escapeHtml, formatDate });
      document.getElementById('insightIntensityNote').textContent = '';
    }

    function buildCoachContext() {
      const today = todayISO();
      const personProfile = normalizePersonProfile(state.settings.personProfile);
      const trainingProfile = normalizeTrainingProfile(state.settings.trainingProfile);
      const goals = normalizeGoals(state.settings.goals);

      const weekStart = startOfWeek(today);
      const weekEnd = addDays(weekStart, 6);
      const last7Start = addDays(today, -6);
      const last14Start = addDays(today, -13);
      const last28Start = addDays(today, -27);

      const completedToDate = state.completed.filter(c => c.date <= today);
      const injuryCheckins14 = dailyInjuryCheckinsUntil(today, 14);
      const injurySignalItems = dailyInjuryAsCompletedItems(today, 14);
      const completedAndDailySignals = [...completedToDate, ...injurySignalItems]
        .sort((a, b) => workoutSortValue(a).localeCompare(workoutSortValue(b)));
      const thisWeek = completedToDate.filter(c => c.date >= weekStart && c.date <= weekEnd);
      const last7Days = completedToDate.filter(c => c.date >= last7Start);
      const last14Days = completedToDate.filter(c => c.date >= last14Start);
      const last28Days = completedToDate.filter(c => c.date >= last28Start);
      const completedToday = completedToDate
        .filter(c => c.date === today)
        .sort((a, b) => workoutSortValue(a).localeCompare(workoutSortValue(b)));
      const completedWithTemplateContext = completedToDate.map(c => {
        const template = completedTemplate(c);
        return {
          ...c,
          name: template.name,
          structuredWorkout: template.structuredWorkout
        };
      });

      function loadBreakdown(items) {
        return items.reduce((acc, c) => {
          const assessment = completedLoadAssessment(c);
          const lvl = assessment.level;
          const context = assessment.intensityContext || completedIntensityContext(c);
          acc[lvl] = (acc[lvl] || 0) + 1;
          if (context.highPulseBase) acc.highPulseBase += 1;
          if (context.countsAsHardQuality || context.countsAsHardLoad) acc.hardQuality += 1;
          return acc;
        }, { low: 0, moderate: 0, high: 0, highPulseBase: 0, hardQuality: 0 });
      }

      const weekSummary = summarizeCompleted(thisWeek);
      const load7 = loadBreakdown(last7Days);
      const intensityBalance14 = canonicalBalanceForCompleted(last14Days, today);
      const heartRateCompliance14 = heartRateComplianceForCompleted(last14Days, today);
      const heartRateZoneCompliance28 = heartRateZoneComplianceForItems(last28Days);

      const bodySignals14 = {
        pain: last14Days.filter(hasPainSignal).length + injuryCheckins14.filter(item => Number(item.painNow) > 0).length,
        adaptation: last14Days.filter(hasAdaptationSignal).length + injuryCheckins14.filter(item => Number(item.painNow) >= 3).length
      };

      let consecutiveDays = 0;
      for (let i = 0; i < 10; i++) {
        if (completedToDate.some(c => c.date === addDays(today, -i))) consecutiveDays++;
        else break;
      }

      const lastWorkout = latestCompletedWorkout(completedToDate);
      const daysSinceLast = lastWorkout
        ? Math.round((new Date(`${today}T12:00:00`) - new Date(`${lastWorkout.date}T12:00:00`)) / 86400000)
        : null;
      const activeCoachRules = getCoachRules();
      const volumeRamp = trainingVolumeRamp(completedToDate, {
        todayIso: today,
        rules: activeCoachRules
      });
      const comeback = comebackProtocol(completedToDate, {
        todayIso: today,
        weeklyTarget: goals.weeklySessionsTarget,
        rules: activeCoachRules
      });
      const effectiveWeeklyTarget = comeback.active && comeback.effectiveWeeklyTarget
        ? comeback.effectiveWeeklyTarget
        : goals.weeklySessionsTarget;

      const latestHrv = latestMetric('hrv7d');
      const latestRestingHr = latestMetric('restingHeartRate7d');

      const heartRateReference = heartRateReferenceForZoneSet();
      const goldenZone = heartRateReference.goldenZone;
      const heartRateZoneProfile = heartRateReference.zoneSet;

      const weekPlanRoles = trainingProfile.weekPlanRoles || [];
      const completedRoles = new Set(
        thisWeek.map(c => completedTemplate(c).role).filter(Boolean)
      );
      const missingRoles = weekPlanRoles.filter(role => role && !completedRoles.has(role));

      const activeChallenge = (state.challenges || []).find(ch =>
        ch.active && (!ch.startDate || ch.startDate <= today) && (!ch.endDate || ch.endDate >= today)
      ) || null;

      const nextPlanned = [...(state.planned || [])]
        .filter(p => p.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date))[0] || null;
      const tomorrow = addDays(today, 1);
      const tomorrowPlanned = [...(state.planned || [])]
        .filter(p => p.date === tomorrow)
        .sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')))[0] || null;

      const isRunningBakken = trainingProfile.primaryFocus === 'running' && trainingProfile.philosophy === 'bakken_threshold';
      const hardCount7 = load7.hardQuality || load7.high || 0;
      const hardCount14 = intensityBalance14.hardCount;
      const easyCount14 = intensityBalance14.easyCount;
      const gradedPain = gradedPainContext(completedAndDailySignals, today);
      const dailyReadiness = loadDailyReadiness();
      const structuredIntervals = structuredIntervalContext(completedWithTemplateContext, today);
      const injurySummary7 = injurySignalSummary(injurySignalEntriesUntil(today, 7));
      const raceReadiness = raceReadinessSummary(state.settings.raceGoal, completedRaceItems(), state.raceResults, today);
      const racePlan = raceGoalPlan(state.settings.raceGoal, raceReadiness, injurySummary7, today);
      const goalScore = goalProgressScore({
        readiness: raceReadiness,
        injurySummary: injurySummary7,
        last7: summarizeCompleted(last7Days),
        last28: summarizeCompleted(last28Days)
      });

      return {
        today, goals, trainingProfile, personProfile, isRunningBakken,
        thisWeek, last7Days, last14Days, last28Days, completedToday,
        weekSummary, load7,
        bodySignals14, consecutiveDays, daysSinceLast, lastWorkout,
        volumeRamp, comeback, effectiveWeeklyTarget,
        latestHrv, latestRestingHr,
        goldenZone, heartRateZoneProfile, heartRateCompliance14, heartRateZoneCompliance28, intensityBalance14,
        weekPlanRoles, completedRoles, missingRoles,
        activeChallenge, nextPlanned, tomorrowPlanned,
        hardCount7, hardCount14, easyCount14,
        gradedPain, dailyReadiness, structuredIntervals, injuryCheckins14,
        injurySummary7, raceReadiness, racePlan, goalScore
      };
    }

    function aiWorkoutFromPlanned(planned) {
      if (!planned) return null;
      const template = plannedTemplate(planned);
      const structured = template.structuredWorkout ? structuredWorkoutBreakdown(template.structuredWorkout) : null;
      return {
        date: planned.date || '',
        plannedTime: String(planned.time || planned.startTime || ''),
        label: template.name || 'Planlagt økt',
        type: template.type || '',
        intensity: template.intensity || '',
        role: template.role || '',
        purpose: template.purpose || '',
        load: template.load || '',
        structure: String(template.structure || '').slice(0, 500),
        estimatedDurationSeconds: Number(structured?.totalSeconds) || null,
        structuredInterval: structured ? {
          compact: structured.compact || '',
          workSeconds: Number(structured.workSeconds) || 0,
          restSeconds: Number(structured.restSeconds) || 0,
          totalSeconds: Number(structured.totalSeconds) || 0,
          intensity: structured.intensity || '',
          restType: structured.restType || ''
        } : null
      };
    }

    function aiWorkoutFromCompleted(completed) {
      if (!completed) return null;
      const template = completedTemplate(completed);
      return {
        date: completed.date || '',
        label: template.name || completed.manualName || 'Gjennomført økt',
        type: template.type || '',
        intensity: template.intensity || '',
        role: template.role || '',
        purpose: template.purpose || '',
        load: completedLoadAssessment(completed).level || template.load || '',
        durationSeconds: completedDurationSeconds(completed),
        distanceKm: Number(completed.distanceKm) || 0,
        averageHeartRate: Number(completed.averageHeartRate || completed.avgHeartRate) || null,
        rpe: Number(completed.rpe) || null,
        structuredWorkSeconds: Number(template.structuredWorkout ? structuredWorkoutBreakdown(template.structuredWorkout)?.workSeconds : 0) || 0,
        completionStatus: completed.execution || 'completed'
      };
    }

    function aiTrainingWindow(items = [], structuredWindow = {}, windowDays = 14) {
      const summary = summarizeCompleted(items);
      const balance = canonicalBalanceForCompleted(items, todayISO(), windowDays);
      return {
        sessions: summary.sessions,
        durationSeconds: summary.seconds,
        distanceKm: summary.km,
        easyCount: balance.easyCount,
        hardCount: balance.hardCount,
        structuredIntervalCount: Number(structuredWindow.count) || 0,
        structuredWorkSeconds: Number(structuredWindow.totalWorkSeconds) || 0
      };
    }

    function buildCurrentAiCoachContext() {
      const ctx = buildCoachContext();
      const trainingLevelAssessment = buildTrainingLevelAssessment(ctx);
      const plannedActive = (state.planned || []).filter(item => item.status !== 'done');
      const todayItems = plannedActive
        .filter(item => item.date === ctx.today)
        .sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
      const upcomingItems = plannedActive
        .filter(item => item.date > ctx.today)
        .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
      const nextDate = upcomingItems[0]?.date || '';
      const nextDateItems = nextDate ? upcomingItems.filter(item => item.date === nextDate) : [];
      const primaryItems = todayItems.length ? todayItems : nextDateItems;
      const decision = buildTodayDecision(ctx, primaryItems, todayItems);
      const raceGoal = normalizeRaceGoal(state.settings.raceGoal);
      const milestones = goalMilestones({
        goal: raceGoal,
        readiness: ctx.raceReadiness,
        plan: ctx.racePlan,
        injurySummary: ctx.injurySummary7,
        last7: summarizeCompleted(ctx.last7Days),
        last28: summarizeCompleted(ctx.last28Days)
      }, ctx.today);
      const nextMilestone = (milestones || []).find(item => ['current', 'blocked'].includes(item.status))
        || (milestones || []).find(item => item.status !== 'done')
        || null;
      const weekStart = startOfWeek(ctx.today);
      const freezeWeek = continuityFreezeWeekSummary(weekStart, state.continuityFreezes, { rules: getCoachRules() });
      const todayFreeze = activeContinuityFreezeForDate(ctx.today);
      const pbSummary = personalBestSummary(completedRaceItems(), state.raceResults);
      const latestPb = (pbSummary.entries || [])
        .map(entry => entry.best ? { ...entry.best, distanceKm: entry.km, label: `${entry.label} PB` } : null)
        .filter(Boolean)
        .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))[0] || null;
      const latestRace = pbSummary.latest || null;
      const latestCheckin = ctx.injuryCheckins14?.[ctx.injuryCheckins14.length - 1] || null;
      const missing = [];
      if (!ctx.dailyReadiness) missing.push('dagsform i dag');
      if (!ctx.lastWorkout) missing.push('tidligere økt');
      if (!raceGoal.name) missing.push('aktivt mål-løp');
      if (!ctx.latestHrv) missing.push('HRV');

      return buildAiCoachContext({
        coachDecision: decision.coachDecision || coachDecisionEngine({
          completedFeedback: decision,
          dailyReadinessLevel: ctx.dailyReadiness?.level || null
        }),
        today: {
          date: ctx.today,
          readiness: ctx.dailyReadiness ? {
            level: ctx.dailyReadiness.level,
            sleep: ctx.dailyReadiness.sleep,
            energy: ctx.dailyReadiness.energy,
            stairsOk: ctx.dailyReadiness.stairsOk,
            restingHeartRate: ctx.dailyReadiness.restingHR
          } : null,
          bodySignal: latestCheckin || ctx.injurySummary7?.hasSignal ? {
            active: Boolean(ctx.injurySummary7?.hasSignal),
            region: latestCheckin?.areaRegion || '',
            side: latestCheckin?.areaSide || '',
            area: latestCheckin?.area || ctx.injurySummary7?.area || '',
            painNow: latestCheckin?.painNow ?? ctx.injurySummary7?.latestScore ?? null,
            trend: latestCheckin?.trend || '',
            status: ctx.injurySummary7?.status || ''
          } : null,
          plannedToday: aiWorkoutFromPlanned(todayItems[0] || null),
          plannedTomorrow: aiWorkoutFromPlanned(ctx.tomorrowPlanned)
        },
        trainingSummary: {
          days7: aiTrainingWindow(ctx.last7Days, ctx.structuredIntervals?.last7, 7),
          days14: aiTrainingWindow(ctx.last14Days, ctx.structuredIntervals?.last14, 14),
          days28: aiTrainingWindow(ctx.last28Days, ctx.structuredIntervals?.last28, 28),
          intensityBalance: ctx.intensityBalance14,
          volumeRamp: ctx.volumeRamp,
          comeback: ctx.comeback
        },
        profile: {
          primaryFocus: ctx.trainingProfile.primaryFocus,
          level: ctx.trainingProfile.level,
          philosophy: ctx.trainingProfile.philosophy,
          priority: ctx.trainingProfile.priority,
          trainingFocus: ctx.trainingProfile.trainingFocus,
          weeklySessionTarget: ctx.effectiveWeeklyTarget || ctx.goals.weeklySessionsTarget,
          goldenZone: ctx.goldenZone,
          heartRateZoneProfile: ctx.heartRateZoneProfile,
          trainingLevelAssessment: {
            version: trainingLevelAssessment.version,
            level: trainingLevelAssessment.level.id,
            levelLabel: trainingLevelAssessment.level.label,
            score: trainingLevelAssessment.score,
            confidence: trainingLevelAssessment.confidence,
            recommendedCoachLevel: trainingLevelAssessment.recommendedCoachLevel,
            eligibleForConfirmation: trainingLevelAssessment.eligibleForConfirmation,
            safetyBlockers: trainingLevelAssessment.safetyBlockers,
            dimensions: trainingLevelAssessment.dimensions.map(item => ({
              id: item.id,
              score: item.score,
              status: item.status,
              summary: item.summary
            }))
          }
        },
        coachKnowledge: coachKnowledgeFromRules(getCoachRules()),
        goals: {
          active: Boolean(raceGoal.name && raceGoal.date),
          raceName: raceGoal.name,
          raceDate: raceGoal.date,
          distanceKm: raceGoal.distanceKm,
          targetTimeSeconds: raceGoal.targetTimeSeconds,
          phase: ctx.racePlan?.phaseLabel || '',
          score: ctx.goalScore?.percent ?? null,
          scoreTrend: ctx.goalScore?.trend?.delta ?? null,
          nextMilestone: nextMilestone?.title || '',
          nextStep: ctx.racePlan?.nextStep || ctx.racePlan?.focus || ctx.goalScore?.nextImprovement || ''
        },
        continuity: {
          streakWeeks: calculateWeeklyStreak(weekStart, ctx.goals.weeklySessionsTarget),
          freezeActiveToday: Boolean(todayFreeze),
          weekProtected: freezeWeek.protected,
          freezeReason: todayFreeze ? continuityFreezeReasonLabel(todayFreeze.reason) : freezeWeek.reasonLabels?.[0] || '',
          freezeIsTraining: false
        },
        recentHighlights: {
          latestWorkout: aiWorkoutFromCompleted(ctx.lastWorkout),
          latestRelevantTest: latestRace ? {
            date: latestRace.date,
            label: latestRace.name || latestRace.workoutName || 'Race/test',
            type: 'Løping',
            role: 'race_test',
            durationSeconds: latestRace.resultSeconds,
            distanceKm: latestRace.distanceKm
          } : null,
          latestPb: latestPb ? {
            date: latestPb.date,
            label: latestPb.label,
            type: 'Løping',
            role: 'race_test',
            durationSeconds: latestPb.resultSeconds,
            distanceKm: latestPb.distanceKm
          } : null
        },
        dataQuality: { missing, stale: [], assumptions: [] }
      });
    }

    function buildCoachNote(ctx) {
      const completedTodayNote = buildCompletedTodayCoachNote(ctx);
      if (completedTodayNote) return completedTodayNote;

      const { goals, trainingProfile, isRunningBakken, weekSummary, load7,
              bodySignals14, consecutiveDays, daysSinceLast, lastWorkout,
              goldenZone, heartRateCompliance14, intensityBalance14,
              hardCount14, easyCount14, last14Days,
              gradedPain, dailyReadiness, structuredIntervals, injuryCheckins14,
              volumeRamp, comeback, effectiveWeeklyTarget } = ctx;

      // 1. Smerte — gradert respons etter alvorlighetsgrad (Bakken: body_signals_first)
      const { activePain, resolvedRecently, highestTier } = gradedPain;
      const painImproving = improvingPainFollowup({ ...ctx, injuryCheckins14 });
      if (painImproving) {
        const loc = painImproving.area ? ` i ${painImproving.area}` : '';
        return `Smerten${loc} er bedre: ${painImproving.previousScore}/10 tidligere, ${painImproving.currentScore}/10 i dag. Det er positivt, men fortsatt moderat. Velg hvile, alternativ trening eller svært rolig test — ikke hard løping før smerten er lavere eller stabil. ${coachPrincipleLine(['body_signals_first'])}`;
      }
      if (highestTier === 'high') {
        const p = activePain.find(p => p.tier === 'high');
        const loc = p?.area ? ` i ${p.area}` : '';
        const dayStr = p?.daysAgo === 0 ? 'i dag' : p?.daysAgo === 1 ? 'i går' : `for ${p?.daysAgo} dager siden`;
        return `Du registrerte smerte${loc} på ${p?.score}/10 ${dayStr}. Alternativ trening eller hvile er riktig valg nå — ikke tren gjennom høy smerte. ${coachPrincipleLine(['body_signals_first'])}`;
      }
      if (highestTier === 'moderate') {
        const p = activePain.find(p => p.tier === 'moderate');
        const loc = p?.area ? ` i ${p.area}` : '';
        const dayStr = p?.daysAgo === 0 ? 'i dag' : p?.daysAgo === 1 ? 'i går' : `for ${p?.daysAgo} dager siden`;
        return `Du hadde smerte${loc} (${p?.score}/10) ${dayStr}. Gjennomfør neste økt lettere enn planlagt, og logg om det kjennes ved start. ${coachPrincipleLine(['body_signals_first'])}`;
      }
      if (highestTier === 'low') {
        const p = activePain.find(p => p.tier === 'low');
        const loc = p?.area ? ` i ${p.area}` : '';
        const dayStr = p?.daysAgo === 0 ? 'i dag' : p?.daysAgo === 1 ? 'i går' : `for ${p?.daysAgo} dager siden`;
        return `Litt smerte${loc} (${p?.score}/10) ${dayStr}. Planlegg normalt, men sjekk inn rett før neste økt — kjennes det noe, logg det og juster da.`;
      }
      if (!highestTier && resolvedRecently.length > 0) {
        return 'Tidligere smerte er fulgt av en smertefri økt. Bygg videre kontrollert, men du trenger ikke la det styre hele treningsuken.';
      }
      if (bodySignals14.adaptation > 0) {
        const bodyState = bodySignalState(last14Days);
        if (bodyState.level === 'active' || bodyState.level === 'caution') {
          return 'En økt ble tilpasset nylig. Bruk neste økt til å bekrefte at kroppen responderer fint før du øker belastningen.';
        }
      }

      // 2. Rød dagsform (Bakken: trafikklymodell — recovery_is_training)
      if (dailyReadiness?.level === 'red') {
        const reason = dailyReadiness.stairsOk === false ? 'trappetest sviktet — kroppen er ikke klar'
          : dailyReadiness.sleep <= 2 ? 'søvnen var dårlig'
          : dailyReadiness.energy <= 2 ? 'energinivået er lavt'
          : 'dagsformen er rød';
        return `Rødt lys i dag — ${reason}. Hvil eller velg en rolig alternativ økt. ${coachPrincipleLine(['recovery_is_training'])}`;
      }

      // 2b. Gul dagsform — myk advarsel, men overrides kun harde råd (Bakken: trafikklymodell)
      if (dailyReadiness?.level === 'yellow') {
        const reason = dailyReadiness.sleep <= 3 && dailyReadiness.energy <= 3
          ? 'søvn og energi er under par'
          : dailyReadiness.sleep <= 3 ? 'søvnen var noe lav'
          : 'energinivået er noe lavt';
        const hasHardPlanned = ctx.nextPlanned?.intensity === 'hard' || ctx.nextPlanned?.type === 'threshold';
        const extra = hasHardPlanned
          ? ' Du har en hard økt planlagt — vurder å tone den ned eller flytte den.'
          : ' En rolig økt eller lett bevegelse passer godt i dag.';
        return `Gult lys i dag — ${reason}.${extra} ${coachPrincipleLine(['recovery_is_training'])}`;
      }

      if (comeback?.active) {
        return `${comeback.explanation} Prioriter lett, repeterbar trening og la første uke bygge rytme fremfor å ta igjen det tapte. ${coachPrincipleLine(['recovery_is_training', 'repeatable_week'])}`;
      }

      if (volumeRamp?.status === 'high') {
        return `${volumeRamp.explanation} Hold neste økt rolig eller kortere, slik at kroppen får tid til å absorbere økningen. ${coachPrincipleLine(['easy_support', 'recovery_is_training'])}`;
      }

      // 3. Mange dager på rad uten rolig økt (Bakken: recovery_is_training)
      if (consecutiveDays >= 3 && load7.low === 0) {
        return `${consecutiveDays} treningsdager på rad uten rolig økt. En hviledag eller lett bevegelse gir kroppen tid til å adaptere. ${coachPrincipleLine(['recovery_is_training'])}`;
      }

      // 3. Pulsrespons vurderes mot øktens intensjon, ikke som ett felles "brudd".
      if (heartRateCompliance14.easyViolationCount >= 2) {
        return `${heartRateCompliance14.easyViolationCount} rolige/baseøkter siste ${heartRateCompliance14.windowDays} dager hadde høy pulsrespons. Hold rolige dager virkelig rolige, slik at kvaliteten kan komme med friske bein. ${coachPrincipleLine(['easy_support', 'fresh_legs'])}`;
      }
      if (heartRateCompliance14.qualityViolationCount >= 2 && goldenZone) {
        return `${heartRateCompliance14.qualityViolationCount} kvalitetsøkter siste ${heartRateCompliance14.windowDays} dager lå over den kontrollerte gylne sonen (${goldenZone.low}–${goldenZone.high} bpm). Hold terskelarbeidet kontrollert og repeterbart. ${coachPrincipleLine(['controlled_threshold', 'golden_zone'])}`;
      }
      if (isRunningBakken && intensityBalance14.highPulseBaseCount >= 2 && hardCount14 <= 1) {
        return `${intensityBalance14.highPulseBaseCount} baseøkter siste ${intensityBalance14.windowDays} dager hadde høy puls. De teller som rolig støtte i intensitetsbalansen, men ikke som hard terskelkvalitet. Bygg videre rolig/base og vent med ny hard kvalitet til beina kjennes friske. ${coachPrincipleLine(['easy_support', 'golden_zone', 'fresh_legs'])}`;
      }

      // 4. Skjev intensitetsbalanse (Bakken: fresh_legs / golden_zone)
      if (isRunningBakken && intensityBalance14.verdict === 'too_hard') {
        return `Intensitetsbalansen siste ${intensityBalance14.windowDays} dager er tung: ${hardCount14} harde mot ${easyCount14} rolige. Bakken-filosofien krever mer rolig volum som fundament. ${coachPrincipleLine(['golden_zone', 'fresh_legs'])}`;
      }
      if (!isRunningBakken && hardCount14 >= 3) {
        return 'Flere harde økter tett på hverandre de siste 2 ukene. Neste økt kan gjerne være rolig for å sikre kontinuitet.';
      }

      // 4b. Strukturert intervallarbeid — støtteinformasjon, ikke hard fasit.
      if (structuredIntervals?.last7.count >= 2 || structuredIntervals?.closeQualityDays) {
        return `Du har hatt ${structuredIntervals.last7.count} strukturerte intervalløkter siste 7 dager. La neste økt være rolig eller restitusjon, slik at kvalitetsarbeidet faktisk får effekt. ${coachPrincipleLine(['fresh_legs', 'recovery_is_training'])}`;
      }
      if (isRunningBakken && structuredIntervals?.last28.count === 0 && weekSummary.sessions > 0 && dailyReadiness?.level === 'green') {
        return `Du har ingen strukturerte intervalløkter siste 28 dager. Hvis kroppssignalene fortsatt er grønne, kan en kontrollert terskel-/intervalløkt være neste kvalitetssteg. ${coachPrincipleLine(['controlled_threshold', 'fresh_legs'])}`;
      }
      if (structuredIntervals?.last14.count === 1 && structuredIntervals.last14.totalWorkSeconds <= 1800 && hardCount14 <= 1) {
        return `Siste 14 dager har du én strukturert kvalitetsøkt med ${formatDuration(structuredIntervals.last14.totalWorkSeconds)} intervallarbeid. Det teller som kontrollert kvalitet — bygg rolig volum rundt den. ${coachPrincipleLine(['controlled_threshold', 'golden_zone'])}`;
      }

      // 5. Siste økt-logikk (kropp og belastning fra siste konkrete økt)
      if (lastWorkout) {
        const lastNote = lastWorkoutCoachNote(lastWorkout, trainingProfile);
        if (lastNote) return lastNote;
      }

      // 6. Ukesprogrems — mål og momentum
      const activeWeeklyTarget = effectiveWeeklyTarget || goals.weeklySessionsTarget;
      const activeStretchTarget = comeback?.active
        ? activeWeeklyTarget
        : goals.weeklyStretchSessionsTarget;
      if (weekSummary.sessions >= activeStretchTarget) {
        return 'Sterk kontinuitet denne uken. Du har nådd stretch-målet, så videre trening bør styres av overskudd og dagsform.';
      }
      if (weekSummary.sessions >= activeWeeklyTarget) {
        return 'Du er i mål med ukesmålet. En eventuell ekstra økt kan være bonus, ikke press.';
      }
      if (weekSummary.sessions > 0) {
        const remaining = Math.max(0, activeWeeklyTarget - weekSummary.sessions);
        return `Du er i gang denne uken. ${remaining} økt${remaining === 1 ? '' : 'er'} igjen til ukesmålet. Velg neste økt ut fra kropp og dagsform.`;
      }
      if (daysSinceLast !== null && daysSinceLast >= Number(getCoachRules().thresholds.comeback.triggerDaysSinceLast || 5)) {
        return `Det er ${daysSinceLast} dager siden siste økt. Start med én gjennomførbar økt — ikke press mer inn enn kroppen er klar for.`;
      }
      return 'Ingen økter logget denne uken ennå. Start med én gjennomførbar økt, gjerne kontrollert og realistisk.';
    }

    function buildCoachBasis(ctx) {
      const { last14Days, bodySignals14, consecutiveDays, daysSinceLast,
              goldenZone, heartRateCompliance14, heartRateZoneCompliance28, intensityBalance14, latestHrv, latestRestingHr,
              gradedPain, dailyReadiness, structuredIntervals, injuryCheckins14,
              volumeRamp, comeback } = ctx;
      const parts = [];
      if (dailyReadiness?.level && TRAFFIC_LIGHT_CONFIG[dailyReadiness.level]) {
        const cfg = TRAFFIC_LIGHT_CONFIG[dailyReadiness.level];
        const stairsPart = dailyReadiness.stairsOk === true ? ', trapp ✓'
          : dailyReadiness.stairsOk === false ? ', trapp ✗' : '';
        parts.push(`Dagsform: ${cfg.label} (søvn ${dailyReadiness.sleep}/5, energi ${dailyReadiness.energy}/5${stairsPart})`);
      }
      if (injuryCheckins14?.length) {
        const latestCheckin = injuryCheckins14[injuryCheckins14.length - 1];
        const scores = injuryCheckins14.map(item => item.painNow).filter(value => value !== '').join(' -> ');
        const trend = injuryTrendLabel(latestCheckin.trend);
        const loc = latestCheckin.area ? ` (${latestCheckin.area})` : '';
        parts.push(`Smerteoppfølging: ${scores}/10${loc}${trend ? `, ${trend.toLowerCase()}` : ''}`);
      }
      const total14 = last14Days.length;
      if (total14 > 0) {
        parts.push(`Intensitetsbalanse: ${intensityBalance14.explanation}`);
      }
      if (comeback?.active) {
        parts.push(`Comeback: ${comeback.explanation}`);
      } else if (volumeRamp?.enoughData) {
        parts.push(`Volumtrend: ${volumeRamp.explanation}`);
      }
      if (gradedPain.activePain.length > 0) {
        const byTier = gradedPain.activePain.reduce((acc, p) => {
          acc[p.tier] = (acc[p.tier] || 0) + 1;
          return acc;
        }, {});
        const tierLabels = { high: 'høy', moderate: 'moderat', low: 'lav' };
        const sigParts = Object.entries(byTier).map(([tier, n]) => `${n} ${tierLabels[tier]}`);
        const locs = [...new Set(gradedPain.activePain.map(p => p.area).filter(Boolean))];
        const locStr = locs.length ? ` (${locs.slice(0, 2).join(', ')})` : '';
        parts.push(`Aktiv smerte: ${sigParts.join(', ')}${locStr}`);
      } else if (gradedPain.resolvedRecently.length > 0) {
        parts.push('Tidligere smerte løst av smertefri økt');
      } else if (bodySignals14.adaptation > 0) {
        parts.push(`${bodySignals14.adaptation} tilpasset økt siste 14 dager`);
      }
      if (consecutiveDays >= 2) {
        parts.push(`${consecutiveDays} treningsdager på rad`);
      } else if (daysSinceLast !== null && daysSinceLast >= 3) {
        parts.push(`${daysSinceLast} dager siden siste økt`);
      }
      if (goldenZone) {
        const pulseSignals = [];
        if (heartRateCompliance14.easyViolationCount) {
          pulseSignals.push(`${heartRateCompliance14.easyViolationCount} rolig/base med høy puls`);
        }
        if (heartRateCompliance14.qualityViolationCount) {
          pulseSignals.push(`${heartRateCompliance14.qualityViolationCount} kvalitet over kontrollert sone`);
        }
        parts.push(`Gylne sonen (${goldenZone.sourceLabel || 'Bakken-beregnet'}): ${goldenZone.low}–${goldenZone.high} bpm${pulseSignals.length ? ` (${pulseSignals.join(', ')})` : ''}`);
      }
      if (ctx.heartRateZoneProfile) {
        parts.push(`Pulssoner 1–5: ${ctx.heartRateZoneProfile.name} (test-/brukerdefinert profil, separat fra gylne sone)`);
      }
      if (heartRateZoneCompliance28?.knownCount) {
        const inPlan = heartRateZoneCompliance28.counts.aligned + heartRateZoneCompliance28.counts.mostly_aligned;
        parts.push(`Soneetterlevelse: ${inPlan} av ${heartRateZoneCompliance28.knownCount} vurderbare økter i eller stort sett i tråd med plan`);
      }
      if (structuredIntervals?.last14.count > 0) {
        const latest = structuredIntervals.latest?.date ? `, siste ${formatDate(structuredIntervals.latest.date)}` : '';
        parts.push(`Strukturert intervall: ${structuredIntervals.last14.count} siste 14 dager, ${formatDuration(structuredIntervals.last14.totalWorkSeconds)} arbeid${latest}`);
      }
      if (latestHrv) parts.push(`HRV: ${latestHrv.hrv7d} ms`);
      if (latestRestingHr) parts.push(`Hvilepuls: ${latestRestingHr.restingHeartRate7d} bpm`);
      if (!parts.length) parts.push('Ikke nok data ennå — logg noen økter for bedre innsikt');
      return parts;
    }

    // ── Bakken-mønstre ────────────────────────────────────────────────────────

    function buildBakkenPatterns(today, profile, goals) {
      const start30 = addDays(today, -29);
      const items30 = state.completed.filter(c => c.date >= start30 && c.date <= today);
      const weekStart = startOfWeek(today);
      const maxHR = Number(normalizePersonProfile(state.settings.personProfile).maxHeartRate) || 0;
      const patterns = [];
      const balance = canonicalBalanceForCompleted(items30, today);
      const pulseCompliance = heartRateComplianceForCompleted(items30, today);
      const countHighPulseBaseAsEasy = getCoachRules().thresholds.intensityBalance.countHighPulseBaseAsEasy !== false;
      const easyItems = items30.filter(item => {
        const context = completedIntensityContext(item);
        return context.countsAsEasySupport && (!context.highPulseBase || countHighPulseBaseAsEasy);
      });

      // 1. Samme kanoniske 14-dagersbalanse som Hjem og Dagens råd.
      patterns.push({
        status: balance.status,
        label: 'Andel rolige økter',
        detail: balance.explanation
      });

      // 2. Rolig pulsrespons og kontrollert kvalitet vurderes hver for seg.
      if (maxHR > 0) {
        const easyCeiling = Math.round(Number(getCoachRules().thresholds.easyCeiling.pctOfMaxHr) * maxHR);
        if (pulseCompliance.easyWithHeartRateCount >= 3) {
          const overEasy = pulseCompliance.easyViolationCount;
          const status = overEasy === 0 ? 'green' : overEasy === 1 ? 'yellow' : 'red';
          const qualityText = pulseCompliance.qualityViolationCount
            ? ` ${pulseCompliance.qualityViolationCount} kvalitetsøkt${pulseCompliance.qualityViolationCount === 1 ? '' : 'er'} var over kontrollert terskelsone.`
            : '';
          const detail = overEasy === 0
            ? `Alle ${pulseCompliance.easyWithHeartRateCount} rolige/baseøkter med puls var under rolig-taket (ca. ${easyCeiling} bpm).${qualityText}`
            : `${overEasy} av ${pulseCompliance.easyWithHeartRateCount} rolige/baseøkter med puls var over rolig-taket (ca. ${easyCeiling} bpm).${qualityText}`;
          patterns.push({ status, label: 'Rolige dager er rolige', detail });
        } else {
          patterns.push({ status: 'neutral', label: 'Rolige dager er rolige', detail: 'Logg snittpuls på flere rolige økter for å se dette mønsteret' });
        }
      }

      // 3. RPE på rolige dager (bør ikke være ≥ 7)
      const easyWithRpe = easyItems.filter(c => Number(c.rpe) > 0);
      if (easyWithRpe.length >= 3) {
        const hardRpe = easyWithRpe.filter(c => Number(c.rpe) >= 7).length;
        const status = hardRpe === 0 ? 'green' : hardRpe === 1 ? 'yellow' : 'red';
        const detail = hardRpe === 0
          ? `Ingen rolige økter med RPE ≥ 7 — bra`
          : `${hardRpe} av ${easyWithRpe.length} rolige økter hadde RPE ≥ 7`;
        patterns.push({ status, label: 'RPE på rolige dager', detail });
      } else {
        patterns.push({ status: 'neutral', label: 'RPE på rolige dager', detail: 'Logg RPE på flere rolige økter for å se dette mønsteret' });
      }

      // 4. Ukentlig konsistens siste 4 uker
      const recentWeeks = recentWeekSummaries(weekStart, 4);
      const metGoal = recentWeeks.filter(w => w.summary.sessions >= goals.weeklySessionsTarget).length;
      const total = recentWeeks.length;
      if (total >= 2) {
        const status = metGoal >= 3 ? 'green' : metGoal >= 2 ? 'yellow' : 'red';
        patterns.push({ status, label: 'Ukentlig konsistens', detail: `${metGoal} av ${total} uker nådde ukesmålet (${goals.weeklySessionsTarget} økter)` });
      }

      return patterns;
    }

    function renderBakkenPatterns() {
      const container = document.getElementById('insightPatterns');
      if (!container) return;
      const today = todayISO();
      const profile = normalizeTrainingProfile(state.settings.trainingProfile);
      const goals = normalizeGoals(state.settings.goals);
      const patterns = buildBakkenPatterns(today, profile, goals);
      container.innerHTML = patterns.map(p => `
        <div class="pattern-item">
          <span class="pattern-dot ${p.status}"></span>
          <div class="pattern-text">
            <strong>${escapeHtml(p.label)}</strong>
            <span class="small-note">${escapeHtml(p.detail)}</span>
          </div>
        </div>`).join('');
    }

    function currentAge(personProfile, today = todayISO()) {
      const birthYear = Number(personProfile?.birthYear);
      const currentYear = Number(String(today).slice(0, 4));
      return birthYear >= 1900 && currentYear >= birthYear ? currentYear - birthYear : null;
    }

    function trainingLevelCompletedItems(profile) {
      return (state.completed || []).map(completed => {
        const template = completedTemplate(completed);
        const context = classifyWorkoutIntensityContext({
          completed,
          template,
          profile: normalizePersonProfile(state.settings.personProfile),
          rules: getCoachRules()
        });
        const optionalMetric = value => value === '' || value === null || value === undefined
          ? null
          : Number.isFinite(Number(value)) ? Number(value) : null;
        return {
          date: completed.date,
          durationSeconds: completedDurationSeconds(completed),
          distanceKm: Number(completed.distanceKm) || 0,
          rpe: optionalMetric(completed.rpe),
          feelingScore: optionalMetric(completed.feelingScore),
          painBefore: optionalMetric(completed.bodyStatus?.painBefore),
          painAfter: optionalMetric(completed.bodyStatus?.painAfter),
          intensityContext: context.category === 'quality' ? 'quality' : context.countsAsEasySupport ? 'easy' : 'other'
        };
      });
    }

    function buildTrainingLevelAssessment(coachCtx = buildCoachContext()) {
      const person = normalizePersonProfile(state.settings.personProfile);
      const latestVo2 = latestMetric('vo2Max');
      const raceResults = personalBestSummary(completedRaceItems(), state.raceResults).raceResults;
      return assessTrainingLevel({
        todayIso: coachCtx.today,
        completed: trainingLevelCompletedItems(coachCtx.trainingProfile),
        raceResults,
        vo2Max: latestVo2?.vo2Max,
        age: currentAge(person, coachCtx.today),
        sex: person.sex,
        currentCoachLevel: coachCtx.trainingProfile.level,
        progress: state.settings.trainingLevelProgress,
        volumeRamp: coachCtx.volumeRamp,
        comeback: coachCtx.comeback,
        activeInjury: Boolean(coachCtx.injurySummary7?.hasSignal)
      });
    }

    function fitnessStatusLabel(status) {
      if (status === 'good') return 'Godt grunnlag';
      if (status === 'watch') return 'Følg med';
      return 'Under bygging';
    }

    function renderTrainingLevelAssessment(coachCtx) {
      const container = document.getElementById('fitnessLevelAssessment');
      const confidence = document.getElementById('fitnessLevelConfidence');
      if (!container || !confidence) return;
      const assessment = buildTrainingLevelAssessment(coachCtx);
      const evidence = trainingLevelInsightEvidence(assessment, { today: coachCtx.today });
      const confidenceLabels = { high: 'Høy datadekning', medium: 'Middels datadekning', low: 'Lav datadekning' };
      confidence.textContent = confidenceLabels[assessment.confidence] || confidenceLabels.low;
      confidence.className = `fitness-confidence ${assessment.confidence}`;
      const dimensions = assessment.dimensions.map(item => `
        <div class="fitness-dimension ${escapeHtml(item.status)}">
          <div class="fitness-dimension-head">
            <span>${escapeHtml(item.label)}</span>
            <strong>${escapeHtml(fitnessStatusLabel(item.status))}</strong>
          </div>
          <div class="fitness-dimension-track"><span style="width:${item.score}%"></span></div>
          <p>${escapeHtml(item.summary)}</p>
        </div>`).join('');
      const blockers = assessment.safetyBlockers.length
        ? `<div class="fitness-safety"><strong>Oppgradering venter</strong><span>${escapeHtml(assessment.safetyBlockers.join(' · '))}</span></div>`
        : '';
      const action = assessment.eligibleForConfirmation
        ? `<button class="btn-primary fitness-level-action" onclick="confirmTrainingLevelUpgrade()">Bekreft neste nivå: ${assessment.confirmationLevel.rank} ${escapeHtml(assessment.confirmationLevel.label)}</button>`
        : '';
      const nextRequirements = assessment.nextLevel && assessment.nextLevelRequirements.length
        ? `<div class="fitness-requirements">
            <strong>Dette mangler for nivå ${assessment.nextLevel.rank} · ${escapeHtml(assessment.nextLevel.label)}</strong>
            <ul>${assessment.nextLevelRequirements.map(item => `<li>${escapeHtml(item.detail)}</li>`).join('')}</ul>
          </div>`
        : '';
      const recommendedNextStep = assessment.recommendedNextStep
        ? `<div class="fitness-next-step"><span>Anbefalt neste steg · ${escapeHtml(assessment.recommendedNextStep.label)}</span><strong>${escapeHtml(assessment.recommendedNextStep.text)}</strong></div>`
        : '';
      const vo2 = assessment.vo2.available
        ? `<div class="fitness-reference-note"><strong>VO2 mot alder:</strong> ${escapeHtml(assessment.vo2.value)} mot HUNT-snitt ${escapeHtml(assessment.vo2.mean)} for ${escapeHtml(assessment.vo2.ageLabel)} år. ${escapeHtml(assessment.vo2.caveat)}</div>`
        : `<div class="fitness-reference-note"><strong>Aldersreferanse:</strong> ${escapeHtml(assessment.vo2.reason)}.</div>`;
      const history = normalizeTrainingLevelProgress(state.settings.trainingLevelProgress, assessment.currentCoachLevel).history;
      const historyHtml = history.length
        ? history.slice(-5).reverse().map(entry => {
            const level = assessment.level.id === entry.toTier ? assessment.level.label : entry.toTier.replaceAll('_', ' ');
            return `<li>${escapeHtml(formatDate(entry.date))}: ${escapeHtml(level)}</li>`;
          }).join('')
        : '<li>Ingen bekreftede nivåendringer ennå.</li>';
      container.innerHTML = `
        <div class="fitness-level-hero">
          <div class="fitness-level-rank"><span>Beregnet nivå</span><strong>Nivå ${assessment.level.rank} · ${escapeHtml(assessment.level.label)}</strong></div>
          <div class="fitness-level-score"><strong>${assessment.score}</strong><span>/100 vurderingsgrunnlag</span></div>
        </div>
        <p class="fitness-score-note">Poengsummen er ikke det samme som nivå. Nivået krever også nok tid, økter og stabile signaler.</p>
        <div class="fitness-confirmed-level"><span>Bekreftet progresjon</span><strong>Nivå ${assessment.highestLevel.rank} · ${escapeHtml(assessment.highestLevel.label)}</strong></div>
        <p class="fitness-level-summary">${escapeHtml(assessment.summary)}</p>
        ${blockers}
        <div class="fitness-dimensions">${dimensions}</div>
        ${action}
        ${nextRequirements}
        ${recommendedNextStep}
        ${insightEvidenceDisclosureHtml(evidence, { escapeHtml, formatDate })}
        <details class="fitness-level-details">
          <summary>Se nivådetaljer</summary>
          <div class="fitness-level-details-content">
            ${vo2}
            <p><strong>PB/test:</strong> ${escapeHtml(assessment.performance.note)}</p>
            <p><strong>Sikkerhetsregel:</strong> PB og VO2 støtter vurderingen, men kan aldri alene oppgradere coach-profilen.</p>
            <p><strong>Aldersgradering av løp:</strong> Ikke aktivert før komplett WMA-tabell er verifisert.</p>
            <ul>${historyHtml}</ul>
          </div>
        </details>`;
    }

    window.confirmTrainingLevelUpgrade = async function() {
      const coachCtx = buildCoachContext();
      const assessment = buildTrainingLevelAssessment(coachCtx);
      if (!assessment.eligibleForConfirmation) {
        showToast('Nivået er ikke klart for bekreftelse nå', 'info');
        return;
      }
      const coachChange = assessment.coachUpgrade
        ? ` Dette endrer coach-nivå fra ${assessment.currentCoachLevel} til ${assessment.recommendedCoachLevel}.`
        : ' Coach-nivået endres ikke.';
      if (!confirm(`Bekreft neste nivå ${assessment.confirmationLevel.rank}: ${assessment.confirmationLevel.label}?${coachChange}`)) return;
      state.settings.trainingLevelProgress = confirmedTrainingLevelProgress(assessment, state.settings.trainingLevelProgress);
      if (assessment.coachUpgrade) {
        state.settings.trainingProfile = normalizeTrainingProfile({
          ...state.settings.trainingProfile,
          level: assessment.recommendedCoachLevel
        });
      }
      await saveSettings();
      showToast(`Nivå ${assessment.confirmationLevel.rank} bekreftet - bra jobbet!`);
    };

    function renderInsights() {
      const today = todayISO();
      const sameEffortInsight = comparableEasyRunFormInsight({
        completedItems: state.completed,
        templates: state.templates,
        today,
        primaryActivityType: 'Løping'
      });
      trainingInsightsUi.renderSameEffortForm({
        ...sameEffortInsight,
        evidence: sameEffortInsightEvidence(sameEffortInsight, { today })
      });
      trainingInsightsUi.renderYearToDate(yearToDatePerformanceInsights({
        completedItems: state.completed,
        templates: state.templates,
        today,
        primaryActivityType: 'Løping'
      }));
      const goals = normalizeGoals(state.settings.goals);
      const profile = normalizeTrainingProfile(state.settings.trainingProfile);
      const weekStart = startOfWeek(today);
      const weekEnd = addDays(weekStart, 6);
      const weekItems = state.completed.filter(c => c.date >= weekStart && c.date <= weekEnd);
      const weekSummary = summarizeCompleted(weekItems);
      const last14Start = addDays(today, -13);
      const last14Days = state.completed.filter(c => c.date >= last14Start && c.date <= today);

      const status = weeklyTrainingStatus(weekItems, weekSummary, goals, profile);
      document.getElementById('insightWeekTime').textContent = formatClockDuration(weekSummary.seconds);
      document.getElementById('insightWeekKm').textContent = formatKm(weekSummary.km);
      document.getElementById('insightWeekLoad').textContent = status.label;
      document.getElementById('insightWeekSignals').textContent = weeklySignalLabel(status);

      const hours = weekSummary.seconds / 3600;
      document.getElementById('insightWeekProgress').innerHTML = [
        progressRow('Ukesmål økter', weekSummary.sessions, goals.weeklySessionsTarget),
        progressRow('Timer', hours, goals.weeklyHoursTarget, 't'),
        progressRow('Kilometer', weekSummary.km, goals.weeklyKmTarget, 'km')
      ].join('');
      renderWeeklyTrainingStatus(weekItems, weekSummary, goals, profile);
      renderWeeklyBodySignals(weekItems);
      renderIntensityBalance(today, profile);
      renderContinuity(weekSummary, goals, weekStart);

      const trendWeeks = recentWeekSummaries(weekStart, 6);
      renderVolumeTrends();

      const weeks = trendWeeks.slice(-4);
      document.getElementById('insightFourWeeks').innerHTML = weeks.map((week, index) => {
        const target = goals.weeklySessionsTarget;
        const percent = Math.max(0, Math.min(100, (week.summary.sessions / Math.max(1, target)) * 100));
        const isCurrent = index === weeks.length - 1;
        const isPrevious = index === weeks.length - 2;
        const status = week.summary.sessions >= target ? 'done' : week.summary.sessions > 0 ? 'partial' : 'empty';
        const title = isCurrent ? 'Denne uken' : isPrevious ? 'Forrige uke' : formatWeekRange(week.start, week.end);
        const range = isCurrent || isPrevious ? formatWeekRange(week.start, week.end) : '';
        return `
          <div class="week-row ${status}">
            <div class="week-row-top">
              <div>
                <strong>${escapeHtml(title)}</strong>
                ${range ? `<span>${escapeHtml(range)}</span>` : ''}
              </div>
              <span class="week-status ${status}">${week.summary.sessions >= target ? 'I mål' : `${week.summary.sessions}/${target}`}</span>
            </div>
            <div class="week-row-metrics">
              <span>${week.summary.sessions} økt${week.summary.sessions === 1 ? '' : 'er'}</span>
              <span>${escapeHtml(formatClockDuration(week.summary.seconds))}</span>
              <span>${escapeHtml(formatKm(week.summary.km))}</span>
            </div>
            <div class="progress-track"><div class="progress-fill ${status}" style="width:${percent}%;"></div></div>
          </div>`;
      }).join('');

      const coachCtx = buildCoachContext();
      renderTrainingLevelAssessment(coachCtx);
      renderBakkenPatterns();
      renderStructuredIntervalInsights(today);
      renderHeartRateZoneComplianceInsight(today);
      renderInjurySignalInsight(today);
      renderWellnessInsights();
      const insightCoachNote = document.getElementById('insightCoachNote');
      const insightCoachBasis = document.getElementById('insightCoachBasis');
      if (insightCoachNote) insightCoachNote.textContent = buildCoachNote(coachCtx);
      if (insightCoachBasis) insightCoachBasis.textContent = buildCoachBasis(coachCtx).join(' · ');
    }

    function renderStructuredIntervalInsights(today) {
      const card = document.getElementById('insightStructuredIntervalsCard');
      const grid = document.getElementById('insightStructuredIntervals');
      const latest = document.getElementById('insightStructuredIntervalLatest');
      const note = document.getElementById('insightStructuredIntervalNote');
      if (!card || !grid || !latest || !note) return;

      const items = state.completed.map(item => ({
        ...item,
        name: completedTemplate(item).name,
        structuredWorkout: completedTemplate(item).structuredWorkout
      }));
      const insight = structuredIntervalInsights(items, today);
      if (!insight.count) {
        card.style.display = 'none';
        return;
      }

      card.style.display = '';
      grid.innerHTML = `
        <div class="insight-stat"><strong>${insight.count}</strong><span>Økter siste 28 d</span></div>
        <div class="insight-stat"><strong>${escapeHtml(formatDuration(insight.totalWorkSeconds))}</strong><span>Intervallarbeid</span></div>
        <div class="insight-stat"><strong>${escapeHtml(formatDuration(insight.totalRestSeconds))}</strong><span>Hvile i drag</span></div>`;
      latest.textContent = insight.latest
        ? `Siste: ${formatDate(insight.latest.date)} · ${insight.latest.name} · ${insight.latest.summary}`
        : '';
      note.textContent = 'Strukturert intervallarbeid hjelper deg å se faktisk kvalitetstid, ikke bare total økttid.';
    }

    function renderHeartRateZoneComplianceInsight(today) {
      const card = document.getElementById('insightHeartRateComplianceCard');
      const container = document.getElementById('insightHeartRateCompliance');
      if (!card || !container) return;
      const start = addDays(today, -27);
      const items = state.completed.filter(item => item.date >= start && item.date <= today);
      const summary = heartRateZoneComplianceForItems(items);
      if (!summary.totalCount) {
        card.style.display = 'none';
        container.innerHTML = '';
        return;
      }
      const inPlan = summary.counts.aligned + summary.counts.mostly_aligned;
      const latest = summary.latest;
      const heartRateReference = heartRateReferenceForZoneSet();
      const zoneSourceText = heartRateReference.zoneSource
        ? `Sone 1–5 følger ${heartRateReference.zoneSource.name}. `
        : 'Ingen aktiv test-/brukerdefinert soneprofil. ';
      const goldenZoneText = heartRateReference.goldenZone
        ? `Gylne sone (${heartRateReference.goldenZone.sourceLabel}) er et separat coach-begrep.`
        : '';
      const evidence = zoneComplianceInsightEvidence(summary, {
        totalSessions: items.length,
        from: start,
        to: today,
        sourceLabel: heartRateReference.zoneSource?.name || ''
      });
      card.style.display = '';
      container.innerHTML = `
        <div class="zone-compliance-insight">
          <div class="insight-grid">
            <div class="insight-stat"><strong>${inPlan}/${summary.knownCount || '-'}</strong><span>I tråd</span></div>
            <div class="insight-stat"><strong>${summary.counts.above_plan}</strong><span>Hardere</span></div>
            <div class="insight-stat"><strong>${summary.counts.below_plan}</strong><span>Roligere</span></div>
          </div>
          ${latest ? `<div class="zone-compliance-latest status-${escapeHtml(latest.status)}">
            <strong>Siste vurdering: ${escapeHtml(latest.label)}</strong>
            <span>${escapeHtml(formatDate(latest.date))} · ${escapeHtml(latest.name)}</span>
            <p>${escapeHtml(latest.summary)}</p>
          </div>` : ''}
          <p class="small-note">${escapeHtml(zoneSourceText + goldenZoneText)}</p>
          ${insightEvidenceDisclosureHtml(evidence, { escapeHtml, formatDate })}
        </div>`;
    }

    function renderInjurySignalInsight(today) {
      const card = document.getElementById('insightInjurySignalCard');
      const container = document.getElementById('insightInjurySignal');
      if (!card || !container) return;
      const entries = injurySignalEntriesUntil(today, 7);
      const summary = injurySignalSummary(entries);
      const recovery = injuryRecoveryGuidance(entries);
      if (!summary.hasSignal) {
        card.style.display = 'none';
        container.innerHTML = '';
        return;
      }
      card.style.display = '';
      container.innerHTML = `
        <div class="injury-signal-head ${escapeHtml(summary.status)}">
          <span>${escapeHtml(summary.statusLabel)}</span>
          <strong>${escapeHtml(summary.area || 'Kroppssignal')}</strong>
        </div>
        <div class="insight-grid injury-signal-grid">
          <div class="insight-stat"><strong>${escapeHtml(summary.trendText || '-')}</strong><span>Siste 7 dager</span></div>
          <div class="insight-stat"><strong>${summary.latestPain ?? '-'}/10</strong><span>Siste smerte</span></div>
          <div class="insight-stat"><strong>${escapeHtml(summary.statusLabel)}</strong><span>Status</span></div>
        </div>
        <p><strong>Anbefaling:</strong> ${escapeHtml(summary.recommendation)}</p>
        <p><strong>Aktuelt nå:</strong> ${escapeHtml(summary.suggestedAction)}</p>
        <div class="injury-release-card ${escapeHtml(recovery.releaseStatus)}">
          <span>${escapeHtml(recovery.releaseLabel)}</span>
          <strong>${escapeHtml(recovery.nextSafeWorkout)}</strong>
          <p>${escapeHtml(recovery.releaseCriteria)}</p>
          <p class="small-note">${escapeHtml(recovery.qualityGate)}</p>
        </div>
        <p class="small-note"><strong>Trend/frislipp:</strong> ${escapeHtml(recovery.trendText || summary.trendText || '-')} · ${escapeHtml(recovery.note)}</p>`;
    }

    function renderRaceInsights(today) {
      renderRaceGoalInsight(today);
      renderPersonalBestInsights();
    }

    function renderGoals(today) {
      renderGoalsOverview(today);
      renderRaceInsights(today);
    }

    function goalScoreStatusText(status) {
      if (status === 'good') return 'God';
      if (status === 'watch') return 'Følg med';
      return 'Ikke nok data';
    }

    function goalScoreBasisHtml(score = {}, fallbackAction = '') {
      const items = Array.isArray(score.items) ? score.items : [];
      const rows = items.length
        ? items.map(item => {
            const value = Math.max(0, Math.min(2, Number(item.value || 0)));
            const status = item.status || 'neutral';
            return `
              <div class="goal-score-item ${escapeHtml(status)}">
                <span></span>
                <div>
                  <div class="goal-score-item-head">
                    <strong>${escapeHtml(item.label || 'Scorepunkt')}</strong>
                    <small class="goal-score-item-points">${value}/2 · ${escapeHtml(goalScoreStatusText(status))}</small>
                  </div>
                  <small>${escapeHtml(item.detail || 'Mangler nok data ennå')}</small>
                </div>
              </div>`;
          }).join('')
        : '<div class="goal-score-empty">Scoregrunnlag kommer når appen har nok mål- og treningsdata.</div>';
      const nextImprovement = score.nextImprovement || fallbackAction || 'Fortsett å bygge repeterbare uker og oppdater måldata når du tester.';
      return `
        <details class="goal-score-basis">
          <summary>
            <span>Vis scoregrunnlag</span>
            <small>Hva betyr dette?</small>
          </summary>
          <div class="goal-score-basis-content">
            <div class="goal-score-basis-head">
              <strong>Scoregrunnlag</strong>
              <span>${items.length ? `${items.length} komponenter` : 'Ingen komponenter ennå'}</span>
            </div>
            <div class="goal-score-list">${rows}</div>
            <div class="goal-score-next-improvement">
              <span>Neste viktigste forbedring</span>
              <strong>${escapeHtml(nextImprovement)}</strong>
            </div>
          </div>
        </details>`;
    }

    function renderGoalsOverview(today) {
      const container = document.getElementById('goalsOverview');
      if (!container) return;
      const completedToDate = state.completed.filter(item => item.date <= today);
      const last7Start = addDays(today, -6);
      const last28Start = addDays(today, -27);
      const previous7Start = addDays(today, -13);
      const previous7End = addDays(today, -7);
      const previous28Start = addDays(today, -34);
      const previous28End = addDays(today, -7);
      const last7 = summarizeCompleted(completedToDate.filter(item => item.date >= last7Start));
      const last28 = summarizeCompleted(completedToDate.filter(item => item.date >= last28Start));
      const previous7 = summarizeCompleted(completedToDate.filter(item => item.date >= previous7Start && item.date <= previous7End));
      const previous28 = summarizeCompleted(completedToDate.filter(item => item.date >= previous28Start && item.date <= previous28End));
      const injurySummary = injurySignalSummary(injurySignalEntriesUntil(today, 7));
      const readiness = raceReadinessSummary(state.settings.raceGoal, completedRaceItems(), state.raceResults, today);
      const plan = raceGoalPlan(state.settings.raceGoal, readiness, injurySummary, today);
      const summary = goalMotivationSummary({
        goal: state.settings.raceGoal,
        readiness,
        plan,
        injurySummary,
        last7,
        last28,
        previous7,
        previous28
      }, today);
      const milestones = goalMilestones({
        goal: state.settings.raceGoal,
        readiness,
        plan,
        injurySummary,
        last7,
        last28
      }, today);
      const testRecommendation = raceTestRecommendation({
        goal: state.settings.raceGoal,
        readiness,
        plan,
        injurySummary,
        last7,
        last28
      }, today);
      const score = summary.score || {};
      const metrics = summary.metrics?.length
        ? `<div class="goals-overview-metrics">${summary.metrics.map(metric => `
            <div class="goals-overview-stat">
              <strong>${escapeHtml(metric.value || '-')}</strong>
              <span>${escapeHtml(metric.label || '')}</span>
            </div>`).join('')}</div>`
        : '';
      const scoreTrend = score.trend
        ? `<small class="goal-progress-trend ${escapeHtml(score.trend.status || 'neutral')}">${escapeHtml(score.trend.label)}</small>`
        : '';
      const scoreCard = summary.hasGoal
        ? `<div class="goal-progress-score ${escapeHtml(score.status || 'neutral')}">
            <div class="goal-progress-score-main">
              <span>Mål-score</span>
              <strong>${Number(score.percent || 0)}/100</strong>
              ${scoreTrend}
            </div>
            <div class="goal-progress-score-bar"><span style="width:${Math.max(0, Math.min(100, Number(score.percent || 0)))}%"></span></div>
            <p>Scoren samler kontinuitet, rolig grunnlag, kontrollert kvalitet, skadefrihet og race/test-status.</p>
            ${goalScoreBasisHtml(score, summary.action)}
          </div>`
        : '';
      const milestoneItems = milestones?.length
        ? `<details class="goal-milestones-disclosure">
            <summary><span>Delmål mot løpet</span><small>${milestones.length} steg</small></summary>
            <div class="goal-milestones">
              ${milestones.map(item => `
                <div class="goal-milestone-item ${escapeHtml(item.status)}">
                  <span class="goal-milestone-dot"></span>
                  <div>
                    <div class="goal-milestone-title">
                      <strong>${escapeHtml(item.title)}</strong>
                      ${item.tag ? `<small>${escapeHtml(item.tag)}</small>` : ''}
                    </div>
                    <p>${escapeHtml(item.detail)}</p>
                  </div>
                </div>`).join('')}
            </div>
          </details>`
        : '';
      const testRecommendationHtml = testRecommendation
        ? `<div class="race-test-recommendation ${escapeHtml(testRecommendation.status || 'neutral')}">
            <span>${testRecommendation.shouldTest ? 'Neste test' : 'Testvurdering'}</span>
            <strong>${escapeHtml(testRecommendation.label)}</strong>
            <div class="race-test-meta">
              <small>${escapeHtml(testRecommendation.intensity || '')}</small>
              <small>${escapeHtml(testRecommendation.timing || '')}</small>
            </div>
            <p>${escapeHtml(testRecommendation.reason || '')}</p>
          </div>`
        : '';
      container.innerHTML = `
        <div class="goals-overview-head ${escapeHtml(summary.score?.status || 'neutral')}">
          <span>${escapeHtml(summary.score?.label || 'Målstatus')}</span>
          <h3>${escapeHtml(summary.title)}</h3>
          ${summary.subtitle ? `<p>${escapeHtml(summary.subtitle)}</p>` : ''}
        </div>
        ${metrics}
        ${scoreCard}
        <div class="goals-next-action">
          <span>Neste smarte steg</span>
          <strong>${escapeHtml(summary.action)}</strong>
          <p>${escapeHtml(summary.motivation)}</p>
        </div>
        ${milestoneItems}
        ${testRecommendationHtml}`;
    }

    function completedRaceItems() {
      return state.completed.map(item => ({
        ...item,
        name: completedTemplate(item).name
      }));
    }

    function renderRaceGoalInsight(today) {
      const card = document.getElementById('insightRaceGoalCard');
      const container = document.getElementById('insightRaceGoal');
      if (!card || !container) return;
      const countdown = raceGoalCountdown(state.settings.raceGoal, today);
      if (!countdown || (!countdown.name && !countdown.date)) {
        card.style.display = 'none';
        container.innerHTML = '';
        return;
      }
      card.style.display = '';
      const meta = [
        countdown.date ? formatDate(countdown.date) : '',
        raceDistanceLabel(countdown.distanceKm),
        countdown.targetTimeSeconds ? `mål ${formatRaceTime(countdown.targetTimeSeconds)}` : ''
      ].filter(Boolean).join(' · ');
      const readiness = raceReadinessSummary(state.settings.raceGoal, completedRaceItems(), state.raceResults, today);
      const racePlan = raceGoalPlan(
        state.settings.raceGoal,
        readiness,
        injurySignalSummary(injurySignalEntriesUntil(today, 7)),
        today
      );
      const latest = readiness.latestRelevant;
      const targetPace = readiness.targetPaceSeconds ? formatRaceTime(readiness.targetPaceSeconds) + ' /km' : '';
      const projected = readiness.projectedTargetSeconds ? formatRaceTime(readiness.projectedTargetSeconds) : '';
      const latestText = latest
        ? `${raceDistanceLabel(latest.distanceKm)} på ${formatRaceTime(latest.resultSeconds)}${latest.name || latest.workoutName ? ` · ${latest.name || latest.workoutName}` : ''}`
        : 'Ingen relevant test ennå';
      container.innerHTML = `
        <div class="race-goal-main">
          <span class="tag ${countdown.status === 'past' ? 'tag-warning' : 'race-tag'}">${escapeHtml(countdown.label)}</span>
          <strong>${escapeHtml(countdown.name || 'Mål-løp')}</strong>
          ${meta ? `<p>${escapeHtml(meta)}</p>` : ''}
          ${countdown.note ? `<p class="small-note">${escapeHtml(countdown.note)}</p>` : ''}
          <div class="race-readiness ${readiness.status}">
            <div class="race-readiness-grid">
              <span><b>${escapeHtml(targetPace || '-')}</b><small>Målpace</small></span>
              <span><b>${escapeHtml(latest ? formatRaceTime(latest.resultSeconds) : '-')}</b><small>Siste test</small></span>
              <span><b>${escapeHtml(projected || '-')}</b><small>Est. mål</small></span>
            </div>
            <p><strong>Siste relevante test:</strong> ${escapeHtml(latestText)}</p>
            <p>${escapeHtml(readiness.note)}</p>
            <p class="race-next-step">${escapeHtml(readiness.nextStep)}</p>
          </div>
          ${racePlan.hasPlan ? `
            <div class="race-plan ${escapeHtml(racePlan.phase)}">
              <div class="race-plan-head">
                <span>Konkurranseplan</span>
                <strong>${escapeHtml(racePlan.phaseLabel)}</strong>
                ${racePlan.weeksLeft !== null ? `<small>${racePlan.weeksLeft} uke${racePlan.weeksLeft === 1 ? '' : 'r'} igjen</small>` : ''}
              </div>
              <p><strong>Fokus:</strong> ${escapeHtml(racePlan.focus)}</p>
              <p><strong>Test:</strong> ${escapeHtml(racePlan.nextTest)}</p>
              <p><strong>Risiko:</strong> ${escapeHtml(racePlan.risk.replace(/^Risiko: /, ''))}</p>
              <p class="race-next-step">${escapeHtml(racePlan.nextStep)}</p>
            </div>` : ''}
        </div>`;
    }

    function renderPersonalBestInsights() {
      const card = document.getElementById('insightPersonalBestsCard');
      const grid = document.getElementById('insightPersonalBests');
      const latest = document.getElementById('insightRaceLatest');
      const toggle = document.getElementById('personalBestToggle');
      if (!card || !grid || !latest) return;
      const items = completedRaceItems();
      const summary = personalBestSummary(items, state.raceResults);
      if (!summary.raceResults.length) {
        card.style.display = 'none';
        grid.innerHTML = '';
        latest.textContent = '';
        toggle?.classList.add('hidden');
        return;
      }
      card.style.display = '';
      const entriesWithResults = summary.entries.filter(entry => entry.best);
      const hiddenCount = Math.max(0, summary.entries.length - entriesWithResults.length);
      const visibleEntries = showAllPersonalBests ? summary.entries : entriesWithResults;
      grid.innerHTML = visibleEntries.map(entry => {
        const best = entry.best;
        const history = entry.history || {};
        const trend = history.trend || entry.trend || {};
        const latestResult = history.latest || null;
        const cardStatus = best ? (trend.status || 'has-best') : 'empty-best';
        const latestLine = latestResult
          ? `${formatRaceTime(latestResult.resultSeconds)} siste · ${trend.statusLabel || ''}`.trim()
          : 'Ingen registrert';
        const changeLine = trend.count >= 2
          ? `${personalBestTrendLabel(trend.trendSeconds)}${trend.improvementPercent !== null ? ` · ${trend.improvementPercent > 0 ? '+' : ''}${trend.improvementPercent}%` : ''}`
          : 'Legg til flere resultater for trend';
        return `
          <div class="personal-best-item ${best ? 'has-best' : 'empty-best'} ${escapeHtml(cardStatus)}" role="button" tabindex="0" onclick="openPersonalBestHistory('${entry.km}')" onkeydown="if(event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openPersonalBestHistory('${entry.km}'); }">
            <div class="pb-title-row">
              <span>${escapeHtml(entry.label)}</span>
              <button class="btn-soft btn-icon" onclick="event.stopPropagation(); openManualRaceResultForm('${entry.km}')" aria-label="Legg til resultat for ${escapeHtml(entry.label)}">✎</button>
            </div>
            <strong>${best ? escapeHtml(formatRaceTime(best.resultSeconds)) : '-'}</strong>
            <small>${best ? escapeHtml(`${formatDate(best.date)} · ${best.name || best.workoutName || 'Race'}`) : 'Ingen registrert'}</small>
            <div class="pb-card-meta">
              <span>${escapeHtml(latestLine)}</span>
              <span>${escapeHtml(`${trend.count || 0} resultat${trend.count === 1 ? '' : 'er'}`)}</span>
            </div>
            <small class="pb-card-trend ${escapeHtml(trend.status || 'empty')}">${escapeHtml(changeLine)}</small>
          </div>`;
      }).join('');
      latest.textContent = summary.latest
        ? `Siste race/testløp: ${formatDate(summary.latest.date)} · ${summary.latest.name || summary.latest.workoutName || 'Race'} · ${raceDistanceLabel(summary.latest.distanceKm)} · ${formatRaceTime(summary.latest.resultSeconds)}`
        : '';
      if (toggle) {
        toggle.classList.toggle('hidden', hiddenCount === 0);
        toggle.textContent = showAllPersonalBests ? 'Skjul distanser uten resultat' : `Se alle distanser · ${hiddenCount} uten resultat`;
      }
    }

    window.toggleAllPersonalBests = function() {
      showAllPersonalBests = !showAllPersonalBests;
      renderPersonalBestInsights();
    };

    function personalBestHistoryChart(results) {
      if (!results.length) return '';
      const width = 320;
      const height = 150;
      const pad = 28;
      const values = results.map(item => Number(item.resultSeconds) || 0).filter(Boolean);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = Math.max(1, max - min);
      const xFor = index => results.length === 1 ? width / 2 : pad + (index * ((width - pad * 2) / (results.length - 1)));
      const yFor = seconds => pad + ((Number(seconds) - min) / range) * (height - pad * 2);
      const points = results.map((item, index) => `${xFor(index).toFixed(1)},${yFor(item.resultSeconds).toFixed(1)}`).join(' ');
      const dots = results.map((item, index) => {
        const x = xFor(index).toFixed(1);
        const y = yFor(item.resultSeconds).toFixed(1);
        const isLatest = index === results.length - 1;
        return `<circle class="${isLatest ? 'latest' : ''}" cx="${x}" cy="${y}" r="${isLatest ? 5 : 4}"><title>${escapeHtml(formatDate(item.date))}: ${escapeHtml(formatRaceTime(item.resultSeconds))}</title></circle>`;
      }).join('');
      const firstLabel = results[0]?.date ? formatDate(results[0].date).replace('.', '') : '';
      const latestLabel = results[results.length - 1]?.date ? formatDate(results[results.length - 1].date).replace('.', '') : '';
      return `
        <div class="pb-history-chart">
          <div class="pb-history-chart-head">
            <span>Raskest ${escapeHtml(formatRaceTime(min))}</span>
            <span>Tregest ${escapeHtml(formatRaceTime(max))}</span>
          </div>
          <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Utvikling i resultattid">
            <line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}"></line>
            <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${height - pad}"></line>
            <text x="${pad}" y="${pad - 8}">${escapeHtml(formatRaceTime(min))}</text>
            <text x="${pad}" y="${height - pad + 13}">${escapeHtml(formatRaceTime(max))}</text>
            ${firstLabel ? `<text class="x-label" x="${pad}" y="${height - 5}" text-anchor="start">${escapeHtml(firstLabel)}</text>` : ''}
            ${latestLabel ? `<text class="x-label" x="${width - pad}" y="${height - 5}" text-anchor="end">${escapeHtml(latestLabel)}</text>` : ''}
            ${results.length > 1 ? `<polyline points="${points}"></polyline>` : ''}
            ${dots}
          </svg>
        </div>`;
    }

    function trendLabel(history) {
      return personalBestTrendLabel(history.trendSeconds);
    }

    function personalBestHistoryHtml(distanceKm) {
      const history = raceHistoryForDistance(completedRaceItems(), state.raceResults, distanceKm);
      const rows = history.results.slice().reverse();
      const bestId = history.best ? `${history.best.source || ''}-${history.best.id || ''}-${history.best.date || ''}` : '';
      const trend = history.trend || {};
      const gapText = trend.bestGapSeconds === null || trend.bestGapSeconds === undefined
        ? 'Ingen avstand beregnet'
        : trend.bestGapSeconds === 0
        ? 'Siste resultat er PB'
        : `${formatRaceTime(trend.bestGapSeconds)} bak PB${trend.bestGapPercent !== null ? ` · ${trend.bestGapPercent}%` : ''}`;
      const improvementText = trend.improvementPercent === null || trend.improvementPercent === undefined
        ? trend.trendLabel || trendLabel(history)
        : `${trend.trendLabel || trendLabel(history)} · ${trend.improvementPercent > 0 ? '+' : ''}${trend.improvementPercent}%`;
      const rowHtml = rows.length
        ? rows.map(item => {
          const rowId = `${item.source || ''}-${item.id || ''}-${item.date || ''}`;
          const isBest = bestId && rowId === bestId;
          const meta = [formatDate(item.date), item.name || item.workoutName || 'Race', item.course, item.source === 'manual' ? 'Manuell' : 'Logg'].filter(Boolean).join(' · ');
          return `
            <div class="pb-history-row ${isBest ? 'best' : ''}">
              <div>
                <strong>${escapeHtml(formatRaceTime(item.resultSeconds))}</strong>
                <span>${escapeHtml(meta)}</span>
              </div>
              ${isBest ? '<span class="tag race-tag">PB</span>' : ''}
            </div>`;
        }).join('')
        : '<p class="small-note">Ingen resultater på denne distansen ennå.</p>';
      return `
        <div class="section-title-row">
          <h2 class="section-title">${escapeHtml(history.label || raceDistanceLabel(distanceKm))} historikk</h2>
          <button class="btn-soft btn-icon" onclick="closePersonalBestHistory()" aria-label="Lukk">×</button>
        </div>
        <div class="pb-history-summary">
          <div><strong>${history.best ? escapeHtml(formatRaceTime(history.best.resultSeconds)) : '-'}</strong><span>Beste</span></div>
          <div><strong>${history.latest ? escapeHtml(formatRaceTime(history.latest.resultSeconds)) : '-'}</strong><span>Siste</span></div>
          <div><strong>${history.results.length}</strong><span>Resultater</span></div>
          <div><strong>${escapeHtml(trend.statusLabel || 'Ingen trend')}</strong><span>Status</span></div>
        </div>
        <div class="pb-history-trend-card ${escapeHtml(trend.status || 'empty')}">
          <strong>${escapeHtml(improvementText)}</strong>
          <span>${escapeHtml(gapText)}</span>
        </div>
        ${personalBestHistoryChart(history.results)}
        <div class="pb-history-list">${rowHtml}</div>
        <div class="button-row">
          <button class="btn-primary" onclick="closePersonalBestHistory(); openManualRaceResultForm('${Number(distanceKm) || ''}')">Legg til resultat</button>
          <button class="btn-soft" onclick="closePersonalBestHistory()">Lukk</button>
        </div>`;
    }

    window.openPersonalBestHistory = function(distanceKm) {
      const modal = document.getElementById('personalBestHistoryModal');
      const content = document.getElementById('personalBestHistoryContent');
      if (!modal || !content) return;
      content.innerHTML = personalBestHistoryHtml(distanceKm);
      modal.classList.add('active');
    };

    window.closePersonalBestHistory = function() {
      document.getElementById('personalBestHistoryModal')?.classList.remove('active');
    };

    function renderAppVersionInfo() {
      const el = document.getElementById('appVersionInfo');
      if (!el) return;
      el.textContent = `Appversjon: ${APP_VERSION} · Cache: ${APP_CACHE_NAME}`;
    }

    function renderLocalSnapshotStatus() {
      const el = document.getElementById('localSnapshotStatus');
      if (!el) return;
      el.classList.toggle('status-warning', localSnapshotStatus.state === 'error');
      if (localSnapshotStatus.state === 'checking') {
        el.textContent = 'Lokal sikkerhetskopi: kontrollerer ...';
        return;
      }
      if (localSnapshotStatus.state === 'empty') {
        el.textContent = 'Lokal sikkerhetskopi: opprettes etter neste synkronisering.';
        return;
      }
      if (localSnapshotStatus.state === 'error') {
        el.textContent = 'Lokal sikkerhetskopi: ikke oppdatert. Firestore-synkronisering fortsetter.';
        return;
      }
      const backend = localSnapshotStatus.backend === 'indexedDB' ? 'IndexedDB reserve' : 'lokal lagring';
      const size = formatSnapshotSize(localSnapshotStatus.bytes);
      el.textContent = `Lokal sikkerhetskopi: oppdatert · ${backend}${size ? ` · ${size}` : ''}`;
    }

    // ── Render ────────────────────────────────────────────────────────────────
    function render() {
      renderCalendar();
      const today = todayISO();
      renderAppVersionInfo();
      renderLocalSnapshotStatus();
      document.getElementById('todayPill').textContent = formatDate(today);
      document.getElementById('planDate').value ||= today;
      state.settings = normalizeSettings(state.settings);
      state.templates = normalizeTemplates(state.templates);
      state.challenges = Array.isArray(state.challenges) ? state.challenges : [];
      state.blockedDays = Array.isArray(state.blockedDays) ? state.blockedDays : [];
      state.raceResults = normalizeRaceResultEntries(state.raceResults);
      state.continuityFreezes = normalizeContinuityFreezes(state.continuityFreezes);
      state.heartRateZoneSets = normalizeHeartRateZoneSets(state.heartRateZoneSets);

      getWorkoutTemplateUi().refreshFormOptions();
      renderSettingsList('activityTypes', 'activityTypeList');
      renderSettingsList('intensities', 'intensityList');
      renderContinuityFreezeList();
      renderTrainingGoals();
      renderRaceGoalSettings();
      renderManualRaceResultList();
      renderTrainingProfile();
      renderPersonProfile();
      getHeartRateZonesUi().render();
      renderWellnessList();
      renderDashboardWellness();
      renderTrafficLight();
      renderChallengeActivityOptions();
      if (!document.getElementById('challengeStartDate').value || !document.getElementById('challengeEndDate').value) clearChallengeForm();
      renderHistoryFilterOptions();
      renderInsights();
      renderGoals(today);
      renderChallenges();
      workspaceSectionsUi.refresh();

      const plannedActive = state.planned.filter(p => p.status !== 'done');
      // BUGFIX punkt 3: trygg sortering selv om createdAt mangler
      const todayItems = plannedActive.filter(p => p.date === today)
        .sort((a,b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
      const upcomingItems = plannedActive.filter(p => p.date > today)
        .sort((a,b) => a.date.localeCompare(b.date));

      renderDashboardSummary(today, todayItems, upcomingItems, plannedActive);
      document.getElementById('upcomingList').innerHTML = upcomingItems.length
        ? upcomingItems.slice(0, 3).map(p => workoutCard(p)).join('')
        : `<div class="empty">Ingen kommende økter.</div>`;

      document.getElementById('planTemplate').innerHTML = templateSelectOptions();
      document.getElementById('completeTemplate').innerHTML = templateSelectOptions({ includeManual: true });

      renderTemplateLibrary();
      renderExerciseLibrary();

      getWorkoutHistoryUi().renderList();
    }

    window.render = render;
    window.renderCalendar = renderCalendar;

    // ── Backup ────────────────────────────────────────────────────────────────
    window.exportData = function() {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `treningsapp-backup-${todayISO()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    };

    window.restoreRecoverySnapshot = async function() {
      const snapshot = await loadRecoverySnapshot();
      if (!snapshot) return alert('Fant ingen lokal sikkerhetskopi å gjenopprette.');
      const savedAt = snapshot.savedAt ? new Date(snapshot.savedAt).toLocaleString('no-NO') : 'ukjent tidspunkt';
      if (!confirm(`Gjenopprette lokal sikkerhetskopi fra ${savedAt}? Dette erstatter dataene som ligger i appen nå.`)) return;
      const previousState = cloneAppState();
      try {
        const recoverySaved = await saveRecoverySnapshot('before-recovery-restore');
        if (!recoverySaved) return alert('Kunne ikke opprette en sikkerhetskopi av dagens data. Gjenoppretting er avbrutt.');
        const nextState = normalizeAppState(snapshot.state);
        state = nextState;
        await saveLocalStateSnapshot();
        render();
        await replaceFirestoreData(nextState);
        showToast('Sikkerhetskopi gjenopprettet');
      } catch (err) {
        console.error('Recovery restore error:', err);
        restoreAppState(previousState);
        alert('Kunne ikke gjenopprette sikkerhetskopien. Dataene i appen er rullet tilbake lokalt.');
      }
    };

    window.refreshApp = async function() {
      showToast('Oppdaterer app ...', 'info');
      try {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) await registration.update();
        }
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.filter(key => key.startsWith('treningsapp-')).map(key => caches.delete(key)));
        }
        await Promise.all(['./index.html', './styles.css', './app.js', './ai-coach-client.js', './ai-coach-ui.js', './domain-core.js', './domain-coach.js', './domain-goals.js', './domain-coach-rules.js', './domain-fitness.js', './domain-exercises.js', './domain-heart-rate-zones.js', './domain-volume-trends.js', './domain-workout-assessment.js', './domain-insight-confidence.js', './insight-confidence-ui.js', './garmin-csv-import.js', './training-import-controller.js', './training-import-ui.js', './app-state.js', './local-state-store.js', './training-repository.js', './domain-training-plan.js', './calendar-ui.js', './workout-template-ui.js', './workout-completion-ui.js', './workout-history-ui.js', './exercise-library-ui.js', './heart-rate-zones-ui.js', './data/coach-rules.json', './service-worker.js'].map(path =>
          fetch(path, { cache: 'reload' }).catch(() => null)
        ));
      } finally {
        const url = new URL(window.location.href);
        url.searchParams.set('refresh', Date.now());
        window.setTimeout(() => window.location.replace(url.toString()), 500);
      }
    };

    window.importData = async function(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        let previousState = null;
        try {
          const imported = JSON.parse(reader.result);
          if (!imported.templates || !imported.planned || !imported.completed) throw new Error('Invalid format');
          if (!confirm('Import vil overskrive data som ligger i appen nå. Fortsette?')) return;
          previousState = cloneAppState();
          const recoverySaved = await saveRecoverySnapshot('before-import');
          if (!recoverySaved) throw new Error('Recovery snapshot failed; import aborted');
          const nextState = normalizeAppState(imported);
          state = nextState;
          await saveLocalStateSnapshot();
          render();
          await replaceFirestoreData(nextState);
          showToast('Backup importert');
        } catch (err) {
          if (previousState) restoreAppState(previousState);
          console.error('Import error:', err);
          alert('Kunne ikke importere filen. Sjekk at dette er en gyldig backup fra appen.');
          setSyncStatus('error');
        }
      };
      reader.readAsText(file);
      event.target.value = '';
    };

    window.seedDemoData = async function() {
      if (!confirm('Legge inn demo-data?')) return;
      const t1 = normalizeTemplate({ id: uid('template'), name: '6 x 6 min terskel', type: 'Løping', intensity: 'Terskel', structure: '10 min oppvarming\n6 x 6 min terskel\n90 sek pause\n10 min nedjogg', createdAt: todayISO() });
      const t2 = normalizeTemplate({ id: uid('template'), name: 'Basis styrke', type: 'Styrke', intensity: 'Styrke', structure: 'Deadbugs 3 x 10\nTåhev 3 x 15\nUtfall 3 x 10 per bein\nPlanke 3 x 30 sek\nPushups 3 x kontrollert', createdAt: todayISO() });
      const p1 = { id: uid('planned'), templateId: t1.id, templateSnapshot: templateSnapshotFromTemplate(t1), date: todayISO(), status: 'planned', notes: 'Hold kontrollert terskel, ikke makse.', createdAt: todayISO() };
      const p2 = { id: uid('planned'), templateId: t2.id, templateSnapshot: templateSnapshotFromTemplate(t2), date: todayISO(), status: 'planned', notes: '', createdAt: todayISO() };
      state.templates.push(t1, t2);
      state.planned.push(p1, p2);
      render();
      await Promise.all([fsBatchSet('templates', [t1, t2]), fsBatchSet('planned', [p1, p2])]);
    };

    window.confirmResetData = function() {
      const userInput = prompt('Skriv inn "SLETT" for å bekrefte sletting av alle økter, planer, historikk, formmålinger, race-resultater, challenges, fryskort og ikke-treningsdager.');
      if (userInput !== 'SLETT') {
        if (userInput !== null) alert('Feil tekst - sletting avbrutt.');
        return;
      }
      resetData();
    };

    window.resetData = async function() {
      if (!confirm('SISTE ADVARSEL: Dette sletter alle økter, planer, historikk, formmålinger, race-resultater, challenges, fryskort og ikke-treningsdager. Dette kan ikke angres. Fortsette?')) return;
      const recoverySaved = await saveRecoverySnapshot('before-reset');
      if (!recoverySaved) return alert('Kunne ikke opprette lokal sikkerhetskopi. Sletting er avbrutt.');
      setSyncStatus('syncing');
      try {
        await trainingRepository.clearData();
        state = createEmptyAppState(state.settings);
        setSyncStatus('ok');
        render();
      } catch (err) {
        console.error('Reset error:', err);
        setSyncStatus('error');
      }
    };

    getWorkoutCompletionUi().bindPacePreview();
    getTrainingImportUi().bind();

    [
      'templateWarmupMinutes',
      'templateCooldownMinutes',
      'templateIntervalRepetitions',
      'templateWorkMinutes',
      'templateWorkSeconds',
      'templateRestMinutes',
      'templateRestSeconds',
      'templateRestType',
      'templateIntervalIntensity',
      'templateIntervalNote',
      'templateStructuredNote'
    ].forEach(id => {
      document.getElementById(id)?.addEventListener('input', renderStructuredWorkoutPreview);
      document.getElementById(id)?.addEventListener('change', renderStructuredWorkoutPreview);
    });

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register(`./service-worker.js?v=${APP_VERSION}`).catch(() => {});
      });
    };
