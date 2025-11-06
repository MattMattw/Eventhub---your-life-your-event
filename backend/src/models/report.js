const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['event', 'user'],
        required: true
    },
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // L'evento o l'utente segnalato
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reason: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'resolved', 'dismissed'],
        default: 'pending'
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    resolvedAt: {
        type: Date
    }
}, {
    timestamps: true,
    validateBeforeSave: true
});

// Validazione custom per assicurarsi che sia fornito event O user, ma non entrambi
reportSchema.pre('validate', function(next) {
    if ((this.event && this.user) || (!this.event && !this.user)) {
        next(new Error('È necessario fornire event O user, ma non entrambi'));
    }
    if ((this.type === 'event' && !this.event) || (this.type === 'user' && !this.user)) {
        next(new Error('Il tipo di segnalazione non corrisponde al riferimento fornito'));
    }
    next();
});

module.exports = mongoose.model('Report', reportSchema);