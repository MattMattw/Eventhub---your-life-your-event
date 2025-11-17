const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: {
        type: String
    },
    verificationTokenExpires: {
        type: Date
    },
    passwordResetToken: {
        type: String
    },
    passwordResetExpires: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Method to generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 3600000; // 1 hour
    return resetToken;
};

// Method to verify password reset token
userSchema.methods.verifyPasswordResetToken = function(token) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    return hashedToken === this.passwordResetToken && this.passwordResetExpires > Date.now();
};

// Method to clear password reset token
userSchema.methods.clearPasswordResetToken = function() {
    this.passwordResetToken = null;
    this.passwordResetExpires = null;
};

// Method to generate email verification token
userSchema.methods.generateVerificationToken = function() {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    this.verificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    this.verificationTokenExpires = Date.now() + 86400000; // 24 hours
    return verificationToken;
};

// Method to verify email token
userSchema.methods.verifyEmailToken = function(token) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    return hashedToken === this.verificationToken && this.verificationTokenExpires > Date.now();
};

// Method to clear verification token
userSchema.methods.clearVerificationToken = function() {
    this.verificationToken = null;
    this.verificationTokenExpires = null;
};

module.exports = mongoose.model('User', userSchema);