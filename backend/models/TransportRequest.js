const mongoose = require('mongoose');

const transportRequestSchema = new mongoose.Schema(
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
    produce: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    quantityUnit: { type: String, trim: true, default: 'tonnes' },
    pickupLocation: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    vehicleType: { type: String, trim: true, default: '' },
    requestedDate: { type: Date, default: null },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LogisticsProvider',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['requested', 'accepted', 'rejected', 'completed', 'cancelled'],
      default: 'requested',
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

transportRequestSchema.index({ farmerId: 1, createdAt: -1 });
transportRequestSchema.index({ farmerId: 1, clientRequestId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('TransportRequest', transportRequestSchema);
