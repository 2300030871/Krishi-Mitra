const User = require('../models/User');
const News = require('../models/News');
const Scheme = require('../models/Scheme');

const toTrimmed = (value) => String(value || '').trim();

const isValidHttpUrl = (value) => {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (error) {
    return false;
  }
};

const addNews = async (req, res, next) => {
  try {
    const title = toTrimmed(req.body.title);
    const content = toTrimmed(req.body.content || req.body.summary || req.body.description);
    const image = toTrimmed(req.body.image);

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required.' });
    }

    if (image && !isValidHttpUrl(image)) {
      return res.status(400).json({ message: 'Image must be a valid http/https URL.' });
    }

    const item = await News.create({ title, content, image });

    return res.status(201).json(item);
  } catch (error) {
    return next(error);
  }
};

const deleteNews = async (req, res, next) => {
  try {
    const deleted = await News.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'News item not found.' });
    }

    return res.json({ message: 'News item deleted.' });
  } catch (error) {
    return next(error);
  }
};

const addScheme = async (req, res, next) => {
  try {
    const title = toTrimmed(req.body.title);
    const description = toTrimmed(req.body.description);
    const eligibility = toTrimmed(req.body.eligibility);
    const link = toTrimmed(req.body.link);

    if (!title || !description || !eligibility) {
      return res.status(400).json({ message: 'Title, description and eligibility are required.' });
    }

    if (!isValidHttpUrl(link)) {
      return res.status(400).json({ message: 'Link must be a valid http/https URL.' });
    }

    const item = await Scheme.create({ title, description, eligibility, link });

    return res.status(201).json(item);
  } catch (error) {
    return next(error);
  }
};

const deleteScheme = async (req, res, next) => {
  try {
    const deleted = await Scheme.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Scheme not found.' });
    }

    return res.json({ message: 'Scheme deleted.' });
  } catch (error) {
    return next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const role = toTrimmed(req.query.role).toLowerCase();
    const search = toTrimmed(req.query.search);
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    const filter = {};

    if (role && ['farmer', 'buyer', 'admin'].includes(role)) {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const shouldPaginate = req.query.page !== undefined || req.query.limit !== undefined || search || role;

    if (!shouldPaginate) {
      const users = await User.find(filter).select('-password').sort({ createdAt: -1 }).lean();
      return res.json(users);
    }

    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 50) : 10;

    const [items, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return res.json({
      items,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    });
  } catch (error) {
    return next(error);
  }
};

const deactivateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (String(id) === String(req.user.id)) {
      return res.status(400).json({ message: 'You cannot deactivate your own admin account.' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      {
        isActive: false,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json(user);
  } catch (error) {
    return next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (String(id) === String(req.user.id)) {
      return res.status(400).json({ message: 'You cannot delete your own admin account.' });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  addNews,
  deleteNews,
  addScheme,
  deleteScheme,
  getUsers,
  deactivateUser,
  deleteUser,
};
