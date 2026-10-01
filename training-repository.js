import { confirmWorkoutRole } from './domain-training-plan.js';

export const TRAINING_DATA_COLLECTIONS = [
  'exercises',
  'templates',
  'planned',
  'completed',
  'wellness',
  'challenges',
  'blockedDays',
  'raceResults',
  'continuityFreezes',
  'heartRateZoneSets',
  'trainingPlans',
  'weeklyTargetSnapshots'
];

export function createTrainingRepository({
  db,
  getCurrentUser,
  firestore,
  normalizeState,
  defaultSettings,
  dataCollections = TRAINING_DATA_COLLECTIONS
}) {
  const {
    collection,
    doc,
    getDoc,
    getDocs,
    getDocFromServer,
    getDocsFromServer,
    setDoc,
    deleteDoc,
    writeBatch,
    waitForPendingWrites,
    runTransaction,
    query,
    where,
    orderBy,
    limit
  } = firestore || {};

  if (!db || typeof getCurrentUser !== 'function' || typeof normalizeState !== 'function') {
    throw new Error('Training repository is missing required dependencies');
  }

  function currentUserId() {
    const user = getCurrentUser();
    if (!user?.uid) throw new Error('No authenticated user');
    return user.uid;
  }

  function userCollection(name) {
    return collection(db, 'users', currentUserId(), name);
  }

  function userDocument(name, id) {
    return doc(db, 'users', currentUserId(), name, id);
  }

  async function set(name, id, data) {
    const { id: _id, ...rest } = data;
    await setDoc(userDocument(name, id), rest);
  }

  async function remove(name, id) {
    await deleteDoc(userDocument(name, id));
  }

  async function batchSet(name, items) {
    if (!items.length) return;
    const batch = writeBatch(db);
    items.forEach(item => {
      const { id, ...rest } = item;
      batch.set(userDocument(name, id), rest);
    });
    await batch.commit();
  }

  async function prepareWeeklyTargetFinalization({ completedStart, completedEnd, weekStarts = [] } = {}) {
    if (typeof waitForPendingWrites !== 'function'
      || typeof getDocFromServer !== 'function'
      || typeof getDocsFromServer !== 'function'
      || typeof query !== 'function'
      || typeof where !== 'function'
      || typeof orderBy !== 'function'
      || typeof limit !== 'function') {
      throw new Error('Server-confirmed weekly target finalization is unavailable');
    }
    await waitForPendingWrites(db);
    const completedRef = userCollection('completed');
    const rangeQuery = query(
      completedRef,
      where('date', '>=', completedStart),
      where('date', '<=', completedEnd),
      orderBy('date', 'asc')
    );
    const predecessorQuery = query(
      completedRef,
      where('date', '<', completedStart),
      orderBy('date', 'desc'),
      limit(1)
    );
    const targetSnapshotReads = Promise.all([...new Set(weekStarts)].map(async weekStart => ({
      weekStart,
      snapshot: await getDocFromServer(userDocument('weeklyTargetSnapshots', weekStart))
    })));
    const [settingsSnapshot, rangeSnapshot, predecessorSnapshot, freezeSnapshot, targetSnapshots] = await Promise.all([
      getDocFromServer(userDocument('settings', 'preferences')),
      getDocsFromServer(rangeQuery),
      getDocsFromServer(predecessorQuery),
      getDocsFromServer(userCollection('continuityFreezes')),
      targetSnapshotReads
    ]);
    if (!settingsSnapshot.exists()) throw new Error('Server-confirmed settings are missing');
    const completedById = new Map();
    [...predecessorSnapshot.docs, ...rangeSnapshot.docs].forEach(item => {
      completedById.set(item.id, { id: item.id, ...item.data() });
    });
    return {
      settings: settingsSnapshot.data(),
      completed: [...completedById.values()].sort((a, b) => String(a.date || '').localeCompare(String(b.date || ''))),
      freezes: freezeSnapshot.docs.map(item => ({ id: item.id, ...item.data() })),
      targetSnapshots: targetSnapshots.filter(item => item.snapshot.exists())
        .map(item => ({ id: item.weekStart, ...item.snapshot.data() }))
    };
  }

  async function prepareWeeklyFreezeBackfill() {
    if (typeof waitForPendingWrites !== 'function' || typeof getDocsFromServer !== 'function') {
      throw new Error('Server-confirmed freeze protection backfill is unavailable');
    }
    await waitForPendingWrites(db);
    const [snapshotDocs, freezeDocs] = await Promise.all([
      getDocsFromServer(userCollection('weeklyTargetSnapshots')),
      getDocsFromServer(userCollection('continuityFreezes'))
    ]);
    return {
      snapshots: snapshotDocs.docs.map(item => ({ id: item.id, ...item.data() })),
      freezes: freezeDocs.docs.map(item => ({ id: item.id, ...item.data() }))
    };
  }

  async function backfillWeeklyFreezeProtection(snapshot) {
    if (typeof runTransaction !== 'function') throw new Error('Transactional freeze protection backfill is unavailable');
    if (!snapshot?.id || typeof snapshot.freezeProtected !== 'boolean') throw new Error('Freeze protection snapshot is incomplete');
    const snapshotRef = userDocument('weeklyTargetSnapshots', snapshot.id);
    return runTransaction(db, async transaction => {
      const existing = await transaction.get(snapshotRef);
      if (!existing.exists() || existing.data()?.status !== 'final') return { updated: false, snapshot: null };
      const data = existing.data();
      if (typeof data.freezeProtected === 'boolean') return { updated: false, snapshot: { id: snapshot.id, ...data } };
      const protection = snapshot.freezeProtection || {};
      transaction.set(snapshotRef, { ...data, freezeProtected: snapshot.freezeProtected, freezeProtection: protection });
      return { updated: true, snapshot: { id: snapshot.id, ...data, freezeProtected: snapshot.freezeProtected, freezeProtection: protection } };
    });
  }

  async function finalizeWeeklyTargetSnapshot(snapshot) {
    if (typeof runTransaction !== 'function') {
      throw new Error('Transactional weekly target finalization is unavailable');
    }
    if (!snapshot?.id) throw new Error('Weekly target snapshot is missing an id');
    const snapshotRef = userDocument('weeklyTargetSnapshots', snapshot.id);
    return runTransaction(db, async transaction => {
      const existing = await transaction.get(snapshotRef);
      if (existing.exists() && existing.data()?.status === 'final') {
        return { created: false, snapshot: { id: existing.id || snapshot.id, ...existing.data() } };
      }
      const locked = existing.exists() && existing.data()?.status === 'target_locked' ? existing.data() : null;
      const { id, ...data } = snapshot;
      if (locked) {
        data.normalTarget = locked.normalTarget;
        data.effectiveTarget = locked.effectiveTarget;
        data.reductions = locked.reductions;
        data.winningReason = locked.winningReason;
        data.lockedAt = locked.lockedAt || '';
      }
      transaction.set(snapshotRef, data);
      return { created: true, snapshot: { id, ...data } };
    });
  }

  async function importActivities({ completedItems = [], plannedItems = [] } = {}, chunkSize = 400) {
    const completed = Array.isArray(completedItems) ? completedItems : [];
    const planned = Array.isArray(plannedItems) ? plannedItems : [];
    const safeChunkSize = Math.max(1, Math.min(450, Math.round(Number(chunkSize) || 400)));
    const entries = [
      ...completed.map(item => ({ collectionName: 'completed', item })),
      ...planned.map(item => ({ collectionName: 'planned', item }))
    ];
    if (!entries.length) return { committedOperations: 0, committedChunks: 0, totalOperations: 0 };
    entries.forEach(({ collectionName, item }) => {
      if (!item?.id) throw new Error(`Import item in ${collectionName} is missing an id`);
    });

    let committedOperations = 0;
    let committedChunks = 0;
    for (let index = 0; index < entries.length; index += safeChunkSize) {
      const chunk = entries.slice(index, index + safeChunkSize);
      const batch = writeBatch(db);
      chunk.forEach(({ collectionName, item }) => {
        const { id, ...rest } = item;
        batch.set(userDocument(collectionName, id), rest);
      });
      try {
        await batch.commit();
        committedOperations += chunk.length;
        committedChunks += 1;
      } catch (error) {
        error.importResult = {
          committedOperations,
          committedChunks,
          totalOperations: entries.length
        };
        throw error;
      }
    }
    return { committedOperations, committedChunks, totalOperations: entries.length };
  }

  async function confirmImportedWorkoutRole({ id, role, reviewedAt } = {}) {
    if (!id || typeof runTransaction !== 'function') throw new Error('Rolleendringen krever en tilgjengelig transaksjon.');
    const completedRef = userDocument('completed', id);
    return runTransaction(db, async transaction => {
      const snapshot = await transaction.get(completedRef);
      if (!snapshot.exists()) throw new Error('Økten finnes ikke lenger. Last inn historikken på nytt.');
      const existing = snapshot.data() || {};
      if (existing.roleSource !== 'unclassified' || existing.templateSnapshot?.role !== 'other') {
        throw new Error('Øktens rolle er endret på en annen enhet. Last inn historikken på nytt.');
      }
      const updated = confirmWorkoutRole({ ...existing, id }, role, reviewedAt);
      const { id: _id, ...data } = updated;
      transaction.set(completedRef, data);
      return updated;
    });
  }

  async function materializeTrainingPlan({ plan, plannedItems = [] } = {}) {
    if (!plan?.id) throw new Error('Training plan is missing an id');
    const items = Array.isArray(plannedItems) ? plannedItems : [];
    if (items.some(item => !item?.id)) throw new Error('Materialized workout is missing an id');
    const batch = writeBatch(db);
    const { id: planId, ...planData } = plan;
    batch.set(userDocument('trainingPlans', planId), planData);
    items.forEach(item => {
      const { id, ...data } = item;
      batch.set(userDocument('planned', id), data);
    });
    await batch.commit();
    return { plan, plannedItems: items, committedOperations: items.length + 1 };
  }

  async function undoTrainingPlanMaterialization({
    plan,
    planId,
    planRevision,
    materializationId,
    plannedIds = []
  } = {}) {
    if (typeof runTransaction !== 'function') throw new Error('Planens økter kan ikke fjernes trygt akkurat nå.');
    if (!plan?.id || plan.id !== planId || !materializationId) throw new Error('Mangler opplysninger for å fjerne planens økter trygt.');
    const ids = [...new Set((Array.isArray(plannedIds) ? plannedIds : []).map(id => String(id || '')).filter(Boolean))];
    return runTransaction(db, async transaction => {
      const refs = ids.map(id => userDocument('planned', id));
      const snapshots = [];
      for (const ref of refs) snapshots.push(await transaction.get(ref));
      snapshots.forEach((snapshot, index) => {
        if (!snapshot.exists()) return;
        const current = snapshot.data() || {};
        const ref = current.planRef || {};
        const matches = String(ref.planId || '') === String(planId)
          && Number(ref.planRevision) === Number(planRevision)
          && String(ref.materializationId || '') === String(materializationId);
        if (!matches) throw new Error('En av øktene er endret siden planen la den inn. Ingen økter ble fjernet.');
      });
      snapshots.forEach((snapshot, index) => {
        if (snapshot.exists()) transaction.delete(refs[index]);
      });
      const { id, ...planData } = plan;
      transaction.set(userDocument('trainingPlans', id), planData);
      return { plan, removedIds: ids.filter((_, index) => snapshots[index].exists()) };
    });
  }

  async function cancelTrainingPlan(command = {}) {
    if (typeof runTransaction !== 'function') throw new Error('Trygg avslutning av planen er ikke tilgjengelig.');
    const { planId, planRevision, expectedPlan, plan, targetLock } = command;
    const operations = Array.isArray(command.operations) ? command.operations : [];
    if (!planId || plan?.id !== planId || plan?.status !== 'cancelled') throw new Error('Planavslutningen er ufullstendig.');
    const stable = value => JSON.stringify(value, (_key, entry) => entry && typeof entry === 'object' && !Array.isArray(entry)
      ? Object.keys(entry).sort().reduce((result, key) => { result[key] = entry[key]; return result; }, {}) : entry);
    return runTransaction(db, async transaction => {
      const planRef = userDocument('trainingPlans', planId);
      const planSnapshot = await transaction.get(planRef);
      if (!planSnapshot.exists()) throw new Error('Planen finnes ikke lenger. Last inn data på nytt.');
      const currentPlan = planSnapshot.data() || {};
      const comparablePlan = normalizeState({ trainingPlans: [{ ...currentPlan, id: planId }] })?.trainingPlans?.[0] || currentPlan;
      if (currentPlan.status !== 'active'
        || Number(currentPlan.planRevision || 1) !== Number(planRevision)
        || String(currentPlan.updatedAt || '') !== String(expectedPlan?.updatedAt || '')
        || stable(comparablePlan.materializations || []) !== stable(expectedPlan?.materializations || [])) {
        throw new Error('Planen er endret siden bekreftelsen. Last inn data på nytt.');
      }
      const itemRefs = operations.map(item => userDocument('planned', item.id));
      const itemSnapshots = [];
      for (const ref of itemRefs) itemSnapshots.push(await transaction.get(ref));
      itemSnapshots.forEach((snapshot, index) => {
        if (!snapshot.exists()) throw new Error('En planøkt er endret siden bekreftelsen. Last inn data på nytt.');
        const current = snapshot.data() || {};
        const expected = operations[index].before || {};
        const comparableCurrent = normalizeState({ planned: [{ ...current, id: operations[index].id }] })?.planned?.[0] || current;
        const fields = ['date', 'templateId', 'templateSnapshot', 'planRef', 'userModified',
          'userModifiedFields', 'planIntentOverride', 'scheduleAdjustment', 'metadataRevision',
          'status', 'notes', 'repeatGroupId', 'createdAt', 'updatedAt'];
        if (fields.some(field => stable(comparableCurrent[field] ?? null) !== stable(expected[field] ?? null))
          || String(current.planRef?.planId || '') !== String(planId)) {
          throw new Error('En planøkt er endret siden bekreftelsen. Last inn data på nytt.');
        }
      });
      let lockedTarget = null;
      if (targetLock) {
        const settingsSnapshot = await transaction.get(userDocument('settings', 'preferences'));
        if (!settingsSnapshot.exists()
          || Number(settingsSnapshot.data()?.goals?.weeklySessionsTarget) !== Number(targetLock.normalTarget)) {
          throw new Error('Ukesmålet er endret siden bekreftelsen. Last inn data på nytt.');
        }
        const lockRef = userDocument('weeklyTargetSnapshots', targetLock.id);
        const existing = await transaction.get(lockRef);
        if (existing.exists()) {
          const data = existing.data() || {};
          if (!['final', 'target_locked'].includes(data.status)
            || Number(data.effectiveTarget) !== Number(targetLock.effectiveTarget)
            || Number(data.normalTarget) !== Number(targetLock.normalTarget)
            || (data.status === 'target_locked' && stable(data.reductions || {}) !== stable(targetLock.reductions || {}))) {
            throw new Error('Ukens mål er endret på en annen enhet. Last inn data på nytt.');
          }
          lockedTarget = { id: targetLock.id, ...data };
        } else {
          const { id, ...data } = targetLock;
          transaction.set(lockRef, data);
          lockedTarget = targetLock;
        }
      }
      operations.forEach((operation, index) => {
        if (operation.choice === 'remove') transaction.delete(itemRefs[index]);
        else {
          // A loose workout differs from its server record only by planRef.
          // Preserve unknown legacy fields rather than replacing them with a
          // normalized client projection.
          const data = { ...itemSnapshots[index].data() };
          delete data.planRef;
          transaction.set(itemRefs[index], data);
        }
      });
      const cancelledPlan = {
        ...currentPlan,
        status: 'cancelled',
        cancelledAt: plan.cancelledAt,
        updatedAt: plan.updatedAt
      };
      delete cancelledPlan.id;
      transaction.set(planRef, cancelledPlan);
      return { plan: { id: planId, ...cancelledPlan }, operations, targetLock: lockedTarget };
    });
  }

  async function load() {
    const snapshots = await Promise.all([
      ...dataCollections.map(name => getDocs(userCollection(name))),
      getDoc(userDocument('settings', 'preferences'))
    ]);
    const settingsSnapshot = snapshots[snapshots.length - 1];
    const input = Object.fromEntries(dataCollections.map((name, index) => [
      name,
      snapshots[index].docs.map(item => ({ id: item.id, ...item.data() }))
    ]));
    input.settings = settingsSnapshot.exists() ? settingsSnapshot.data() : defaultSettings();
    const state = normalizeState(input);
    if (!settingsSnapshot.exists()) await set('settings', 'preferences', state.settings);
    return state;
  }

  async function commitOperations(operations, chunkSize = 450) {
    for (let index = 0; index < operations.length; index += chunkSize) {
      const batch = writeBatch(db);
      operations.slice(index, index + chunkSize).forEach(operation => operation(batch));
      await batch.commit();
    }
  }

  async function replace(nextState) {
    const existing = await Promise.all(dataCollections.map(name => getDocs(userCollection(name))));
    const deleteOperations = existing.flatMap(snapshot =>
      snapshot.docs.map(item => batch => batch.delete(item.ref))
    );
    const setOperations = dataCollections.flatMap(name => (nextState[name] || []).map(item => batch => {
      const { id, ...rest } = item;
      batch.set(userDocument(name, id), rest);
    }));
    await commitOperations([...deleteOperations, ...setOperations]);
    await set('settings', 'preferences', nextState.settings);
  }

  async function clearData() {
    const existing = await Promise.all(dataCollections.map(name => getDocs(userCollection(name))));
    const deleteOperations = existing.flatMap(snapshot =>
      snapshot.docs.map(item => batch => batch.delete(item.ref))
    );
    await commitOperations(deleteOperations);
  }

  return {
    load,
    set,
    remove,
    batchSet,
    importActivities,
    confirmImportedWorkoutRole,
    materializeTrainingPlan,
    undoTrainingPlanMaterialization,
    cancelTrainingPlan,
    replace,
    clearData,
    prepareWeeklyTargetFinalization,
    finalizeWeeklyTargetSnapshot,
    prepareWeeklyFreezeBackfill,
    backfillWeeklyFreezeProtection
  };
}
