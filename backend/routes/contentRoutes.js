const express = require('express');
const { getMandiPrices, getSchemes, getNews } = require('../controllers/contentController');

const router = express.Router();

router.get('/mandi', getMandiPrices);
router.get('/schemes', getSchemes);
router.get('/news', getNews);

module.exports = router;
