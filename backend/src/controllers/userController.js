const User = require('../models/user');
const jwt = require('../utils/jwt');
const { enqueueEmail, sendEmailImmediate } = require('../utils/email');
const RefreshToken = require('../models/refreshToken');
const crypto = require('crypto');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

exports.register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password, firstName, lastName } = req.body;

        // Check if user already exists
        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user
        user = new User({
            username,
            email,
            password,
            firstName,
            lastName,
            isVerified: false
        });

        // Generate verification token
        const verificationToken = user.generateVerificationToken();
        await user.save();

        // Create verification URL
        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`;

        try {
            await sendEmail({
                to: user.email,
                subject: 'Email Verification - EventHub',
                html: `
                    <h2>Welcome to EventHub!</h2>
                    <p>Please verify your email address to complete your registration.</p>
                    <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
                        Verify Email
                    </a>
                    <p>Link expires in 24 hours.</p>
                    <p>If you didn't sign up for EventHub, please ignore this email.</p>
                `
            });
        } catch (err) {
            console.warn('Failed to send verification email', err);
            // Continue anyway - user can request new verification email
        }

        // Generate JWT token (can be used immediately, but features limited until verified)
        const token = jwt.generateToken(user._id);
        // Create refresh token
        const refreshTokenValue = crypto.randomBytes(40).toString('hex');
        const refresh = new RefreshToken({
            user: user._id,
            token: refreshTokenValue,
            expiresAt: new Date(Date.now() + (1000 * 60 * 60 * 24 * 7)) // 7 days
        });
        await refresh.save();

        res.status(201).json({
            token,
            refreshToken: refreshTokenValue,
            user: {
                id: user._id.toString(),
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isVerified: user.isVerified
            },
            message: 'Registration successful. Please verify your email.'
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.generateToken(user._id);
        const refreshTokenValue = crypto.randomBytes(40).toString('hex');
        const refresh = new RefreshToken({
            user: user._id,
            token: refreshTokenValue,
            expiresAt: new Date(Date.now() + (1000 * 60 * 60 * 24 * 7)) // 7 days
        });
        await refresh.save();

        res.json({
            token,
            refreshToken: refreshTokenValue,
            user: {
                id: user._id.toString(),
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Return a consistent shape (same as register/login responses)
        res.json({
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isVerified: user.isVerified
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, email } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (email) user.email = email;

        await user.save();

        res.json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal if email exists
            return res.status(200).json({ message: 'If email exists, reset link has been sent' });
        }

        // Generate reset token
        const resetToken = user.generatePasswordResetToken();
        await user.save({ validateBeforeSave: false });

        // Create reset URL
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

        try {
            await sendEmail({
                to: user.email,
                subject: 'Password Reset Request - EventHub',
                html: `
                    <h2>Password Reset Request</h2>
                    <p>You requested a password reset. Click the link below to reset your password:</p>
                    <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
                        Reset Password
                    </a>
                    <p>Link expires in 1 hour.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                `
            });
        } catch (err) {
            // Log the error but don't fail the request: user experience should not reveal email delivery issues
            console.warn('Error sending password reset email (continuing):', err?.message || err);
        }

        res.status(200).json({ message: 'If email exists, reset link has been sent' });
    } catch (error) {
        console.error('Request password reset error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, password, passwordConfirm } = req.body;

        if (!token || !password || !passwordConfirm) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        if (password !== passwordConfirm) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Find user with valid reset token
        const user = await User.findOne({
            passwordResetToken: require('crypto').createHash('sha256').update(token).digest('hex'),
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Update password
        user.password = password;
        user.clearPasswordResetToken();
        await user.save();

        res.status(200).json({ message: 'Password has been reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) {
            const rt = await RefreshToken.findOne({ token: refreshToken });
            if (rt) {
                rt.revoked = true;
                await rt.save();
            }
        }
        // Optionally add access token revocation (e.g., store jti in Redis)
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        logger.error({ error }, 'Logout error');
        res.status(500).json({ message: 'Server error' });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ message: 'Refresh token required' });

        const stored = await RefreshToken.findOne({ token: refreshToken, revoked: false, expiresAt: { $gt: Date.now() } }).populate('user');
        if (!stored) return res.status(401).json({ message: 'Invalid refresh token' });

        // Issue new access token
        const newToken = jwt.generateToken(stored.user._id);
        res.json({ token: newToken });
    } catch (error) {
        logger.error({ error }, 'Refresh token error');
        res.status(500).json({ message: 'Server error' });
    }
};

exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ message: 'Verification token is required' });
        }

        // Find user with valid verification token
        const user = await User.findOne({
            verificationToken: require('crypto').createHash('sha256').update(token).digest('hex'),
            verificationTokenExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        // Mark email as verified
        user.isVerified = true;
        user.clearVerificationToken();
        await user.save();

        res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
        console.error('Verify email error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Email already verified' });
        }

        // Generate new verification token
        const verificationToken = user.generateVerificationToken();
        await user.save({ validateBeforeSave: false });

        // Create verification URL
        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`;

        try {
            await sendEmail({
                to: user.email,
                subject: 'Email Verification - EventHub',
                html: `
                    <h2>Verify Your Email</h2>
                    <p>Please verify your email address to activate your EventHub account.</p>
                    <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
                        Verify Email
                    </a>
                    <p>Link expires in 24 hours.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                `
            });
        } catch (err) {
            user.clearVerificationToken();
            await user.save({ validateBeforeSave: false });
            return res.status(500).json({ message: 'Error sending email' });
        }

        res.status(200).json({ message: 'Verification email sent' });
    } catch (error) {
        console.error('Resend verification email error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};