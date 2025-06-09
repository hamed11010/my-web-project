import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Protect routes middleware
const protect = async (req, res, next) => {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
        console.log('Token found in Authorization header');
    }
    // Check for token in URL query parameters
    else if (req.query.token) {
        token = req.query.token;
        console.log('Token found in URL query parameters');
    }

    if (!token) {
        console.log('No token found in request');
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        console.log('Token verified successfully, user ID:', decoded.id);

        // Get user from the token
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            console.log('User not found for ID:', decoded.id);
            return res.status(401).json({ message: 'Not authorized, user not found' });
        }

        // Check if user is banned
        if (req.user.isBanned) {
            console.log('User is banned:', req.user._id);
            return res.status(403).json({
                message: 'Account is banned',
                banReason: req.user.banReason,
                banDate: req.user.banDate
            });
        }

        console.log('User authenticated successfully:', req.user._id);
        next();
    } catch (error) {
        console.error('Token verification error:', error.message);
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

// Admin middleware
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        console.log('Admin access granted for user:', req.user._id);
        next();
    } else {
        console.log('Admin access denied for user:', req.user?._id);
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};

export { protect, admin }; 