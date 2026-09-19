import api from '../api';

export const getTreatment = async ({ crop, diseaseOrPest, language }) => {
  const { data } = await api.get(`/treatments/${encodeURIComponent(diseaseOrPest)}`, {
    params: { crop, language },
  });
  return data.treatment;
};
