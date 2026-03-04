const express = require('express');
const {
  getAllCropsV2,
  getCropByIdV2,
  addCropV2,
  updateCropV2,
  deleteCropV2,
  getMyCropsV2,
} = require('../controllers/cropV2Controller');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const { cropImageUpload } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/crops', getAllCropsV2);
router.get('/crops/my', requireAuth, requireRole('farmer'), getMyCropsV2);
router.get('/crops/:id', getCropByIdV2);
router.post('/crops', requireAuth, requireRole('farmer'), cropImageUpload.single('image'), addCropV2);
router.put('/crops/:id', requireAuth, requireRole('farmer'), cropImageUpload.single('image'), updateCropV2);
router.delete('/crops/:id', requireAuth, requireRole('farmer'), deleteCropV2);

module.exports = router;
