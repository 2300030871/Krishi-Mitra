const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    paymentTransactionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
      index: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Buyer',
      required: true,
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farmer',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    method: {
      type: String,
      enum: ['PhonePe', 'Paytm', 'Razorpay', 'UPI'],
      default: 'PhonePe',
    },
    razorpayOrderId: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    razorpaySignature: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Pending', 'Verified', 'Failed'],
      default: 'Pending',
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model('Payment', paymentSchema);