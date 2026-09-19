import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getQueuedActions } from '../services/offlineStorage';
import { syncPendingActions } from '../services/syncService';

const initialState = { status: 'idle', pending: 0 };

export default function SyncStatus() {
  const { t } = useTranslation();
  const [syncState, setSyncState] = useState(initialState);

  useEffect(() => {
    getQueuedActions().then((actions) => setSyncState({ status: actions.length ? 'queued' : 'idle', pending: actions.length }));

    const handleStatus = (event) => {
      setSyncState((previous) => ({ ...previous, ...event.detail }));
    };
    window.addEventListener('agrimandi-sync-status', handleStatus);
    return () => window.removeEventListener('agrimandi-sync-status', handleStatus);
  }, []);

  if (syncState.status === 'idle' && !syncState.pending) return null;
  if (syncState.status === 'syncing') return <div className="sync-status syncing">🔄 {t('syncing')}</div>;
  if (syncState.status === 'error') {
    return (
      <div className="sync-status error">
        <span>{t('syncPaused')} {syncState.pending || syncState.failed || 0}</span>
        <button type="button" className="btn-small btn-ghost" onClick={syncPendingActions}>{t('retrySync')}</button>
      </div>
    );
  }
  if (syncState.status === 'synced') return <div className="sync-status synced">✓ {t('synced')}</div>;
  return <div className="sync-status queued">{syncState.pending} {t('actionsWaiting')}</div>;
}
