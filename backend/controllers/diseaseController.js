const fs = require('fs');
const mongoose = require('mongoose');
const DiseaseDiagnosis = require('../models/DiseaseDiagnosis');
const { detectDisease } = require('../services/diseaseDetectionService');

const toPublicImagePath = (file) => `/uploads/disease/${file.filename}`;

const analyzeDisease = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a crop image.' });
  }

  const crop = String(req.body.crop || '').trim();
  if (!crop) {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ message: 'Please select a crop.' });
  }

  try {
    const clientRequestId = String(req.headers['x-client-request-id'] || '').trim();
    if (clientRequestId) {
      const existing = await DiseaseDiagnosis.findOne({ farmerId: req.user.id, clientRequestId });
      if (existing) {
        fs.unlink(req.file.path, () => {});
        return res.status(200).json({ success: true, diagnosis: existing });
      }
    }

    const result = await detectDisease(req.file.path, crop);
    const diagnosis = await DiseaseDiagnosis.create({
      farmerId: req.user.id,
      clientRequestId: clientRequestId || undefined,
      crop,
      imagePath: toPublicImagePath(req.file),
      imageOriginalName: req.file.originalname,
      ...result,
      status: 'completed',
    });

    return res.status(201).json({ success: true, diagnosis });
  } catch (error) {
    fs.unlink(req.file.path, () => {});
    return next(error);
  }
};

const getMyDiagnoses = async (req, res, next) => {
  try {
    const pageValue = Number(req.query.page || 1);
    const limitValue = Number(req.query.limit || 10);
    const page = Number.isFinite(pageValue) && pageValue > 0 ? Math.floor(pageValue) : 1;
    const limit = Number.isFinite(limitValue) && limitValue > 0 ? Math.min(Math.floor(limitValue), 50) : 10;
    const filter = { farmerId: req.user.id };

    const [diagnoses, total] = await Promise.all([
      DiseaseDiagnosis.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      DiseaseDiagnosis.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      diagnoses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getDiagnosisById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid diagnosis id.' });
    }

    const diagnosis = await DiseaseDiagnosis.findById(req.params.id).lean();
    if (!diagnosis) {
      return res.status(404).json({ message: 'Diagnosis not found.' });
    }

    if (diagnosis.farmerId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Diagnosis not found.' });
    }

    return res.json({ success: true, diagnosis });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  analyzeDisease,
  getMyDiagnoses,
  getDiagnosisById,
};
