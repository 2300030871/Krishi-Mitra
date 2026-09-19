const Cart = require('../models/Cart');
const Product = require('../models/Product');

const normalizeQuantity = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 1;
  return Math.floor(parsed);
};

const populateCart = async (userId) => Cart.findOne({ userId }).populate('items.productId');

const getCart = async (req, res, next) => {
  try {
    const cart = await populateCart(req.user.id);
    return res.json(cart || { userId: req.user.id, items: [] });
  } catch (error) {
    return next(error);
  }
};

const addCartItem = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const cart = (await Cart.findOne({ userId: req.user.id }).populate('items.productId')) || new Cart({ userId: req.user.id, items: [] });
    const existingFarmerId = cart.items[0]?.productId
      ? String(cart.items[0].productId.farmerId || cart.items[0].productId.farmer || cart.items[0].productId.farmer_id || '')
      : '';
    const currentFarmerId = String(product.farmerId || product.farmer || product.farmer_id || '');

    if (cart.items.length && existingFarmerId && currentFarmerId && existingFarmerId !== currentFarmerId) {
      return res.status(400).json({ message: 'Cart can only contain products from one farmer at a time.' });
    }

    const existingIndex = cart.items.findIndex((item) => String(item.productId) === String(productId));
    const nextQuantity = normalizeQuantity(quantity);

    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += nextQuantity;
    } else {
      cart.items.push({ productId: product._id, quantity: nextQuantity });
    }

    await cart.save();
    const populated = await populateCart(req.user.id);
    return res.status(200).json(populated);
  } catch (error) {
    return next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const nextQuantity = normalizeQuantity(quantity);

    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.json({ userId: req.user.id, items: [] });
    }

    const itemIndex = cart.items.findIndex((item) => String(item.productId) === String(productId));
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Cart item not found.' });
    }

    if (nextQuantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = nextQuantity;
    }

    await cart.save();
    const populated = await populateCart(req.user.id);
    return res.json(populated || { userId: req.user.id, items: [] });
  } catch (error) {
    return next(error);
  }
};

const removeCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      return res.json({ userId: req.user.id, items: [] });
    }

    cart.items = cart.items.filter((item) => String(item.productId) !== String(productId));
    await cart.save();

    const populated = await populateCart(req.user.id);
    return res.json(populated || { userId: req.user.id, items: [] });
  } catch (error) {
    return next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { items: [] } },
      { upsert: true, new: true, runValidators: true }
    );

    return res.json(cart);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
};