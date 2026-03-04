import axios from 'axios';
import { clearSession, getToken } from './auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = String(error?.config?.url || '');
    const isAuthRequest = /\/auth\/(login|register)/.test(requestUrl);

    if (status === 401 && !isAuthRequest) {
      clearSession();

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('agrimandi-session-expired'));
      }
    }

    return Promise.reject(error);
  }
);

export default api;
