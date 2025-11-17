const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Register user
router.post('/register', [
    check('username', 'Username is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
    check('firstName', 'First name is required').not().isEmpty(),
    check('lastName', 'Last name is required').not().isEmpty()
], userController.register);

// Login user
router.post('/login', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
], userController.login);

// Get user profile
router.get('/profile', authMiddleware, userController.getProfile);

// Update user profile
router.put('/profile', authMiddleware, [
    check('email', 'Please include a valid email').optional().isEmail(),
    check('firstName', 'First name is required').optional().not().isEmpty(),
    check('lastName', 'Last name is required').optional().not().isEmpty()
], userController.updateProfile);

// Request password reset
router.post('/forgot-password', [
    check('email', 'Please include a valid email').isEmail()
], userController.requestPasswordReset);

// Reset password
router.post('/reset-password', [
    check('token', 'Reset token is required').not().isEmpty(),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
    check('passwordConfirm', 'Password confirmation is required').not().isEmpty()
], userController.resetPassword);

// Logout user
// Logout user (accepts refreshToken in body to revoke)
router.post('/logout', authMiddleware, userController.logout);

// Refresh access token
router.post('/token', userController.refreshToken);

// Verify email
router.post('/verify-email', [
    check('token', 'Verification token is required').not().isEmpty()
], userController.verifyEmail);

// Resend verification email
router.post('/resend-verification', [
    check('email', 'Please include a valid email').isEmail()
], userController.resendVerificationEmail);

module.exports = router;