const Report = require('../models/report');
const Event = require('../models/event');
const User = require('../models/user');
const { getIo } = require('../sockets/chatSocket');
const { sendEmail } = require('../utils/email');
const { validationResult } = require('express-validator');

// Create a new report (event or user)
exports.createReport = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { type, eventId, userId, reason, description } = req.body;

        // Validate required references based on type
        if (type === 'event' && !eventId) {
            return res.status(400).json({ message: 'eventId required for event reports' });
        }
        if (type === 'user' && !userId) {
            return res.status(400).json({ message: 'userId required for user reports' });
        }

        if (type === 'event') {
            const event = await Event.findById(eventId);
            if (!event) return res.status(404).json({ message: 'Event not found' });
        } else if (type === 'user') {
            const user = await User.findById(userId);
            if (!user) return res.status(404).json({ message: 'User not found' });
        } else {
            return res.status(400).json({ message: 'Invalid report type' });
        }

        const reportData = {
            type,
            reporter: req.user.id,
            reason,
            description
        };

        if (type === 'event') reportData.event = eventId;
        if (type === 'user') reportData.user = userId;

        const report = new Report(reportData);
        await report.save();
        await report.populate('reporter', 'username email');
        await report.populate('event', 'title');
        await report.populate('user', 'username');

        // Notify admins via socket
        try {
            const io = getIo();
            io.to('admins').emit('newReport', {
                reportId: report._id,
                type: report.type,
                reason: report.reason,
                reportedItem: type === 'event' ? report.event?.title : report.user?.username,
                reporter: report.reporter.username
            });
        } catch (err) {
            console.warn('Socket.io not initialized, skipping admin notification');
        }

        // Send email to admins
        try {
            const admins = await User.find({ role: 'admin' });
            for (const admin of admins) {
                await sendEmail({
                    to: admin.email,
                    subject: `New Report: ${type === 'event' ? 'Event' : 'User'} - EventHub`,
                    html: `
                        <h2>New Report Submitted</h2>
                        <p><strong>Type:</strong> ${type.charAt(0).toUpperCase() + type.slice(1)}</p>
                        <p><strong>Reason:</strong> ${reason}</p>
                        <p><strong>Description:</strong> ${description || ''}</p>
                        <p><strong>Reporter:</strong> ${report.reporter.username} (${report.reporter.email})</p>
                        <p><strong>Reported ${type === 'event' ? 'Event' : 'User'}:</strong> ${type === 'event' ? report.event?.title : report.user?.username}</p>
                        <p>Please review this report in the admin panel.</p>
                    `
                });
            }
        } catch (err) {
            console.warn('Failed to send report email to admins', err);
        }

        res.status(201).json(report);
    } catch (error) {
        console.error('Create report error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get paginated reports
exports.getReports = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, type } = req.query;
        const query = {};

        if (status) query.status = status;
        if (type) query.type = type;

        const reports = await Report.find(query)
            .populate('reporter', 'username email')
            .populate('event', 'title')
            .populate('user', 'username')
            .populate('resolvedBy', 'username')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Report.countDocuments(query);

        res.json({
            reports,
            totalPages: Math.ceil(total / limit),
            currentPage: Number(page),
            total
        });
    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get single report
exports.getReportById = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id)
            .populate('reporter', 'username email')
            .populate('event', 'title description organizer')
            .populate('user', 'username email role')
            .populate('resolvedBy', 'username');

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        res.json(report);
    } catch (error) {
        console.error('Get report error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update report status (pending/resolved/dismissed)
exports.updateReportStatus = async (req, res) => {
    try {
        const { status, notes } = req.body;

        if (!['pending', 'resolved', 'dismissed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const report = await Report.findByIdAndUpdate(
            req.params.id,
            {
                status,
                resolvedBy: req.user.id,
                resolvedAt: new Date(),
                notes
            },
            { new: true }
        )
        .populate('reporter', 'username email')
        .populate('event', 'title')
        .populate('user', 'username');

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        res.json(report);
    } catch (error) {
        console.error('Update report error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a report
exports.deleteReport = async (req, res) => {
    try {
        const report = await Report.findByIdAndDelete(req.params.id);

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        res.json({ message: 'Report deleted successfully' });
    } catch (error) {
        console.error('Delete report error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};