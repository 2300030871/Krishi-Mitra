const Crop = require('../models/Crop');
const { createCrop, updateCrop, deleteCrop, getMyCrops } = require('../services/cropService');

const toPublicPath = (filePath) => {
  if (!filePath) return '';
  const normalized = String(filePath).replace(/\\/g, '/');
  if (normalized.startsWith('http')) return normalized;
  if (normalized.startsWith('/uploads/')) return normalized;
  return `/uploads/${normalized.split('/uploads/').pop()}`;
};

const toImageUrl = (req, file) => {
  if (!file) return '';
  return `/uploads/${String(file.path).split('uploads').pop().replace(/\\/g, '/').replace(/^\//, '')}`;
};

const formatCrop = (crop) => ({
  ...crop.toObject(),
  imageUrl: toPublicPath(crop.imageUrl),
});

const getAllCropsV2 = async (req, res, next) => {
  try {
    const { crop_name, name, location, minPrice, maxPrice } = req.query;
    const query = {};

    if (crop_name || name) {
      const keyword = String(name || crop_name).trim();
      query.$or = [
        { crop_name: { $regex: keyword, $options: 'i' } },
        { name: { $regex: keyword, $options: 'i' } },
      ];
    }

    if (location) {
      query.location = { $regex: String(location).trim(), $options: 'i' };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined && minPrice !== '') {
        const min = Number(minPrice);
        if (!Number.isFinite(min)) {
          return res.status(400).json({ message: 'minPrice must be a valid number.' });
        }
        query.price.$gte = min;
      }
      if (maxPrice !== undefined && maxPrice !== '') {
        const max = Number(maxPrice);
        if (!Number.isFinite(max)) {
          return res.status(400).json({ message: 'maxPrice must be a valid number.' });
        }
        query.price.$lte = max;
      }
      if (!Object.keys(query.price).length) {
        delete query.price;
      }
    }

    const crops = await Crop.find(query).populate('farmer', 'name email').sort({ createdAt: -1, created_at: -1 });

    return res.json(crops.map((crop) => formatCrop(crop)));
  } catch (error) {
    return next(error);
  }
};

const getCropByIdV2 = async (req, res, next) => {
  try {
    const crop = await Crop.findById(req.params.id).populate('farmer', 'name email');
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found.' });
    }

    return res.json(formatCrop(crop));
  } catch (error) {
    return next(error);
  }
};

const addCropV2 = async (req, res, next) => {
  try {
    const imageUrl = toImageUrl(req, req.file);
    const { crop, error } = await createCrop({
      body: req.body,
      userId: req.user.id,
      imageUrl,
    });

    if (error) {
      return res.status(400).json({ message: error });
    }

    const withFarmer = await Crop.findById(crop._id).populate('farmer', 'name email');
    const payload = formatCrop(withFarmer);

    req.io.emit('cropAdded', payload);
    req.io.emit('crop:created', payload);

    return res.status(201).json(payload);
  } catch (error) {
    return next(error);
  }
};

const updateCropV2 = async (req, res, next) => {
  try {
    const imageUrl = toImageUrl(req, req.file);
    const result = await updateCrop({
      id: req.params.id,
      body: req.body,
      userId: req.user.id,
      imageUrl,
    });

    if (result.error) {
      return res.status(result.status || 400).json({ message: result.error });
    }

    const withFarmer = await Crop.findById(result.crop._id).populate('farmer', 'name email');
    const payload = formatCrop(withFarmer);

    req.io.emit('cropUpdated', payload);
    req.io.emit('crop:updated', payload);

    return res.json(payload);
  } catch (error) {
    return next(error);
  }
};

const deleteCropV2 = async (req, res, next) => {
  try {
    const result = await deleteCrop({ id: req.params.id, userId: req.user.id });

    if (result.error) {
      return res.status(result.status || 400).json({ message: result.error });
    }

    const deletedId = result.crop._id.toString();
    req.io.emit('cropDeleted', { id: deletedId });
    req.io.emit('crop:deleted', { id: deletedId });

    return res.json({ message: 'Crop deleted successfully.', id: deletedId });
  } catch (error) {
    return next(error);
  }
};

const getMyCropsV2 = async (req, res, next) => {
  try {
    const crops = await getMyCrops(req.user.id);
    return res.json(crops.map((crop) => formatCrop(crop)));
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAllCropsV2,
  getCropByIdV2,
  addCropV2,
  updateCropV2,
  deleteCropV2,
  getMyCropsV2,
};
