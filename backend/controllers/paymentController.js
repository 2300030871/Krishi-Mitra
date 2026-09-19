const crypto = require('crypto');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Farmer = require('../models/Farmer');
const Buyer = require('../models/Buyer');
const { isValidTransactionId } = require('./orderController');
const { createRazorpayClient, getRazorpayConfig } = require('../config/razorpay');

const toPaise = (amount) => Math.round(Number(amount || 0) * 100);

const syncPaymentState = async ({ order, paymentTransactionId, status, verifiedBy }) => {
  const payment = await Payment.findOneAndUpdate(
    { orderId: order._id },
    {
      $set: {
        paymentTransactionId,
        status,
        verifiedAt: status === 'Verified' ? new Date() : null,
        verifiedBy: status === 'Verified' ? verifiedBy : null,
      },
    },
    { new: true, runValidators: true }
  );

  if (!payment) {
    return null;
  }

  order.paymentTransactionId = paymentTransactionId;
  order.paymentStatus = status;
  await order.save();

  return payment;
};

const createRazorpayOrder = async (req, res, next) => {
  try {
    const { amount, orderId } = req.body;
    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: 'A valid amount is required.' });
    }

    const razorpay = createRazorpayClient();
    const config = getRazorpayConfig();

    if (!razorpay || !config.enabled) {
      return res.status(500).json({ message: 'Razorpay is not configured on the server.' });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: toPaise(parsedAmount),
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    });

    if (orderId) {
      const buyerProfile = await Buyer.findOne({ userId: req.user.id });
      const order = await Order.findOne({ orderId, buyerId: buyerProfile?._id });

      if (order) {
        await Payment.findOneAndUpdate(
          { orderId: order._id },
          {
            $set: {
              method: 'Razorpay',
              razorpayOrderId: razorpayOrder.id,
            },
          },
          { new: true, runValidators: true }
        );
      }
    }

    return res.json({
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: config.keyId,
    });
  } catch (error) {
    return next(error);
  }
};

const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const {
      orderId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    } = req.body;

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ message: 'orderId, razorpay_order_id, razorpay_payment_id and razorpay_signature are required.' });
    }

    const config = getRazorpayConfig();
    if (!config.enabled) {
      return res.status(500).json({ message: 'Razorpay is not configured on the server.' });
    }

    const buyerProfile = await Buyer.findOne({ userId: req.user.id });
    const order = req.marketplaceOrder || (await Order.findOne({ orderId, buyerId: buyerProfile?._id }));

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const generatedSignature = crypto
      .createHmac('sha256', config.keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    const verified = generatedSignature === String(razorpaySignature);

    if (!verified) {
      await Payment.findOneAndUpdate(
        { orderId: order._id },
        {
          $set: {
            method: 'Razorpay',
            status: 'Failed',
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
          },
        },
        { new: true, runValidators: true }
      );

      order.paymentStatus = 'Failed';
      await order.save();

      return res.status(400).json({ message: 'Payment signature verification failed.' });
    }

    const payment = await Payment.findOneAndUpdate(
      { orderId: order._id },
      {
        $set: {
          method: 'Razorpay',
          status: 'Verified',
          verifiedAt: new Date(),
          verifiedBy: req.user.id,
          paymentTransactionId: razorpayPaymentId,
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
        },
      },
      { new: true, runValidators: true }
    );

    order.paymentStatus = 'Verified';
    order.paymentTransactionId = razorpayPaymentId;
    order.orderStatus = 'Paid';

    const lastStatus = order.statusHistory?.[order.statusHistory.length - 1];
    if (!lastStatus || lastStatus.status !== 'Paid') {
      order.statusHistory.push({ status: 'Paid', date: new Date() });
    }

    await order.save();

    return res.json({
      message: 'Payment Successful',
      payment,
      order,
    });
  } catch (error) {
    return next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { orderId, paymentTransactionId } = req.body;

    if (!orderId || !paymentTransactionId) {
      return res.status(400).json({ message: 'Order ID and Payment Transaction ID are required.' });
    }

    const farmerProfile = await Farmer.findOne({ userId: req.user.id });
    if (!farmerProfile) {
      return res.status(404).json({ message: 'Farmer profile not found.' });
    }

    const order = req.marketplaceOrder || (await Order.findOne({ orderId }));
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (String(order.farmerId) !== String(farmerProfile._id)) {
      return res.status(403).json({ message: 'You can only verify payments for your own orders.' });
    }

    const status = isValidTransactionId(paymentTransactionId) ? 'Verified' : 'Failed';
    const payment = await syncPaymentState({
      order,
      paymentTransactionId: String(paymentTransactionId).trim(),
      status,
      verifiedBy: req.user.id,
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found for this order.' });
    }

    farmerProfile.ordersReceivedCount = await Order.countDocuments({ farmerId: farmerProfile._id });
    farmerProfile.latestOrderStatus = order.orderStatus;
    await farmerProfile.save();

    return res.json({
      message: status === 'Verified' ? 'Payment verified successfully.' : 'Payment verification failed.',
      payment,
      order,
    });
  } catch (error) {
    return next(error);
  }
};

const retryPayment = async (req, res, next) => {
  try {
    const { orderId, paymentTransactionId, paymentMethod } = req.body;

    if (!orderId || !paymentTransactionId) {
      return res.status(400).json({ message: 'Order ID and Payment Transaction ID are required.' });
    }

    const buyerProfile = await Buyer.findOne({ userId: req.user.id });
    if (!buyerProfile) {
      return res.status(404).json({ message: 'Buyer profile not found.' });
    }

    const order = req.marketplaceOrder || (await Order.findOne({ orderId, buyerId: buyerProfile._id }));
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const payment = await Payment.findOne({ orderId: order._id });
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found for this order.' });
    }

    const status = isValidTransactionId(paymentTransactionId) ? 'Verified' : 'Failed';
    const nextPayment = await Payment.findOneAndUpdate(
      { orderId: order._id },
      {
        $set: {
          paymentTransactionId: String(paymentTransactionId).trim(),
          method: paymentMethod || payment.method,
          status,
          verifiedAt: status === 'Verified' ? new Date() : null,
          verifiedBy: status === 'Verified' ? req.user.id : null,
        },
      },
      { new: true, runValidators: true }
    );

    order.paymentTransactionId = String(paymentTransactionId).trim();
    order.paymentStatus = status;
    if (paymentMethod) {
      order.paymentMethod = paymentMethod;
    }
    await order.save();

    return res.json({
      message: status === 'Verified' ? 'Payment retry verified successfully.' : 'Payment retry failed.',
      payment: nextPayment,
      order,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  verifyPayment,
  retryPayment,
};