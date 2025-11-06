const Registration = require('../models/registration');
const Event = require('../models/event');

exports.createRegistration = async (req, res) => {
    try {
        const { eventId, ticketQuantity } = req.body;

        // Check if event exists
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Calculate total price
        const totalPrice = event.price * ticketQuantity;

        const registration = new Registration({
            event: eventId,
            user: req.user.id,
            ticketQuantity,
            totalPrice
        });

        await registration.save();

        res.status(201).json(registration);
    } catch (error) {
        console.error('Create registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getUserRegistrations = async (req, res) => {
    try {
        const registrations = await Registration.find({ user: req.user.id })
            .populate('event')
            .sort({ createdAt: -1 });

        res.json(registrations);
    } catch (error) {
        console.error('Get user registrations error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getEventRegistrations = async (req, res) => {
    try {
        const event = await Event.findById(req.params.eventId);
        
        // Check if user is the organizer
        if (event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const registrations = await Registration.find({ event: req.params.eventId })
            .populate('user', 'username email firstName lastName')
            .sort({ createdAt: -1 });

        res.json(registrations);
    } catch (error) {
        console.error('Get event registrations error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateRegistration = async (req, res) => {
    try {
        const registration = await Registration.findById(req.params.id);

        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        // Check if user owns the registration or is the event organizer
        const event = await Event.findById(registration.event);
        if (registration.user.toString() !== req.user.id && 
            event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const updatedRegistration = await Registration.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );

        res.json(updatedRegistration);
    } catch (error) {
        console.error('Update registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.cancelRegistration = async (req, res) => {
    try {
        const registration = await Registration.findById(req.params.id);

        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        // Check if user owns the registration
        if (registration.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        registration.status = 'cancelled';
        await registration.save();

        res.json({ message: 'Registration cancelled' });
    } catch (error) {
        console.error('Cancel registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};