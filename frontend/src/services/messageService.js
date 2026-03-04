import api from '../api';

export const getConversation = async (userId) => {
  const { data } = await api.get(`/messages/${userId}`);
  return data;
};

export const sendTextMessage = async ({ receiverId, text }) => {
  const { data } = await api.post('/messages', { receiverId, text });
  return data;
};

export const sendVoiceMessage = async ({ receiverId, voiceBlob, fileName = `voice-${Date.now()}.webm` }) => {
  const formData = new FormData();
  formData.append('receiverId', receiverId);
  formData.append('voice', voiceBlob, fileName);

  const { data } = await api.post('/messages/voice', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return data;
};
