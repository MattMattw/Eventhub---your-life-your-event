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
    date: {
        type: Date,
        required: true
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
        required: true
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
        type: String
    }]
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
        type: String
    }}
}, {
    timestamps: true
});

module.exports = mongoose.model('Event', eventSchema);