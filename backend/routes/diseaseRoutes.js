const express = require('express');
const {
  analyzeDisease,
  getMyDiagnoses,
  getDiagnosisById,
} = require('../controllers/diseaseController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const { diseaseImageUpload } = require('../middleware/diseaseUploadMiddleware');

const router = express.Router();
const farmerOnly = [requireAuth, requireRole('farmer')];

router.post('/disease-detection/analyze', ...farmerOnly, diseaseImageUpload.single('image'), analyzeDisease);
router.get('/disease-detection/my', ...farmerOnly, getMyDiagnoses);
router.get('/disease-detection/:id', ...farmerOnly, getDiagnosisById);

module.exports = router;
