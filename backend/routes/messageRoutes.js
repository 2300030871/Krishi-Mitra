const express = require('express');
const { getConversationMessages, sendMessage } = require('../controllers/messageController');
const { requireAuth, requireAnyRole } = require('../middleware/authMiddleware');
const { voiceUpload } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/messages/:userId', requireAuth, requireAnyRole(['farmer', 'buyer', 'admin']), getConversationMessages);
router.post('/messages', requireAuth, requireAnyRole(['farmer', 'buyer', 'admin']), sendMessage);
router.post('/messages/voice', requireAuth, requireAnyRole(['farmer', 'buyer', 'admin']), voiceUpload.single('voice'), sendMessage);

module.exports = router;
