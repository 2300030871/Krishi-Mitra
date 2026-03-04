const Crop = require('../models/Crop');

const normalizeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const allowedUnits = new Set(['kg', 'quintal', 'ton']);

const normalizeUnit = (value) => String(value || '').trim().toLowerCase();

const addCrop = async (req, res, next) => {
  try {
    const { crop_name, price, quantity, unit, farmer_id, location } = req.body;

    if (!crop_name || price === undefined || quantity === undefined || !unit || !farmer_id || !location) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const parsedPrice = normalizeNumber(price);
    const parsedQuantity = normalizeNumber(quantity);

    if (parsedPrice === null || parsedQuantity === null) {
      return res.status(400).json({ message: 'Price and quantity must be valid numbers.' });
    }

    const normalizedUnit = normalizeUnit(unit);
    if (!allowedUnits.has(normalizedUnit)) {
      return res.status(400).json({ message: 'Unit must be one of: kg, quintal, ton.' });
    }

    const crop = await Crop.create({
      crop_name,
      price: parsedPrice,
      quantity: parsedQuantity,
      unit: normalizedUnit,
      farmer_id,
      location,
    });

    req.io.emit('cropAdded', crop);

    return res.status(201).json(crop);
  } catch (error) {
    return next(error);
  }
};

const updateCrop = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.price !== undefined) {
      const parsedPrice = normalizeNumber(updates.price);
      if (parsedPrice === null) {
        return res.status(400).json({ message: 'Price must be a valid number.' });
      }
      updates.price = parsedPrice;
    }

    if (updates.quantity !== undefined) {
      const parsedQuantity = normalizeNumber(updates.quantity);
      if (parsedQuantity === null) {
        return res.status(400).json({ message: 'Quantity must be a valid number.' });
      }
      updates.quantity = parsedQuantity;
    }

    if (updates.unit !== undefined) {
      const normalizedUnit = normalizeUnit(updates.unit);
      if (!allowedUnits.has(normalizedUnit)) {
        return res.status(400).json({ message: 'Unit must be one of: kg, quintal, ton.' });
      }
      updates.unit = normalizedUnit;
    }

    const updatedCrop = await Crop.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedCrop) {
      return res.status(404).json({ message: 'Crop not found.' });
    }

    req.io.emit('cropUpdated', updatedCrop);

    return res.json(updatedCrop);
  } catch (error) {
    return next(error);
  }
};

const deleteCrop = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedCrop = await Crop.findByIdAndDelete(id);

    if (!deletedCrop) {
      return res.status(404).json({ message: 'Crop not found.' });
    }

    req.io.emit('cropDeleted', { id: deletedCrop._id.toString() });

    return res.json({ message: 'Crop deleted successfully.' });
  } catch (error) {
    return next(error);
  }
};

const getAllCrops = async (req, res, next) => {
  try {
    const { crop_name, location, minPrice, maxPrice } = req.query;
    const query = {};

    if (crop_name) {
      query.crop_name = { $regex: crop_name, $options: 'i' };
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};

      if (minPrice !== undefined) {
        const parsedMinPrice = normalizeNumber(minPrice);
        if (parsedMinPrice === null) {
          return res.status(400).json({ message: 'minPrice must be a valid number.' });
        }
        query.price.$gte = parsedMinPrice;
      }

      if (maxPrice !== undefined) {
        const parsedMaxPrice = normalizeNumber(maxPrice);
        if (parsedMaxPrice === null) {
          return res.status(400).json({ message: 'maxPrice must be a valid number.' });
        }
        query.price.$lte = parsedMaxPrice;
      }
    }

    const crops = await Crop.find(query).sort({ created_at: -1 });

    return res.json(crops);
  } catch (error) {
    return next(error);
  }
};

const getCropById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const crop = await Crop.findById(id);

    if (!crop) {
      return res.status(404).json({ message: 'Crop not found.' });
    }

    return res.json(crop);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  addCrop,
  updateCrop,
  deleteCrop,
  getAllCrops,
  getCropById,
};
