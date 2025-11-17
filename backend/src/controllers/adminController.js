const User = require('../models/user');
const Event = require('../models/event');
const Report = require('../models/report');
const Registration = require('../models/registration');
const Message = require('../models/message');
const { sendEmail } = require('../utils/email');
const { getIo } = require('../sockets/chatSocket');

// Get admin dashboard statistics
exports.getStats = async (req, res) => {
    try {
        // admin getStats
        const [totalUsers, totalEvents, reports] = await Promise.all([
            User.countDocuments(),
            Event.countDocuments(),
            Report.find({ status: 'pending' })
        ]);

        // Calcola il totale dei ricavi da tutti gli eventi
        const events = await Event.find();
        const totalRevenue = events.reduce((sum, event) => {
            return sum + (event.price * (event.capacity - event.availableSpots));
        }, 0);

        res.json({
            totalUsers,
            totalEvents,
            totalRevenue,
            activeReports: reports.length
        });
    } catch (error) {
        console.error('Error getting admin stats:', error);
        res.status(500).json({ message: 'Errore nel recupero delle statistiche' });
    }
};

// Get all events with advanced search and filters
exports.getEvents = async (req, res) => {
    try {
    // admin getEvents
        const { 
            page = 1, 
            limit = 10,
            search,
            status,
            startDate,
            endDate,
            category,
            price,
            tags,
            sortBy,
            sortOrder
        } = req.query;

        const buildSearchQuery = require('../utils/searchQueryBuilder');
        const { query, sort } = buildSearchQuery({}, {
            search,
            status,
            startDate,
            endDate,
            category,
            price: price ? JSON.parse(price) : undefined,
            tags: tags ? tags.split(',') : undefined,
            sortBy,
            sortOrder,
            searchFields: ['title', 'description', 'location']
        });

        const events = await Event.find(query)
            .populate('organizer', 'username email')
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Event.countDocuments(query);

        // Recupera le statistiche per i filtri
        const [categories, allTags, statusCounts] = await Promise.all([
            Event.distinct('category'),
            Event.distinct('tags'),
            Event.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ])
        ]);

        res.json({
            events,
            totalPages: Math.ceil(total / limit),
            currentPage: Number(page),
            total,
            filters: {
                categories,
                tags: allTags,
                statusCounts: statusCounts.reduce((acc, { _id, count }) => {
                    acc[_id] = count;
                    return acc;
                }, {})
            }
        });
    } catch (error) {
        console.error('Error getting events:', error);
        res.status(500).json({ message: 'Errore nel recupero degli eventi' });
    }
};

// Get all reports with pagination and filters
exports.getReports = async (req, res) => {
    try {
    // admin getReports
        const { page = 1, limit = 10, status, type } = req.query;
        const query = {};

        // Applica i filtri se presenti
        if (status) {
            query.status = status;
        }
        if (type) {
            query.type = type;
        }

        const reports = await Report.find(query)
            .populate('reporter', 'username email')
            .populate('event', 'title')
            .populate('user', 'username')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Report.countDocuments(query);

        res.json({
            reports,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        console.error('Error getting reports:', error);
        res.status(500).json({ message: 'Errore nel recupero delle segnalazioni' });
    }
};

// Get all users with advanced search and filters
exports.getUsers = async (req, res) => {
    try {
    // admin getUsers
        const { 
            page = 1, 
            limit = 10,
            search,
            status,
            role,
            sortBy,
            sortOrder,
            lastLoginStart,
            lastLoginEnd
        } = req.query;

        const buildSearchQuery = require('../utils/searchQueryBuilder');
        const { query, sort } = buildSearchQuery({}, {
            search,
            status,
            sortBy,
            sortOrder,
            searchFields: ['username', 'email', 'firstName', 'lastName']
        });

        // Filtro per ruolo
        if (role) {
            query.isAdmin = role === 'admin';
        }

        // Filtro per ultima login
        if (lastLoginStart || lastLoginEnd) {
            query.lastLogin = {};
            if (lastLoginStart) {
                query.lastLogin.$gte = new Date(lastLoginStart);
            }
            if (lastLoginEnd) {
                query.lastLogin.$lte = new Date(lastLoginEnd);
            }
        }

        const users = await User.find(query)
            .select('-password')
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await User.countDocuments(query);

        // Recupera le statistiche per i filtri
        const [statusCounts, roleCounts] = await Promise.all([
            User.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            User.aggregate([
                { $group: { 
                    _id: '$isAdmin', 
                    count: { $sum: 1 } 
                } }
            ])
        ]);

        res.json({
            users,
            totalPages: Math.ceil(total / limit),
            currentPage: Number(page),
            total,
            filters: {
                statusCounts: statusCounts.reduce((acc, { _id, count }) => {
                    acc[_id] = count;
                    return acc;
                }, {}),
                roleCounts: {
                    admin: roleCounts.find(r => r._id === true)?.count || 0,
                    user: roleCounts.find(r => r._id === false)?.count || 0
                }
            }
        });
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ message: 'Errore nel recupero degli utenti' });
    }
};

