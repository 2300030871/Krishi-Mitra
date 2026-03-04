const express = require('express');
const { register, login, loginFarmer, loginBuyer, loginAdmin, me } = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/login/farmer', loginFarmer);
router.post('/auth/login/buyer', loginBuyer);
router.post('/auth/login/admin', loginAdmin);
router.get('/auth/me', requireAuth, me);

module.exports = router;
