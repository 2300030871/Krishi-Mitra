import api from '../api';

export const getChatUsers = async () => {
  const { data } = await api.get('/users/chat-list');
  return data;
};

export const updateLanguagePreference = async (language) => {
  const { data } = await api.patch('/users/language', { language });
  return data;
};
