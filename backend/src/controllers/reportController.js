const Report = require('../models/report');
const Event = require('../models/event');
const { getIo } = require('../sockets/chatSocket');

exports.createReport = async (req, res) => {
    try {
        const { eventId, reason } = req.body;
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        const report = new Report({ reporter: req.user.id, event: eventId, reason });
        await report.save();

        // Notify admins in a dedicated room/channel
        try {
            const io = getIo();
            io.to('admins').emit('eventReported', { reportId: report._id, eventId, reason });
        } catch (err) {
            console.warn('Socket.io not initialized, skipping admin notification');
        }

        res.status(201).json(report);
    } catch (error) {
        console.error('Create report error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};