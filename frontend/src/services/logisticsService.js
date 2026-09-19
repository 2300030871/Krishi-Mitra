import api from '../api';
import { createClientRequestId } from './offlineStorage';

export const searchLogisticsProviders = async (filters = {}) => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => String(value ?? '').trim() !== '')
  );
  const { data } = await api.get('/logistics/providers', { params });
  return data;
};

export const createTransportRequest = async (payload) => {
  const requestPayload = {
    ...payload,
    clientRequestId: payload.clientRequestId || createClientRequestId(),
  };
  const { data } = await api.post('/logistics/requests', requestPayload);
  return data.request;
};

export const getMyTransportRequests = async () => {
  const { data } = await api.get('/logistics/requests/my');
  return data;
};
