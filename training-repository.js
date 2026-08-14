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
    setDoc,
    deleteDoc,
    writeBatch
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

  return { load, set, remove, batchSet, importActivities, replace, clearData };
}

