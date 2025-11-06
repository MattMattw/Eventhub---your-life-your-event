const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const eventController = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');

// Create a new event
router.post('/', [
    authMiddleware,
    check('title', 'Title is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('date', 'Date is required').not().isEmpty(),
    check('location', 'Location is required').not().isEmpty(),
    check('category', 'Category is required').not().isEmpty(),
    check('capacity', 'Capacity is required').isNumeric(),
    check('price', 'Price is required').isNumeric()
], eventController.createEvent);

// Get all events
// Public events
router.get('/', eventController.getEvents);

// Get events created by the authenticated user
router.get('/my', authMiddleware, eventController.getMyEvents);

// Get single event
router.get('/:id', eventController.getEvent);

// Update event
router.put('/:id', authMiddleware, eventController.updateEvent);

// Delete event
router.delete('/:id', authMiddleware, eventController.deleteEvent);

module.exports = router;