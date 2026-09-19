import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isOnline, subscribeToConnectivity } from '../services/connectivityService';

export default function ConnectivityStatus() {
  const { t } = useTranslation();
  const [online, setOnline] = useState(isOnline());

  useEffect(() => subscribeToConnectivity(setOnline), []);

  return (
    <div className={online ? 'connectivity-status online' : 'connectivity-status offline'} role="status" aria-live="polite">
      <strong>{online ? `🟢 ${t('online')}` : `🔴 ${t('offline')}`}</strong>
      {!online ? <span>{t('offlineSavedMessage')}</span> : null}
    </div>
  );
}
