const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const registrationController = require('../controllers/registrationController');
const authMiddleware = require('../middleware/authMiddleware');

// Create a new registration
router.post('/', [
    authMiddleware,
    check('eventId', 'Event ID is required').not().isEmpty(),
    check('ticketQuantity', 'Ticket quantity is required').isNumeric()
], registrationController.createRegistration);

// Get user's registrations
router.get('/my-registrations', authMiddleware, registrationController.getUserRegistrations);

// Get event's registrations
router.get('/event/:eventId', authMiddleware, registrationController.getEventRegistrations);

// Update registration
router.put('/:id', authMiddleware, registrationController.updateRegistration);

// Cancel registration
router.patch('/:id/cancel', authMiddleware, registrationController.cancelRegistration);

module.exports = router;