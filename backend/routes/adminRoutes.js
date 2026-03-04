const express = require('express');
const {
	addNews,
	deleteNews,
	addScheme,
	deleteScheme,
	getUsers,
	deactivateUser,
	deleteUser,
} = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/admin/news', requireAuth, requireRole('admin'), addNews);
router.delete('/admin/news/:id', requireAuth, requireRole('admin'), deleteNews);
router.post('/admin/schemes', requireAuth, requireRole('admin'), addScheme);
router.delete('/admin/schemes/:id', requireAuth, requireRole('admin'), deleteScheme);
router.get('/admin/users', requireAuth, requireRole('admin'), getUsers);
router.patch('/admin/users/:id/deactivate', requireAuth, requireRole('admin'), deactivateUser);
router.delete('/admin/users/:id', requireAuth, requireRole('admin'), deleteUser);

module.exports = router;
