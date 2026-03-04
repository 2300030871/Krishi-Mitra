const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { toCanonicalLanguage } = require('../utils/language');

const validRoles = new Set(['farmer', 'buyer', 'admin']);

const buildToken = (user) => {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      preferredLanguage: toCanonicalLanguage(user.preferredLanguage),
    },
    process.env.JWT_SECRET || 'dev-jwt-secret',
    {
      expiresIn: '7d',
    }
  );
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'farmer' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const normalizedRole = String(role).toLowerCase();
    if (!validRoles.has(normalizedRole)) {
      return res.status(400).json({ message: 'Role must be farmer, buyer, or admin.' });
    }

    const existingUser = await User.findOne({ email: String(email).toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: normalizedRole,
      preferredLanguage: 'english',
      isActive: true,
    });

    const token = buildToken(user);

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferredLanguage: toCanonicalLanguage(user.preferredLanguage),
        isActive: user.isActive,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const loginInternal = async (req, res, next, expectedRole) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'This account has been deactivated. Contact admin.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    if (expectedRole && user.role !== expectedRole) {
      return res.status(403).json({ message: `This account is not registered as ${expectedRole}.` });
    }

    user.preferredLanguage = toCanonicalLanguage(user.preferredLanguage);
    user.lastLogin = new Date();
    await user.save();

    const token = buildToken(user);

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferredLanguage: toCanonicalLanguage(user.preferredLanguage),
        isActive: user.isActive,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  return loginInternal(req, res, next);
};

const loginFarmer = async (req, res, next) => {
  return loginInternal(req, res, next, 'farmer');
};

const loginBuyer = async (req, res, next) => {
  return loginInternal(req, res, next, 'buyer');
};

const loginAdmin = async (req, res, next) => {
  return loginInternal(req, res, next, 'admin');
};

const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json(user);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  register,
  login,
  loginFarmer,
  loginBuyer,
  loginAdmin,
  me,
};
