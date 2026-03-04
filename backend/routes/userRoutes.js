const express = require('express');
const { updateLanguage, getChatUserList } = require('../controllers/userController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/users/chat-list', requireAuth, getChatUserList);
router.patch('/users/language', requireAuth, updateLanguage);

module.exports = router;
