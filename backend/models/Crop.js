const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    crop_name: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      enum: ['kg', 'quintal', 'ton'],
      required: true,
      default: 'kg',
      trim: true,
    },
    farmer_id: {
      type: String,
      trim: true,
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model('Crop', cropSchema);
