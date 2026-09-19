const mongoose = require('mongoose');

const guidanceSchema = new mongoose.Schema(
  {
    symptoms: [{ type: String, trim: true }],
    immediateActions: [{ type: String, trim: true }],
    treatmentOptions: [{ type: String, trim: true }],
    organicMethods: [{ type: String, trim: true }],
    prevention: [{ type: String, trim: true }],
    safetyNotes: [{ type: String, trim: true }],
    expertAdvice: [{ type: String, trim: true }],
  },
  { _id: false }
);

const treatmentSchema = new mongoose.Schema(
  {
    crop: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    diseaseOrPest: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    symptoms: [{ type: String, trim: true }],
    immediateActions: [{ type: String, trim: true }],
    treatmentOptions: [{ type: String, trim: true }],
    organicMethods: [{ type: String, trim: true }],
    prevention: [{ type: String, trim: true }],
    safetyNotes: [{ type: String, trim: true }],
    expertAdvice: [{ type: String, trim: true }],
    translations: {
      english: { type: guidanceSchema, default: undefined },
      hindi: { type: guidanceSchema, default: undefined },
      telugu: { type: guidanceSchema, default: undefined },
    },
    sourceNote: {
      type: String,
      trim: true,
      default: 'Prototype guidance requires review against current local agricultural recommendations.',
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

treatmentSchema.index({ crop: 1, diseaseOrPest: 1 }, { unique: true });

module.exports = mongoose.model('Treatment', treatmentSchema);
