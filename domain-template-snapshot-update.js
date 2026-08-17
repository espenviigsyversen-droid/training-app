const SNAPSHOT_FIELDS = [
  ['name', 'Øktnavn'],
  ['type', 'Aktivitetstype'],
  ['intensity', 'Intensitet'],
  ['role', 'Rolle'],
  ['purpose', 'Formål'],
  ['load', 'Belastning'],
  ['structure', 'Struktur'],
  ['sourceUrl', 'Øktlenke'],
  ['structuredWorkout', 'Strukturert intervall'],
  ['exercisePlan', 'Øvelsesplan'],
  ['roleClassificationVersion', 'Rollemodell']
];

const PLAN_INTENT_FIELDS = new Set([
  'templateId',
  'templateSnapshot',
  'role',
  'intensity',
  'structure',
  'targetDurationSeconds',
  'targetDistanceKm'
]);

function uniqueText(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).map(value => String(value || '').trim()).filter(Boolean))];
}

function cloneValue(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function validIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) ? String(value) : '';
}

function addIsoDays(value, days) {
  const date = validIsoDate(value);
  if (!date) return '';
  const parsed = new Date(`${date}T12:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + Number(days || 0));
  return parsed.toISOString().slice(0, 10);
}

function normalizedMetadataRevision(record = {}, timestamp = '') {
  const existing = record?.metadataRevision && typeof record.metadataRevision === 'object'
    ? record.metadataRevision
    : {};
  return {
    ...existing,
    source: 'manual_template_refresh',
    changedAt: String(timestamp || existing.changedAt || existing.revisedAt || new Date().toISOString()),
    templateId: String(record.templateId || existing.templateId || ''),
    roleClassificationVersion: 2
  };
}

function isV176sSnapshotOnlyOverride(record = {}) {
  const fields = uniqueText(record.userModifiedFields);
  const manualRefresh = record.templateSnapshotUpdateSource === 'manual_template_refresh'
    || record.templateSnapshot?.snapshotUpdateSource === 'manual_template_refresh';
  return record.userModified === true
    && manualRefresh
    && fields.length > 0
    && fields.every(field => field === 'templateId' || field === 'templateSnapshot')
    && !record.planIntentOverride;
}

export function normalizePlanChangeTracking(record = {}) {
  const normalized = {
    ...record,
    userModified: record.userModified === true,
    userModifiedFields: uniqueText(record.userModifiedFields)
  };
  if (isV176sSnapshotOnlyOverride(record)) {
    normalized.userModified = false;
    normalized.userModifiedFields = [];
    normalized.metadataRevision = normalizedMetadataRevision(record, record.templateSnapshotUpdatedAt || record.updatedAt);
  }
  return normalized;
}

function comparable(value) {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value !== 'object') return String(value);
  if (Array.isArray(value)) return JSON.stringify(value.map(item => comparableObject(item)));
  return JSON.stringify(comparableObject(value));
}

function comparableObject(value) {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(comparableObject);
  return Object.keys(value).sort().reduce((result, key) => {
    const normalized = comparableObject(value[key]);
    if (normalized !== undefined) result[key] = normalized;
    return result;
  }, {});
}

export function buildTemplateSnapshotDiff({ currentTemplateId = '', currentSnapshot = {}, nextTemplateId = '', nextSnapshot = {} } = {}) {
  const rows = [];
  if (String(currentTemplateId || '') !== String(nextTemplateId || '')) {
    rows.push({ key: 'templateId', label: 'Kildemal', before: String(currentTemplateId || ''), after: String(nextTemplateId || '') });
  }
  SNAPSHOT_FIELDS.forEach(([key, label]) => {
    const before = comparable(currentSnapshot?.[key]);
    const after = comparable(nextSnapshot?.[key]);
    if (before !== after) rows.push({ key, label, before, after });
  });
  return rows;
}

export function versionedTemplateSnapshot(snapshot = {}, updatedAt = new Date().toISOString()) {
  return {
    ...snapshot,
    roleClassificationVersion: 2,
    snapshotUpdatedAt: updatedAt,
    snapshotUpdateSource: 'manual_template_refresh'
  };
}

export function applyExplicitTemplateSnapshotUpdate(record = {}, { kind, templateId, templateSnapshot, updatedAt } = {}) {
  if (!['planned', 'completed'].includes(kind)) throw new Error('Ugyldig økttype for snapshot-oppdatering.');
  if (!record?.id || !templateId || !templateSnapshot) throw new Error('Økt, mal og snapshot må være angitt.');
  const timestamp = String(updatedAt || new Date().toISOString());
  const tracked = normalizePlanChangeTracking(record);
  return {
    ...tracked,
    templateId: String(templateId),
    templateSnapshot: versionedTemplateSnapshot(templateSnapshot, timestamp),
    templateSnapshotUpdatedAt: timestamp,
    templateSnapshotUpdateSource: 'manual_template_refresh',
    metadataRevision: normalizedMetadataRevision({ ...tracked, templateId: String(templateId) }, timestamp),
    updatedAt: timestamp
  };
}

export function applyScheduleAdjustment(record = {}, { newDate, changedAt, reason = 'user_reschedule' } = {}) {
  const nextDate = validIsoDate(newDate);
  if (!record?.id || !nextDate) throw new Error('Økt og ny dato må være angitt.');
  const timestamp = String(changedAt || new Date().toISOString());
  const tracked = normalizePlanChangeTracking(record);
  const originalDate = validIsoDate(tracked.scheduleAdjustment?.originalDate) || validIsoDate(tracked.date);
  const planWeekStart = validIsoDate(tracked.planRef?.weekStart);
  const outsidePlanWeek = Boolean(planWeekStart && (nextDate < planWeekStart || nextDate > addIsoDays(planWeekStart, 6)));
  return {
    ...tracked,
    date: nextDate,
    scheduleAdjustment: {
      originalDate,
      adjustedDate: nextDate,
      adjustedAt: timestamp,
      reason: String(reason || 'user_reschedule'),
      state: outsidePlanWeek ? 'rescheduled_out' : 'rescheduled'
    },
    updatedAt: timestamp
  };
}

export function clearScheduleAdjustment(record = {}, { planDate, updatedAt } = {}) {
  const nextDate = validIsoDate(planDate) || validIsoDate(record.scheduleAdjustment?.originalDate);
  if (!record?.id || !nextDate) throw new Error('Planens dato er ikke tilgjengelig.');
  return {
    ...normalizePlanChangeTracking(record),
    date: nextDate,
    scheduleAdjustment: null,
    updatedAt: String(updatedAt || new Date().toISOString())
  };
}

export function capturePlanPrescription(record = {}) {
  const snapshot = {};
  PLAN_INTENT_FIELDS.forEach(field => {
    if (record[field] !== undefined) snapshot[field] = cloneValue(record[field]);
  });
  return snapshot;
}

export function applyPlanIntentOverride(record = {}, { updates = {}, fields = [], updatedAt, prescriptionSnapshot } = {}) {
  if (!record?.id) throw new Error('Planlagt økt må være angitt.');
  const changedFields = uniqueText(fields).filter(field => PLAN_INTENT_FIELDS.has(field));
  if (!changedFields.length) throw new Error('Ingen planstyrte felt er valgt.');
  const timestamp = String(updatedAt || new Date().toISOString());
  const tracked = normalizePlanChangeTracking(record);
  const prescription = prescriptionSnapshot || tracked.planRef?.prescriptionSnapshot || capturePlanPrescription(tracked);
  const next = { ...tracked };
  changedFields.forEach(field => {
    if (Object.prototype.hasOwnProperty.call(updates, field)) next[field] = cloneValue(updates[field]);
  });
  next.userModified = true;
  next.userModifiedFields = uniqueText([...tracked.userModifiedFields, ...changedFields]);
  next.planIntentOverride = { active: true, changedAt: timestamp, fields: [...next.userModifiedFields] };
  next.planIntentBaseline = cloneValue(tracked.planIntentBaseline || prescription);
  if (tracked.planRef) {
    next.planRef = {
      ...tracked.planRef,
      prescriptionSnapshot: cloneValue(tracked.planRef.prescriptionSnapshot || prescription)
    };
  }
  next.updatedAt = timestamp;
  return next;
}

export function buildPlanIntentResetDiff(record = {}, prescriptionSnapshot = record?.planRef?.prescriptionSnapshot || record?.planIntentBaseline || {}) {
  const prescribed = prescriptionSnapshot && typeof prescriptionSnapshot === 'object' ? prescriptionSnapshot : {};
  return uniqueText(record.userModifiedFields)
    .filter(field => PLAN_INTENT_FIELDS.has(field) && Object.prototype.hasOwnProperty.call(prescribed, field))
    .filter(field => comparable(record[field]) !== comparable(prescribed[field]))
    .map(field => ({
      key: field,
      label: SNAPSHOT_FIELDS.find(([key]) => key === field)?.[1]
        || ({ templateId: 'Kildemal', targetDurationSeconds: 'Målvarighet', targetDistanceKm: 'Måldistanse' })[field]
        || field,
      before: comparable(record[field]),
      after: comparable(prescribed[field])
    }));
}

export function resetPlanIntentOverride(record = {}, { prescriptionSnapshot, updatedAt } = {}) {
  if (!record?.id) throw new Error('Planlagt økt må være angitt.');
  const prescribed = prescriptionSnapshot || record.planRef?.prescriptionSnapshot || record.planIntentBaseline;
  if (!prescribed || typeof prescribed !== 'object') throw new Error('Planens opprinnelige innhold er ikke tilgjengelig.');
  const next = { ...normalizePlanChangeTracking(record) };
  uniqueText(next.userModifiedFields).forEach(field => {
    if (PLAN_INTENT_FIELDS.has(field) && Object.prototype.hasOwnProperty.call(prescribed, field)) {
      next[field] = cloneValue(prescribed[field]);
    }
  });
  next.userModified = false;
  next.userModifiedFields = [];
  next.planIntentOverride = null;
  next.planIntentBaseline = null;
  next.updatedAt = String(updatedAt || new Date().toISOString());
  return next;
}

export function planTrackingForCompletion(record = {}) {
  const tracked = normalizePlanChangeTracking(record);
  return {
    ...(tracked.planRef ? { planRef: cloneValue(tracked.planRef) } : {}),
    ...(tracked.scheduleAdjustment ? { scheduleAdjustment: cloneValue(tracked.scheduleAdjustment) } : {}),
    ...(tracked.metadataRevision ? { metadataRevision: cloneValue(tracked.metadataRevision) } : {}),
    ...(tracked.planIntentOverride ? { planIntentOverride: cloneValue(tracked.planIntentOverride) } : {}),
    ...(tracked.planIntentBaseline ? { planIntentBaseline: cloneValue(tracked.planIntentBaseline) } : {}),
    userModified: tracked.userModified === true,
    userModifiedFields: [...tracked.userModifiedFields]
  };
}

export function templateSnapshotUpdateAffectsRoleHistory(kind) {
  return kind === 'completed';
}

