const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');
const adminController = require('../controllers/adminController');

router.get('/reports', auth, admin, adminController.getReports);
router.post('/reports/:id/resolve', auth, admin, adminController.resolveReport);
router.post('/events/:id/approve', auth, admin, adminController.approveEvent);
router.post('/events/:id/reject', auth, admin, adminController.rejectEvent);
router.post('/users/:id/block', auth, admin, adminController.blockUser);
router.post('/users/:id/unblock', auth, admin, adminController.unblockUser);

module.exports = router;