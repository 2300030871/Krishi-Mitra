const mongoose = require('mongoose');

const diseaseDiagnosisSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    clientRequestId: {
      type: String,
      trim: true,
      index: true,
      sparse: true,
    },
    crop: {
      type: String,
      required: true,
      trim: true,
    },
    imagePath: {
      type: String,
      required: true,
      trim: true,
    },
    imageOriginalName: {
      type: String,
      trim: true,
      default: '',
    },
    diagnosisType: {
      type: String,
      enum: ['disease', 'pest', 'healthy', 'unknown'],
      required: true,
    },
    diseaseOrPest: {
      type: String,
      required: true,
      trim: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'moderate', 'high', 'unknown'],
      default: 'unknown',
    },
    symptoms: [{ type: String, trim: true }],
    possibleCauses: [{ type: String, trim: true }],
    prevention: [{ type: String, trim: true }],
    detectionSource: {
      type: String,
      enum: ['mock', 'model', 'external-api'],
      required: true,
    },
    status: {
      type: String,
      enum: ['completed', 'failed'],
      default: 'completed',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

diseaseDiagnosisSchema.index({ farmerId: 1, createdAt: -1 });
diseaseDiagnosisSchema.index({ crop: 1, createdAt: -1 });
diseaseDiagnosisSchema.index({ farmerId: 1, clientRequestId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('DiseaseDiagnosis', diseaseDiagnosisSchema);
