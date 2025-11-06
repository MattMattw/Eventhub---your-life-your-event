const Registration = require('../models/registration');
const Event = require('../models/event');
const { getIo } = require('../sockets/chatSocket');
const { sendEmail } = require('../utils/email');
const User = require('../models/user');

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

        // Emit real-time notification to event chat room
        try {
            const io = getIo();
            io.to(`event-${eventId}`).emit('registration', {
                registrationId: registration._id,
                eventId,
                userId: req.user.id,
                ticketQuantity,
                totalPrice
            });

            // Notify admins
            io.to('admins').emit('adminNotification', {
                type: 'registration',
                registrationId: registration._id,
                eventId,
                userId: req.user.id
            });
        } catch (err) {
            console.warn('Socket.io not initialized, skipping notifications');
        }

        // Send email to event organizer (if available)
        try {
            const eventOrganizer = await User.findById(event.organizer);
            if (eventOrganizer && eventOrganizer.email) {
                await sendEmail({
                    to: eventOrganizer.email,
                    subject: `New registration for your event: ${event.title}`,
                    text: `User ${req.user.username || req.user.id} registered for ${event.title}. Quantity: ${ticketQuantity}`
                });
            }
        } catch (err) {
            console.warn('Failed to send organizer email', err);
        }

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

        // Notify via socket
        try {
            const io = getIo();
            io.to(`event-${registration.event}`).emit('registrationCancelled', {
                registrationId: registration._id,
                eventId: registration.event,
                userId: req.user.id
            });
            io.to('admins').emit('adminNotification', {
                type: 'registrationCancelled',
                registrationId: registration._id,
                eventId: registration.event,
                userId: req.user.id
            });
        } catch (err) {
            console.warn('Socket.io not initialized, skipping cancel notifications');
        }

        res.json({ message: 'Registration cancelled' });
    } catch (error) {
        console.error('Cancel registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};