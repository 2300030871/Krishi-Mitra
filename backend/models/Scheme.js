const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000,
    },
    eligibility: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    link: {
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

module.exports = mongoose.model('Scheme', schemeSchema);
