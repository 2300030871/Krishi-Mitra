export const isOnline = () => typeof navigator === 'undefined' || navigator.onLine !== false;

export const subscribeToConnectivity = (listener) => {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => listener(true);
  const handleOffline = () => listener(false);
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

export const isConnectivityError = (error) => {
  if (!isOnline()) return true;
  return !error?.response && ['ERR_NETWORK', 'ECONNABORTED', 'ETIMEDOUT'].includes(error?.code);
};