// Block/Unblock an event
exports.updateEventStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;

        const event = await Event.findByIdAndUpdate(
            id,
            { 
                status,
                blockReason: status === 'blocked' ? reason : null
            },
            { new: true }
        ).populate('organizer', 'username email');

        if (!event) {
            return res.status(404).json({ message: 'Evento non trovato' });
        }

        res.json(event);
    } catch (error) {
        console.error('Error updating event status:', error);
        res.status(500).json({ message: 'Errore nell\'aggiornamento dello stato dell\'evento' });
    }
};

// Delete an event
exports.deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the event first so we can notify organizer and get details
        const event = await Event.findById(id).populate('organizer', 'username email');
        if (!event) {
            return res.status(404).json({ message: 'Evento non trovato' });
        }

        // Delete related registrations, messages and reports
        await Promise.all([
            Registration.deleteMany({ event: event._id }),
            Message.deleteMany({ event: event._id }),
            Report.deleteMany({ event: event._id })
        ]);

        // Finally remove the event itself
        await Event.findByIdAndDelete(id);

        // Notify organizer by email if available
        try {
            if (event.organizer && event.organizer.email) {
                await sendEmail({
                    to: event.organizer.email,
                    subject: `Il tuo evento "${event.title}" è stato eliminato`,
                    text: `Ciao ${event.organizer.username || ''},\n\nL'evento \"${event.title}\" programmato per ${event.date} è stato eliminato dall'amministratore. Se hai bisogno di informazioni, contatta il supporto.`,
                    html: `<p>Ciao ${event.organizer.username || ''},</p><p>L'evento <strong>${event.title}</strong> è stato eliminato dall'amministratore.</p>`
                });
            }
        } catch (emailErr) {
            console.warn('Failed to send organizer notification email:', emailErr);
        }

        // Emit socket notification to admins if socket.io initialized
        try {
            const io = getIo();
            io.to('admins').emit('eventDeleted', { eventId: id, title: event.title });
        } catch (ioErr) {
            // ignore if io not initialized
            console.warn('Socket.io not initialized, skipping admin notification');
        }

        res.json({ message: 'Evento eliminato con successo' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ message: 'Errore nell\'eliminazione dell\'evento' });
    }
};

// Block/Unblock a user
exports.updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;

        const user = await User.findByIdAndUpdate(
            id,
            { 
                status,
                blockReason: status === 'blocked' ? reason : null
            },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'Utente non trovato' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({ message: 'Errore nell\'aggiornamento dello stato dell\'utente' });
    }
};

// Update user role (admin/user)
exports.updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { isAdmin } = req.body;

        // Impedisce all'admin di rimuovere i propri privilegi
        if (id === req.user._id.toString() && !isAdmin) {
            return res.status(400).json({ 
                message: 'Non puoi rimuovere i tuoi privilegi di admin' 
            });
        }

        const user = await User.findByIdAndUpdate(
            id,
            { isAdmin },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'Utente non trovato' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ message: 'Errore nell\'aggiornamento del ruolo dell\'utente' });
    }
};

// Update report status
exports.updateReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const report = await Report.findByIdAndUpdate(
            id,
            { 
                status,
                resolvedBy: req.user._id,
                resolvedAt: new Date()
            },
            { new: true }
        )
        .populate('reporter', 'username email')
        .populate('event', 'title')
        .populate('user', 'username');

        if (!report) {
            return res.status(404).json({ message: 'Segnalazione non trovata' });
        }

        res.json(report);
    } catch (error) {
        console.error('Error updating report status:', error);
        res.status(500).json({ message: 'Errore nell\'aggiornamento dello stato della segnalazione' });
    }
};