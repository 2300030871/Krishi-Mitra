const { createMessage, getConversation } = require('../services/messageService');

const toUploadUrl = (file) => {
  if (!file) return '';
  const relative = String(file.path).split('uploads').pop().replace(/\\/g, '/').replace(/^\//, '');
  return `/uploads/${relative}`;
};

const toUploadPath = (file) => {
  if (!file) return '';
  return String(file.path || '').trim();
};

const getConversationMessages = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await getConversation(req.user.id, userId);

    if (result.error) {
      return res.status(result.status || 400).json({ message: result.error });
    }

    return res.json(result.messages);
  } catch (error) {
    return next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, text } = req.body;
    const originalAudioUrl = toUploadUrl(req.file) || req.body.originalAudioUrl;
    const originalAudioPath = toUploadPath(req.file);

    const result = await createMessage({
      senderId: req.user.id,
      receiverId,
      text,
      originalAudioUrl,
      originalAudioPath,
    });

    if (result.error) {
      return res.status(result.status || 400).json({ message: result.error });
    }

    const message = result.message;

    req.io.to(`user:${String(message.receiverId._id)}`).emit('message:new', message);
    req.io.to(`user:${String(message.senderId._id)}`).emit('message:new', message);

    return res.status(201).json(message);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getConversationMessages,
  sendMessage,
};
