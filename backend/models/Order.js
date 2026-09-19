const mongoose = require('mongoose');
const { generateOrderId } = require('../utils/marketplaceId');

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      trim: true,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unit: {
      type: String,
      trim: true,
      default: 'kg',
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      index: true,
      trim: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Buyer',
      required: true,
      index: true,
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farmer',
      required: true,
      index: true,
    },
    products: {
      type: [orderItemSchema],
      default: [],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentTransactionId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Verified', 'Failed'],
      default: 'Pending',
    },
    orderStatus: {
      type: String,
      enum: ['Paid', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'],
      default: 'Packed',
    },
    deliveryDate: {
      type: Date,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['PhonePe', 'Paytm', 'Razorpay', 'UPI'],
      default: 'PhonePe',
    },
    statusHistory: {
      type: [
        {
          status: {
            type: String,
            enum: ['Paid', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'],
            required: true,
          },
          date: {
            type: Date,
            required: true,
          },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

orderSchema.pre('validate', async function assignOrderId(next) {
  if (!this.orderId) {
    this.orderId = await generateOrderId();
  }

  if (!Array.isArray(this.statusHistory) || this.statusHistory.length === 0) {
    this.statusHistory = [{ status: this.orderStatus || 'Packed', date: new Date() }];
  }

  next();
});

module.exports = mongoose.model('Order', orderSchema);