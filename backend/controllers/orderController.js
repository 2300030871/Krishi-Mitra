const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Farmer = require('../models/Farmer');
const Buyer = require('../models/Buyer');
const Cart = require('../models/Cart');

const ORDER_STATUSES = ['Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

const calculateDeliveryDate = () => {
  const daysToAdd = 3 + Math.floor(Math.random() * 5);
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + daysToAdd);
  return { daysToAdd, deliveryDate };
};

const normalizeQuantity = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 1;
  return parsed;
};

const isValidTransactionId = (transactionId) => {
  const value = String(transactionId || '').trim();
  return value.length >= 8 && value.length <= 12;
};

const getBuyerProfile = async (userId) => Buyer.findOne({ userId });
const getFarmerProfile = async (userId) => Farmer.findOne({ userId });
const getBuyerCart = async (userId) => Cart.findOne({ userId }).populate('items.productId');

const getFarmerUserIdFromCart = (cart) => {
  const farmerIds = new Set();

  cart.items.forEach((item) => {
    const product = item.productId;
    const farmerValue = product?.farmerId || product?.farmer || product?.farmer_id;
    if (farmerValue && typeof farmerValue === 'object' && farmerValue._id) {
      farmerIds.add(String(farmerValue._id));
    } else if (farmerValue) {
      farmerIds.add(String(farmerValue));
    }
  });

  return farmerIds.size === 1 ? [...farmerIds][0] : '';
};

const buildOrderItems = (cart) =>
  cart.items
    .map((item) => {
      const product = item.productId;
      if (!product) return null;

      const quantity = normalizeQuantity(item.quantity);
      const price = Number(product.price || 0);

      return {
        productId: product._id,
        name: product.name || product.crop_name || '',
        price,
        quantity,
        unit: product.unit || 'kg',
        imageUrl: product.imageUrl || '',
        lineTotal: price * quantity,
      };
    })
    .filter(Boolean);

const clearCart = async (userId) => {
  await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } }, { upsert: true, new: true, runValidators: true });
};

const createOrder = async (req, res, next) => {
  try {
    const { paymentTransactionId = '', paymentMethod = 'Razorpay' } = req.body;

    const buyerProfile = await getBuyerProfile(req.user.id);
    if (!buyerProfile) {
      return res.status(404).json({ message: 'Buyer profile not found.' });
    }

    const cart = await getBuyerCart(req.user.id);
    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cannot place order with an empty cart.' });
    }

    const farmerUserId = getFarmerUserIdFromCart(cart);
    if (!farmerUserId) {
      return res.status(400).json({ message: 'Cart items must belong to one farmer.' });
    }

    const farmerProfile = await getFarmerProfile(farmerUserId);
    if (!farmerProfile) {
      return res.status(404).json({ message: 'Farmer profile not found.' });
    }

    const products = buildOrderItems(cart);
    if (!products.length) {
      return res.status(400).json({ message: 'Unable to build order from the cart.' });
    }

    const totalAmount = products.reduce((sum, item) => sum + item.lineTotal, 0);
    const { daysToAdd, deliveryDate } = calculateDeliveryDate();
    const normalizedTransactionId = String(paymentTransactionId || '').trim() || `PENDING-${Date.now()}`;

    const order = await Order.create({
      buyerId: buyerProfile._id,
      farmerId: farmerProfile._id,
      products,
      totalAmount,
      paymentTransactionId: normalizedTransactionId,
      paymentMethod,
      paymentStatus: 'Pending',
      orderStatus: 'Packed',
      deliveryDate,
      statusHistory: [{ status: 'Packed', date: new Date() }],
    });

    const payment = await Payment.create({
      paymentTransactionId: normalizedTransactionId,
      orderId: order._id,
      buyerId: buyerProfile._id,
      farmerId: farmerProfile._id,
      amount: totalAmount,
      method: paymentMethod,
      status: 'Pending',
    });

    farmerProfile.ordersReceivedCount = await Order.countDocuments({ farmerId: farmerProfile._id });
    farmerProfile.latestOrderStatus = order.orderStatus;
    await farmerProfile.save();

    await clearCart(req.user.id);

    return res.status(201).json({
      message: 'Order placed successfully.',
      order,
      payment,
      estimatedDeliveryDays: daysToAdd,
      paymentStatus: payment.status,
    });
  } catch (error) {
    return next(error);
  }
};

const getBuyerOrders = async (req, res, next) => {
  try {
    const buyerProfile = await getBuyerProfile(req.user.id);
    if (!buyerProfile) {
      return res.json([]);
    }

    const orders = await Order.find({ buyerId: buyerProfile._id })
      .populate('farmerId')
      .sort({ createdAt: -1 });

    return res.json(orders);
  } catch (error) {
    return next(error);
  }
};

const getFarmerOrders = async (req, res, next) => {
  try {
    const farmerProfile = await getFarmerProfile(req.user.id);
    if (!farmerProfile) {
      return res.json([]);
    }

    const orders = await Order.find({ farmerId: farmerProfile._id })
      .populate('buyerId')
      .sort({ createdAt: -1 });

    return res.json(orders);
  } catch (error) {
    return next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus } = req.body;
    const order = req.marketplaceOrder || (await Order.findOne({ orderId: req.params.orderId }));

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (!ORDER_STATUSES.includes(orderStatus)) {
      return res.status(400).json({ message: 'Invalid order status.' });
    }

    const farmerProfile = await getFarmerProfile(req.user.id);
    if (!farmerProfile) {
      return res.status(404).json({ message: 'Farmer profile not found.' });
    }

    if (String(order.farmerId) !== String(farmerProfile._id)) {
      return res.status(403).json({ message: 'You can only update your own orders.' });
    }

    order.orderStatus = orderStatus;
    const lastHistory = order.statusHistory[order.statusHistory.length - 1];
    if (!lastHistory || lastHistory.status !== orderStatus) {
      order.statusHistory.push({ status: orderStatus, date: new Date() });
    }

    await order.save();

    farmerProfile.latestOrderStatus = orderStatus;
    await farmerProfile.save();

    return res.json(order);
  } catch (error) {
    return next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = req.marketplaceOrder || (await Order.findOne({ orderId: req.params.orderId }).populate('buyerId').populate('farmerId'));

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    return res.json(order);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createOrder,
  getBuyerOrders,
  getFarmerOrders,
  updateOrderStatus,
  getOrderById,
  isValidTransactionId,
};