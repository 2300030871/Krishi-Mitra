import api from '../api';

export const getMyCrops = async () => {
  const { data } = await api.get('/crops/my');
  return data;
};

export const createCrop = async (formData) => {
  const { data } = await api.post('/crops', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

export const updateCrop = async (id, formData) => {
  const { data } = await api.put(`/crops/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

export const deleteCrop = async (id) => {
  const { data } = await api.delete(`/crops/${id}`);
  return data;
};
