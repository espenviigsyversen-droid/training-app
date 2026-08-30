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

  async function prepareWeeklyTargetFinalization({ completedStart, completedEnd } = {}) {
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
    const [settingsSnapshot, rangeSnapshot, predecessorSnapshot] = await Promise.all([
      getDocFromServer(userDocument('settings', 'preferences')),
      getDocsFromServer(rangeQuery),
      getDocsFromServer(predecessorQuery)
    ]);
    if (!settingsSnapshot.exists()) throw new Error('Server-confirmed settings are missing');
    const completedById = new Map();
    [...predecessorSnapshot.docs, ...rangeSnapshot.docs].forEach(item => {
      completedById.set(item.id, { id: item.id, ...item.data() });
    });
    return {
      settings: settingsSnapshot.data(),
      completed: [...completedById.values()].sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')))
    };
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
      const { id, ...data } = snapshot;
      transaction.set(snapshotRef, data);
      return { created: true, snapshot };
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
    if (typeof runTransaction !== 'function') throw new Error('Transactional materialization undo is unavailable');
    if (!plan?.id || plan.id !== planId || !materializationId) throw new Error('Materialization undo is incomplete');
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
        if (!matches) throw new Error(`Planlagt økt ${ids[index]} tilhører ikke denne materialiseringen`);
      });
      snapshots.forEach((snapshot, index) => {
        if (snapshot.exists()) transaction.delete(refs[index]);
      });
      const { id, ...planData } = plan;
      transaction.set(userDocument('trainingPlans', id), planData);
      return { plan, removedIds: ids.filter((_, index) => snapshots[index].exists()) };
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
    materializeTrainingPlan,
    undoTrainingPlanMaterialization,
    replace,
    clearData,
    prepareWeeklyTargetFinalization,
    finalizeWeeklyTargetSnapshot
  };
}
