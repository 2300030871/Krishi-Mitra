import api from '../api';
import { isOnline } from './connectivityService';
import { getQueuedActions, removeQueuedAction, updateQueuedAction } from './offlineStorage';

let syncInProgress = false;

const emitSyncStatus = (status, extra = {}) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('agrimandi-sync-status', { detail: { status, ...extra } }));
  }
};

const buildDiseaseFormData = (payload) => {
  const formData = new FormData();
  formData.append('crop', payload.crop);
  formData.append('image', payload.image, payload.imageName || 'crop-image');
  return formData;
};

const sendAction = async (action) => {
  const headers = { 'X-Client-Request-Id': action.requestId };
  if (action.actionType === 'disease-analysis') {
    return api.post(action.endpoint, buildDiseaseFormData(action.payload), {
      headers: { ...headers, 'Content-Type': 'multipart/form-data' },
    });
  }

  return api.request({
    url: action.endpoint,
    method: action.method,
    data: action.payload,
    headers,
  });
};

export const syncPendingActions = async () => {
  if (!isOnline() || syncInProgress) return { synced: 0, failed: 0 };

  syncInProgress = true;
  let synced = 0;
  let failed = 0;
  emitSyncStatus('syncing');

  try {
    const actions = await getQueuedActions();
    for (const action of actions) {
      if (!isOnline()) break;
      await updateQueuedAction(action.id, {
        status: 'syncing',
        attempts: (action.attempts || 0) + 1,
        lastAttemptAt: new Date().toISOString(),
      });

      try {
        await sendAction(action);
        await removeQueuedAction(action.id);
        synced += 1;
        emitSyncStatus('synced', { synced, pending: Math.max(actions.length - synced - failed, 0) });
        window.dispatchEvent(new CustomEvent('agrimandi-sync-complete', { detail: action }));
      } catch (error) {
        failed += 1;
        await updateQueuedAction(action.id, {
          status: 'failed',
          lastError: error.response?.data?.message || error.message || 'Synchronization failed.',
        });
        emitSyncStatus('error', { failed, pending: actions.length - synced - failed });
      }
    }
  } finally {
    syncInProgress = false;
    if (!failed) emitSyncStatus(synced ? 'synced' : 'idle', { synced, pending: 0 });
  }

  return { synced, failed };
};

export const initializeSync = () => {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => {
    emitSyncStatus('syncing');
    syncPendingActions();
  };
  window.addEventListener('online', handleOnline);
  syncPendingActions();

  return () => window.removeEventListener('online', handleOnline);
};
