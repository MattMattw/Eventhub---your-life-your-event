const jwt = require('jsonwebtoken');
const User = require('../models/user');

const adminAuth = async (req, res, next) => {
    try {
        // Verifica se il token è presente nei cookie
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: 'Autenticazione richiesta' });
        }

        // Verifica la validità del token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Cerca l'utente nel database
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: 'Utente non trovato' });
        }

        // Verifica se l'utente è bloccato
        if (user.status === 'blocked') {
            return res.status(403).json({ message: 'Account bloccato' });
        }

        // Verifica se l'utente è un admin
        if (!user.isAdmin) {
            return res.status(403).json({ message: 'Accesso non autorizzato' });
        }

        // Aggiunge l'utente alla richiesta per uso successivo
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