const Crop = require('../models/Crop');

const normalizeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const allowedUnits = new Set(['kg', 'quintal', 'ton']);

const normalizeUnit = (value) => String(value || '').trim().toLowerCase();

const buildCropPayload = ({ body, userId, imageUrl }) => {
  const name = String(body.name || body.crop_name || '').trim();
  const location = String(body.location || '').trim();
  const description = String(body.description || '').trim();
  const price = normalizeNumber(body.price);
  const quantity = normalizeNumber(body.quantity);
  const unit = normalizeUnit(body.unit);

  if (!name || !location || price === null || quantity === null || !unit) {
    return {
      error: 'Name, location, price, quantity and unit are required.',
    };
  }

  if (!allowedUnits.has(unit)) {
    return {
      error: 'Unit must be one of: kg, quintal, ton.',
    };
  }

  return {
    payload: {
      name,
      crop_name: name,
      price,
      quantity,
      unit,
      location,
      description,
      imageUrl: imageUrl || String(body.imageUrl || '').trim(),
      farmer: userId,
      farmer_id: String(userId),
    },
  };
};

const createCrop = async ({ body, userId, imageUrl }) => {
  const { payload, error } = buildCropPayload({ body, userId, imageUrl });
  if (error) {
    return { error };
  }

  const crop = await Crop.create(payload);
  return { crop };
};

const updateCrop = async ({ id, body, userId, imageUrl }) => {
  const existing = await Crop.findById(id);
  if (!existing) {
    return { error: 'Crop not found.', status: 404 };
  }

  const ownerId = existing.farmer ? existing.farmer.toString() : existing.farmer_id;
  if (String(ownerId) !== String(userId)) {
    return { error: 'You can only update your own crops.', status: 403 };
  }

  const updates = {};

  if (body.name !== undefined || body.crop_name !== undefined) {
    const name = String(body.name || body.crop_name || '').trim();
    if (!name) return { error: 'Crop name cannot be empty.', status: 400 };
    updates.name = name;
    updates.crop_name = name;
  }

  if (body.location !== undefined) {
    const location = String(body.location || '').trim();
    if (!location) return { error: 'Location cannot be empty.', status: 400 };
    updates.location = location;
  }

  if (body.description !== undefined) {
    updates.description = String(body.description || '').trim();
  }

  if (body.price !== undefined) {
    const price = normalizeNumber(body.price);
    if (price === null) return { error: 'Price must be a valid number.', status: 400 };
    updates.price = price;
  }

  if (body.quantity !== undefined) {
    const quantity = normalizeNumber(body.quantity);
    if (quantity === null) return { error: 'Quantity must be a valid number.', status: 400 };
    updates.quantity = quantity;
  }

  if (body.unit !== undefined) {
    const unit = normalizeUnit(body.unit);
    if (!unit) {
      return { error: 'Unit is required.', status: 400 };
    }
    if (!allowedUnits.has(unit)) {
      return { error: 'Unit must be one of: kg, quintal, ton.', status: 400 };
    }
    updates.unit = unit;
  }

  if (imageUrl) {
    updates.imageUrl = imageUrl;
  }

  const crop = await Crop.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  return { crop };
};

const deleteCrop = async ({ id, userId }) => {
  const crop = await Crop.findById(id);

  if (!crop) {
    return { error: 'Crop not found.', status: 404 };
  }

  const ownerId = crop.farmer ? crop.farmer.toString() : crop.farmer_id;
  if (String(ownerId) !== String(userId)) {
    return { error: 'You can only delete your own crops.', status: 403 };
  }

  await Crop.deleteOne({ _id: id });
  return { crop };
};

const getMyCrops = async (userId) => {
  return Crop.find({
    $or: [{ farmer: userId }, { farmer_id: String(userId) }],
  }).sort({ createdAt: -1, created_at: -1 });
};

module.exports = {
  createCrop,
  updateCrop,
  deleteCrop,
  getMyCrops,
};
