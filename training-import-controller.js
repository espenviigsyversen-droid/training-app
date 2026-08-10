import {
  garminDuplicateFor,
  mergeGarminIntoCompleted,
  parseGarminActivitiesCsv,
  suggestGarminMatches
} from './garmin-csv-import.js';

export const GARMIN_IMPORT_MAX_FILE_BYTES = 5 * 1024 * 1024;
export const GARMIN_IMPORT_MAX_ROWS = 2000;

export const GARMIN_ENRICHMENT_FIELDS = [
  'durationSeconds',
  'durationMinutes',
  'distanceKm',
  'averageSpeedKmh',
  'paceSecondsPerKm',
  'avgHeartRate',
  'maxHeartRate',
  'elevationGainM',
  'activitySetting'
];

export const GARMIN_ENRICHMENT_LABELS = {
  durationSeconds: 'varighet',
  durationMinutes: 'varighet i minutter',
  distanceKm: 'distanse',
  averageSpeedKmh: 'snittfart',
  paceSecondsPerKm: 'tempo',
  avgHeartRate: 'snittpuls',
  maxHeartRate: 'makspuls',
  elevationGainM: 'høydemeter',
  activitySetting: 'aktivitetsmiljø'
};

function plainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function targetKey(kind, id) {
  return `${kind}:${String(id || '')}`;
}

function resolvedTemplate(item, resolveTemplate) {
  if (typeof resolveTemplate === 'function') return plainObject(resolveTemplate(item));
  return plainObject(item?.templateSnapshot || item?.template);
}

function targetLabel(item, template) {
  return String(item?.manualName || template?.name || 'Økt').trim().slice(0, 160) || 'Økt';
}

function matchTarget(item, kind, resolveTemplate) {
  const template = resolvedTemplate(item, resolveTemplate);
  return {
    ...item,
    template,
    templateSnapshot: item?.templateSnapshot || template,
    activityType: item?.activityType || template.type || ''
  };
}

function comparable(value) {
  if (value === '' || value === null || value === undefined) return '';
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : String(value).trim();
}

export function garminMergeConflicts(existing, candidate) {
  const current = plainObject(existing);
  const draft = plainObject(candidate?.completedDraft || candidate);
  return GARMIN_ENRICHMENT_FIELDS.flatMap(field => {
    const existingValue = comparable(current[field]);
    const importedValue = comparable(draft[field]);
    if (existingValue === '' || importedValue === '' || existingValue === importedValue) return [];
    return [{
      field,
      label: GARMIN_ENRICHMENT_LABELS[field] || field,
      existingValue: current[field],
      importedValue: draft[field]
    }];
  });
}

function previewMatch(match, kind, resolveTemplate) {
  const item = match.target;
  const template = resolvedTemplate(item, resolveTemplate);
  return {
    key: targetKey(kind, item.id),
    kind,
    id: item.id,
    label: targetLabel(item, template),
    date: item.date || '',
    level: match.level,
    score: match.score,
    reasons: [...match.reasons],
    item,
    conflicts: kind === 'completed' ? garminMergeConflicts(item, match.candidate) : []
  };
}

function buildMatches(candidate, completedItems, plannedItems, resolveTemplate) {
  const completedTargets = completedItems.map(item => matchTarget(item, 'completed', resolveTemplate));
  const plannedTargets = plannedItems
    .filter(item => item?.status !== 'done')
    .map(item => matchTarget(item, 'planned', resolveTemplate));
  const completedById = new Map(completedItems.map(item => [item.id, item]));
  const plannedById = new Map(plannedItems.map(item => [item.id, item]));
  const completedMatches = suggestGarminMatches(candidate, completedTargets).map(match => ({
    ...match,
    candidate,
    target: completedById.get(match.target.id) || match.target
  }));
  const plannedMatches = suggestGarminMatches(candidate, plannedTargets).map(match => ({
    ...match,
    candidate,
    target: plannedById.get(match.target.id) || match.target
  }));
  return [
    ...completedMatches.map(match => previewMatch(match, 'completed', resolveTemplate)),
    ...plannedMatches.map(match => previewMatch(match, 'planned', resolveTemplate))
  ].sort((left, right) => right.score - left.score);
}

export function createGarminImportPreview(csvText, {
  completedItems = [],
  plannedItems = [],
  resolveTemplate,
  maxRows = GARMIN_IMPORT_MAX_ROWS
} = {}) {
  if (typeof csvText !== 'string' || !csvText.trim()) throw new Error('CSV-filen er tom.');
  const parsed = parseGarminActivitiesCsv(csvText);
  const totalRows = parsed.activities.length + parsed.rejectedRows.length;
  if (totalRows > maxRows) throw new Error(`CSV-filen har ${totalRows} aktivitetsrader. Maksgrensen er ${maxRows}.`);

  const completed = Array.isArray(completedItems) ? completedItems : [];
  const planned = Array.isArray(plannedItems) ? plannedItems : [];
  const rows = parsed.activities.map(candidate => {
    const duplicate = garminDuplicateFor(candidate, completed);
    const matches = duplicate ? [] : buildMatches(candidate, completed, planned, resolveTemplate);
    const selectedTargetKey = matches[0]?.key || '';
    return {
      candidate,
      fingerprint: candidate.fingerprint,
      duplicate,
      matches,
      selectedTargetKey,
      action: duplicate ? 'skip' : 'review',
      overwriteFields: []
    };
  });

  return {
    version: 1,
    source: parsed.source,
    headers: parsed.headers,
    rows,
    rejectedRows: parsed.rejectedRows,
    createdAt: new Date().toISOString()
  };
}

