import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
    import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut as fbSignOut }
      from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
    import { getFirestore, doc, collection, getDoc, getDocs, setDoc, deleteDoc, writeBatch }
      from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

    const APP_VERSION = 'v21';

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
        weightKg: ''
      }
    };
    let state = { templates: [], planned: [], completed: [], wellness: [], settings: JSON.parse(JSON.stringify(defaultSettings)) };

    // ── Utilities ─────────────────────────────────────────────────────────────
    function uid(prefix) {
      return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
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
        weightKg: normalizeGoalNumber(profile.weightKg, defaults.weightKg)
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
        weightKg: document.getElementById('personWeightKg').value
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
      document.getElementById('templateStructure').value = t.structure || '';
      document.getElementById('templateSubmitBtn').textContent = 'Lagre endringer';
      document.getElementById('cancelEditTemplateBtn').classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.cancelEditTemplate = function() { clearTemplateForm(); };

    function clearTemplateForm() {
      document.getElementById('editingTemplateId').value = '';
      document.getElementById('templateName').value = '';
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
        'completeDurationHours',
        'completeDurationMinutes',
        'completeDurationSeconds',
        'completeDistance',
        'completeAvgHr',
        'completeMaxHr',
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
    }

    function setCompleteModalMode(mode) {
      const isEditing = mode === 'edit';
      document.getElementById('completeModalTitle').textContent = isEditing ? 'Rediger økt' : 'Loggfør økt';
      document.getElementById('completeSubmitBtn').textContent = isEditing ? 'Lagre endringer' : 'Marker utført';
    }

    function completedFormData() {
      const durationSeconds = getDurationSecondsFromForm();
      return {
        durationSeconds: durationSeconds || '',
        durationDisplay: durationSeconds ? formatDuration(durationSeconds) : '',
        durationMinutes: durationSeconds ? Math.round(durationSeconds / 60) : '',
        distanceKm: document.getElementById('completeDistance').value || '',
        avgHeartRate: document.getElementById('completeAvgHr').value || '',
        maxHeartRate: document.getElementById('completeMaxHr').value || '',
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
          adaptation: document.getElementById('completeAdaptation').value || '',
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

    function completedDurationLabel(completed) {
      if (completed.durationSeconds) return formatDuration(completed.durationSeconds);
      if (completed.durationDisplay) return completed.durationDisplay;
      if (completed.durationMinutes) return `${completed.durationMinutes} min`;
      return '';
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

    function readinessLabel(readiness = {}) {
      const parts = [
        readiness.energy ? `Energi ${readiness.energy}/5` : null,
        readiness.legs ? `Ben ${readiness.legs}/5` : null,
        readiness.sleep ? `Søvn ${readiness.sleep}/5` : null,
        readiness.stress ? `Stress ${readiness.stress}/5` : null
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
        bodyStatus.painBefore ? `Smerte før ${bodyStatus.painBefore}/10` : null,
        bodyStatus.painAfter ? `Smerte etter ${bodyStatus.painAfter}/10` : null,
        bodyStatus.area ? `Område: ${bodyStatus.area}` : null,
        bodyStatus.adaptation ? `Tilpasning: ${adaptationLabel(bodyStatus.adaptation)}` : null
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

    window.openCompleteModal = function(plannedId) {
      clearCompleteForm();
      setCompleteModalMode('create');
      document.getElementById('completePlannedId').value = plannedId;
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
      setDurationFormFromSeconds(completed.durationSeconds || (completed.durationMinutes ? Number(completed.durationMinutes) * 60 : 0));
      document.getElementById('completeDistance').value = completed.distanceKm || '';
      document.getElementById('completeAvgHr').value = completed.avgHeartRate || '';
      document.getElementById('completeMaxHr').value = completed.maxHeartRate || '';
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
      document.getElementById('completeAdaptation').value = completed.bodyStatus?.adaptation || '';
      document.getElementById('completeBodyNotes').value = completed.bodyStatus?.notes || '';
      document.getElementById('completeNotes').value = completed.notes || '';
      document.getElementById('completeModal').classList.add('active');
    };

    window.completeWorkout = async function() {
      const editingId = document.getElementById('editingCompletedId').value;
      if (editingId) {
        const completedIndex = state.completed.findIndex(c => c.id === editingId);
        if (completedIndex === -1) return;

        state.completed[completedIndex] = {
          ...state.completed[completedIndex],
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
      if (!planned) return;
      planned.status = 'done';
      const completed = {
        id: uid('completed'),
        plannedWorkoutId: plannedId,
        templateId: planned.templateId,
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
      const template = getTemplate(completed.templateId);
      if (!confirm(`Er du sikker på at du vil angre utført økt?\n\n${template.name} flyttes tilbake til planlagt økt.`)) return;
      const planned = state.planned.find(p => p.id === completed.plannedWorkoutId);
      if (planned) planned.status = 'planned';
      state.completed = state.completed.filter(c => c.id !== completedId);
      render();
      if (document.getElementById('calendarDayModal')?.classList.contains('active') && selectedCalendarDate) {
        openCalendarDayModal(selectedCalendarDate);
      }
      const ops = [fsDelete('completed', completedId)];
      if (planned) ops.push(fsSet('planned', planned.id, planned));
      await Promise.all(ops);
      showToast('Økt flyttet tilbake til planlagt');
    };

    // ── Render helpers ────────────────────────────────────────────────────────
    function getTemplate(id) {
      return state.templates.find(t => t.id === id) || { name: 'Slettet øktmal', type: 'Annet', intensity: '', structure: '' };
    }

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

    function templateCard(t) {
      return `
        <div class="workout-card">
          <div class="workout-top">
            <div>
              <h3 class="workout-title">${escapeHtml(t.name)}</h3>
              <div class="meta">${escapeHtml(t.type)} · ${escapeHtml(t.intensity)}</div>
            </div>
            <span class="tag">Mal</span>
          </div>
          ${t.structure ? `<p class="meta" style="white-space:pre-line;">${escapeHtml(t.structure)}</p>` : ''}
          <div class="button-row">
            <button class="btn-primary" onclick="editTemplate('${t.id}')">Rediger</button>
            <button class="btn-soft" onclick="deleteTemplate('${t.id}')">Slett</button>
          </div>
        </div>`;
    }

    function completedCard(c) {
      const t = getTemplate(c.templateId);
      const durationLabel = completedDurationLabel(c);
      const execution = executionLabel(c.execution);
      const feeling = feelingLabel(c.feelingScore);
      const readiness = readinessLabel(c.readiness);
      const bodyStatus = bodyStatusLabel(c.bodyStatus);
      const trainingEffect = trainingEffectTag(c.trainingEffectType);
      const metrics = [
        durationLabel || null,
        c.distanceKm ? `${c.distanceKm} km` : null,
        c.avgHeartRate ? `Snitt ${c.avgHeartRate} bpm` : null,
        c.maxHeartRate ? `Maks ${c.maxHeartRate} bpm` : null,
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
          ${execution ? `<p class="meta"><strong>Gjennomføring:</strong> ${escapeHtml(execution)}</p>` : ''}
          ${feeling ? `<p class="meta"><strong>Følelse:</strong> ${escapeHtml(feeling)}</p>` : ''}
          ${readiness ? `<p class="meta"><strong>Dagsform:</strong> ${escapeHtml(readiness)}</p>` : ''}
          ${bodyStatus ? `<p class="meta"><strong>Kropp:</strong> ${escapeHtml(bodyStatus)}</p>` : ''}
          ${c.bodyStatus?.notes ? `<p class="meta"><strong>Kroppsnotat:</strong> ${escapeHtml(c.bodyStatus.notes)}</p>` : ''}
          ${c.notes ? `<p class="meta"><strong>Notat:</strong> ${escapeHtml(c.notes)}</p>` : ''}
          <div class="button-row">
            <button class="btn-primary" onclick="editCompleted('${c.id}')">Rediger</button>
            <button class="btn-soft" onclick="undoComplete('${c.id}')">Angre utført</button>
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
            const template = getTemplate(c.templateId);
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
        const weekLabel = isCurrent ? 'Nå' : `-${weeks.length - 1 - index}`;
        const label = sessions >= target ? 'OK' : `${sessions}/${target}`;
        return `
          <div class="continuity-chip ${status} ${isCurrent ? 'current' : ''}" title="${escapeHtml(formatDate(week.start))} - ${escapeHtml(formatDate(week.end))}">
            <span class="continuity-week-label">${escapeHtml(weekLabel)}</span>
            <strong>${escapeHtml(label)}</strong>
            <span>${sessions >= target ? 'i mål' : 'økter'}</span>
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
      renderIntensityBalance(today, profile);
      renderContinuity(weekSummary, goals, weekStart);

      const weeks = [];
      for (let i = 3; i >= 0; i--) {
        const start = addDays(weekStart, -(i * 7));
        const end = addDays(start, 6);
        const items = state.completed.filter(c => c.date >= start && c.date <= end);
        weeks.push({ start, end, summary: summarizeCompleted(items) });
      }
      const maxSessions = Math.max(1, ...weeks.map(w => w.summary.sessions), goals.weeklySessionsTarget);
      document.getElementById('insightFourWeeks').innerHTML = weeks.map(week => {
        const percent = Math.max(0, Math.min(100, (week.summary.sessions / maxSessions) * 100));
        return `
          <div class="week-row">
            <div class="week-row-top">
              <span>${escapeHtml(formatDate(week.start))} - ${escapeHtml(formatDate(week.end))}</span>
              <span>${week.summary.sessions} økter · ${escapeHtml(formatHoursFromSeconds(week.summary.seconds))} · ${escapeHtml(formatKm(week.summary.km))}</span>
            </div>
            <div class="progress-track"><div class="progress-fill" style="width:${percent}%;"></div></div>
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

      document.getElementById('statToday').textContent = todayItems.length;
      document.getElementById('statPlanned').textContent = plannedActive.length;
      document.getElementById('statDone').textContent = state.completed.length;

      const nextWorkout = todayItems[0] || upcomingItems[0];
      const nextBanner = document.getElementById('nextWorkoutBanner');
      if (nextWorkout) {
        const nextTemplate = getTemplate(nextWorkout.templateId);
        document.getElementById('nextWorkoutTitle').textContent = nextTemplate.name;
        document.getElementById('nextWorkoutMeta').textContent =
          `${formatDate(nextWorkout.date)} · ${nextTemplate.type} · ${nextTemplate.intensity || ''}`;
        nextBanner.classList.remove('hidden');
      } else {
        nextBanner.classList.add('hidden');
      }

      document.getElementById('todayList').innerHTML = todayItems.length
        ? todayItems.map(p => workoutCard(p)).join('')
        : `<div class="empty">Ingen planlagte økter i dag.</div>`;
      document.getElementById('upcomingList').innerHTML = upcomingItems.length
        ? upcomingItems.map(p => workoutCard(p)).join('')
        : `<div class="empty">Ingen kommende økter.</div>`;

      document.getElementById('planTemplate').innerHTML = state.templates.length
        ? state.templates.map(t => `<option value="${t.id}">${escapeHtml(t.name)} · ${escapeHtml(t.type)}</option>`).join('')
        : `<option value="">Lag en øktmal først</option>`;

      document.getElementById('templateList').innerHTML = state.templates.length
        ? state.templates.map(templateCard).join('')
        : `<div class="empty">Ingen øktmaler enda. Lag din første over.</div>`;

      const filter = document.getElementById('historyFilter')?.value || 'Alle';
      const sort = document.getElementById('historySort')?.value || 'desc';
      let completed = [...state.completed];
      if (filter !== 'Alle') completed = completed.filter(c => getTemplate(c.templateId).type === filter);
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

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register(`./service-worker.js?v=${APP_VERSION}`).catch(() => {});
      });
    };
