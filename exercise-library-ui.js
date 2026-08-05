import { normalizeExercise, normalizeTextList } from './domain-exercises.js';

function compareText(a, b) {
  return String(a || '').localeCompare(String(b || ''), 'nb', {
    numeric: true,
    sensitivity: 'base'
  });
}

export function filterExercises(exercises = [], query = '') {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  return [...exercises]
    .sort((a, b) => compareText(a.name, b.name))
    .filter(exercise => {
      if (!normalizedQuery) return true;
      return [
        exercise.name,
        exercise.description,
        exercise.equipment,
        ...(exercise.muscleGroups || []),
        ...(exercise.purposeTags || [])
      ].filter(Boolean).join(' ').toLowerCase().includes(normalizedQuery);
    });
}

export function createExerciseLibraryUi({
  getState,
  documentRef = globalThis.document,
  escapeHtml
}) {
  function element(id) {
    return documentRef.getElementById(id);
  }

  function setFormVisible(visible, { focus = true } = {}) {
    const panel = element('exerciseEditorPanel');
    if (!panel) return;
    panel.classList.toggle('hidden', !visible);
    if (visible) {
      panel.scrollIntoView?.({ block: 'start', behavior: 'smooth' });
      if (focus) element('exerciseName')?.focus();
    }
  }

  function startNewForm() {
    clearForm({ keepOpen: true });
    if (element('exerciseEditorTitle')) element('exerciseEditorTitle').textContent = 'Ny øvelse';
    setFormVisible(true);
  }

  function readForm() {
    const name = element('exerciseName')?.value.trim() || '';
    if (!name) return { ok: false, error: 'Skriv inn navn på øvelsen først.' };
    return {
      ok: true,
      editingId: element('editingExerciseId')?.value || '',
      data: normalizeExercise({
        name,
        description: element('exerciseDescription')?.value,
        muscleGroups: normalizeTextList(element('exerciseMuscleGroups')?.value),
        purposeTags: normalizeTextList(element('exercisePurposeTags')?.value),
        equipment: element('exerciseEquipment')?.value,
        mediaUrl: element('exerciseMediaUrl')?.value
      })
    };
  }

  function fillForm(exercise) {
    if (!exercise) return;
    setFormVisible(true, { focus: false });
    element('editingExerciseId').value = exercise.id;
    element('exerciseName').value = exercise.name || '';
    element('exerciseDescription').value = exercise.description || '';
    element('exerciseMuscleGroups').value = (exercise.muscleGroups || []).join(', ');
    element('exercisePurposeTags').value = (exercise.purposeTags || []).join(', ');
    element('exerciseEquipment').value = exercise.equipment || '';
    element('exerciseMediaUrl').value = exercise.mediaUrl || '';
    element('exerciseSubmitBtn').textContent = 'Lagre endringer';
    element('cancelEditExerciseBtn').classList.remove('hidden');
    if (element('exerciseEditorTitle')) element('exerciseEditorTitle').textContent = `Rediger ${exercise.name || 'øvelse'}`;
    element('exerciseName')?.focus();
  }

  function clearForm({ keepOpen = false } = {}) {
    [
      'editingExerciseId',
      'exerciseName',
      'exerciseDescription',
      'exerciseMuscleGroups',
      'exercisePurposeTags',
      'exerciseEquipment',
      'exerciseMediaUrl'
    ].forEach(id => { if (element(id)) element(id).value = ''; });
    if (element('exerciseSubmitBtn')) element('exerciseSubmitBtn').textContent = 'Lagre øvelse';
    element('cancelEditExerciseBtn')?.classList.add('hidden');
    if (element('exerciseEditorTitle')) element('exerciseEditorTitle').textContent = 'Ny øvelse';
    if (!keepOpen) setFormVisible(false, { focus: false });
  }

  function exerciseCard(exercise) {
    const details = [
      ...(exercise.muscleGroups || []),
      ...(exercise.purposeTags || []),
      exercise.equipment
    ].filter(Boolean);
    return `
      <article class="exercise-library-card">
        <div class="exercise-library-copy">
          <h3>${escapeHtml(exercise.name)}</h3>
          ${details.length ? `<p class="exercise-meta">${details.map(escapeHtml).join(' · ')}</p>` : ''}
          ${exercise.description ? `<p>${escapeHtml(exercise.description)}</p>` : ''}
          ${exercise.mediaUrl ? `<a href="${escapeHtml(exercise.mediaUrl)}" target="_blank" rel="noopener noreferrer">Se demonstrasjon</a>` : ''}
        </div>
        <div class="exercise-library-actions">
          <button class="secondary compact-btn" onclick="editExercise('${exercise.id}')">Rediger</button>
          <button class="ghost danger-link compact-btn" onclick="deleteExercise('${exercise.id}')">Slett</button>
        </div>
      </article>
    `;
  }

  function renderLibrary() {
    const state = getState();
    const list = element('exerciseLibraryList');
    const summary = element('exerciseLibrarySummary');
    if (!list) return;
    const exercises = filterExercises(state.exercises || [], element('exerciseSearch')?.value);
    if (summary) {
      summary.textContent = exercises.length === (state.exercises || []).length
        ? `${exercises.length} ${exercises.length === 1 ? 'øvelse' : 'øvelser'} i biblioteket.`
        : `${exercises.length} av ${(state.exercises || []).length} øvelser vises.`;
    }
    list.innerHTML = exercises.length
      ? exercises.map(exerciseCard).join('')
      : '<div class="empty">Ingen øvelser matcher søket.</div>';
  }

  return {
    readForm,
    fillForm,
    clearForm,
    startNewForm,
    setFormVisible,
    renderLibrary
  };
}
