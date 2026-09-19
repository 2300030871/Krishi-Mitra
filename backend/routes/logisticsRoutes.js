const express = require('express');
const {
  getLogisticsProviders,
  createTransportRequest,
  getMyTransportRequests,
} = require('../controllers/logisticsController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();
const farmerOnly = [requireAuth, requireRole('farmer')];

router.get('/logistics/providers', ...farmerOnly, getLogisticsProviders);
router.post('/logistics/requests', ...farmerOnly, createTransportRequest);
router.get('/logistics/requests/my', ...farmerOnly, getMyTransportRequests);

module.exports = router;
