const User = require('../models/user');
const Event = require('../models/event');
const Report = require('../models/report');

exports.getReports = async (req, res) => {
    try {
        const reports = await Report.find().populate('reporter', 'username email').populate('event');
        res.json(reports);
    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.resolveReport = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });

        report.resolved = true;
        report.resolvedBy = req.user.id;
        await report.save();

        res.json({ message: 'Report resolved', report });
    } catch (error) {
        console.error('Resolve report error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.approveEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        event.status = 'published';
        await event.save();

        res.json({ message: 'Event approved', event });
    } catch (error) {
        console.error('Approve event error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.rejectEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        event.status = 'cancelled';
        await event.save();

        res.json({ message: 'Event rejected', event });
    } catch (error) {
        console.error('Reject event error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.blockUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.isBlocked = true;
        await user.save();

        res.json({ message: 'User blocked', user });
    } catch (error) {
        console.error('Block user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.unblockUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.isBlocked = false;
        await user.save();

        res.json({ message: 'User unblocked', user });
    } catch (error) {
        console.error('Unblock user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};