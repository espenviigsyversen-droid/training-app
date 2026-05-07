import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
    import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut as fbSignOut }
      from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
    import { getFirestore, doc, collection, getDoc, getDocs, setDoc, deleteDoc, writeBatch }
      from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

    const APP_VERSION = 'v37';

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

    let currentUser = null;
    const defaultSettings = {
      activityTypes: ['Løping', 'Styrke', 'Mobilitet', 'Ski', 'Sykling', 'Annet'],
      intensities: ['Rolig', 'Tempo', 'Terskel', 'Intervall', 'Anaerob', 'Styrke', 'Restitusjon'],
      goals: {
        weeklySessionsTarget: 3,
        weeklyStretchSessionsTarget: 4,
        weeklyHoursTarget: '',
        weeklyKmTarget: ''
      },
      trainingProfile: {
        primaryFocus: 'running',
        level: 'building_beginner',
        philosophy: 'bakken_threshold',
        priority: 'injury_free_progression',
        trainingFocus: 'base_threshold'
      },
      personProfile: {
        name: '',
        birthYear: '',
        sex: '',
        heightCm: '',
        weightKg: '',
        maxHeartRate: '',
        thresholdHeartRate: ''
      }
    };
    let state = { templates: [], planned: [], completed: [], wellness: [], settings: JSON.parse(JSON.stringify(defaultSettings)) };

    // ── Utilities ─────────────────────────────────────────────────────────────
    function uid(prefix) {
      return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    }

    function asArray(value) {
      if (Array.isArray(value)) return value.filter(Boolean);
      return value ? [value] : [];
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
      dot.className = 'sync-dot' + (status === 'syncing' ? ' syncing' : status === 'error' ? ' error' : '');
      label.textContent = status === 'syncing' ? 'Synkroniserer...' : status === 'error' ? 'Feil ved synk' : 'Synkronisert';
    }

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

    function addDays(dateIso, days) {
      const d = new Date(`${dateIso}T12:00:00`);
      d.setDate(d.getDate() + days);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }

    function freshDefaultSettings() {
      return JSON.parse(JSON.stringify(defaultSettings));
    }

    function normalizeSettings(settings = {}) {
      return {
        activityTypes: Array.isArray(settings.activityTypes) && settings.activityTypes.length
          ? settings.activityTypes
          : [...defaultSettings.activityTypes],
        intensities: Array.isArray(settings.intensities) && settings.intensities.length
          ? settings.intensities
          : [...defaultSettings.intensities],
        goals: normalizeGoals(settings.goals),
        trainingProfile: normalizeTrainingProfile(settings.trainingProfile),
        personProfile: normalizePersonProfile(settings.personProfile)
      };
    }

    function normalizePersonProfile(profile = {}) {
      const defaults = defaultSettings.personProfile;
      return {
        name: profile.name || defaults.name,
        birthYear: normalizeGoalNumber(profile.birthYear, defaults.birthYear, 1900),
        sex: profile.sex || defaults.sex,
        heightCm: normalizeGoalNumber(profile.heightCm, defaults.heightCm),
        weightKg: normalizeGoalNumber(profile.weightKg, defaults.weightKg),
        maxHeartRate: normalizeGoalNumber(profile.maxHeartRate, defaults.maxHeartRate),
        thresholdHeartRate: normalizeGoalNumber(profile.thresholdHeartRate, defaults.thresholdHeartRate)
      };
    }

    function normalizeTrainingProfile(profile = {}) {
      const defaults = defaultSettings.trainingProfile;
      const legacyFocusMap = {
        base_building: 'base_threshold',
        five_ten_k: 'competition_prep'
      };
      const rawTrainingFocus = profile.trainingFocus || profile.runningPhase || defaults.trainingFocus;
      return {
        primaryFocus: profile.primaryFocus || defaults.primaryFocus,
        level: profile.level || defaults.level,
        philosophy: profile.philosophy || defaults.philosophy,
        priority: profile.priority || defaults.priority,
        trainingFocus: legacyFocusMap[rawTrainingFocus] || rawTrainingFocus
      };
    }

    function normalizeGoals(goals = {}) {
      return {
        weeklySessionsTarget: normalizeGoalNumber(goals.weeklySessionsTarget, defaultSettings.goals.weeklySessionsTarget, 1),
        weeklyStretchSessionsTarget: normalizeGoalNumber(goals.weeklyStretchSessionsTarget, defaultSettings.goals.weeklyStretchSessionsTarget, 1),
        weeklyHoursTarget: normalizeGoalNumber(goals.weeklyHoursTarget, ''),
        weeklyKmTarget: normalizeGoalNumber(goals.weeklyKmTarget, '')
      };
    }

    function normalizeGoalNumber(value, fallback = '', min = 0) {
      if (value === '' || value === null || value === undefined) return fallback;
      const number = Number(value);
      if (!Number.isFinite(number) || number < min) return fallback;
      return number;
    }

    function uniqueValues(values) {
      return [...new Set(values.filter(Boolean))];
    }

    // ── Firestore ─────────────────────────────────────────────────────────────
    function userCol(colName) { return collection(db, 'users', currentUser.uid, colName); }
    function userDoc(colName, id) { return doc(db, 'users', currentUser.uid, colName, id); }

    async function loadFromFirestore() {
      setSyncStatus('syncing');
      try {
        const [tSnap, pSnap, cSnap, wSnap, settingsSnap] = await Promise.all([
          getDocs(userCol('templates')),
          getDocs(userCol('planned')),
          getDocs(userCol('completed')),
          getDocs(userCol('wellness')),
          getDoc(userDoc('settings', 'preferences'))
        ]);
        state.templates = tSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        state.planned   = pSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        state.completed = cSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        state.wellness = wSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        state.settings = settingsSnap.exists() ? normalizeSettings(settingsSnap.data()) : freshDefaultSettings();
        if (!settingsSnap.exists()) await fsSet('settings', 'preferences', state.settings);
        setSyncStatus('ok');
        render();
      } catch (err) {
        console.error('Firestore load error:', err);
        setSyncStatus('error');
      }
    }

    async function fsSet(colName, id, data) {
      setSyncStatus('syncing');
      try {
        const { id: _id, ...rest } = data;
        await setDoc(userDoc(colName, id), rest);
        setSyncStatus('ok');
      } catch (err) {
        console.error('Firestore write error:', err);
        setSyncStatus('error');
        throw err;
      }
    }

    async function fsDelete(colName, id) {
      setSyncStatus('syncing');
      try {
        await deleteDoc(userDoc(colName, id));
        setSyncStatus('ok');
      } catch (err) {
        console.error('Firestore delete error:', err);
        setSyncStatus('error');
        throw err;
      }
    }

    async function fsBatchSet(colName, items) {
      if (!items.length) return;
      setSyncStatus('syncing');
      try {
        const batch = writeBatch(db);
        items.forEach(item => {
          const { id, ...rest } = item;
          batch.set(userDoc(colName, id), rest);
        });
        await batch.commit();
        setSyncStatus('ok');
      } catch (err) {
        console.error('Firestore batch error:', err);
        setSyncStatus('error');
        throw err;
      }
    }

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

    onAuthStateChanged(auth, async (user) => {
      const loading = document.getElementById('loadingOverlay');
      const authScreen = document.getElementById('authScreen');
      const mainApp = document.getElementById('mainApp');

      if (user) {
        currentUser = user;
        loading.classList.add('hidden');
        authScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        renderUserAvatar(user);
        document.getElementById('settingsUserEmail').textContent = `Innlogget som: ${user.email}`;
        await loadFromFirestore();
      } else {
        currentUser = null;
        state = { templates: [], planned: [], completed: [], wellness: [], settings: normalizeSettings(state.settings) };
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
    window.showTab = function(tabId, btn = null) {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.getElementById(tabId).classList.add('active');
      const navBtn = btn || document.querySelector(`nav button[data-tab="${tabId}"]`);
      if (navBtn) {
        document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
        navBtn.classList.add('active');
      }
      document.getElementById('userMenu').classList.add('hidden');
      render();
    };

    window.openPlan = function(dateIso = '') {
      showTab('plan');
      document.getElementById('planDate').value = dateIso || document.getElementById('planDate').value || todayISO();
    };

    window.openLibrary = function() {
      showTab('library');
    };

    // ── Settings ──────────────────────────────────────────────────────────────
    async function saveSettings() {
      state.settings = normalizeSettings(state.settings);
      await fsSet('settings', 'preferences', state.settings);
      render();
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

    window.saveTrainingProfile = async function() {
      state.settings.trainingProfile = normalizeTrainingProfile({
        primaryFocus: document.getElementById('profilePrimaryFocus').value,
        level: document.getElementById('profileLevel').value,
        philosophy: document.getElementById('profilePhilosophy').value,
        priority: document.getElementById('profilePriority').value,
        trainingFocus: document.getElementById('profileRunningPhase').value
      });
      await saveSettings();
      showToast('Treningsprofil lagret');
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

      if (editingId) {
        const index = state.wellness.findIndex(item => item.id === editingId);
        if (index >= 0) state.wellness[index] = measurement;
      } else {
        state.wellness.push(measurement);
      }
      state.wellness.sort((a, b) => b.date.localeCompare(a.date));
      clearWellnessForm();
      render();
      await fsSet('wellness', measurement.id, measurement);
      showToast(editingId ? 'Formmåling oppdatert' : 'Formmåling lagret');
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
      state.wellness = state.wellness.filter(entry => entry.id !== id);
      render();
      await fsDelete('wellness', id);
      showToast('Formmåling slettet');
    };

    // ── Templates ─────────────────────────────────────────────────────────────
    function setSelectOptions(selectId, values, selectedValue = '') {
      const select = document.getElementById(selectId);
      const options = selectedValue && !values.includes(selectedValue) ? [...values, selectedValue] : values;
      select.innerHTML = options.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
      if (selectedValue) select.value = selectedValue;
    }

    window.saveTemplate = async function() {
      const editingId = document.getElementById('editingTemplateId').value;
      const name = document.getElementById('templateName').value.trim();
      if (!name) return alert('Skriv inn navn på økten først.');
      const templateData = {
        name,
        type: document.getElementById('templateType').value,
        intensity: document.getElementById('templateIntensity').value,
        purpose: document.getElementById('templatePurpose').value,
        load: document.getElementById('templateLoad').value,
        recommendedWhen: getCheckedValues('templateRecommendedWhen'),
        avoidWhen: document.getElementById('templateAvoidWhen').value,
        structure: document.getElementById('templateStructure').value.trim()
      };
      if (editingId) {
        const idx = state.templates.findIndex(t => t.id === editingId);
        if (idx === -1) return alert('Fant ikke øktmalen.');
        state.templates[idx] = { ...state.templates[idx], ...templateData, updatedAt: new Date().toISOString() };
        await fsSet('templates', editingId, state.templates[idx]);
      } else {
        const newT = { id: uid('template'), ...templateData, createdAt: todayISO() };
        state.templates.push(newT);
        await fsSet('templates', newT.id, newT);
      }
      clearTemplateForm();
      render();
      showToast(editingId ? 'Øktmal oppdatert' : 'Øktmal lagret');
    };

    window.editTemplate = function(id) {
      const t = state.templates.find(t => t.id === id);
      if (!t) return;
      document.getElementById('editingTemplateId').value = t.id;
      document.getElementById('templateName').value = t.name;
      setSelectOptions('templateType', state.settings.activityTypes, t.type);
      setSelectOptions('templateIntensity', state.settings.intensities, t.intensity);
      document.getElementById('templateType').value = t.type;
      document.getElementById('templateIntensity').value = t.intensity;
      document.getElementById('templatePurpose').value = t.purpose || '';
      document.getElementById('templateLoad').value = t.load || '';
      setCheckedValues('templateRecommendedWhen', t.recommendedWhen);
      document.getElementById('templateAvoidWhen').value = t.avoidWhen || '';
      document.getElementById('templateStructure').value = t.structure || '';
      document.getElementById('templateSubmitBtn').textContent = 'Lagre endringer';
      document.getElementById('cancelEditTemplateBtn').classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.cancelEditTemplate = function() { clearTemplateForm(); };

    function clearTemplateForm() {
      document.getElementById('editingTemplateId').value = '';
      document.getElementById('templateName').value = '';
      document.getElementById('templatePurpose').value = '';
      document.getElementById('templateLoad').value = '';
      setCheckedValues('templateRecommendedWhen', []);
      document.getElementById('templateAvoidWhen').value = '';
      document.getElementById('templateStructure').value = '';
      document.getElementById('templateSubmitBtn').textContent = 'Lagre øktmal';
      document.getElementById('cancelEditTemplateBtn').classList.add('hidden');
    }

    window.deleteTemplate = async function(id) {
      if (!confirm('Slette denne øktmalen? Planlagte økter blir ikke slettet.')) return;
      state.templates = state.templates.filter(t => t.id !== id);
      await fsDelete('templates', id);
      render();
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

      let intervalWeeks = 0;
      if (repeat === 'weekly') intervalWeeks = 1;
      if (repeat === 'biweekly') intervalWeeks = 2;
      if (repeat === 'custom') intervalWeeks = Math.max(1, customInterval);

      const plannedGroupId = uid('group');
      const workoutsToAdd = [];

      if (repeat === 'none') {
        workoutsToAdd.push({ id: uid('planned'), templateId, date, status: 'planned', notes, repeatGroupId: null, createdAt: todayISO() });
      } else {
        if (!repeatWeeks || repeatWeeks < 1) return alert('Velg antall uker frem i tid.');
        for (let weekOffset = 0; weekOffset <= repeatWeeks; weekOffset += intervalWeeks) {
          workoutsToAdd.push({
            id: uid('planned'), templateId, date: addDays(date, weekOffset * 7),
            status: 'planned', notes, repeatGroupId: plannedGroupId,
            repeatRule: { type: repeat, intervalWeeks, totalWeeks: repeatWeeks },
            createdAt: todayISO()
          });
        }
      }

      state.planned.push(...workoutsToAdd);
      document.getElementById('planNotes').value = '';
      document.getElementById('planRepeat').value = 'none';
      document.getElementById('planRepeatWeeks').value = 8;
      document.getElementById('planRepeatInterval').value = 1;
      toggleRepeatOptions();
      render();
      await fsBatchSet('planned', workoutsToAdd);
      showToast(workoutsToAdd.length > 1 ? `${workoutsToAdd.length} økter planlagt` : 'Økt planlagt');
    };

    window.deletePlanned = async function(id) {
      if (!confirm('Slette planlagt økt?')) return;
      state.planned = state.planned.filter(p => p.id !== id);
      await fsDelete('planned', id);
      render();
      if (document.getElementById('calendarDayModal')?.classList.contains('active') && selectedCalendarDate) {
        openCalendarDayModal(selectedCalendarDate);
      }
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

      const diffDays = daysBetween(oldDate, newDate);
      if (diffDays === 0) { closeRescheduleModal(); return; }

      const toUpdate = [];
      if (shiftFollowing) {
        state.planned.forEach(p => {
          if (p.status !== 'done' && p.date >= oldDate) {
            p.date = addDays(p.date, diffDays);
            p.updatedAt = new Date().toISOString();
            toUpdate.push(p);
          }
        });
      } else {
        planned.date = newDate;
        planned.updatedAt = new Date().toISOString();
        toUpdate.push(planned);
      }

      closeRescheduleModal();
      render();
      await fsBatchSet('planned', toUpdate);
    };

    // ── Complete ──────────────────────────────────────────────────────────────
    function clearCompleteForm() {
      document.getElementById('completePlannedId').value = '';
      document.getElementById('editingCompletedId').value = '';
      [
        'completeDate',
        'completeTemplate',
        'completeManualName',
        'completeDurationHours',
        'completeDurationMinutes',
        'completeDurationSeconds',
        'completeDistance',
        'completeAvgHr',
        'completeMaxHr',
        'completeElevationGain',
        'completeTreadmillIncline',
        'completeTrainingEffect',
        'completeExecution',
        'completeFeeling',
        'completeRpe',
        'completeEnergy',
        'completeLegs',
        'completeSleep',
        'completeStress',
        'completePainBefore',
        'completePainAfter',
        'completePainArea',
        'completeAdaptation',
        'completeBodyNotes',
        'completeNotes'
      ]
        .forEach(id => document.getElementById(id).value = '');
      document.getElementById('completeAdaptation').value = 'none';
      updatePacePreview();
    }

    function setCompleteModalMode(mode) {
      const isEditing = mode === 'edit';
      const isHistorical = mode === 'historical';
      document.getElementById('completeModalTitle').textContent = isEditing ? 'Rediger økt' : isHistorical ? 'Legg inn historisk økt' : 'Loggfør økt';
      document.getElementById('completeSubmitBtn').textContent = isEditing ? 'Lagre endringer' : isHistorical ? 'Lagre historisk økt' : 'Marker utført';
      document.getElementById('completeManualFields').classList.toggle('hidden', !(isEditing || isHistorical));
    }

    function completedFormData() {
      const durationSeconds = getDurationSecondsFromForm();
      const distanceKm = document.getElementById('completeDistance').value || '';
      const pace = calculatePaceMetrics(durationSeconds, distanceKm);
      return {
        durationSeconds: durationSeconds || '',
        durationDisplay: durationSeconds ? formatDuration(durationSeconds) : '',
        durationMinutes: durationSeconds ? Math.round(durationSeconds / 60) : '',
        distanceKm,
        averageSpeedKmh: pace.averageSpeedKmh || '',
        paceSecondsPerKm: pace.paceSecondsPerKm || '',
        paceDisplay: pace.paceDisplay || '',
        avgHeartRate: document.getElementById('completeAvgHr').value || '',
        maxHeartRate: document.getElementById('completeMaxHr').value || '',
        elevationGainM: document.getElementById('completeElevationGain').value || '',
        treadmillInclinePercent: document.getElementById('completeTreadmillIncline').value || '',
        trainingEffectType: document.getElementById('completeTrainingEffect').value || '',
        trainingEffectCategory: trainingEffectCategory(document.getElementById('completeTrainingEffect').value),
        execution: document.getElementById('completeExecution').value || '',
        feelingScore: document.getElementById('completeFeeling').value || '',
        rpe: document.getElementById('completeRpe').value || '',
        readiness: {
          energy: document.getElementById('completeEnergy').value || '',
          legs: document.getElementById('completeLegs').value || '',
          sleep: document.getElementById('completeSleep').value || '',
          stress: document.getElementById('completeStress').value || ''
        },
        bodyStatus: {
          painBefore: document.getElementById('completePainBefore').value || '',
          painAfter: document.getElementById('completePainAfter').value || '',
          area: document.getElementById('completePainArea').value.trim(),
          adaptation: document.getElementById('completeAdaptation').value || 'none',
          notes: document.getElementById('completeBodyNotes').value.trim()
        },
        notes: document.getElementById('completeNotes').value.trim()
      };
    }

    function getDurationSecondsFromForm() {
      const hours = parseNonNegativeInteger(document.getElementById('completeDurationHours').value);
      const minutes = parseNonNegativeInteger(document.getElementById('completeDurationMinutes').value);
      const seconds = parseNonNegativeInteger(document.getElementById('completeDurationSeconds').value);
      return (hours * 3600) + (Math.min(minutes, 59) * 60) + Math.min(seconds, 59);
    }

    function parseNonNegativeInteger(value) {
      const parsed = Number.parseInt(value, 10);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    }

    function setDurationFormFromSeconds(totalSeconds) {
      const secondsTotal = parseNonNegativeInteger(totalSeconds);
      const hours = Math.floor(secondsTotal / 3600);
      const minutes = Math.floor((secondsTotal % 3600) / 60);
      const seconds = secondsTotal % 60;
      document.getElementById('completeDurationHours').value = hours || '';
      document.getElementById('completeDurationMinutes').value = minutes || '';
      document.getElementById('completeDurationSeconds').value = seconds || '';
    }

    function formatDuration(totalSeconds) {
      const secondsTotal = parseNonNegativeInteger(totalSeconds);
      if (!secondsTotal) return '';
      const hours = Math.floor(secondsTotal / 3600);
      const minutes = Math.floor((secondsTotal % 3600) / 60);
      const seconds = secondsTotal % 60;
      if (hours) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      return `${minutes}:${String(seconds).padStart(2, '0')}`;
    }

    function calculatePaceMetrics(durationSeconds, distanceKm) {
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

    function formatPace(secondsPerKm) {
      const secondsTotal = parseNonNegativeInteger(secondsPerKm);
      if (!secondsTotal) return '';
      const minutes = Math.floor(secondsTotal / 60);
      const seconds = secondsTotal % 60;
      return `${minutes}:${String(seconds).padStart(2, '0')}`;
    }

    function updatePacePreview() {
      const preview = document.getElementById('completePacePreview');
      if (!preview) return;
      const pace = calculatePaceMetrics(getDurationSecondsFromForm(), document.getElementById('completeDistance').value);
      document.getElementById('completeSpeedPreview').textContent = pace.averageSpeedKmh || '-';
      document.getElementById('completePaceTextPreview').textContent = pace.paceDisplay || '-';
      preview.classList.toggle('hidden', !pace.averageSpeedKmh);
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

    function heartRateContextLabel(value, profile = normalizePersonProfile(state.settings.personProfile)) {
      const hr = Number(value);
      if (!Number.isFinite(hr) || hr <= 0) return '';
      const parts = [];
      const maxHeartRate = Number(profile.maxHeartRate);
      const thresholdHeartRate = Number(profile.thresholdHeartRate);
      if (Number.isFinite(maxHeartRate) && maxHeartRate > 0) {
        parts.push(`${Math.round((hr / maxHeartRate) * 100)}% maks`);
      }
      if (Number.isFinite(thresholdHeartRate) && thresholdHeartRate > 0) {
        parts.push(`${Math.round((hr / thresholdHeartRate) * 100)}% terskel`);
      }
      return parts.length ? ` (${parts.join(' · ')})` : '';
    }

    function executionLabel(value) {
      const labels = {
        as_planned: 'Som planlagt',
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

    function completedLoadAssessment(completed) {
      const effectCategory = completed.trainingEffectCategory || trainingEffectCategory(completed.trainingEffectType);
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

      const reason = reasons.length
        ? reasons.slice(0, 3).join(' · ')
        : 'Mangler nok intensitetsdata for tydelig vurdering.';
      return { level, label, reason };
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
      const template = getTemplate(completed.templateId);
      const assessment = completedLoadAssessment(completed);
      const painBefore = numberOrZero(completed.bodyStatus?.painBefore);
      const painAfter = numberOrZero(completed.bodyStatus?.painAfter);
      const adaptation = completed.bodyStatus?.adaptation || '';
      const incline = numberOrZero(completed.treadmillInclinePercent);
      const elevationGain = numberOrZero(completed.elevationGainM);
      const distance = numberOrZero(completed.distanceKm);
      const elevationPerKm = distance ? elevationGain / distance : 0;
      const hillContext = incline >= 4 || elevationPerKm >= 20 || elevationGain >= 150;
      const runningBakkenFocus = profile.primaryFocus === 'running' && profile.philosophy === 'bakken_threshold';
      const intro = `Siste økt (${template.name}) vurderes som ${assessment.label.toLowerCase()}.`;

      if (painAfter >= 4 || painAfter > painBefore + 1) {
        return `${intro} Siden smerte ble registrert eller økte, bør neste økt være rolig, alternativ eller hvile hvis samme område fortsatt kjennes.`;
      }
      if (assessment.level === 'high') {
        return runningBakkenFocus
          ? `${intro} Med Bakken-inspirert løpsfokus bør neste økt gi overskudd tilbake: rolig volum, mobilitet eller hvile før mer kvalitet.`
          : `${intro} Neste økt bør trolig være rolig eller kontrollert, spesielt hvis beina kjennes tunge.`;
      }
      if (adaptation && adaptation !== 'none') {
        return `${intro} Økten ble tilpasset (${adaptationLabel(adaptation).toLowerCase()}). Bruk neste økt til å bekrefte at kroppen responderer fint før du øker belastningen.`;
      }
      if (hillContext && assessment.level === 'moderate') {
        return `${intro} Bakke eller møllestigning forklarer noe av innsatsen, så vurder neste økt etter bein og pulsrespons, ikke bare tempo.`;
      }
      if (assessment.level === 'moderate') {
        return `${intro} Dette er en fin treningsbelastning, men neste kvalitetsøkt bør helst komme med friske bein.`;
      }
      return `${intro} Kroppen ser ut til å tåle normal plan videre, så lenge dagsformen fortsatt er grei.`;
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

      return { label, level, note, loadCounts, painCount, adaptationCount };
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
            <div><strong>${status.loadCounts.low}</strong><span>Lav</span></div>
            <div><strong>${status.loadCounts.moderate}</strong><span>Moderat</span></div>
            <div><strong>${status.loadCounts.high}</strong><span>Høy</span></div>
            <div><strong>${status.painCount}/${status.adaptationCount}</strong><span>Smerte/tilpasning</span></div>
          </div>
          <p>${escapeHtml(status.note)}</p>
        </div>`;
    }

    window.openCompleteModal = function(plannedId) {
      clearCompleteForm();
      setCompleteModalMode('create');
      document.getElementById('completePlannedId').value = plannedId;
      document.getElementById('completeModal').classList.add('active');
    };

    window.openHistoricalCompleteModal = function() {
      clearCompleteForm();
      setCompleteModalMode('historical');
      document.getElementById('completeDate').value = todayISO();
      document.getElementById('completeTemplate').value = state.templates[0]?.id || '';
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
      document.getElementById('editingCompletedId').value = completed.id;
      document.getElementById('completePlannedId').value = completed.plannedWorkoutId || '';
      document.getElementById('completeDate').value = completed.date || todayISO();
      document.getElementById('completeTemplate').value = completed.templateId || '';
      document.getElementById('completeManualName').value = completed.manualName || '';
      setDurationFormFromSeconds(completed.durationSeconds || (completed.durationMinutes ? Number(completed.durationMinutes) * 60 : 0));
      document.getElementById('completeDistance').value = completed.distanceKm || '';
      document.getElementById('completeAvgHr').value = completed.avgHeartRate || '';
      document.getElementById('completeMaxHr').value = completed.maxHeartRate || '';
      document.getElementById('completeElevationGain').value = completed.elevationGainM || '';
      document.getElementById('completeTreadmillIncline').value = completed.treadmillInclinePercent || '';
      document.getElementById('completeTrainingEffect').value = completed.trainingEffectType || '';
      document.getElementById('completeExecution').value = completed.execution || '';
      document.getElementById('completeFeeling').value = completed.feelingScore || '';
      document.getElementById('completeRpe').value = completed.rpe || '';
      document.getElementById('completeEnergy').value = completed.readiness?.energy || '';
      document.getElementById('completeLegs').value = completed.readiness?.legs || '';
      document.getElementById('completeSleep').value = completed.readiness?.sleep || '';
      document.getElementById('completeStress').value = completed.readiness?.stress || '';
      document.getElementById('completePainBefore').value = completed.bodyStatus?.painBefore || '';
      document.getElementById('completePainAfter').value = completed.bodyStatus?.painAfter || '';
      document.getElementById('completePainArea').value = completed.bodyStatus?.area || '';
      document.getElementById('completeAdaptation').value = completed.bodyStatus?.adaptation || 'none';
      document.getElementById('completeBodyNotes').value = completed.bodyStatus?.notes || '';
      document.getElementById('completeNotes').value = completed.notes || '';
      document.getElementById('completeModal').classList.add('active');
    };

    window.completeWorkout = async function() {
      const editingId = document.getElementById('editingCompletedId').value;
      if (editingId) {
        const completedIndex = state.completed.findIndex(c => c.id === editingId);
        if (completedIndex === -1) return;
        const date = document.getElementById('completeDate').value || state.completed[completedIndex].date;
        const templateId = document.getElementById('completeTemplate').value || state.completed[completedIndex].templateId;
        const manualName = document.getElementById('completeManualName').value.trim();

        state.completed[completedIndex] = {
          ...state.completed[completedIndex],
          date,
          templateId,
          manualName,
          templateSnapshot: completedTemplateSnapshot(templateId, manualName),
          ...completedFormData(),
          updatedAt: new Date().toISOString()
        };

        const updatedCompleted = state.completed[completedIndex];
        closeCompleteModal();
        render();
        if (selectedCalendarDate && document.getElementById('calendarDayModal').classList.contains('active')) {
          openCalendarDayModal(selectedCalendarDate);
        }
        await fsSet('completed', editingId, updatedCompleted);
        showToast('Økt oppdatert');
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
          ...completedFormData(),
          completedAt: new Date().toISOString(),
          source: 'manual'
        };
        state.completed.push(completed);
        closeCompleteModal();
        render();
        await fsSet('completed', completed.id, completed);
        showToast('Historisk økt lagret');
        return;
      }
      planned.status = 'done';
      const completed = {
        id: uid('completed'),
        plannedWorkoutId: plannedId,
        templateId: planned.templateId,
        manualName: '',
        templateSnapshot: completedTemplateSnapshot(planned.templateId, ''),
        date: planned.date,
        ...completedFormData(),
        completedAt: new Date().toISOString()
      };
      state.completed.push(completed);
      closeCompleteModal();
      render();
      await Promise.all([fsSet('planned', plannedId, planned), fsSet('completed', completed.id, completed)]);
      showToast('Økt logget - bra jobba!');
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
      if (planned) planned.status = 'planned';
      state.completed = state.completed.filter(c => c.id !== completedId);
      render();
      if (document.getElementById('calendarDayModal')?.classList.contains('active') && selectedCalendarDate) {
        openCalendarDayModal(selectedCalendarDate);
      }
      const ops = [fsDelete('completed', completedId)];
      if (planned) ops.push(fsSet('planned', planned.id, planned));
      await Promise.all(ops);
      showToast(planned ? 'Økt flyttet tilbake til planlagt' : 'Historisk økt slettet');
    };

    window.closeWorkoutDetailModal = function() {
      document.getElementById('workoutDetailModal').classList.remove('active');
    };

    // ── Render helpers ────────────────────────────────────────────────────────
    function getTemplate(id) {
      return state.templates.find(t => t.id === id) || { name: 'Slettet øktmal', type: 'Annet', intensity: '', purpose: '', load: '', recommendedWhen: '', avoidWhen: '', structure: '' };
    }

    function completedTemplateSnapshot(templateId, manualName) {
      const template = state.templates.find(t => t.id === templateId);
      return {
        name: manualName || template?.name || 'Historisk økt',
        type: template?.type || 'Annet',
        intensity: template?.intensity || '',
        structure: template?.structure || ''
      };
    }

    function completedTemplate(completed) {
      const template = state.templates.find(t => t.id === completed.templateId);
      if (template) return { ...template, name: completed.manualName || template.name };
      return {
        name: completed.manualName || completed.templateSnapshot?.name || 'Historisk økt',
        type: completed.templateSnapshot?.type || 'Annet',
        intensity: completed.templateSnapshot?.intensity || '',
        structure: completed.templateSnapshot?.structure || ''
      };
    }

    function detailMetric(label, value) {
      return value
        ? `<div class="detail-metric"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`
        : '';
    }

    function detailSection(title, html) {
      return html
        ? `<section class="detail-section"><h3>${escapeHtml(title)}</h3>${html}</section>`
        : '';
    }

    function detailLine(label, value) {
      return value
        ? `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`
        : '';
    }

    function completedDetailHtml(c) {
      const t = completedTemplate(c);
      const personProfile = normalizePersonProfile(state.settings.personProfile);
      const profile = normalizeTrainingProfile(state.settings.trainingProfile);
      const durationLabel = completedDurationLabel(c);
      const pace = completedPaceMetrics(c);
      const execution = executionLabel(c.execution);
      const feeling = feelingLabel(c.feelingScore);
      const readiness = readinessLabel(c.readiness);
      const bodyStatus = bodyStatusLabel(c.bodyStatus);
      const trainingEffect = trainingEffectInfo(c.trainingEffectType);
      const assessment = completedLoadAssessment(c);
      const coachNote = lastWorkoutCoachNote(c, profile).replace(/^Siste økt/, 'Denne økten');
      const heartRateLines = [
        detailLine('Snittpuls', c.avgHeartRate ? `${c.avgHeartRate} bpm${heartRateContextLabel(c.avgHeartRate, personProfile)}` : ''),
        detailLine('Makspuls økt', c.maxHeartRate ? `${c.maxHeartRate} bpm${heartRateContextLabel(c.maxHeartRate, personProfile)}` : ''),
        detailLine('Din maks/terskel', personProfile.maxHeartRate || personProfile.thresholdHeartRate
          ? `${personProfile.maxHeartRate || '-'} / ${personProfile.thresholdHeartRate || '-'} bpm`
          : '')
      ].join('');
      const terrainLines = [
        detailLine('Høydemeter', c.elevationGainM ? `${c.elevationGainM} hm` : ''),
        detailLine('Møllestigning', c.treadmillInclinePercent ? `${c.treadmillInclinePercent}%` : '')
      ].join('');
      const bodyLines = [
        detailLine('Status', bodyStatus),
        detailLine('Kroppsnotat', c.bodyStatus?.notes || '')
      ].join('');
      return `
        <div class="detail-hero">
          <span class="tag done">Utført</span>
          <h2>${escapeHtml(t.name)}</h2>
          <p>${formatDate(c.date)} · ${escapeHtml(t.type)}${t.intensity ? ` · ${escapeHtml(t.intensity)}` : ''}</p>
        </div>
        <div class="detail-metrics-grid">
          ${detailMetric('Varighet', durationLabel)}
          ${detailMetric('Distanse', c.distanceKm ? `${c.distanceKm} km` : '')}
          ${detailMetric('Pace', pace.paceDisplay ? `${pace.paceDisplay} min/km` : '')}
          ${detailMetric('Fart', pace.averageSpeedKmh ? `${pace.averageSpeedKmh} km/t` : '')}
        </div>
        ${detailSection('Belastning', `
          <div class="load-assessment ${assessment.level}">
            <span class="tag load-${assessment.level}">${escapeHtml(assessment.label)}</span>
            <p>${escapeHtml(assessment.reason)}</p>
          </div>
          ${trainingEffect ? `<p class="detail-text"><strong>Garmin:</strong> ${escapeHtml(trainingEffect.label)} · ${escapeHtml(trainingEffect.categoryLabel)}</p>` : ''}
          ${c.rpe ? `<p class="detail-text"><strong>Opplevd intensitet:</strong> ${escapeHtml(c.rpe)}/10</p>` : ''}
        `)}
        ${detailSection('Puls', heartRateLines)}
        ${detailSection('Terreng og stigning', terrainLines)}
        ${detailSection('Gjennomføring', [
          detailLine('Gjennomføring', execution),
          detailLine('Følelse etter økt', feeling),
          detailLine('Dagsform før økt', readiness)
        ].join(''))}
        ${detailSection('Kropp og tilpasning', bodyLines)}
        ${detailSection('Coach-notat', `<p>${escapeHtml(coachNote)}</p>`)}
        ${detailSection('Egne notater', c.notes ? `<p>${escapeHtml(c.notes)}</p>` : '')}
        <div class="button-row">
          <button class="btn-primary" onclick="editCompleted('${c.id}'); closeWorkoutDetailModal();">Rediger</button>
          <button class="btn-soft" onclick="closeWorkoutDetailModal()">Lukk</button>
        </div>`;
    }

    window.openWorkoutDetail = function(completedId) {
      const completed = state.completed.find(c => c.id === completedId);
      if (!completed) return;
      document.getElementById('workoutDetailContent').innerHTML = completedDetailHtml(completed);
      document.getElementById('workoutDetailModal').classList.add('active');
    };

    function workoutCard(planned, options = {}) {
      const t = getTemplate(planned.templateId);
      return `
        <div class="workout-card">
          <div class="workout-top">
            <div>
              <h3 class="workout-title">${escapeHtml(t.name)}</h3>
              <div class="meta">${formatDate(planned.date)} · ${escapeHtml(t.type)} · ${escapeHtml(t.intensity || '')}</div>
            </div>
            <span class="tag ${planned.status === 'done' ? 'done' : 'planned'}">${planned.status === 'done' ? 'Utført' : 'Planlagt'}</span>
          </div>
          ${t.structure ? `<p class="meta" style="white-space:pre-line;">${escapeHtml(t.structure)}</p>` : ''}
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
        other: 'Annet formål'
      });
    }

    function templateLoadLabel(value) {
      return labelFromMap(value, {
        low: 'Lav belastning',
        moderate: 'Moderat belastning',
        high: 'Høy belastning'
      });
    }

    function templateRecommendedWhenLabel(value) {
      const map = {
        normal: 'Passer normal dag',
        fresh_legs: 'Passer med friske bein',
        tired: 'Passer når litt sliten',
        after_hard: 'Passer etter hard økt',
        pain_adaptation: 'Passer ved småvondt/tilpasning',
        bonus: 'Passer som bonusøkt'
      };
      return asArray(value).map(item => labelFromMap(item, map)).filter(Boolean).join(' · ');
    }

    function templateAvoidWhenLabel(value) {
      return labelFromMap(value, {
        pain: 'Unngå ved smerte',
        heavy_legs: 'Unngå ved tunge bein',
        many_hard: 'Unngå ved mye hardt',
        low_hrv: 'Unngå ved lav HRV'
      });
    }

    function templateCard(t) {
      const coachTags = [
        templatePurposeLabel(t.purpose),
        templateLoadLabel(t.load),
        templateRecommendedWhenLabel(t.recommendedWhen),
        templateAvoidWhenLabel(t.avoidWhen)
      ].filter(Boolean);
      return `
        <div class="workout-card">
          <div class="workout-top">
            <div>
              <h3 class="workout-title">${escapeHtml(t.name)}</h3>
              <div class="meta">${escapeHtml(t.type)} · ${escapeHtml(t.intensity)}</div>
            </div>
            <span class="tag">Mal</span>
          </div>
          ${coachTags.length ? `<p class="meta"><strong>Coach:</strong> ${escapeHtml(coachTags.join(' · '))}</p>` : ''}
          ${t.structure ? `<p class="meta" style="white-space:pre-line;">${escapeHtml(t.structure)}</p>` : ''}
          <div class="button-row">
            <button class="btn-primary" onclick="editTemplate('${t.id}')">Rediger</button>
            <button class="btn-soft" onclick="deleteTemplate('${t.id}')">Slett</button>
          </div>
        </div>`;
    }

    function completedCard(c) {
      const t = completedTemplate(c);
      const personProfile = normalizePersonProfile(state.settings.personProfile);
      const durationLabel = completedDurationLabel(c);
      const execution = executionLabel(c.execution);
      const feeling = feelingLabel(c.feelingScore);
      const readiness = readinessLabel(c.readiness);
      const bodyStatus = bodyStatusLabel(c.bodyStatus);
      const trainingEffect = trainingEffectTag(c.trainingEffectType);
      const pace = completedPaceMetrics(c);
      const metrics = [
        durationLabel || null,
        c.distanceKm ? `${c.distanceKm} km` : null,
        pace.averageSpeedKmh ? `${pace.averageSpeedKmh} km/t` : null,
        pace.paceDisplay ? `${pace.paceDisplay} min/km` : null,
        c.elevationGainM ? `${c.elevationGainM} hm` : null,
        c.treadmillInclinePercent ? `${c.treadmillInclinePercent}% mølle` : null,
        c.avgHeartRate ? `Snitt ${c.avgHeartRate} bpm${heartRateContextLabel(c.avgHeartRate, personProfile)}` : null,
        c.maxHeartRate ? `Maks ${c.maxHeartRate} bpm${heartRateContextLabel(c.maxHeartRate, personProfile)}` : null,
        c.rpe ? `RPE ${c.rpe}/10` : null
      ].filter(Boolean).join(' · ');
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
          ${trainingEffect ? `<div class="meta">${trainingEffect}</div>` : ''}
          ${loadAssessmentHtml(c)}
          ${execution ? `<p class="meta"><strong>Gjennomføring:</strong> ${escapeHtml(execution)}</p>` : ''}
          ${feeling ? `<p class="meta"><strong>Følelse:</strong> ${escapeHtml(feeling)}</p>` : ''}
          ${readiness ? `<p class="meta"><strong>Dagsform:</strong> ${escapeHtml(readiness)}</p>` : ''}
          ${bodyStatus ? `<p class="meta"><strong>Kropp:</strong> ${escapeHtml(bodyStatus)}</p>` : ''}
          ${c.bodyStatus?.notes ? `<p class="meta"><strong>Kroppsnotat:</strong> ${escapeHtml(c.bodyStatus.notes)}</p>` : ''}
          ${c.notes ? `<p class="meta"><strong>Notat:</strong> ${escapeHtml(c.notes)}</p>` : ''}
          <div class="button-row">
            <button class="btn-primary" onclick="openWorkoutDetail('${c.id}')">Detaljer</button>
            <button class="btn-primary" onclick="editCompleted('${c.id}')">Rediger</button>
            <button class="btn-soft" onclick="undoComplete('${c.id}')">${c.plannedWorkoutId ? 'Angre utført' : 'Slett'}</button>
          </div>
        </div>`;
    }

    function shortCalendarLabel(template) {
      const typeMap = {
        'Løping': 'Løp',
        'Styrke': 'Styrke',
        'Mobilitet': 'Mob',
        'Ski': 'Ski',
        'Sykling': 'Sykkel',
        'Annet': 'Annet'
      };
      const intensityMap = {
        'Rolig': 'Rolig',
        'Tempo': 'Tempo',
        'Terskel': 'Terskel',
        'Intervall': 'Interv',
        'Anaerob': 'Ana',
        'Styrke': 'Styrke',
        'Restitusjon': 'Rest'
      };
      const type = typeMap[template.type] || template.type || template.name;
      const intensity = intensityMap[template.intensity] || template.intensity || '';
      return intensity && intensity !== type ? `${type} ${intensity}` : type;
    }

    // ── Calendar ──────────────────────────────────────────────────────────────
    window.changeCalendarMonth = function(direction) {
      const input = document.getElementById('calendarMonth');
      if (!input.value) input.value = todayISO().slice(0, 7);
      const parts = input.value.split('-');
      let year = Number(parts[0]);
      let month = Number(parts[1]) + direction;
      if (month < 1) { month = 12; year -= 1; }
      if (month > 12) { month = 1; year += 1; }
      input.value = `${year}-${String(month).padStart(2,'0')}`;
      renderCalendar();
    };

    function renderCalendar() {
      const input = document.getElementById('calendarMonth');
      if (!input) return;
      if (!input.value) input.value = todayISO().slice(0, 7);
      const [year, month] = input.value.split('-').map(Number);
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);

      let html = '<div class="calendar-grid">';
      ['Man','Tir','Ons','Tor','Fre','Lør','Søn'].forEach(d => {
        html += `<div class="calendar-weekday">${d}</div>`;
      });

      const startOffset = (firstDay.getDay() + 6) % 7;
      for (let i = 0; i < startOffset; i++) html += '<div></div>';

      for (let day = 1; day <= lastDay.getDate(); day++) {
        // BUGFIX punkt 2: tid satt til 12:00 for å unngå tidssone-feil i Norge
        const dateIso = new Date(year, month - 1, day, 12).toISOString().slice(0, 10);
        const plannedItems = state.planned.filter(p => p.date === dateIso && p.status !== 'done');
        const doneItems = state.completed.filter(c => c.date === dateIso);
        const dayItems = [
          ...plannedItems.map(p => {
            const template = getTemplate(p.templateId);
            return { status: 'planned', name: template.name, shortLabel: shortCalendarLabel(template) };
          }),
          ...doneItems.map(c => {
            const template = completedTemplate(c);
            return { status: 'done', name: template.name, shortLabel: shortCalendarLabel(template) };
          })
        ];
        const visibleItems = dayItems.slice(0, 2);
        const hiddenCount = dayItems.length - visibleItems.length;
        html += `
          <div class="calendar-day ${dateIso === todayISO() ? 'today' : ''}" onclick="openCalendarDayModal('${dateIso}')">
            <div class="calendar-date">${day}</div>
            ${visibleItems.map(item => `
              <div class="calendar-entry ${item.status}" title="${escapeHtml(item.name)}">
                <span class="calendar-entry-short">${escapeHtml(item.shortLabel)}</span>
                <span class="calendar-entry-full">${escapeHtml(item.name)}</span>
              </div>`).join('')}
            ${hiddenCount > 0 ? `<div class="calendar-entry calendar-more">+${hiddenCount} flere</div>` : ''}
          </div>`;
      }

      html += '</div>';
      document.getElementById('calendarGrid').innerHTML = html;
    }

    let selectedCalendarDate = '';

    window.openCalendarDayModal = function(dateIso) {
      selectedCalendarDate = dateIso;
      const plannedItems = state.planned.filter(p => p.date === dateIso && p.status !== 'done')
        .sort((a,b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
      const doneItems = state.completed.filter(c => c.date === dateIso)
        .sort((a,b) => String(a.completedAt || '').localeCompare(String(b.completedAt || '')));
      document.getElementById('calendarDayTitle').textContent = formatDate(dateIso);
      document.getElementById('calendarDayList').innerHTML =
        [
          ...plannedItems.map(p => workoutCard(p, { canDelete: true })),
          ...doneItems.map(completedCard)
        ].join('') || `<div class="empty">Ingen økter denne dagen.</div>`;
      document.getElementById('calendarDayModal').classList.add('active');
    };

    window.closeCalendarDayModal = function() {
      document.getElementById('calendarDayModal').classList.remove('active');
    };

    window.planFromCalendarDay = function() {
      closeCalendarDayModal();
      openPlan(selectedCalendarDate || todayISO());
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

    function renderTrainingProfile() {
      const profile = normalizeTrainingProfile(state.settings.trainingProfile);
      document.getElementById('profilePrimaryFocus').value = profile.primaryFocus;
      document.getElementById('profileLevel').value = profile.level;
      document.getElementById('profilePhilosophy').value = profile.philosophy;
      document.getElementById('profilePriority').value = profile.priority;
      document.getElementById('profileRunningPhase').value = profile.trainingFocus;
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

    function renderWellnessInsights() {
      document.getElementById('insightWellnessTrend').innerHTML = [
        wellnessTrendRow('VO2 Max', 'vo2Max'),
        wellnessTrendRow('HRV 7d', 'hrv7d', ' ms'),
        wellnessTrendRow('Hvilepuls 7d', 'restingHeartRate7d', ' bpm')
      ].join('');
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

    function templateMatches(template, keywords = []) {
      const haystack = `${template.name} ${template.type} ${template.intensity} ${template.purpose || ''} ${template.load || ''} ${asArray(template.recommendedWhen).join(' ')} ${template.avoidWhen || ''} ${template.structure}`.toLowerCase();
      return keywords.some(keyword => haystack.includes(keyword.toLowerCase()));
    }

    function templateSuggestionScore(template, suggestion) {
      let score = 0;
      if (suggestion.types?.includes(template.type)) score += 4;
      if (suggestion.purposes?.includes(template.purpose)) score += 7;
      if (suggestion.loads?.includes(template.load)) score += 5;
      const recommendedMatches = asArray(template.recommendedWhen).filter(value => suggestion.recommendedWhen?.includes(value)).length;
      score += recommendedMatches * 4;
      if (suggestion.intensities?.includes(template.intensity)) score += 3;
      if (templateMatches(template, suggestion.keywords || [])) score += 2;
      if (suggestion.avoidTemplateWhen?.includes(template.avoidWhen)) score -= 8;
      return score;
    }

    function findSuggestedTemplate(suggestion) {
      const templates = state.templates || [];
      if (!templates.length) return null;
      const ranked = templates
        .map(template => ({ template, score: templateSuggestionScore(template, suggestion) }))
        .sort((a, b) => b.score - a.score);
      if (ranked[0]?.score > 0) return ranked[0].template;
      const typeMatch = templates.filter(t => suggestion.types?.includes(t.type));
      return typeMatch.find(t => templateMatches(t, suggestion.keywords))
        || templates.find(t => templateMatches(t, suggestion.keywords))
        || typeMatch.find(t => suggestion.intensities?.includes(t.intensity))
        || templates.find(t => suggestion.intensities?.includes(t.intensity))
        || typeMatch[0]
        || null;
    }

    function buildWorkoutSuggestion(today, weekSummary, weekItems, last14Days, profile) {
      const effectSummary = summarizeTrainingEffects(weekItems);
      const painItems = last14Days.filter(c => c.bodyStatus?.painBefore || c.bodyStatus?.painAfter || c.bodyStatus?.area);
      const high = effectSummary.categories.high_aerobic.count;
      const anaerobic = effectSummary.categories.anaerobic.count;
      const low = effectSummary.categories.low_aerobic.count;
      const runningBakkenFocus = profile.primaryFocus === 'running' && profile.philosophy === 'bakken_threshold';
      const baseSuggestion = {
        title: 'Rolig aerob økt',
        detail: 'Hold det lett og kontrollert. Målet er å bygge kontinuitet og komme ut med overskudd.',
        note: 'Foreslått fordi rolig volum gir best grunnlag for neste kvalitetsøkt.',
        types: ['Løping', 'Sykling', 'Ski'],
        intensities: ['Rolig', 'Restitusjon'],
        purposes: ['base', 'recovery'],
        loads: ['low'],
        recommendedWhen: ['normal', 'tired', 'after_hard', 'bonus'],
        avoidTemplateWhen: [],
        keywords: ['rolig', 'restitusjon', 'base', 'lett', 'fri']
      };

      if (painItems.length) {
        return {
          ...baseSuggestion,
          title: 'Skånsom rolig økt eller alternativ trening',
          detail: 'Velg kort rolig løp, sykkel, mobilitet eller hvile hvis samme område fortsatt kjennes.',
          note: 'Foreslått fordi du har registrert smerte eller tilpasning nylig.',
          types: ['Mobilitet', 'Sykling', 'Løping', 'Ski'],
          intensities: ['Rolig', 'Restitusjon'],
          purposes: ['recovery', 'mobility', 'base'],
          loads: ['low'],
          recommendedWhen: ['pain_adaptation', 'tired', 'after_hard'],
          avoidTemplateWhen: ['pain', 'heavy_legs', 'many_hard'],
          keywords: ['mobilitet', 'rolig', 'restitusjon', 'lett', 'sykkel']
        };
      }

      if (profile.primaryFocus === 'strength' && profile.trainingFocus === 'muscle_growth') {
        return {
          title: 'Styrke med progresjon',
          detail: 'Prioriter store øvelser, nok volum og god teknikk. Ikke jag kondisjonsbelastning denne økten.',
          note: 'Foreslått fordi treningsprofilen din står på muskelvekst/bulking.',
          types: ['Styrke'],
          intensities: ['Styrke'],
          purposes: ['muscle_growth', 'strength'],
          loads: ['moderate', 'high'],
          recommendedWhen: ['fresh_legs', 'normal'],
          avoidTemplateWhen: ['pain', 'low_hrv'],
          keywords: ['styrke', 'basis', 'helkropp', 'overkropp', 'bein', 'progresjon']
        };
      }

      if (profile.primaryFocus === 'ski' && profile.trainingFocus === 'technique_skill') {
        return {
          title: 'Teknikkøkt ski/staking',
          detail: 'Hold intensiteten kontrollert og fokuser på rytme, kraftoverføring og teknisk kvalitet.',
          note: 'Foreslått fordi treningsprofilen prioriterer teknikk/ferdighet.',
          types: ['Ski'],
          intensities: ['Rolig', 'Tempo'],
          purposes: ['technique', 'base'],
          loads: ['low', 'moderate'],
          recommendedWhen: ['normal', 'fresh_legs'],
          avoidTemplateWhen: ['pain'],
          keywords: ['staking', 'teknikk', 'rolig', 'ski', 'kontrollert']
        };
      }

      if (runningBakkenFocus) {
        if (anaerobic || high >= 2 || (high >= 1 && low === 0)) {
          return {
            ...baseSuggestion,
            note: 'Foreslått fordi du allerede har nok høy belastning eller mangler rolig støtte rundt kvaliteten.'
          };
        }
        if (weekSummary.sessions === 0 || (low >= 1 && high === 0 && weekSummary.sessions < 2)) {
          return {
            title: 'Kontrollert terskeløkt',
            detail: 'Hold deg kontrollert under maks press. Målet er kvalitet med friske bein, ikke å vinne økten.',
            note: 'Foreslått fordi profilen din er Bakken-inspirert løping og uken tåler én kontrollert kvalitetsøkt.',
            types: ['Løping'],
            intensities: ['Terskel', 'Tempo'],
            purposes: ['threshold'],
            loads: ['moderate'],
            recommendedWhen: ['fresh_legs', 'normal'],
            avoidTemplateWhen: ['pain', 'heavy_legs', 'many_hard', 'low_hrv'],
            keywords: ['terskel', 'tempo', '6 x', '10x', 'intervall', 'drag']
          };
        }
        return baseSuggestion;
      }

      if (weekSummary.sessions >= normalizeGoals(state.settings.goals).weeklySessionsTarget) {
        return {
          ...baseSuggestion,
          title: 'Bonusøkt med lav belastning',
          note: 'Foreslått fordi ukesmålet allerede er nådd. Hold eventuell ekstra økt lett.',
          recommendedWhen: ['bonus', 'after_hard', 'tired']
        };
      }

      return {
        title: 'Gjennomførbar basisøkt',
        detail: 'Velg en økt du vet du klarer å gjennomføre med god følelse.',
        note: 'Foreslått for å bygge kontinuitet uten å gjøre planleggingen for komplisert.',
        types: ['Løping', 'Styrke', 'Mobilitet', 'Sykling', 'Ski'],
        intensities: ['Rolig', 'Styrke', 'Mobilitet'],
        purposes: ['base', 'strength', 'mobility', 'technique'],
        loads: ['low', 'moderate'],
        recommendedWhen: ['normal', 'fresh_legs', 'tired'],
        avoidTemplateWhen: ['pain'],
        keywords: ['rolig', 'basis', 'mobilitet', 'styrke', 'lett']
      };
    }

    function renderWorkoutSuggestion(today, weekSummary, weekItems, last14Days, profile) {
      const suggestion = buildWorkoutSuggestion(today, weekSummary, weekItems, last14Days, profile);
      const template = findSuggestedTemplate(suggestion);
      const tomorrow = addDays(today, 1);
      const templateCoachMeta = template
        ? [templatePurposeLabel(template.purpose), templateLoadLabel(template.load)].filter(Boolean).join(' · ')
        : '';
      const templateMeta = template
        ? `<p class="meta"><strong>Passende mal:</strong> ${escapeHtml(template.name)} · ${escapeHtml(template.type)} · ${escapeHtml(template.intensity || '')}${templateCoachMeta ? ` · ${escapeHtml(templateCoachMeta)}` : ''}</p>`
        : '<p class="meta">Ingen tydelig passende øktmal funnet ennå. Lag gjerne en mal som matcher forslaget.</p>';
      document.getElementById('homeWorkoutSuggestion').innerHTML = `
        <div class="suggestion-card">
          <div class="suggestion-kicker">Neste smarte valg</div>
          <h3>${escapeHtml(suggestion.title)}</h3>
          <p>${escapeHtml(suggestion.detail)}</p>
          <p class="meta">${escapeHtml(suggestion.note)}</p>
          ${templateMeta}
          <div class="button-row">
            ${template ? `<button class="btn-primary" onclick="planSuggestedWorkout('${template.id}', '${tomorrow}')">Planlegg forslaget</button>` : ''}
            <button class="btn-soft" onclick="${template ? `openPlan('${tomorrow}')` : 'openLibrary()'}">${template ? 'Velg selv' : 'Lag øktmal'}</button>
          </div>
        </div>`;
    }

    window.planSuggestedWorkout = function(templateId, dateIso) {
      openPlan(dateIso || addDays(todayISO(), 1));
      document.getElementById('planTemplate').value = templateId;
      document.getElementById('planNotes').value = 'Foreslått av coach-assistenten. Juster etter dagsform.';
      showToast('Forslag lagt klart i planlegging');
    };

    function renderDashboardSummary(today, todayItems, upcomingItems) {
      const goals = normalizeGoals(state.settings.goals);
      const profile = normalizeTrainingProfile(state.settings.trainingProfile);
      const weekStart = startOfWeek(today);
      const weekEnd = addDays(weekStart, 6);
      const weekItems = state.completed.filter(c => c.date >= weekStart && c.date <= weekEnd);
      const weekSummary = summarizeCompleted(weekItems);
      const last14Start = addDays(today, -13);
      const last14Days = state.completed.filter(c => c.date >= last14Start && c.date <= today);
      const primaryItems = todayItems.length ? todayItems : upcomingItems.slice(0, 1);

      document.getElementById('homePrimaryTitle').textContent = todayItems.length ? 'Dagens økt' : 'Neste økt';
      document.getElementById('homePrimaryWorkout').innerHTML = primaryItems.length
        ? primaryItems.map(p => workoutCard(p)).join('')
        : `<div class="empty">Ingen økter planlagt. Gå til Planlegg for å legge inn neste økt.</div>`;

      document.getElementById('homeWeekSessions').textContent = `${weekSummary.sessions}/${goals.weeklySessionsTarget}`;
      document.getElementById('homeWeekTime').textContent = formatClockDuration(weekSummary.seconds);
      document.getElementById('homeWeekLoad').textContent = homeLoadLabel(weekItems, profile);
      document.getElementById('homeWeekNote').textContent = weekSummary.sessions >= goals.weeklySessionsTarget
        ? 'Ukesmålet er nådd. Videre trening bør styres av overskudd og dagsform.'
        : `${Math.max(0, goals.weeklySessionsTarget - weekSummary.sessions)} økt${Math.max(0, goals.weeklySessionsTarget - weekSummary.sessions) === 1 ? '' : 'er'} igjen til ukesmålet.`;
      document.getElementById('homeCoachNote').textContent = buildCoachNote(weekSummary, goals, last14Days, profile);
      renderWorkoutSuggestion(today, weekSummary, weekItems, last14Days, profile);
    }

    function renderHistoryFilterOptions() {
      const select = document.getElementById('historyFilter');
      const selected = select.value || 'Alle';
      const templateTypes = state.templates.map(t => t.type);
      const values = ['Alle', ...uniqueValues([...(state.settings.activityTypes || []), ...templateTypes])];
      select.innerHTML = values.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
      select.value = values.includes(selected) ? selected : 'Alle';
    }

    function dateToISO(date) {
      return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    }

    function startOfWeek(dateIso) {
      const date = new Date(`${dateIso}T12:00:00`);
      const day = date.getDay() || 7;
      date.setDate(date.getDate() - day + 1);
      return dateToISO(date);
    }

    function completedDurationSeconds(completed) {
      if (completed.durationSeconds) return Number(completed.durationSeconds) || 0;
      if (completed.durationMinutes) return (Number(completed.durationMinutes) || 0) * 60;
      return 0;
    }

    function formatHoursFromSeconds(seconds) {
      const total = Number(seconds) || 0;
      const hours = total / 3600;
      if (!hours) return '0 t';
      return `${hours.toLocaleString('no-NO', { maximumFractionDigits: hours < 10 ? 1 : 0 })} t`;
    }

    function formatClockDuration(seconds) {
      const total = Math.max(0, Math.round(Number(seconds) || 0));
      const hours = Math.floor(total / 3600);
      const minutes = Math.floor((total % 3600) / 60);
      const remainingSeconds = total % 60;
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }

    function formatKm(km) {
      const value = Number(km) || 0;
      return `${value.toLocaleString('no-NO', { maximumFractionDigits: value < 10 ? 1 : 0 })} km`;
    }

    function isHardWorkout(completed) {
      const template = getTemplate(completed.templateId);
      const hardIntensities = ['Tempo', 'Terskel', 'Intervall', 'Anaerob'];
      return hardIntensities.includes(template.intensity) || Number(completed.rpe || 0) >= 7;
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

    function calculateWeeklyStreak(currentWeekStart, weeklyTarget) {
      let streak = 0;
      let cursor = currentWeekStart;
      const currentWeek = weekSummaryForStart(cursor);
      if (currentWeek.summary.sessions >= weeklyTarget) {
        streak += 1;
        cursor = addDays(cursor, -7);
      } else {
        cursor = addDays(cursor, -7);
      }

      while (true) {
        const week = weekSummaryForStart(cursor);
        if (week.summary.sessions < weeklyTarget) break;
        streak += 1;
        cursor = addDays(cursor, -7);
      }
      return streak;
    }

    function renderContinuity(weekSummary, goals, weekStart) {
      const target = goals.weeklySessionsTarget;
      const streak = calculateWeeklyStreak(weekStart, target);
      const remaining = Math.max(0, target - weekSummary.sessions);
      const currentStatus = weekSummary.sessions >= target
        ? 'I mål'
        : `${weekSummary.sessions}/${target}`;

      document.getElementById('insightStreakWeeks').textContent = streak;
      document.getElementById('insightCurrentWeekStatus').textContent = currentStatus;

      const weeks = buildContinuityWeeks(weekStart);
      document.getElementById('insightContinuityWeeks').innerHTML = weeks.map((week, index) => {
        const sessions = week.summary.sessions;
        const status = sessions >= target ? 'done' : sessions > 0 ? 'partial' : 'empty';
        const isCurrent = index === weeks.length - 1;
        const distance = weeks.length - 1 - index;
        const weekLabel = isCurrent ? 'Denne uken' : distance === 1 ? 'Forrige' : `-${distance} uker`;
        const label = sessions >= target ? 'OK' : `${sessions}/${target}`;
        return `
          <div class="continuity-chip ${status} ${isCurrent ? 'current' : ''}" title="${escapeHtml(formatDate(week.start))} - ${escapeHtml(formatDate(week.end))}">
            <span class="continuity-week-label">${escapeHtml(weekLabel)}</span>
            <strong>${escapeHtml(label)}</strong>
            <span>${sessions >= target ? 'i mål' : `${sessions} økt${sessions === 1 ? '' : 'er'}`}</span>
            <small>${escapeHtml(formatWeekRange(week.start, week.end))}</small>
          </div>`;
      }).join('');

      document.getElementById('insightContinuityNote').textContent = weekSummary.sessions >= target
        ? 'Denne uken teller som en kontinuitetsuke. Videre trening er bonus og bør styres av overskudd.'
        : `${remaining} økt${remaining === 1 ? '' : 'er'} igjen for at denne uken skal telle i kontinuiteten.`;
    }

    function summarizeTrainingEffects(items) {
      const summary = {
        total: 0,
        seconds: 0,
        missing: 0,
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
      return `Tolkes mot: ${profileLabel(profile.primaryFocus)} · ${profileLabel(profile.philosophy)} · ${profileLabel(profile.priority)} · ${profileLabel(profile.trainingFocus)}`;
    }

    function weightedLoadScore(summary, profile) {
      const runningBakkenFocus = profile.primaryFocus === 'running' && profile.philosophy === 'bakken_threshold';
      const weights = runningBakkenFocus
        ? { low_aerobic: 1, high_aerobic: 2.2, anaerobic: 4.5 }
        : { low_aerobic: 1, high_aerobic: 2, anaerobic: 3.5 };
      return Object.entries(summary.categories).reduce((score, [key, category]) => {
        return score + (category.count * (weights[key] || 1));
      }, 0);
    }

    function intensityBalanceCard(title, items) {
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

      const legend = categories.map(category => {
        const value = category[basis];
        const percent = totalBasis ? Math.round((value / totalBasis) * 100) : 0;
        const detail = basis === 'seconds'
          ? `${formatClockDuration(category.seconds)} · ${category.count} økt${category.count === 1 ? '' : 'er'}`
          : `${category.count} økt${category.count === 1 ? '' : 'er'}`;
        return `
          <div class="intensity-legend-row">
            <span class="intensity-dot ${category.className}"></span>
            <span>${escapeHtml(category.shortLabel)} (${escapeHtml(category.label)})</span>
            <span>${percent}% · ${escapeHtml(detail)}</span>
          </div>`;
      }).join('');

      const missingText = summary.missing
        ? `<p class="small-note">${summary.missing} økt${summary.missing === 1 ? '' : 'er'} mangler Garmin-valg.</p>`
        : '';

      return `
        <div class="intensity-card">
          <div class="intensity-header">
            <strong>${escapeHtml(title)}</strong>
            <span>${summary.total} registrert${summary.total === 1 ? '' : 'e'} med Garmin-valg</span>
          </div>
          <div class="intensity-stack">${stack}</div>
          <div class="intensity-legend">${legend}</div>
          ${missingText}
        </div>`;
    }

    function buildIntensityNote(last7Items, last28Items, profile) {
      const last7 = summarizeTrainingEffects(last7Items);
      const last28 = summarizeTrainingEffects(last28Items);
      const hard7 = last7.categories.high_aerobic.count + last7.categories.anaerobic.count;
      const low7 = last7.categories.low_aerobic.count;
      const high7 = last7.categories.high_aerobic.count;
      const anaerobic7 = last7.categories.anaerobic.count;
      const low28 = last28.categories.low_aerobic.count;
      const hard28 = last28.categories.high_aerobic.count + last28.categories.anaerobic.count;
      const loadScore7 = weightedLoadScore(last7, profile);
      const runningBakkenFocus = profile.primaryFocus === 'running' && profile.philosophy === 'bakken_threshold';
      const strengthGrowthFocus = profile.primaryFocus === 'strength' && profile.trainingFocus === 'muscle_growth';
      const skiTechniqueFocus = profile.primaryFocus === 'ski' && profile.trainingFocus === 'technique_skill';

      if (!last7.total && last7.missing) {
        return 'Du har logget økter siste 7 dager, men mangler Garmin-valg. Legg inn Primær treningseffekt på øktene for å få bedre analyse.';
      }
      if (!last7.total) {
        return 'Når du logger økter med Garmin-feltet, får du en enkel balanse mellom rolig, moderat og hard trening her.';
      }
      if (strengthGrowthFocus) {
        return 'Med muskelvekst som treningsfokus er Garmin-intensitet bare et sekundært signal. Viktigst blir styrkevolum, progresjon, nok mat og nok restitusjon mellom tunge økter.';
      }
      if (skiTechniqueFocus && anaerobic7 >= 1) {
        return 'Med teknikk/staking som fokus bør hard anaerob belastning doseres forsiktig. Prioriter teknisk kvalitet og kontrollerte drag fremfor å jage høyest mulig belastning.';
      }
      if (anaerobic7 >= 2) {
        return 'Du har flere anaerobe økter siste 7 dager. For kontinuitet og skadefri progresjon bør neste økt trolig være rolig eller teknisk kontrollert.';
      }
      if (runningBakkenFocus && anaerobic7 >= 1) {
        return 'Med Bakken-inspirert løpsfokus bør anaerob belastning brukes forsiktig. Neste løpeøkt bør trolig være Base/Recovery eller kontrollert terskel under maks press.';
      }
      if (hard7 >= 2 && low7 === 0) {
        return 'Denne uken har mye moderat/hard belastning og lite rolig trening. Vurder en Base eller Recovery-økt neste gang.';
      }
      if (runningBakkenFocus && high7 >= 2 && low7 < 1) {
        return 'Du har nok terskelnær kvalitet denne uken, men lite rolig støtte rundt den. For sprekere bein og bedre kontinuitet bør neste økt være rolig aerob.';
      }
      if (runningBakkenFocus && high7 >= 1 && low7 >= 1 && anaerobic7 === 0 && loadScore7 <= 5.5) {
        return 'Dette ligner en god Bakken-inspirert uke: rolig aerob støtte rundt kontrollert kvalitet, uten unødvendig anaerob toppbelastning.';
      }
      if (last28.total >= 4 && low28 < hard28) {
        return 'Siste 4 uker har mer høy belastning enn rolig aerob trening. Litt mer Base/Recovery kan gi bedre kontinuitet og lavere skaderisiko.';
      }
      return runningBakkenFocus
        ? 'Balansen ser kontrollert ut for Bakken-inspirert løping: bygg rolig volum rundt kontrollert terskel, og spar anaerob belastning til sjeldnere behov.'
        : 'Balansen ser kontrollert ut. Fortsett å bruke Garmin-valget etter øktene, så blir coach-vurderingene mer presise over tid.';
    }

    function renderIntensityBalance(today, profile) {
      const last7Start = addDays(today, -6);
      const last28Start = addDays(today, -27);
      const last7Items = state.completed.filter(c => c.date >= last7Start && c.date <= today);
      const last28Items = state.completed.filter(c => c.date >= last28Start && c.date <= today);
      document.getElementById('insightIntensityProfile').textContent = intensityProfileText(profile);
      document.getElementById('insightIntensityBalance').innerHTML = [
        intensityBalanceCard('Siste 7 dager', last7Items),
        intensityBalanceCard('Siste 4 uker', last28Items)
      ].join('');
      document.getElementById('insightIntensityNote').textContent = buildIntensityNote(last7Items, last28Items, profile);
    }

    function buildCoachNote(weekSummary, goals, last14Days, profile) {
      const latest = latestCompletedWorkout(state.completed.filter(c => c.date <= todayISO()));
      const latestNote = lastWorkoutCoachNote(latest, profile);
      if (latestNote) return latestNote;

      const painItems = last14Days.filter(c => c.bodyStatus?.painBefore || c.bodyStatus?.painAfter || c.bodyStatus?.area);
      const hardItems = last14Days.filter(isHardWorkout);
      const runningBakkenFocus = profile.primaryFocus === 'running' && profile.philosophy === 'bakken_threshold';
      const strengthGrowthFocus = profile.primaryFocus === 'strength' && profile.trainingFocus === 'muscle_growth';
      const skiTechniqueFocus = profile.primaryFocus === 'ski' && profile.trainingFocus === 'technique_skill';
      if (painItems.length >= 2) {
        return runningBakkenFocus
          ? 'Du har registrert smerte eller kroppsnotat på flere økter de siste 14 dagene. Med skadefri løpsprogresjon som mål bør neste økt være rolig, alternativ trening eller hvile hvis smerten øker.'
          : 'Du har registrert smerte eller kroppsnotat på flere økter de siste 14 dagene. Hold neste økt kontrollert, og vurder rolig alternativ eller hvile hvis smerten øker.';
      }
      if (strengthGrowthFocus && weekSummary.sessions >= goals.weeklySessionsTarget) {
        return 'Du ligger godt an mot ukesmålet. Med muskelvekst som fokus blir neste steg å sikre nok restitusjon, jevn progresjon og nok energi inn, ikke bare flere økter.';
      }
      if (skiTechniqueFocus && hardItems.length >= 2) {
        return 'Du har nok hard belastning tett på teknikkfokuset. Neste skiøkt bør trolig handle om stakingsteknikk, rytme og kontrollert kapasitet.';
      }
      if (painItems.length === 1) {
        return 'Du har registrert smerte eller tilpasning på en nylig økt. Smart å justere belastningen tidlig, spesielt hvis samme område fortsatt kjennes.';
      }
      if (runningBakkenFocus && hardItems.length >= 2) {
        return 'Du har allerede nok høy belastning i en Bakken-inspirert løpsuke. Prioriter rolig volum eller kontrollert terskel med overskudd, ikke mer hard intensitet.';
      }
      if (hardItems.length >= 3) {
        return 'Det har vært flere harde økter tett på hverandre. For kontinuitet og skadefri progresjon kan neste økt gjerne være rolig eller restitusjon.';
      }
      if (weekSummary.sessions >= goals.weeklySessionsTarget) {
        return weekSummary.sessions >= goals.weeklyStretchSessionsTarget
          ? 'Sterk kontinuitet denne uken. Du har nådd stretch-målet, så videre trening bør styres av overskudd og dagsform.'
          : 'Du er i mål med ukesmålet. En eventuell ekstra økt kan være bonus, ikke press.';
      }
      if (weekSummary.sessions > 0) {
        const remaining = Math.max(0, goals.weeklySessionsTarget - weekSummary.sessions);
        return `Du er i gang denne uken. ${remaining} økt${remaining === 1 ? '' : 'er'} igjen til ukesmålet. Velg neste økt ut fra kropp og dagsform.`;
      }
      return 'Ingen økter logget denne uken ennå. Start med én gjennomførbar økt, gjerne kontrollert og realistisk.';
    }

    function renderInsights() {
      const today = todayISO();
      const goals = normalizeGoals(state.settings.goals);
      const profile = normalizeTrainingProfile(state.settings.trainingProfile);
      const weekStart = startOfWeek(today);
      const weekEnd = addDays(weekStart, 6);
      const weekItems = state.completed.filter(c => c.date >= weekStart && c.date <= weekEnd);
      const weekSummary = summarizeCompleted(weekItems);
      const last14Start = addDays(today, -13);
      const last14Days = state.completed.filter(c => c.date >= last14Start && c.date <= today);

      document.getElementById('insightWeekSessions').textContent = `${weekSummary.sessions}/${goals.weeklySessionsTarget}`;
      document.getElementById('insightWeekTime').textContent = formatClockDuration(weekSummary.seconds);
      document.getElementById('insightWeekKm').textContent = formatKm(weekSummary.km);
      document.getElementById('insightWeekHard').textContent = weekSummary.hard;

      const hours = weekSummary.seconds / 3600;
      document.getElementById('insightWeekProgress').innerHTML = [
        progressRow('Ukesmål økter', weekSummary.sessions, goals.weeklySessionsTarget),
        progressRow('Stretch økter', weekSummary.sessions, goals.weeklyStretchSessionsTarget),
        progressRow('Timer', hours, goals.weeklyHoursTarget, 't'),
        progressRow('Kilometer', weekSummary.km, goals.weeklyKmTarget, 'km')
      ].join('');
      renderWeeklyTrainingStatus(weekItems, weekSummary, goals, profile);
      renderIntensityBalance(today, profile);
      renderContinuity(weekSummary, goals, weekStart);

      const weeks = [];
      for (let i = 3; i >= 0; i--) {
        const start = addDays(weekStart, -(i * 7));
        const end = addDays(start, 6);
        const items = state.completed.filter(c => c.date >= start && c.date <= end);
        weeks.push({ start, end, summary: summarizeCompleted(items) });
      }
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

      renderWellnessInsights();
      document.getElementById('insightCoachNote').textContent = buildCoachNote(weekSummary, goals, last14Days, profile);
    }

    // ── Render ────────────────────────────────────────────────────────────────
    function render() {
      renderCalendar();
      const today = todayISO();
      document.getElementById('todayPill').textContent = formatDate(today);
      document.getElementById('planDate').value ||= today;
      state.settings = normalizeSettings(state.settings);

      const editingTemplateId = document.getElementById('editingTemplateId').value;
      const selectedType = document.getElementById('templateType').value;
      const selectedIntensity = document.getElementById('templateIntensity').value;
      const typeToKeep = editingTemplateId || state.settings.activityTypes.includes(selectedType) ? selectedType : '';
      const intensityToKeep = editingTemplateId || state.settings.intensities.includes(selectedIntensity) ? selectedIntensity : '';
      setSelectOptions('templateType', state.settings.activityTypes, typeToKeep);
      setSelectOptions('templateIntensity', state.settings.intensities, intensityToKeep);
      renderSettingsList('activityTypes', 'activityTypeList');
      renderSettingsList('intensities', 'intensityList');
      renderTrainingGoals();
      renderTrainingProfile();
      renderPersonProfile();
      renderWellnessList();
      renderDashboardWellness();
      renderHistoryFilterOptions();
      renderInsights();

      const plannedActive = state.planned.filter(p => p.status !== 'done');
      // BUGFIX punkt 3: trygg sortering selv om createdAt mangler
      const todayItems = plannedActive.filter(p => p.date === today)
        .sort((a,b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
      const upcomingItems = plannedActive.filter(p => p.date > today)
        .sort((a,b) => a.date.localeCompare(b.date));

      renderDashboardSummary(today, todayItems, upcomingItems);
      document.getElementById('upcomingList').innerHTML = upcomingItems.length
        ? upcomingItems.slice(0, 3).map(p => workoutCard(p)).join('')
        : `<div class="empty">Ingen kommende økter.</div>`;

      document.getElementById('planTemplate').innerHTML = state.templates.length
        ? state.templates.map(t => `<option value="${t.id}">${escapeHtml(t.name)} · ${escapeHtml(t.type)}</option>`).join('')
        : `<option value="">Lag en øktmal først</option>`;
      document.getElementById('completeTemplate').innerHTML = [
        `<option value="">Ingen / eget navn</option>`,
        ...state.templates.map(t => `<option value="${t.id}">${escapeHtml(t.name)} · ${escapeHtml(t.type)}</option>`)
      ].join('');

      document.getElementById('templateList').innerHTML = state.templates.length
        ? state.templates.map(templateCard).join('')
        : `<div class="empty">Ingen øktmaler enda. Lag din første over.</div>`;

      const filter = document.getElementById('historyFilter')?.value || 'Alle';
      const sort = document.getElementById('historySort')?.value || 'desc';
      let completed = [...state.completed];
      if (filter !== 'Alle') completed = completed.filter(c => completedTemplate(c).type === filter);
      completed.sort((a,b) => sort === 'desc' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date));
      document.getElementById('historyList').innerHTML = completed.length
        ? completed.map(completedCard).join('')
        : `<div class="empty">Ingen historikk enda.</div>`;
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
        await Promise.all(['./index.html', './styles.css', './app.js'].map(path =>
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
        try {
          const imported = JSON.parse(reader.result);
          if (!imported.templates || !imported.planned || !imported.completed) throw new Error('Invalid format');
          if (!confirm('Import vil overskrive data som ligger i appen nå. Fortsette?')) return;
          state = { ...imported, wellness: imported.wellness || [], settings: normalizeSettings(imported.settings) };
          render();
          await Promise.all([
            fsBatchSet('templates', state.templates),
            fsBatchSet('planned', state.planned),
            fsBatchSet('completed', state.completed),
            fsBatchSet('wellness', state.wellness),
            fsSet('settings', 'preferences', state.settings)
          ]);
        } catch (err) {
          alert('Kunne ikke importere filen. Sjekk at dette er en gyldig backup fra appen.');
          setSyncStatus('error');
        }
      };
      reader.readAsText(file);
      event.target.value = '';
    };

    window.seedDemoData = async function() {
      if (!confirm('Legge inn demo-data?')) return;
      const t1 = { id: uid('template'), name: '6 x 6 min terskel', type: 'Løping', intensity: 'Terskel', structure: '10 min oppvarming\n6 x 6 min terskel\n90 sek pause\n10 min nedjogg', createdAt: todayISO() };
      const t2 = { id: uid('template'), name: 'Basis styrke', type: 'Styrke', intensity: 'Styrke', structure: 'Deadbugs 3 x 10\nTåhev 3 x 15\nUtfall 3 x 10 per bein\nPlanke 3 x 30 sek\nPushups 3 x kontrollert', createdAt: todayISO() };
      const p1 = { id: uid('planned'), templateId: t1.id, date: todayISO(), status: 'planned', notes: 'Hold kontrollert terskel, ikke makse.', createdAt: todayISO() };
      const p2 = { id: uid('planned'), templateId: t2.id, date: todayISO(), status: 'planned', notes: '', createdAt: todayISO() };
      state.templates.push(t1, t2);
      state.planned.push(p1, p2);
      render();
      await Promise.all([fsBatchSet('templates', [t1, t2]), fsBatchSet('planned', [p1, p2])]);
    };

    window.confirmResetData = function() {
      const userInput = prompt('Skriv inn "SLETT" for å bekrefte sletting av alle økter, planer, historikk og formmålinger.');
      if (userInput !== 'SLETT') {
        if (userInput !== null) alert('Feil tekst - sletting avbrutt.');
        return;
      }
      resetData();
    };

    window.resetData = async function() {
      if (!confirm('SISTE ADVARSEL: Dette sletter alle økter, planer, historikk og formmålinger. Dette kan ikke angres. Fortsette?')) return;
      setSyncStatus('syncing');
      try {
        const [tSnap, pSnap, cSnap, wSnap] = await Promise.all([
          getDocs(userCol('templates')),
          getDocs(userCol('planned')),
          getDocs(userCol('completed')),
          getDocs(userCol('wellness'))
        ]);
        const batch = writeBatch(db);
        [...tSnap.docs, ...pSnap.docs, ...cSnap.docs, ...wSnap.docs].forEach(d => batch.delete(d.ref));
        await batch.commit();
        state = { templates: [], planned: [], completed: [], wellness: [], settings: normalizeSettings(state.settings) };
        setSyncStatus('ok');
        render();
      } catch (err) {
        console.error('Reset error:', err);
        setSyncStatus('error');
      }
    };

    [
      'completeDurationHours',
      'completeDurationMinutes',
      'completeDurationSeconds',
      'completeDistance'
    ].forEach(id => document.getElementById(id)?.addEventListener('input', updatePacePreview));

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register(`./service-worker.js?v=${APP_VERSION}`).catch(() => {});
      });
    };
