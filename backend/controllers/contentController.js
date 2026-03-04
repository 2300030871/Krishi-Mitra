const Crop = require('../models/Crop');
const mongoose = require('mongoose');
const Scheme = require('../models/Scheme');
const News = require('../models/News');

const getMandiPrices = async (req, res, next) => {
  try {
    const mandiCollection = mongoose.connection.db.collection('mandi_prices');
    const mandiPrices = await mandiCollection.find({}).sort({ state: 1, crop: 1 }).toArray();

    if (mandiPrices.length > 0) {
      return res.json(mandiPrices);
    }

    const derivedMandiData = await Crop.aggregate([
      {
        $group: {
          _id: {
            state: '$location',
            crop: '$crop_name',
          },
          price: { $avg: '$price' },
        },
      },
      {
        $project: {
          _id: 0,
          state: '$_id.state',
          crop: '$_id.crop',
          price: { $round: ['$price', 2] },
        },
      },
      { $sort: { state: 1, crop: 1 } },
    ]);

    return res.json(derivedMandiData);
  } catch (error) {
    return next(error);
  }
};

const getSchemes = async (req, res, next) => {
  try {
    const schemes = await Scheme.find({}).sort({ createdAt: -1 }).lean();

    return res.json(schemes);
  } catch (error) {
    return next(error);
  }
};

const getNews = async (req, res, next) => {
  try {
    const news = await News.find({}).sort({ createdAt: -1 }).limit(20).lean();

    return res.json(news);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getMandiPrices,
  getSchemes,
  getNews,
};
