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
  const updated = {
    ...record,
    templateId: String(templateId),
    templateSnapshot: versionedTemplateSnapshot(templateSnapshot, timestamp),
    templateSnapshotUpdatedAt: timestamp,
    templateSnapshotUpdateSource: 'manual_template_refresh',
    updatedAt: timestamp
  };
  if (kind === 'planned') {
    updated.userModified = true;
    updated.userModifiedFields = [...new Set([...(record.userModifiedFields || []), 'templateId', 'templateSnapshot'])];
  }
  return updated;
}

export function templateSnapshotUpdateAffectsRoleHistory(kind) {
  return kind === 'completed';
}

