const socketIo = require('socket.io');
const jwt = require('../utils/jwt');

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
        next();
    });

    io.on('connection', (socket) => {
        console.log('User connected:', socket.userId);

        // Join event-specific chat room
        socket.on('joinEventChat', (eventId) => {
            socket.join(`event-${eventId}`);
            console.log(`User ${socket.userId} joined chat for event ${eventId}`);
        });

        // Leave event-specific chat room
        socket.on('leaveEventChat', (eventId) => {
            socket.leave(`event-${eventId}`);
            console.log(`User ${socket.userId} left chat for event ${eventId}`);
        });

        // Handle chat messages
        socket.on('sendMessage', (data) => {
            io.to(`event-${data.eventId}`).emit('message', {
                userId: socket.userId,
                text: data.message,
                timestamp: new Date()
            });
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