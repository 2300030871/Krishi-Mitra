const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const { translateText } = require('./translationService');
const { synthesizeSpeech, transcribeAudio } = require('./speechService');
const { toCanonicalLanguage } = require('../utils/language');

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || ''));

const getConversation = async (currentUserId, targetUserId) => {
  if (!isValidObjectId(targetUserId)) {
    return { error: 'Invalid target user id.', status: 400 };
  }

  const messages = await Message.find({
    $or: [
      { senderId: currentUserId, receiverId: targetUserId },
      { senderId: targetUserId, receiverId: currentUserId },
      { sender: currentUserId, receiver: targetUserId },
      { sender: targetUserId, receiver: currentUserId },
    ],
  })
    .sort({ createdAt: 1 })
    .populate('senderId', 'name role preferredLanguage')
    .populate('receiverId', 'name role preferredLanguage');

  return { messages };
};

const createMessage = async ({ senderId, receiverId, text, originalAudioUrl, originalAudioPath }) => {
  if (!isValidObjectId(receiverId)) {
    return { error: 'Invalid receiver id.', status: 400 };
  }

  const [sender, receiver] = await Promise.all([
    User.findById(senderId).select('preferredLanguage'),
    User.findById(receiverId).select('preferredLanguage'),
  ]);

  if (!sender || !receiver) {
    return { error: 'Sender or receiver not found.', status: 404 };
  }

  const senderLanguage = toCanonicalLanguage(sender.preferredLanguage);
  const receiverLanguage = toCanonicalLanguage(receiver.preferredLanguage);

  const normalizedAudioUrl = String(originalAudioUrl || '').trim();
  let originalText = String(text || '').trim();

  if (!originalText && normalizedAudioUrl) {
    const transcription = await transcribeAudio({
      filePath: originalAudioPath,
      language: senderLanguage,
    });
    originalText = String(transcription.text || '').trim();
  }

  if (!originalText && normalizedAudioUrl) {
    originalText = 'Voice message';
  }

  if (!originalText && !normalizedAudioUrl) {
    return { error: 'Either text or voice message is required.', status: 400 };
  }

  const translation = await translateText({
    text: originalText,
    sourceLanguage: senderLanguage,
    targetLanguage: receiverLanguage,
  });

  const translatedText = String(translation.translatedText || originalText || '').trim();

  const tts = await synthesizeSpeech({
    text: translatedText,
    language: receiverLanguage,
    prefix: 'translated',
  });

  const translatedAudioUrl = tts.audioUrl || normalizedAudioUrl || '';

  const message = await Message.create({
    senderId,
    receiverId,
    originalText,
    translatedText,
    originalLanguage: senderLanguage,
    targetLanguage: receiverLanguage,
    messageType: normalizedAudioUrl ? 'voice' : 'text',
    originalAudioUrl: normalizedAudioUrl,
    translatedAudioUrl,
  });

  const populated = await Message.findById(message._id)
    .populate('senderId', 'name role preferredLanguage')
    .populate('receiverId', 'name role preferredLanguage');

  return { message: populated };
};

module.exports = {
  getConversation,
  createMessage,
};
