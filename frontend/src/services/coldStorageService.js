import api from '../api';

export const searchColdStorage = async (filters = {}) => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => String(value ?? '').trim() !== '')
  );
  const { data } = await api.get('/cold-storage', { params });
  return data;
};

export const getColdStorageDetails = async (id, coordinates = {}) => {
  const { data } = await api.get(`/cold-storage/${id}`, { params: coordinates });
  return data.storage;
};
