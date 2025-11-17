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

        // Check if event is published
        if (event.status !== 'published') {
            return res.status(400).json({ 
                message: `Event is not available for registration (status=${event.status} availableSpots=${event.availableSpots})` 
            });
        }

        // Check if user already registered for this event
        const existingRegistration = await Registration.findOne({
            event: eventId,
            user: req.user.id,
            status: { $in: ['pending', 'confirmed'] }
        });
        if (existingRegistration) {
            return res.status(400).json({ message: 'User already registered for this event' });
        }

        // Validate ticket quantity
        if (!ticketQuantity || ticketQuantity < 1) {
            return res.status(400).json({ message: 'Ticket quantity must be at least 1' });
        }

        // Check available spots
        if (event.availableSpots < ticketQuantity) {
            return res.status(400).json({ 
                message: `Not enough available spots. Only ${event.availableSpots} spots remaining` 
            });
        }

        // Calculate total price
        const totalPrice = event.price * ticketQuantity;

        const registration = new Registration({
            event: eventId,
            user: req.user.id,
            ticketQuantity,
            totalPrice,
            status: 'confirmed'
        });

        await registration.save();

        // Decrement available spots
        event.availableSpots -= ticketQuantity;
        await event.save();

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

        // Send confirmation email to the registering user
        try {
            const registeringUser = await User.findById(req.user.id);
            if (registeringUser && registeringUser.email) {
                await sendEmail({
                    to: registeringUser.email,
                    subject: `Registration confirmed: ${event.title}`,
                    html: `
                        <p>Ciao ${registeringUser.username || ''},</p>
                        <p>La tua iscrizione all'evento <strong>${event.title}</strong> è stata confermata.</p>
                        <p>Quantità biglietti: ${ticketQuantity}</p>
                        <p>Totale pagato: ${totalPrice} ${event.price ? '' : ''}</p>
                        <p>Grazie per aver usato EventHub.</p>
                    `
                });
            }
        } catch (err) {
            console.warn('Failed to send confirmation email to user', err);
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

        // Prevent cancelling already cancelled registration
        if (registration.status === 'cancelled') {
            return res.status(400).json({ message: 'Registration already cancelled' });
        }

        const previousStatus = registration.status;
        registration.status = 'cancelled';
        await registration.save();

        // Increment available spots (only if was confirmed or pending)
        if (previousStatus !== 'cancelled') {
            const event = await Event.findById(registration.event);
            if (event) {
                event.availableSpots += registration.ticketQuantity;
                await event.save();
            }
        }

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

        // Send cancellation emails to organizer and user
        try {
            const event = await Event.findById(registration.event).populate('organizer', 'username email');
            const user = await User.findById(registration.user);

            if (event && event.organizer && event.organizer.email) {
                await sendEmail({
                    to: event.organizer.email,
                    subject: `Registration cancelled for your event: ${event.title}`,
                    html: `
                        <p>Ciao ${event.organizer.username || ''},</p>
                        <p>L'utente ${user?.username || registration.user} ha annullato l'iscrizione per l'evento <strong>${event.title}</strong>.</p>
                        <p>Quantità: ${registration.ticketQuantity}</p>
                    `
                });
            }

            if (user && user.email) {
                await sendEmail({
                    to: user.email,
                    subject: `Registration cancelled: ${event ? event.title : ''}`,
                    html: `
                        <p>Ciao ${user.username || ''},</p>
                        <p>La tua iscrizione all'evento <strong>${event ? event.title : ''}</strong> è stata annullata correttamente.</p>
                    `
                });
            }
        } catch (emailErr) {
            console.warn('Failed to send cancellation emails', emailErr);
        }

        res.json({ message: 'Registration cancelled' });
    } catch (error) {
        console.error('Cancel registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};