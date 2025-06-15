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
export const isAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).render('error', { 
                message: 'Please log in to access this page',
                error: 'Authentication required',
                statusCode: 401
            });
        }

        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).render('error', { 
                message: 'Access Denied',
                error: 'You do not have permission to access this page',
                statusCode: 403
            });
        }

        next();
    } catch (error) {
        console.error('Admin Middleware Error:', error);
        res.status(500).render('error', { 
            message: 'Server Error',
            error: process.env.NODE_ENV === 'development' ? error : {},
            statusCode: 500
        });
    }
};

// Basic middleware structure for future implementation
export const isAuthenticated = (req, res, next) => {
    next();
};

// Check if user is banned
export const checkBanned = (req, res, next) => {
    next();
};

// Role-based access control middleware
export const auth = async (req, res, next) => {
    try {
        // Get token from cookie
        const token = req.cookies.token;
        
        if (!token) {
            console.log('❌ No token found in cookies');
            return res.redirect('/login');
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            console.log('❌ User not found');
            return res.redirect('/login');
        }

        // Check if user is banned
        if (user.isBanned) {
            console.log('❌ User is banned');
            return res.redirect('/banned');
        }

        // Attach user to request
        req.user = user;
        console.log('✅ User authenticated:', user._id);
        next();
    } catch (error) {
        console.error('❌ Auth middleware error:', error);
        return res.redirect('/login');
    }
};

