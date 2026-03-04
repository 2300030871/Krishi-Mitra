const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    originalText: {
      type: String,
      trim: true,
      default: '',
      maxlength: 5000,
    },
    translatedText: {
      type: String,
      trim: true,
      default: '',
      maxlength: 5000,
    },
    originalLanguage: {
      type: String,
      enum: ['english', 'hindi', 'telugu'],
      required: true,
      default: 'english',
    },
    targetLanguage: {
      type: String,
      enum: ['english', 'hindi', 'telugu'],
      required: true,
      default: 'english',
    },
    originalAudioUrl: {
      type: String,
      trim: true,
      default: '',
    },
    translatedAudioUrl: {
      type: String,
      trim: true,
      default: '',
    },
    messageType: {
      type: String,
      enum: ['text', 'voice'],
      required: true,
      default: 'text',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model('Message', messageSchema);
