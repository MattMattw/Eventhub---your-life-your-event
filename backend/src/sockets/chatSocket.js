const socketIo = require('socket.io');
const jwt = require('../utils/jwt');
const User = require('../models/user');
const Message = require('../models/message');

let io;

exports.initializeSocket = (server) => {
    io = socketIo(server, {
        cors: {
            origin: process.env.ALLOWED_ORIGINS.split(','),
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }

        const decoded = jwt.verifyToken(token);
        if (!decoded) {
            return next(new Error('Authentication error'));
        }

        socket.userId = decoded.userId;

        // Attach role info by looking up user (non-blocking)
        User.findById(decoded.userId).then(user => {
            if (user && user.role === 'admin') {
                socket.join('admins');
                socket.isAdmin = true;
            }
        }).catch(err => {
            console.warn('Unable to fetch user for socket role check', err);
        });
        next();
    });

    io.on('connection', (socket) => {
        console.log('User connected:', socket.userId);

        // Join event-specific chat room
        socket.on('joinEventChat', async (data) => {
            const eventId = data.eventId;
            socket.join(`event-${eventId}`);
            console.log(`User ${socket.userId} joined chat for event ${eventId}`);

            try {
                // Load message history (last 50 messages)
                const messages = await Message.find({ event: eventId })
                    .populate('user', 'username')
                    .sort({ createdAt: -1 })
                    .limit(50)
                    .lean();

                // Send in reverse order (oldest first)
                const reversedMessages = messages.reverse().map(msg => ({
                    id: msg._id,
                    userId: msg.user._id,
                    username: msg.user.username,
                    text: msg.text,
                    timestamp: msg.createdAt
                }));

                socket.emit('messageHistory', reversedMessages);
            } catch (err) {
                console.error('Error loading message history:', err);
            }
        });

        // Leave event-specific chat room
        socket.on('leaveEventChat', (data) => {
            const eventId = data.eventId;
            socket.leave(`event-${eventId}`);
            console.log(`User ${socket.userId} left chat for event ${eventId}`);
        });

        // Handle chat messages
        socket.on('sendMessage', async (data) => {
            try {
                const eventId = data.eventId;
                const messageText = data.message;

                // Get user info
                const user = await User.findById(socket.userId);
                if (!user) {
                    return socket.emit('error', { message: 'User not found' });
                }

                // Save message to database
                const message = new Message({
                    event: eventId,
                    user: socket.userId,
                    username: user.username,
                    text: messageText,
                    createdAt: new Date()
                });

                await message.save();

                // Emit to event room
                io.to(`event-${eventId}`).emit('message', {
                    id: message._id,
                    userId: socket.userId,
                    username: user.username,
                    text: messageText,
                    timestamp: message.createdAt
                });
            } catch (err) {
                console.error('Error sending message:', err);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.userId);
        });
    });
};

exports.getIo = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};