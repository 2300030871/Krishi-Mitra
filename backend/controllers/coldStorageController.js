const mongoose = require('mongoose');
const ColdStorage = require('../models/ColdStorage');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseCoordinate = (value, min, max) => {
  if (value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
};

const toRadians = (value) => (value * Math.PI) / 180;

const distanceInKm = (latitude, longitude, targetLatitude, targetLongitude) => {
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(targetLatitude - latitude);
  const longitudeDelta = toRadians(targetLongitude - longitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(latitude)) * Math.cos(toRadians(targetLatitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const addDistance = (storage, latitude, longitude) => {
  if (latitude === null || longitude === null || storage.latitude === null || storage.longitude === null) {
    return storage;
  }

  return {
    ...storage,
    distanceKm: Number(distanceInKm(latitude, longitude, storage.latitude, storage.longitude).toFixed(1)),
  };
};

const buildFilter = (query) => {
  const filter = { status: 'active' };
  const produce = String(query.produce || '').trim();
  const location = String(query.location || '').trim();
  const storageType = String(query.storageType || '').trim();
  const quantity = query.quantity === undefined || query.quantity === '' ? null : Number(query.quantity);

  if (produce) filter.supportedProduce = { $regex: escapeRegex(produce), $options: 'i' };
  if (location) filter.location = { $regex: escapeRegex(location), $options: 'i' };
  if (storageType) filter.storageType = { $regex: escapeRegex(storageType), $options: 'i' };
  if (quantity !== null && Number.isFinite(quantity) && quantity >= 0) {
    filter.availableCapacity = { $gte: quantity };
  }

  return { filter, invalidQuantity: quantity !== null && (!Number.isFinite(quantity) || quantity < 0) };
};

const getColdStorage = async (req, res, next) => {
  try {
    const { filter, invalidQuantity } = buildFilter(req.query);
    if (invalidQuantity) {
      return res.status(400).json({ message: 'Quantity must be a valid non-negative number.' });
    }

    const latitude = parseCoordinate(req.query.latitude ?? req.query.lat, -90, 90);
    const longitude = parseCoordinate(req.query.longitude ?? req.query.lon, -180, 180);
    const records = await ColdStorage.find(filter).sort({ name: 1 }).lean();

    return res.json({
      success: true,
      sampleData: records.some((record) => record.dataSource === 'sample'),
      storageOptions: records.map((record) => addDistance(record, latitude, longitude)),
    });
  } catch (error) {
    return next(error);
  }
};

const getColdStorageById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid storage id.' });
    }

    const record = await ColdStorage.findOne({ _id: req.params.id, status: 'active' }).lean();
    if (!record) {
      return res.status(404).json({ message: 'Cold-storage option not found.' });
    }

    const latitude = parseCoordinate(req.query.latitude ?? req.query.lat, -90, 90);
    const longitude = parseCoordinate(req.query.longitude ?? req.query.lon, -180, 180);

    return res.json({
      success: true,
      storage: addDistance(record, latitude, longitude),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getColdStorage,
  getColdStorageById,
};
