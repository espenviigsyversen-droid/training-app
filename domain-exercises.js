export const EXERCISE_PLAN_VERSION = 1;
export const EXERCISE_BLOCK_TYPES = ['warmup', 'main', 'cooldown'];

const EXERCISE_BLOCK_TITLES = {
  warmup: 'Oppvarming',
  main: 'Hoveddel',
  cooldown: 'Nedtrapping'
};

function objectValue(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function text(value) {
  return String(value || '').trim();
}

function nonNegativeInteger(value) {
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

export function normalizeTextList(value = []) {
  const values = Array.isArray(value) ? value : String(value || '').split(',');
  return [...new Set(values.map(text).filter(Boolean))];
}

export function normalizeExerciseUrl(value = '') {
  const candidate = text(value);
  if (!candidate) return '';
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

export function normalizeExercise(exercise = {}) {
  const source = objectValue(exercise);
  return {
    ...source,
    id: text(source.id),
    name: text(source.name),
    description: text(source.description),
    muscleGroups: normalizeTextList(source.muscleGroups),
    purposeTags: normalizeTextList(source.purposeTags),
    equipment: text(source.equipment),
    mediaUrl: normalizeExerciseUrl(source.mediaUrl),
    createdAt: text(source.createdAt),
    updatedAt: text(source.updatedAt)
  };
}

export function normalizeExerciseLibrary(exercises = []) {
  return Array.isArray(exercises)
    ? exercises.map(normalizeExercise).filter(exercise => exercise.id && exercise.name)
    : [];
}

export function normalizeExerciseSnapshot(snapshot = {}) {
  const exercise = normalizeExercise(snapshot);
  if (!exercise.name) return null;
  return {
    id: exercise.id,
    name: exercise.name,
    description: exercise.description,
    muscleGroups: exercise.muscleGroups,
    purposeTags: exercise.purposeTags,
    equipment: exercise.equipment,
    mediaUrl: exercise.mediaUrl
  };
}

export function createExercisePrescription(exercise = {}, overrides = {}) {
  const normalizedExercise = normalizeExercise(exercise);
  return normalizeExercisePrescription({
    ...overrides,
    exerciseId: overrides.exerciseId || normalizedExercise.id,
    exerciseSnapshot: overrides.exerciseSnapshot || normalizedExercise
  });
}

export function normalizeExercisePrescription(prescription = {}) {
  const source = objectValue(prescription);
  const snapshot = normalizeExerciseSnapshot(source.exerciseSnapshot || source.exercise);
  const exerciseId = text(source.exerciseId || snapshot?.id);
  if (!exerciseId && !snapshot?.name) return null;
  return {
    id: text(source.id),
    exerciseId,
    exerciseSnapshot: snapshot,
    sets: nonNegativeInteger(source.sets),
    reps: text(source.reps),
    durationSeconds: nonNegativeInteger(source.durationSeconds),
    restSeconds: nonNegativeInteger(source.restSeconds),
    loadText: text(source.loadText),
    note: text(source.note)
  };
}

export function normalizeExerciseBlock(block = {}) {
  const source = objectValue(block);
  const exercises = Array.isArray(source.exercises)
    ? source.exercises.map(normalizeExercisePrescription).filter(Boolean)
    : [];
  if (!exercises.length) return null;
  const candidateType = text(source.type).toLowerCase();
  const type = EXERCISE_BLOCK_TYPES.includes(candidateType) ? candidateType : 'main';
  return {
    id: text(source.id),
    type,
    title: text(source.title) || EXERCISE_BLOCK_TITLES[type],
    exercises
  };
}

export function normalizeExercisePlan(plan = null) {
  const source = objectValue(plan);
  const blocks = Array.isArray(source.blocks)
    ? source.blocks.map(normalizeExerciseBlock).filter(Boolean)
    : [];
  if (!blocks.length) return null;
  return {
    version: EXERCISE_PLAN_VERSION,
    kind: text(source.kind) || (blocks.some(block => block.type !== 'main') ? 'exercise-blocks' : 'strength'),
    sourceUrl: normalizeExerciseUrl(source.sourceUrl),
    notes: text(source.notes),
    blocks
  };
}

export function exercisePrescriptionLabel(prescription = {}) {
  const item = normalizeExercisePrescription(prescription);
  if (!item) return '';
  const duration = item.durationSeconds >= 60 && item.durationSeconds % 60 === 0
    ? `${item.durationSeconds / 60} min`
    : `${item.durationSeconds} sek`;
  const amount = item.durationSeconds
    ? `${item.sets || 1} x ${duration}`
    : [item.sets, item.reps].filter(Boolean).join(' x ');
  return [
    item.exerciseSnapshot?.name || 'Øvelse',
    amount,
    item.loadText
  ].filter(Boolean).join(' · ');
}

export function exercisePlanBlock(plan = null, type = 'main') {
  const normalized = normalizeExercisePlan(plan);
  return normalized?.blocks.find(block => block.type === type) || null;
}

export function exercisePlanBlockSummary(block = null) {
  const normalized = normalizeExerciseBlock(block);
  if (!normalized) return '';
  const count = normalized.exercises.length;
  return `${normalized.title}: ${count} ${count === 1 ? 'øvelse' : 'øvelser'}`;
}

export function exercisePlanItems(plan = null) {
  const normalized = normalizeExercisePlan(plan);
  return normalized
    ? normalized.blocks.flatMap(block => block.exercises)
    : [];
}

export function exercisePlanSummary(plan = null) {
  const items = exercisePlanItems(plan);
  if (!items.length) return '';
  const names = items.slice(0, 3).map(item => item.exerciseSnapshot?.name || 'Øvelse');
  const remainder = items.length > names.length ? ` +${items.length - names.length}` : '';
  return `${items.length} ${items.length === 1 ? 'øvelse' : 'øvelser'} · ${names.join(', ')}${remainder}`;
}

export function exercisePlanSearchText(plan = null) {
  const normalized = normalizeExercisePlan(plan);
  if (!normalized) return '';
  return [
    normalized.notes,
    normalized.sourceUrl,
    ...normalized.blocks.flatMap(block => [
      block.title,
      ...block.exercises.flatMap(item => [
        item.exerciseSnapshot?.name,
        item.exerciseSnapshot?.description,
        ...(item.exerciseSnapshot?.muscleGroups || []),
        ...(item.exerciseSnapshot?.purposeTags || []),
        item.loadText,
        item.note
      ])
    ])
  ].filter(Boolean).join(' ');
}
