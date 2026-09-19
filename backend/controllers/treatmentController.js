const Treatment = require('../models/Treatment');
const { toCanonicalLanguage } = require('../utils/language');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getTreatment = async (req, res, next) => {
  try {
    const diseaseOrPest = String(req.params.diseaseOrPest || '').trim();
    const crop = String(req.query.crop || '').trim();

    if (!diseaseOrPest) {
      return res.status(400).json({ message: 'Disease or pest is required.' });
    }

    if (!crop) {
      return res.status(400).json({ message: 'Crop is required to find treatment guidance.' });
    }

    const treatment = await Treatment.findOne({
      active: true,
      crop: { $regex: `^${escapeRegex(crop)}$`, $options: 'i' },
      diseaseOrPest: { $regex: `^${escapeRegex(diseaseOrPest)}$`, $options: 'i' },
    }).lean();

    if (!treatment) {
      return res.status(404).json({ message: 'Treatment guidance is not available for this crop and diagnosis.' });
    }

    const language = toCanonicalLanguage(req.query.language || req.user.preferredLanguage);
    const localized = treatment.translations?.[language] || treatment.translations?.english || {};
    const baseFields = [
      'symptoms',
      'immediateActions',
      'treatmentOptions',
      'organicMethods',
      'prevention',
      'safetyNotes',
      'expertAdvice',
    ];
    const guidance = baseFields.reduce((result, field) => {
      result[field] = localized[field]?.length ? localized[field] : treatment[field] || [];
      return result;
    }, {});

    return res.json({
      success: true,
      treatment: {
        _id: treatment._id,
        crop: treatment.crop,
        diseaseOrPest: treatment.diseaseOrPest,
        sourceNote: treatment.sourceNote,
        language,
        ...guidance,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getTreatment,
};
