const DB_NAME = 'agrimandi-offline';
const DB_VERSION = 1;
const ACTION_STORE = 'actionQueue';
const DRAFT_STORE = 'formDrafts';

const memory = {
  actions: new Map(),
  drafts: new Map(),
};

const canUseIndexedDb = () => typeof window !== 'undefined' && 'indexedDB' in window;

const openDatabase = () => {
  if (!canUseIndexedDb()) return Promise.resolve(null);

  return new Promise((resolve) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(ACTION_STORE)) {
        database.createObjectStore(ACTION_STORE, { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains(DRAFT_STORE)) {
        database.createObjectStore(DRAFT_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
};

const runTransaction = async (storeName, mode, operation) => {
  const database = await openDatabase();
  if (!database) return operation(null);

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    let result;

    try {
      result = operation(store);
    } catch (error) {
      database.close();
      reject(error);
      return;
    }

    transaction.oncomplete = () => {
      database.close();
      resolve(result);
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error || new Error('Offline storage transaction failed.'));
    };
  });
};

const requestValue = (request) =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Offline storage request failed.'));
  });

export const createClientRequestId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `agrimandi-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const saveDraft = async (id, data) => {
  const draft = { id, data, updatedAt: new Date().toISOString() };
  memory.drafts.set(id, draft);
  try {
    await runTransaction(DRAFT_STORE, 'readwrite', (store) => {
      if (!store) return null;
      store.put(draft);
      return null;
    });
  } catch (error) {
    return false;
  }
  return true;
};

export const getDraft = async (id) => {
  try {
    const result = await runTransaction(DRAFT_STORE, 'readonly', (store) => {
      if (!store) return memory.drafts.get(id) || null;
      return requestValue(store.get(id));
    });
    return result || memory.drafts.get(id) || null;
  } catch (error) {
    return memory.drafts.get(id) || null;
  }
};

export const deleteDraft = async (id) => {
  memory.drafts.delete(id);
  try {
    await runTransaction(DRAFT_STORE, 'readwrite', (store) => {
      if (store) store.delete(id);
      return null;
    });
  } catch (error) {
    return false;
  }
  return true;
};

export const enqueueAction = async ({ actionType, endpoint, method = 'POST', payload, requestId = createClientRequestId() }) => {
  const action = {
    id: createClientRequestId(),
    actionType,
    endpoint,
    method,
    payload,
    requestId,
    createdAt: new Date().toISOString(),
    status: 'pending',
    attempts: 0,
  };
  memory.actions.set(action.id, action);

  try {
    await runTransaction(ACTION_STORE, 'readwrite', (store) => {
      if (store) store.put(action);
      return null;
    });
  } catch (error) {
    return action;
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('agrimandi-sync-status', { detail: { status: 'queued', pending: 1 } }));
  }
  return action;
};

export const getQueuedActions = async () => {
  try {
    const result = await runTransaction(ACTION_STORE, 'readonly', (store) => {
      if (!store) return Array.from(memory.actions.values());
      return requestValue(store.getAll());
    });
    const actions = result || Array.from(memory.actions.values());
    return actions.filter((action) => action.status !== 'synced').sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  } catch (error) {
    return Array.from(memory.actions.values()).filter((action) => action.status !== 'synced');
  }
};

export const updateQueuedAction = async (id, updates) => {
  const current = memory.actions.get(id) || (await getQueuedActions()).find((action) => action.id === id);
  if (!current) return null;
  const updated = { ...current, ...updates };
  memory.actions.set(id, updated);
  try {
    await runTransaction(ACTION_STORE, 'readwrite', (store) => {
      if (store) store.put(updated);
      return null;
    });
  } catch (error) {
    return updated;
  }
  return updated;
};

export const removeQueuedAction = async (id) => {
  memory.actions.delete(id);
  try {
    await runTransaction(ACTION_STORE, 'readwrite', (store) => {
      if (store) store.delete(id);
      return null;
    });
  } catch (error) {
    return false;
  }
  return true;
};
