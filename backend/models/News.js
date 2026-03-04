const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },
    image: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

module.exports = mongoose.model('News', newsSchema);
