export function snapshotByteLength(value = '') {
  const text = String(value);
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(text).length;
  }

  let bytes = 0;
  for (const character of text) {
    const codePoint = character.codePointAt(0);
    if (codePoint <= 0x7f) bytes += 1;
    else if (codePoint <= 0x7ff) bytes += 2;
    else if (codePoint <= 0xffff) bytes += 3;
    else bytes += 4;
  }
  return bytes;
}

export function isStorageQuotaError(error) {
  return error?.name === 'QuotaExceededError'
    || error?.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    || error?.code === 22
    || error?.code === 1014;
}

export function createIndexedDbKeyValueStore({
  indexedDB,
  dbName = 'treningsapp-local-state',
  storeName = 'snapshots'
} = {}) {
  if (!indexedDB || typeof indexedDB.open !== 'function') return null;

  function run(method, key, value) {
    return new Promise((resolve, reject) => {
      const openRequest = indexedDB.open(dbName, 1);

      openRequest.onupgradeneeded = () => {
        const database = openRequest.result;
        if (!database.objectStoreNames.contains(storeName)) {
          database.createObjectStore(storeName);
        }
      };

      openRequest.onerror = () => reject(openRequest.error || new Error('IndexedDB could not be opened'));
      openRequest.onsuccess = () => {
        const database = openRequest.result;
        let request;
        let settled = false;
        const finish = (callback, value) => {
          if (settled) return;
          settled = true;
          database.close();
          callback(value);
        };
        try {
          const mode = method === 'get' ? 'readonly' : 'readwrite';
          const transaction = database.transaction(storeName, mode);
          const objectStore = transaction.objectStore(storeName);
          if (method === 'get') request = objectStore.get(key);
          else if (method === 'set') request = objectStore.put(value, key);
          else request = objectStore.delete(key);

          request.onsuccess = () => {
            if (method === 'get') finish(resolve, request.result ?? null);
          };
          request.onerror = () => finish(reject, request.error || new Error('IndexedDB request failed'));
          transaction.oncomplete = () => {
            if (method !== 'get') finish(resolve, undefined);
            else database.close();
          };
          transaction.onerror = () => finish(reject, transaction.error || new Error('IndexedDB transaction failed'));
          transaction.onabort = () => finish(reject, transaction.error || new Error('IndexedDB transaction was aborted'));
        } catch (error) {
          finish(reject, error);
        }
      };
    });
  }

  return {
    getItem(key) {
      return run('get', key);
    },
    setItem(key, value) {
      return run('set', key, value);
    },
    removeItem(key) {
      return run('remove', key);
    }
  };
}

export function createLocalStateStore({
  storage,
  fallbackStorage = null,
  key,
  normalizeState,
  now = () => new Date().toISOString(),
  warningBytes = 3 * 1024 * 1024
}) {
  if (!storage || !key || typeof normalizeState !== 'function') {
    throw new Error('Local state store requires storage, key and normalizeState');
  }

  let writeQueue = Promise.resolve();

  function enqueueWrite(task) {
    const queued = writeQueue.then(task, task);
    writeQueue = queued.catch(() => undefined);
    return queued;
  }

  function serialize(state, extra = {}) {
    const payload = {
      version: 2,
      savedAt: now(),
      ...extra,
      state: normalizeState(state)
    };
    const raw = JSON.stringify(payload);
    return { payload, raw, bytes: snapshotByteLength(raw) };
  }

  function parse(raw) {
    if (!raw) return null;
    try {
      const snapshot = JSON.parse(raw);
      if (!snapshot?.state) return null;
      return {
        ...snapshot,
        savedAt: snapshot.savedAt || null,
        state: normalizeState(snapshot.state),
        bytes: snapshotByteLength(raw)
      };
    } catch {
      return null;
    }
  }

  function newestSnapshot(primary, fallback) {
    if (!primary) return fallback;
    if (!fallback) return primary;
    const primaryTime = Date.parse(primary.savedAt || '') || 0;
    const fallbackTime = Date.parse(fallback.savedAt || '') || 0;
    return fallbackTime > primaryTime ? fallback : primary;
  }

  async function writeSafe(storageKey, serialized) {
    return enqueueWrite(async () => {
      try {
        storage.setItem(storageKey, serialized.raw);
        if (fallbackStorage) {
          try {
            await fallbackStorage.removeItem(storageKey);
          } catch {
            // A stale fallback is harmless; reads select the newest valid snapshot.
          }
        }
        return {
          ok: true,
          backend: 'localStorage',
          savedAt: serialized.payload.savedAt,
          bytes: serialized.bytes,
          warning: serialized.bytes >= warningBytes
        };
      } catch (error) {
        if (!isStorageQuotaError(error) || !fallbackStorage) throw error;
        await fallbackStorage.setItem(storageKey, serialized.raw);
        try {
          storage.removeItem(storageKey);
        } catch {
          // IndexedDB now holds the valid copy even if localStorage cleanup fails.
        }
        return {
          ok: true,
          backend: 'indexedDB',
          savedAt: serialized.payload.savedAt,
          bytes: serialized.bytes,
          warning: true,
          fallbackReason: 'quota'
        };
      }
    });
  }

  async function readSafe(storageKey) {
    let primaryRaw = null;
    let fallbackRaw = null;
    try {
      primaryRaw = storage.getItem(storageKey);
    } catch {
      primaryRaw = null;
    }
    if (fallbackStorage) {
      try {
        fallbackRaw = await fallbackStorage.getItem(storageKey);
      } catch {
        fallbackRaw = null;
      }
    }

    const primary = parse(primaryRaw);
    const fallback = parse(fallbackRaw);
    if (primary) primary.backend = 'localStorage';
    if (fallback) fallback.backend = 'indexedDB';
    return newestSnapshot(primary, fallback);
  }

  function writeSnapshot(state) {
    const serialized = serialize(state);
    storage.setItem(key, serialized.raw);
    return { bytes: serialized.bytes, savedAt: serialized.payload.savedAt };
  }

  function readSnapshot() {
    const snapshot = parse(storage.getItem(key));
    if (!snapshot) return null;
    return {
      savedAt: snapshot.savedAt,
      state: snapshot.state,
      bytes: snapshot.bytes
    };
  }

  function writeRecovery(state, reason) {
    const serialized = serialize(state, { reason });
    storage.setItem(`${key}_recovery`, serialized.raw);
    return { bytes: serialized.bytes, savedAt: serialized.payload.savedAt };
  }

  function readRecovery() {
    return parse(storage.getItem(`${key}_recovery`));
  }

  function writeSnapshotSafe(state) {
    return writeSafe(key, serialize(state));
  }

  function readSnapshotSafe() {
    return readSafe(key);
  }

  function writeRecoverySafe(state, reason) {
    return writeSafe(`${key}_recovery`, serialize(state, { reason }));
  }

  function readRecoverySafe() {
    return readSafe(`${key}_recovery`);
  }

  function estimateSnapshot(state) {
    const serialized = serialize(state);
    return {
      bytes: serialized.bytes,
      warning: serialized.bytes >= warningBytes
    };
  }

  return {
    writeSnapshot,
    readSnapshot,
    writeRecovery,
    readRecovery,
    writeSnapshotSafe,
    readSnapshotSafe,
    writeRecoverySafe,
    readRecoverySafe,
    estimateSnapshot
  };
}
