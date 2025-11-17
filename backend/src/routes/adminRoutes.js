const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const adminController = require('../controllers/adminController');

// Applica il middleware di autenticazione admin a tutte le routes
router.use(adminAuth);

// Dashboard stats
router.get('/stats', adminController.getStats);

// Events management
router.get('/events', adminController.getEvents);
router.patch('/events/:id/status', adminController.updateEventStatus);
router.delete('/events/:id', adminController.deleteEvent);

// Users management
router.get('/users', adminController.getUsers);
// Support blocking/unblocking from admin UI (frontend posts to /users/:id/block)
router.post('/users/:id/block', adminController.updateUserStatus);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.patch('/users/:id/role', adminController.updateUserRole);

// Reports management
router.get('/reports', adminController.getReports);
router.patch('/reports/:id', adminController.updateReportStatus);

module.exports = router;