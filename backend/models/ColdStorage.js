const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    phone: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    contactPerson: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const coldStorageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true, index: true },
    address: { type: String, trim: true, default: '' },
    latitude: { type: Number, min: -90, max: 90, default: null },
    longitude: { type: Number, min: -180, max: 180, default: null },
    storageType: { type: String, required: true, trim: true, index: true },
    capacity: { type: Number, min: 0, default: null },
    availableCapacity: { type: Number, min: 0, default: null },
    supportedProduce: [{ type: String, trim: true }],
    contact: { type: contactSchema, default: () => ({}) },
    operatingHours: { type: String, trim: true, default: '' },
    facilities: [{ type: String, trim: true }],
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    dataSource: { type: String, enum: ['sample', 'verified'], default: 'sample' },
    availabilityNote: {
      type: String,
      trim: true,
      default: 'Sample record. Availability must be confirmed directly with the storage provider.',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

coldStorageSchema.index({ status: 1, location: 1, storageType: 1 });
coldStorageSchema.index({ supportedProduce: 1 });

module.exports = mongoose.model('ColdStorage', coldStorageSchema);
