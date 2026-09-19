const mongoose = require('mongoose');
const { generateBuyerId } = require('../utils/marketplaceId');

const buyerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    buyerId: {
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
    mobileNumber: {
      type: String,
      trim: true,
      default: '',
    },
    pinCode: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

buyerSchema.pre('validate', async function assignBuyerId(next) {
  if (!this.buyerId) {
    this.buyerId = await generateBuyerId();
  }

  next();
});

module.exports = mongoose.model('Buyer', buyerSchema);