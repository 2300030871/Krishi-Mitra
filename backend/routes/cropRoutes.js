const express = require('express');
const {
  addCrop,
  updateCrop,
  deleteCrop,
  getAllCrops,
  getCropById,
} = require('../controllers/cropController');

const router = express.Router();

router.post('/addCrop', addCrop);
router.put('/updateCrop/:id', updateCrop);
router.delete('/deleteCrop/:id', deleteCrop);
router.get('/allCrops', getAllCrops);
router.get('/crop/:id', getCropById);

module.exports = router;
