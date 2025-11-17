const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pinoHttp = require('pino-http');
require('dotenv').config();
const logger = require('./utils/logger');

// Import routes
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security & logging middleware
app.use(helmet());
app.use(pinoHttp({ logger }));

app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting for auth-sensitive endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/users/login', authLimiter);
app.use('/api/users/forgot-password', authLimiter);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);

// Error handling middleware
app.use(errorHandler);

module.exports = app;