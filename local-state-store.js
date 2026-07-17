export function createLocalStateStore({ storage, key, normalizeState, now = () => new Date().toISOString() }) {
  if (!storage || !key || typeof normalizeState !== 'function') {
    throw new Error('Local state store requires storage, key and normalizeState');
  }

  function writeSnapshot(state) {
    storage.setItem(key, JSON.stringify({ savedAt: now(), state }));
  }

  function readSnapshot() {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const snapshot = JSON.parse(raw);
    if (!snapshot?.state) return null;
    return {
      savedAt: snapshot.savedAt || null,
      state: normalizeState(snapshot.state)
    };
  }

  function writeRecovery(state, reason) {
    storage.setItem(`${key}_recovery`, JSON.stringify({
      savedAt: now(),
      reason,
      state
    }));
  }

  function readRecovery() {
    const raw = storage.getItem(`${key}_recovery`);
    if (!raw) return null;
    const snapshot = JSON.parse(raw);
    if (!snapshot?.state) return null;
    return {
      ...snapshot,
      state: normalizeState(snapshot.state)
    };
  }

  return { writeSnapshot, readSnapshot, writeRecovery, readRecovery };
}

