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

const APP_VERSION = 'v176f';
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
    let volumeTrendPeriod = 'week';
    let volumeTrendActivity = 'all';
    const volumeTrendOffsets = { week: 0, month: 0, year: 0 };
    let tlSelections = { sleep: null, energy: null, stairsOk: null };
    let injuryCheckinExpanded = false;

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
        if (email) email.textContent = 'Offline-visning med siste lagrede kopi…79980 tokens truncated…= 'Enter' || event.key === ' ') { event.preventDefault(); openPersonalBestHistory('${entry.km}'); }">
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
    }

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
        await Promise.all(['./index.html', './styles.css', './app.js', './ai-coach-client.js', './ai-coach-ui.js', './domain-core.js', './domain-coach.js', './domain-goals.js', './domain-coach-rules.js', './domain-fitness.js', './domain-exercises.js', './domain-heart-rate-zones.js', './domain-volume-trends.js', './domain-workout-assessment.js', './garmin-csv-import.js', './training-import-controller.js', './training-import-ui.js', './app-state.js', './local-state-store.js', './training-repository.js', './domain-training-plan.js', './calendar-ui.js', './workout-template-ui.js', './workout-completion-ui.js', './workout-history-ui.js', './exercise-library-ui.js', './heart-rate-zones-ui.js', './data/coach-rules.json', './service-worker.js'].map(path =>
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
