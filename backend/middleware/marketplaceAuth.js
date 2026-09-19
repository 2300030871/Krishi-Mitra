const Buyer = require('../models/Buyer');
const Farmer = require('../models/Farmer');
const Order = require('../models/Order');
const { requireAnyRole } = require('./authMiddleware');

const requireBuyerRole = [requireAnyRole(['buyer'])];
const requireFarmerRole = [requireAnyRole(['farmer'])];

const getProfileByRole = async (userId, role) => {
  if (role === 'buyer') {
    return Buyer.findOne({ userId });
  }

  if (role === 'farmer') {
    return Farmer.findOne({ userId });
  }

  return null;
};

const requireOrderOwnership = (allowedRoles = ['buyer', 'farmer']) => async (req, res, next) => {
  try {
    const orderKey = req.params.orderId || req.body.orderId;
    if (!orderKey) {
      return res.status(400).json({ message: 'Order ID is required.' });
    }

    const order = await Order.findOne({ orderId: orderKey }).populate('buyerId').populate('farmerId');
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const role = String(req.user?.role || '').toLowerCase();
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role permissions.' });
    }

    const profile = await getProfileByRole(req.user.id, role);
    if (!profile) {
      return res.status(404).json({ message: `${role === 'farmer' ? 'Farmer' : 'Buyer'} profile not found.` });
    }

    const ownsOrder = role === 'buyer'
      ? String(order.buyerId?._id || order.buyerId) === String(profile._id)
      : String(order.farmerId?._id || order.farmerId) === String(profile._id);

    if (!ownsOrder) {
      return res.status(403).json({ message: 'You can only access your own orders.' });
    }

    req.marketplaceOrder = order;
    req.marketplaceProfile = profile;
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  requireBuyerRole,
  requireFarmerRole,
  requireOrderOwnership,
};