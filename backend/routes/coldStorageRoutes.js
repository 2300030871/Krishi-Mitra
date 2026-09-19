const express = require('express');
const { getColdStorage, getColdStorageById } = require('../controllers/coldStorageController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();
const farmerOnly = [requireAuth, requireRole('farmer')];

router.get('/cold-storage', ...farmerOnly, getColdStorage);
router.get('/cold-storage/:id', ...farmerOnly, getColdStorageById);

module.exports = router;