function selectedMatch(row) {
  return row.matches.find(match => match.key === row.selectedTargetKey) || null;
}

function cleanTemplateSnapshot(template, fallbackName, fallbackType) {
  const source = plainObject(template);
  return {
    id: String(source.id || ''),
    name: String(source.name || fallbackName || 'Garmin-økt').slice(0, 160),
    type: String(source.type || fallbackType || 'Annet').slice(0, 80),
    intensity: String(source.intensity || '').slice(0, 80),
    role: String(source.role || '').slice(0, 80),
    purpose: String(source.purpose || '').slice(0, 80),
    load: String(source.load || '').slice(0, 40),
    structure: String(source.structure || '').slice(0, 4000),
    sourceUrl: String(source.sourceUrl || '').slice(0, 500),
    structuredWorkout: source.structuredWorkout || null,
    exercisePlan: source.exercisePlan || null
  };
}

function materializeCompleted(candidate, { id, now, planned = null, resolveTemplate } = {}) {
  const draft = plainObject(candidate?.completedDraft);
  const linkedTemplate = planned ? resolvedTemplate(planned, resolveTemplate) : null;
  const templateSnapshot = cleanTemplateSnapshot(
    linkedTemplate,
    draft.manualName || draft.activityType,
    draft.activityType
  );
  const withProvenance = mergeGarminIntoCompleted({}, candidate, { importedAt: now });
  const completed = {
    id,
    templateId: planned?.templateId || '',
    templateSnapshot,
    plannedWorkoutId: planned?.id || '',
    date: draft.date || '',
    manualName: planned ? '' : String(draft.manualName || '').slice(0, 160),
    durationSeconds: Number(draft.durationSeconds) || 0,
    durationMinutes: Number(draft.durationMinutes) || 0,
    distanceKm: Number(draft.distanceKm) || 0,
    activitySetting: String(draft.activitySetting || ''),
    source: 'garmin_csv',
    externalData: withProvenance.externalData,
    completedAt: now
  };
  ['averageSpeedKmh', 'paceSecondsPerKm', 'avgHeartRate', 'maxHeartRate', 'elevationGainM'].forEach(field => {
    if (draft[field] !== '' && draft[field] !== null && draft[field] !== undefined && Number.isFinite(Number(draft[field]))) {
      completed[field] = Number(draft[field]);
    }
  });
  return completed;
}

export function buildGarminImportCommit(preview, {
  createId,
  now = new Date().toISOString(),
  resolveTemplate
} = {}) {
  if (!preview || !Array.isArray(preview.rows)) throw new Error('Importforhåndsvisningen mangler.');
  if (typeof createId !== 'function') throw new Error('Importen mangler en trygg ID-generator.');
  const unresolved = preview.rows.filter(row => row.action === 'review');
  if (unresolved.length) throw new Error(`${unresolved.length} aktiviteter mangler valgt handling.`);

  const completedItems = [];
  const plannedItems = [];
  const usedTargets = new Set();
  const stats = { imported: 0, enriched: 0, linked: 0, skipped: 0, duplicates: 0 };

  preview.rows.forEach(row => {
    if (row.duplicate) {
      stats.duplicates += 1;
      return;
    }
    if (row.action === 'skip') {
      stats.skipped += 1;
      return;
    }
    if (row.action === 'create') {
      completedItems.push(materializeCompleted(row.candidate, {
        id: createId('completed'), now, resolveTemplate
      }));
      stats.imported += 1;
      return;
    }

    const match = selectedMatch(row);
    if (!match) throw new Error(`Rad ${row.candidate?.rowNumber || '?'} mangler valgt treff.`);
    if (usedTargets.has(match.key)) throw new Error(`Flere Garmin-aktiviteter er koblet til samme økt: ${match.label}.`);
    usedTargets.add(match.key);

    if (row.action === 'enrich' && match.kind === 'completed') {
      completedItems.push({
        ...mergeGarminIntoCompleted(match.item, row.candidate, {
          overwriteFields: row.overwriteFields || [],
          importedAt: now
        }),
        updatedAt: now
      });
      stats.enriched += 1;
      return;
    }
    if (row.action === 'link' && match.kind === 'planned') {
      const completed = materializeCompleted(row.candidate, {
        id: createId('completed'), now, planned: match.item, resolveTemplate
      });
      completedItems.push(completed);
      plannedItems.push({
        ...match.item,
        status: 'done',
        completedWorkoutId: completed.id,
        completedAt: now
      });
      stats.linked += 1;
      return;
    }
    throw new Error(`Ugyldig handling for rad ${row.candidate?.rowNumber || '?'}.`);
  });

  return {
    completedItems,
    plannedItems,
    rejectedRows: [...(preview.rejectedRows || [])],
    stats: { ...stats, rejected: preview.rejectedRows?.length || 0 },
    operationCount: completedItems.length + plannedItems.length
  };
}
