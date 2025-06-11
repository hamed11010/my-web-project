import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'; // Import crypto for token generation
import sendEmail from '../utils/sendEmail.js'; // Import sendEmail utility

const router = express.Router();

// Register user
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phoneNumber, role } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user
        user = new User({
            name,
            email,
            password,
            phoneNumber,
            role: role || 'user'
        });

        await user.save();

        // Create token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt for email:', email); // Debug log

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found'); // Debug log
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            console.log('Password mismatch'); // Debug log
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check if user is banned
        if (user.isBanned) {
            console.log('User is banned'); // Debug log
            return res.status(403).json({
                message: 'Account is banned',
                banReason: user.banReason,
                banDate: user.banDate
            });
        }

        // Create token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '7d' }
        );

        console.log('Login successful, token created with 7-day expiration'); // Debug log
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user profile
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user profile
router.put('/profile', protect, async (req, res) => {
    try {
        const { name, email } = req.body;
        const user = await User.findById(req.user.id);

        if (name) user.name = name;
        if (email) user.email = email;

        await user.save();

        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all users (admin only)
router.get('/', protect, admin, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete user (admin only)
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await user.remove();
        res.json({ message: 'User removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Ban user (admin only)
router.put('/ban/:id', protect, admin, async (req, res) => {
    try {
        const { reason } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isBanned = true;
        user.banReason = reason;
        user.banDate = new Date();

        await user.save();
        res.json({ message: 'User banned successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Unban user (admin only)
router.put('/unban/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isBanned = false;
        user.banReason = null;
        user.banDate = null;

        await user.save();
        res.json({ message: 'User unbanned successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get banned users (admin only)
router.get('/banned', protect, admin, async (req, res) => {
    try {
        const bannedUsers = await User.find({ isBanned: true }).select('-password');
        res.json(bannedUsers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Verify token
router.get('/verify', protect, async (req, res) => {
    try {
        // If we get here, the token is valid (protect middleware already verified it)
        res.json({ 
            valid: true,
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role
            }
        });
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ 
            valid: false,
            message: 'Invalid token'
        });
    }
});

// Verify admin role
router.get('/verify-admin', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ isAdmin: user.role === 'admin' });
    } catch (error) {
        console.error('Error verifying admin status:', error);
        res.status(500).json({ message: 'Error verifying admin status' });
    }
});

// Request Password Reset
router.post('/forgot-password', async (req, res) => {
    console.log('Forgot password route hit!');
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            // Respond generically to prevent email enumeration
            return res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent to it.' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // Token valid for 10 minutes

        await user.save();

        // Create reset URL
        const resetURL = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;

        const message = `
            <h1>You have requested a password reset</h1>
            <p>Please go to this link to reset your password:</p>
            <a href="${resetURL}" clicktracking=off>${resetURL}</a>
            <br>
            <p>This link is valid for 10 minutes only.</p>
            <p>If you did not request this, please ignore this email.</p>
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset Request for Coffee House App',
                html: message,
            });

            res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent to it.' });
        } catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            console.error('Error sending email:', error);
            return res.status(500).json({ message: 'Email could not be sent. Please try again later.' });
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reset Password
router.post('/reset-password/:token', async (req, res) => {
    try {
        const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token.' });
        }

        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: 'Please provide a new password.' });
        }

        user.password = password; // Pre-save hook will hash this
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({ message: 'Password reset successful.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router; 