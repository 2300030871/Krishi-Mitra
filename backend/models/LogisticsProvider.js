const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    phone: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    contactPerson: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const logisticsProviderSchema = new mongoose.Schema(
  {
    providerName: { type: String, required: true, trim: true },
    contact: { type: contactSchema, default: () => ({}) },
    vehicleType: { type: String, required: true, trim: true, index: true },
    vehicleCapacity: { type: Number, min: 0, default: null },
    capacityUnit: { type: String, trim: true, default: 'tonnes' },
    serviceAreas: [{ type: String, trim: true }],
    supportedProduce: [{ type: String, trim: true }],
    baseRate: { type: Number, min: 0, default: null },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    availabilityStatus: { type: String, enum: ['sample', 'unknown', 'available'], default: 'sample' },
    dataSource: { type: String, enum: ['sample', 'verified'], default: 'sample' },
    availabilityNote: {
      type: String,
      trim: true,
      default: 'Sample provider record. Availability and rates must be confirmed directly with the provider.',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

logisticsProviderSchema.index({ status: 1, vehicleType: 1 });
logisticsProviderSchema.index({ serviceAreas: 1 });
logisticsProviderSchema.index({ supportedProduce: 1 });

module.exports = mongoose.model('LogisticsProvider', logisticsProviderSchema);
