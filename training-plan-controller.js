import { normalizePeriodizedTrainingPlan } from './domain-periodized-training-plan.js';
import { capturePlanPrescription, normalizePlanChangeTracking } from './domain-template-snapshot-update.js';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TEMPLATE_SNAPSHOT_FIELDS = [
  'name', 'type', 'intensity', 'role', 'purpose', 'load', 'structure', 'sourceUrl',
  'structuredWorkout', 'exercisePlan', 'avoidWhen', 'roleClassificationVersion'
];

function plainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cloneValue(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function validIsoDate(value) {
  const text = String(value || '').trim();
  if (!ISO_DATE_PATTERN.test(text)) return '';
  const date = new Date(`${text}T12:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text ? '' : text;
}

function addIsoDays(value, days) {
  const iso = validIsoDate(value);
  if (!iso) return '';
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + Number(days || 0));
  return date.toISOString().slice(0, 10);
}

function isoWeekStart(value) {
  const iso = validIsoDate(value);
  if (!iso) return '';
  const date = new Date(`${iso}T12:00:00Z`);
  const weekday = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - weekday + 1);
  return date.toISOString().slice(0, 10);
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

function comparableRecord(value = {}) {
  const copy = { ...value };
  delete copy.updatedAt;
  return comparable(copy);
}

function stablePreviewId(planId, slotId) {
  return `planned-${String(planId || 'plan').replace(/[^a-zA-Z0-9_-]/g, '-')}-${String(slotId || 'slot').replace(/[^a-zA-Z0-9_-]/g, '-')}`;
}

function defaultTemplateSnapshot(template = {}) {
  return TEMPLATE_SNAPSHOT_FIELDS.reduce((snapshot, field) => {
    if (template[field] !== undefined) snapshot[field] = cloneValue(template[field]);
    return snapshot;
  }, { roleClassificationVersion: 2 });
}

function materializationWeeks(plan, today, scope = 'current_next') {
  if (scope === 'first_week') return plan.weeks.slice(0, 1);
  const currentWeekStart = isoWeekStart(today);
  const nextWeekStart = addIsoDays(currentWeekStart, 7);
  const selected = new Set([currentWeekStart, nextWeekStart].filter(Boolean));
  return plan.weeks.filter(week => selected.has(week.weekStart));
}

function slotKey(planId, slotId) {
  return `${String(planId || '')}::${String(slotId || '')}`;
}

function templateForSlot(slot, templates) {
  return (Array.isArray(templates) ? templates : []).find(template => String(template?.id || '') === String(slot?.templateId || '')) || null;
}

function planRefFor(plan, week, slot, prescriptionSnapshot, materialization = {}) {
  return {
    planId: plan.id,
    planRevision: plan.planRevision,
    weekStart: week.weekStart,
    weekIndex: week.index,
    slotId: slot.slotId,
    prescribedDate: slot.date,
    prescriptionSnapshot: cloneValue(prescriptionSnapshot),
    materializedAt: String(materialization.materializedAt || ''),
    materializationId: String(materialization.materializationId || '')
  };
}

function plannedRecordForSlot(plan, week, slot, template, {
  id,
  now,
  buildTemplateSnapshot = defaultTemplateSnapshot,
  materialization = {}
} = {}) {
  // Snapshot builders receive the template only. App-level helpers use their
  // second argument for a manual workout name, so passing slot/plan objects
  // here would persist "[object Object]" as the template name.
  const templateSnapshot = buildTemplateSnapshot(template) || defaultTemplateSnapshot(template);
  const base = normalizePlanChangeTracking({
    id: id || stablePreviewId(plan.id, slot.slotId),
    templateId: template.id,
    templateSnapshot: { ...cloneValue(templateSnapshot), roleClassificationVersion: 2 },
    date: slot.date,
    status: 'planned',
    notes: '',
    repeatGroupId: null,
    userModified: false,
    userModifiedFields: [],
    scheduleAdjustment: null,
    metadataRevision: null,
    planIntentOverride: null,
    planIntentBaseline: null,
    createdAt: now,
    updatedAt: now
  });
  const prescriptionSnapshot = capturePlanPrescription({
    ...base,
    role: slot.role,
    intensity: base.templateSnapshot?.intensity
  });
  return {
    ...base,
    planRef: planRefFor(plan, week, slot, prescriptionSnapshot, materialization)
  };
}

function diffRows(before = {}, after = {}) {
  const fields = [
    ['date', 'Dato'], ['templateId', 'Mal'], ['templateSnapshot', 'Malsnapshot'],
    ['planRef', 'Planreferanse'], ['scheduleAdjustment', 'Datoflytting'],
    ['metadataRevision', 'Metadataretting'], ['userModified', 'Intensjonsoverstyring']
  ];
  return fields
    .filter(([key]) => comparable(before?.[key]) !== comparable(after?.[key]))
    .map(([key, label]) => ({ key, label, before: comparable(before?.[key]), after: comparable(after?.[key]) }));
}

function samePlanSlot(item, plan, slot) {
  return String(item?.planRef?.planId || '') === String(plan.id || '')
    && String(item?.planRef?.slotId || '') === String(slot.slotId || '');
}

function metadataMatchesSlot(item, slot, expected) {
  const currentRole = String(item?.templateSnapshot?.role || item?.role || '');
  const expectedRole = String(slot?.role || expected?.templateSnapshot?.role || '');
  const currentIntensity = String(item?.templateSnapshot?.intensity || item?.intensity || '');
  const expectedIntensity = String(expected?.templateSnapshot?.intensity || '');
  return currentRole === expectedRole && (!expectedIntensity || currentIntensity === expectedIntensity);
}

function operationBase(type, reason, plan, week, slot, before = null, after = null) {
  return {
    id: `${type}:${plan.id}:${slot.slotId}`,
    type,
    reason,
    planId: plan.id,
    planRevision: plan.planRevision,
    weekStart: week.weekStart,
    weekIndex: week.index,
    slotId: slot.slotId,
    date: slot.date,
    role: slot.role,
    before: before ? cloneValue(before) : null,
    after: after ? cloneValue(after) : null,
    diff: diffRows(before || {}, after || {})
  };
}

function conflictOperation(reason, plan, week, slot, {
  before = null,
  after = null,
  blockingItems = [],
  allowedActions = [],
  selectedAction = null
} = {}) {
  return {
    ...operationBase('conflict', reason, plan, week, slot, before, after),
    blockingItems: cloneValue(blockingItems),
    blockingItemIds: blockingItems.map(item => String(item?.id || '')).filter(Boolean),
    allowedActions,
    selectedAction,
    requiresChoice: true
  };
}

function resolvedExistingOperation({ plan, week, slot, existing, expected, selectedAction }) {
  const tracked = normalizePlanChangeTracking(existing);
  const planningState = tracked.planRef?.planningState || expected.planRef?.planningState || '';
  const planExpected = tracked.planRef
    ? {
        ...expected,
        planRef: {
          ...expected.planRef,
          materializedAt: tracked.planRef.materializedAt || expected.planRef?.materializedAt || '',
          materializationId: tracked.planRef.materializationId || expected.planRef?.materializationId || '',
          ...(planningState ? { planningState } : {})
        }
      }
    : expected;
  if (tracked.scheduleAdjustment) {
    if (!selectedAction) {
      return conflictOperation('schedule_adjustment', plan, week, slot, {
        before: tracked,
        after: planExpected,
        allowedActions: ['keep_adjusted', 'use_plan_date']
      });
    }
    if (selectedAction === 'keep_adjusted') {
      return { ...operationBase('keep', 'schedule_adjustment_respected', plan, week, slot, tracked, tracked), selectedAction };
    }
    if (selectedAction === 'use_plan_date') {
      const next = { ...tracked, date: slot.date, scheduleAdjustment: null, planRef: planExpected.planRef, updatedAt: planExpected.updatedAt };
      return { ...operationBase('update', 'schedule_adjustment_explicitly_reset', plan, week, slot, tracked, next), selectedAction };
    }
  }
  if (tracked.userModified) {
    if (!selectedAction) {
      return conflictOperation('user_intent_override', plan, week, slot, {
        before: tracked,
        after: planExpected,
        allowedActions: ['keep_user_intent', 'restore_plan_intent']
      });
    }
    if (selectedAction === 'keep_user_intent') {
      return { ...operationBase('keep', 'user_intent_respected', plan, week, slot, tracked, tracked), selectedAction };
    }
    if (selectedAction === 'restore_plan_intent') {
      return { ...operationBase('update', 'plan_intent_explicitly_restored', plan, week, slot, tracked, planExpected), selectedAction };
    }
  }
  if (tracked.metadataRevision && !metadataMatchesSlot(tracked, slot, planExpected)) {
    if (selectedAction === 'keep_corrected_metadata') {
      return { ...operationBase('keep', 'metadata_revision_respected', plan, week, slot, tracked, tracked), selectedAction };
    }
    if (selectedAction === 'use_plan_metadata') {
      return { ...operationBase('update', 'plan_metadata_explicitly_restored', plan, week, slot, tracked, planExpected), selectedAction };
    }
    return conflictOperation('metadata_revision_mismatch', plan, week, slot, {
      before: tracked,
      after: planExpected,
      allowedActions: ['keep_corrected_metadata', 'use_plan_metadata'],
      selectedAction
    });
  }
  const next = tracked.metadataRevision
    ? { ...tracked, planRef: planExpected.planRef, updatedAt: planExpected.updatedAt }
    : {
        ...tracked,
        templateId: planExpected.templateId,
        templateSnapshot: planExpected.templateSnapshot,
        date: planExpected.date,
        status: tracked.status || planExpected.status,
        planRef: planExpected.planRef,
        updatedAt: planExpected.updatedAt
      };
  if (comparableRecord(tracked) === comparableRecord(next)) return operationBase('keep', 'already_materialized', plan, week, slot, tracked, tracked);
  return operationBase('update', tracked.metadataRevision ? 'metadata_revision_preserved' : 'plan_revision_changed', plan, week, slot, tracked, next);
}

export function buildTrainingPlanMaterializationPreview({
  plan: inputPlan = {},
  plannedItems = [],
  completedItems = [],
  templates = [],
  today,
  choices = {},
  rules,
  now = new Date().toISOString(),
  createId,
  buildTemplateSnapshot = defaultTemplateSnapshot,
  scope = 'current_next',
  materialization = {}
} = {}) {
  const plan = normalizePeriodizedTrainingPlan(inputPlan, { rules });
  const normalizedToday = validIsoDate(today);
  const operations = [];
  if (!normalizedToday) {
    return { ready: false, errors: ['today_invalid'], plan, window: null, operations, summary: {} };
  }
  if (!plan.canMaterialize || plan.status === 'cancelled' || plan.status === 'completed') {
    return { ready: false, errors: ['plan_not_materializable'], plan, window: null, operations, summary: {} };
  }
  const weeks = materializationWeeks(plan, normalizedToday, scope);
  const window = {
    currentWeekStart: isoWeekStart(normalizedToday),
    nextWeekStart: addIsoDays(isoWeekStart(normalizedToday), 7),
    weekStarts: weeks.map(week => week.weekStart)
  };
  const planned = Array.isArray(plannedItems) ? plannedItems : [];
  const completed = Array.isArray(completedItems) ? completedItems : [];
  const planSlots = new Set();

  weeks.forEach(week => {
    week.slots.forEach(slot => {
      planSlots.add(slotKey(plan.id, slot.slotId));
      const template = templateForSlot(slot, templates);
      if (!template) {
        operations.push(conflictOperation('template_missing', plan, week, slot, {
          allowedActions: ['choose_template', 'skip'],
          selectedAction: choices[slot.slotId]?.action || null
        }));
        return;
      }
      const id = typeof createId === 'function' ? createId(plan, week, slot) : stablePreviewId(plan.id, slot.slotId);
      const expected = plannedRecordForSlot(plan, week, slot, template, { id, now, buildTemplateSnapshot, materialization });
      const existingCompleted = completed.find(item => samePlanSlot(item, plan, slot));
      if (existingCompleted) {
        operations.push(operationBase('keep', 'completed_never_changes', plan, week, slot, existingCompleted, existingCompleted));
        return;
      }
      const existing = planned.find(item => samePlanSlot(item, plan, slot));
      if (existing) {
        if (validIsoDate(existing.date) && existing.date < normalizedToday) {
          operations.push(operationBase('keep', 'past_planned_never_changes', plan, week, slot, existing, existing));
          return;
        }
        operations.push(resolvedExistingOperation({
          plan,
          week,
          slot,
          existing,
          expected,
          selectedAction: choices[slot.slotId]?.action || null
        }));
        return;
      }
      if (slot.date < normalizedToday) {
        operations.push(operationBase('keep', 'past_slot_not_created', plan, week, slot));
        return;
      }
      const blockingItems = planned.filter(item => validIsoDate(item?.date) === slot.date && !samePlanSlot(item, plan, slot));
      if (blockingItems.length) {
        const selectedAction = choices[slot.slotId]?.action || null;
        if (selectedAction === 'skip') {
          operations.push({ ...operationBase('keep', 'manual_conflict_skipped', plan, week, slot), selectedAction });
        } else if (selectedAction === 'choose_another_date') {
          const alternateDate = validIsoDate(choices[slot.slotId]?.date);
          const withinWeek = alternateDate && alternateDate >= week.weekStart && alternateDate <= week.weekEnd;
          const alternateBlocking = withinWeek
            ? planned.filter(item => validIsoDate(item?.date) === alternateDate && !samePlanSlot(item, plan, slot))
            : blockingItems;
          if (withinWeek && !alternateBlocking.length) {
            const alternateSlot = { ...slot, date: alternateDate };
            const alternateExpected = plannedRecordForSlot(plan, week, alternateSlot, template, { id, now, buildTemplateSnapshot, materialization });
            operations.push({
              ...operationBase('create', 'manual_conflict_rescheduled', plan, week, alternateSlot, null, alternateExpected),
              selectedAction
            });
          } else {
            operations.push(conflictOperation('alternate_date_unavailable', plan, week, slot, {
              after: expected,
              blockingItems: alternateBlocking,
              allowedActions: ['choose_another_date', 'skip'],
              selectedAction
            }));
          }
        } else {
          const hasManual = blockingItems.some(item => !plainObject(item?.planRef));
          operations.push(conflictOperation(hasManual ? 'manual_workout' : 'other_plan', plan, week, slot, {
            after: expected,
            blockingItems,
            allowedActions: ['choose_another_date', 'skip'],
            selectedAction
          }));
        }
        return;
      }
      operations.push(operationBase('create', 'slot_missing', plan, week, slot, null, expected));
    });
  });

  planned
    .filter(item => String(item?.planRef?.planId || '') === plan.id)
    .filter(item => window.weekStarts.includes(String(item?.planRef?.weekStart || '')))
    .filter(item => !planSlots.has(slotKey(plan.id, item?.planRef?.slotId)))
    .forEach(item => {
      const week = weeks.find(candidate => candidate.weekStart === item.planRef.weekStart) || weeks[0];
      const slot = { slotId: item.planRef.slotId || item.id, date: item.date, role: item.templateSnapshot?.role || 'other' };
      if (!week || validIsoDate(item.date) < normalizedToday) {
        if (week) operations.push(operationBase('keep', 'orphan_past_never_changes', plan, week, slot, item, item));
        return;
      }
      const selectedAction = choices[slot.slotId]?.action || null;
      if (selectedAction === 'detach_keep_workout') {
        const detached = { ...cloneValue(item) };
        delete detached.planRef;
        operations.push({ ...operationBase('detach', 'slot_removed_keep_loose', plan, week, slot, item, detached), selectedAction });
        return;
      }
      if (selectedAction === 'remove_plan_workout') {
        operations.push({ ...operationBase('remove', 'slot_removed_delete', plan, week, slot, item, null), selectedAction });
        return;
      }
      operations.push(conflictOperation('slot_removed', plan, week, slot, {
        before: item,
        allowedActions: ['detach_keep_workout', 'remove_plan_workout'],
        selectedAction
      }));
    });

  const summary = ['create', 'update', 'remove', 'detach', 'keep', 'conflict'].reduce((result, type) => {
    result[type] = operations.filter(operation => operation.type === type).length;
    return result;
  }, {});
  summary.requiresChoice = operations.filter(operation => operation.requiresChoice).length;
  summary.total = operations.length;
  return {
    ready: summary.requiresChoice === 0,
    errors: [],
    plan,
    window,
    operations,
    summary,
    scope,
    writeEnabled: scope === 'first_week' && summary.requiresChoice === 0
  };
}

function materializationIdFor(plan, now) {
  const stamp = String(now || '').replace(/[^0-9]/g, '').slice(0, 17) || 'now';
  return `materialization-${String(plan?.id || 'plan').replace(/[^a-zA-Z0-9_-]/g, '-')}-${plan?.planRevision || 1}-${stamp}`;
}

export function buildFirstWeekMaterializationCommand(preview = {}, {
  materializationId = '',
  now = new Date().toISOString()
} = {}) {
  if (preview?.scope !== 'first_week' || !preview?.writeEnabled || !preview?.ready) {
    throw new Error('Første uke er ikke klar til å legges i kalenderen.');
  }
  const unsupported = (preview.operations || []).filter(operation => !['create', 'keep'].includes(operation.type));
  if (unsupported.length) throw new Error('Steg 2 kan bare opprette manglende økter og beholde eksisterende data.');
  const plan = normalizePeriodizedTrainingPlan(preview.plan);
  const firstWeek = plan.weeks[0];
  if (!firstWeek || preview.operations.some(operation => operation.weekIndex !== 1)) {
    throw new Error('Dette steget kan bare legge blokkens første uke i kalenderen.');
  }
  const id = materializationId || materializationIdFor(plan, now);
  const createdItems = preview.operations
    .filter(operation => operation.type === 'create')
    .map(operation => ({
      ...cloneValue(operation.after),
      planRef: {
        ...cloneValue(operation.after?.planRef),
        materializedAt: now,
        materializationId: id,
        planningState: firstWeek.planningState || 'normal'
      }
    }));
  const record = {
    id,
    planRevision: plan.planRevision,
    weekStart: firstWeek.weekStart,
    createdPlannedIds: createdItems.map(item => item.id),
    createdAt: now,
    undoneAt: '',
    status: 'applied'
  };
  const savedPlan = normalizePeriodizedTrainingPlan({
    ...plan,
    status: 'active',
    activatedAt: plan.activatedAt || now,
    updatedAt: now,
    materializations: [...(plan.materializations || []).filter(item => item.id !== id), record]
  });
  return {
    id,
    type: 'materialize_first_week',
    plan: savedPlan,
    plannedItems: createdItems,
    keptOperations: preview.operations.filter(operation => operation.type === 'keep').map(cloneValue),
    record
  };
}

export function buildUndoMaterializationCommand(planInput = {}, materializationId = '', {
  now = new Date().toISOString()
} = {}) {
  const plan = normalizePeriodizedTrainingPlan(planInput);
  const record = (plan.materializations || []).find(item => item.id === materializationId && item.status === 'applied');
  if (!record) throw new Error('Fant ingen økter fra planen som kan fjernes.');
  const updatedRecord = { ...record, status: 'undone', undoneAt: now };
  return {
    id: record.id,
    type: 'undo_materialization',
    plan: normalizePeriodizedTrainingPlan({
      ...plan,
      updatedAt: now,
      materializations: plan.materializations.map(item => item.id === record.id ? updatedRecord : item)
    }),
    planId: plan.id,
    planRevision: record.planRevision,
    plannedIds: [...record.createdPlannedIds],
    record: updatedRecord
  };
}

export function createTrainingPlanController({
  getState,
  getRules = () => undefined,
  now = () => new Date().toISOString(),
  createId,
  buildTemplateSnapshot,
  canWrite = () => ({ allowed: false, reason: 'Kalenderlagring er ikke tilgjengelig.' }),
  commitMaterialization,
  commitUndo
} = {}) {
  if (typeof getState !== 'function') throw new Error('Training plan controller requires getState');
  return {
    preview(plan, { today, choices = {}, scope = 'current_next', materialization = {} } = {}) {
      const state = getState() || {};
      return buildTrainingPlanMaterializationPreview({
        plan,
        plannedItems: state.planned,
        completedItems: state.completed,
        templates: state.templates,
        today,
        choices,
        rules: getRules(),
        now: now(),
        createId,
        buildTemplateSnapshot,
        scope,
        materialization
      });
    },
    writeAccess() {
      const access = typeof canWrite === 'function' ? canWrite() : false;
      return typeof access === 'object' ? access : { allowed: Boolean(access), reason: access ? '' : 'Kalenderlagring er ikke tilgjengelig.' };
    },
    prepareMaterialization(plan, { today, choices = {}, materializationId = '', preparedAt = now() } = {}) {
      const preview = this.preview(plan, {
        today,
        choices,
        scope: 'first_week',
        materialization: { materializationId, materializedAt: preparedAt }
      });
      return buildFirstWeekMaterializationCommand(preview, { materializationId, now: preparedAt });
    },
    async materialize(plan, options = {}) {
      const access = this.writeAccess();
      if (!access.allowed) throw new Error(access.reason || 'Uke 1 kan ikke legges i kalenderen.');
      if (typeof commitMaterialization !== 'function') throw new Error('Kalenderlagring er ikke tilgjengelig.');
      const command = this.prepareMaterialization(plan, options);
      await commitMaterialization(command);
      return command;
    },
    prepareUndo(plan, materializationId, options = {}) {
      return buildUndoMaterializationCommand(plan, materializationId, { now: options.undoneAt || now() });
    },
    async undo(plan, materializationId, options = {}) {
      const access = this.writeAccess();
      if (!access.allowed) throw new Error(access.reason || 'Angre er blokkert.');
      if (typeof commitUndo !== 'function') throw new Error('Skrivekobling for angre mangler.');
      const command = this.prepareUndo(plan, materializationId, options);
      await commitUndo(command);
      return command;
    }
  };
}
