const mongoose = require('mongoose');
const LogisticsProvider = require('../models/LogisticsProvider');
const TransportRequest = require('../models/TransportRequest');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getLogisticsProviders = async (req, res, next) => {
  try {
    const produce = String(req.query.produce || '').trim();
    const location = String(req.query.pickupLocation || req.query.location || '').trim();
    const vehicleType = String(req.query.vehicleType || '').trim();
    const quantity = req.query.quantity === undefined || req.query.quantity === '' ? null : Number(req.query.quantity);

    if (quantity !== null && (!Number.isFinite(quantity) || quantity <= 0)) {
      return res.status(400).json({ message: 'Quantity must be a valid number greater than 0.' });
    }

    const filter = { status: 'active' };
    if (produce) filter.supportedProduce = { $regex: escapeRegex(produce), $options: 'i' };
    if (location) filter.serviceAreas = { $regex: escapeRegex(location), $options: 'i' };
    if (vehicleType) filter.vehicleType = { $regex: escapeRegex(vehicleType), $options: 'i' };
    if (quantity !== null) filter.vehicleCapacity = { $gte: quantity };

    const providers = await LogisticsProvider.find(filter).sort({ providerName: 1 }).lean();
    const result = providers.map((provider) => ({
      ...provider,
      estimatedCost: provider.baseRate,
      costIsSample: provider.dataSource === 'sample',
      availabilityIsLive: provider.availabilityStatus === 'available' && provider.dataSource === 'verified',
    }));

    return res.json({
      success: true,
      sampleData: providers.some((provider) => provider.dataSource === 'sample'),
      providers: result,
    });
  } catch (error) {
    return next(error);
  }
};

const createTransportRequest = async (req, res, next) => {
  try {
    const produce = String(req.body.produce || '').trim();
    const pickupLocation = String(req.body.pickupLocation || '').trim();
    const destination = String(req.body.destination || '').trim();
    const quantity = Number(req.body.quantity);
    const providerId = String(req.body.providerId || '').trim();
    const clientRequestId = String(req.body.clientRequestId || '').trim();
    const vehicleType = String(req.body.vehicleType || '').trim();
    const requestedDateValue = String(req.body.requestedDate || '').trim();

    if (!produce || !pickupLocation || !destination || !providerId) {
      return res.status(400).json({ message: 'Produce, pickup location, destination, and provider are required.' });
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be a valid number greater than 0.' });
    }

    if (clientRequestId) {
      const existing = await TransportRequest.findOne({ farmerId: req.user.id, clientRequestId }).populate('providerId').lean();
      if (existing) return res.status(200).json({ success: true, request: existing });
    }

    if (!mongoose.Types.ObjectId.isValid(providerId)) {
      return res.status(400).json({ message: 'Invalid logistics provider.' });
    }

    const provider = await LogisticsProvider.findOne({ _id: providerId, status: 'active' }).lean();
    if (!provider) {
      return res.status(404).json({ message: 'Logistics provider not found.' });
    }

    if (provider.vehicleCapacity !== null && quantity > provider.vehicleCapacity) {
      return res.status(400).json({ message: 'Requested quantity exceeds the selected vehicle capacity.' });
    }

    let requestedDate = null;
    if (requestedDateValue) {
      requestedDate = new Date(requestedDateValue);
      if (Number.isNaN(requestedDate.getTime())) {
        return res.status(400).json({ message: 'Requested date must be valid.' });
      }
    }

    const request = await TransportRequest.create({
      farmerId: req.user.id,
      clientRequestId: clientRequestId || undefined,
      produce,
      quantity,
      pickupLocation,
      destination,
      vehicleType: vehicleType || provider.vehicleType,
      requestedDate,
      providerId: provider._id,
      status: 'requested',
    });

    const populated = await TransportRequest.findById(request._id).populate('providerId').lean();
    return res.status(201).json({ success: true, request: populated });
  } catch (error) {
    return next(error);
  }
};

const getMyTransportRequests = async (req, res, next) => {
  try {
    const requests = await TransportRequest.find({ farmerId: req.user.id })
      .populate('providerId')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, requests });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getLogisticsProviders,
  createTransportRequest,
  getMyTransportRequests,
};
