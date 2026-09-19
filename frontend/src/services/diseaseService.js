import api from '../api';
import { createClientRequestId } from './offlineStorage';

export const analyzeDisease = async (formData, clientRequestId = createClientRequestId()) => {
  const { data } = await api.post('/disease-detection/analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'X-Client-Request-Id': clientRequestId,
    },
  });
  return data.diagnosis;
};

export const getMyDiagnoses = async (params = {}) => {
  const { data } = await api.get('/disease-detection/my', { params });
  return data;
};

export const getDiagnosisById = async (id) => {
  const { data } = await api.get(`/disease-detection/${id}`);
  return data.diagnosis;
};
