import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Protect routes middleware
export const protect = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: 'Not authorized, no token' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({ message: 'Not authorized, user not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

// Admin middleware
export const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

// Check if user is authenticated
export const isAuthenticated = (req, res, next) => {
    if (req.user) {
        next();
    } else {
        res.status(401).json({ message: 'Not authenticated' });
    }
};

// Check if user is banned
export const checkBanned = (req, res, next) => {
    if (req.user && req.user.isBanned) {
        return res.status(403).json({ message: 'Your account has been banned' });
    }
    next();
};

// Role-based access control middleware
export const auth = (roles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        if (roles.length && !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized for this role' });
        }

        next();
    };
}; 