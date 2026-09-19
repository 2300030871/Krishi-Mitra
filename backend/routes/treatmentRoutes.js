const express = require('express');
const { getTreatment } = require('../controllers/treatmentController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/treatments/:diseaseOrPest', requireAuth, requireRole('farmer'), getTreatment);

module.exports = router;
