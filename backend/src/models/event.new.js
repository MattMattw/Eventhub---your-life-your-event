const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true,
        validate: {
            validator: function(value) {
                return value > this.startDate;
            },
            message: 'La data di fine deve essere successiva alla data di inizio'
        }
    },
    location: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    capacity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    image: {
        type: String
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'cancelled', 'blocked'],
        default: 'draft'
    },
    blockReason: {
        type: String
    },
    availableSpots: {
        type: Number,
        required: true,
        default: function() {
            return this.capacity;
        }
    },
    isPrivate: {
        type: Boolean,
        default: false
    },
    tags: [{
        type: String,
        trim: true
    }]
}, {
    timestamps: true
});

// Virtual per verificare se l'evento è completo
eventSchema.virtual('isFull').get(function() {
    return this.availableSpots === 0;
});

// Virtual per verificare se l'evento è passato
eventSchema.virtual('isPast').get(function() {
    return this.endDate < new Date();
});

module.exports = mongoose.model('Event', eventSchema);