const mongoose = require('mongoose');
const { generateFarmerId } = require('../utils/marketplaceId');

const farmerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    farmerId: {
      type: String,
      unique: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
      required: true,
    },
    productsAddedCount: {
      type: Number,
      default: 0,
    },
    ordersReceivedCount: {
      type: Number,
      default: 0,
    },
    latestOrderStatus: {
      type: String,
      default: 'Packed',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

farmerSchema.pre('validate', async function assignFarmerId(next) {
  if (!this.farmerId) {
    this.farmerId = await generateFarmerId();
  }

  next();
});

module.exports = mongoose.model('Farmer', farmerSchema);