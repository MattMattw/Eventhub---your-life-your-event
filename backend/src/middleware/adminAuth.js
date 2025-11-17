const jwt = require('jsonwebtoken');
const User = require('../models/user');

const adminAuth = async (req, res, next) => {
    try {
        // Support both Authorization header (Bearer) and cookie-based token
        let token = null;
        const header = req.header('Authorization');
        if (header && header.startsWith('Bearer ')) {
            token = header.replace('Bearer ', '');
        } else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({ message: 'Autenticazione richiesta' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: 'Utente non trovato' });
        }

        // Check if user is blocked (support both boolean and status field)
        if (user.isBlocked === true || user.status === 'blocked') {
            return res.status(403).json({ message: 'Account bloccato' });
        }

        // Allow admin if role === 'admin' or legacy isAdmin flag
        const isAdmin = (user.role && user.role === 'admin') || user.isAdmin;
        if (!isAdmin) {
            return res.status(403).json({ message: 'Accesso non autorizzato' });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token non valido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token scaduto' });
        }
        res.status(500).json({ message: 'Errore del server' });
    }
};

module.exports = adminAuth;