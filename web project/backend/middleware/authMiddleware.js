import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Protect routes middleware
const protect = async (req, res, next) => {
    console.log('=== Auth Middleware Debug ===');
    console.log('Request headers:', req.headers);
    console.log('Request path:', req.path);
    
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
    // Check for token in cookies
    else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
        console.log('Token found in cookies');
    }

    if (!token) {
        console.log('No token found in request');
        // For menu page, don't require authentication
        if (req.path === '/api/products') {
            console.log('Allowing access to products without token');
            return next();
        }
        // For view routes, redirect to login with return URL
        if (!req.path.startsWith('/api/')) {
            console.log('Redirecting to login page');
            // Store the current path in a cookie
            res.cookie('returnTo', req.originalUrl, { maxAge: 900000 }); // 15 minutes
            return res.redirect('/login');
        }
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        // First try to decode without verification to check expiration
        const decoded = jwt.decode(token);
        if (!decoded) {
            console.log('Token could not be decoded');
            if (!req.path.startsWith('/api/')) {
                // Store the current path in a cookie
                res.cookie('returnTo', req.originalUrl, { maxAge: 900000 }); // 15 minutes
                return res.redirect('/login');
            }
            return res.status(401).json({ message: 'Invalid token format' });
        }

        const expirationDate = new Date(decoded.exp * 1000);
        const now = new Date();
        const timeRemaining = Math.floor((expirationDate - now) / 1000 / 60);

        console.log('Token details:', {
            userId: decoded.id,
            role: decoded.role,
            expiresAt: expirationDate.toISOString(),
            currentTime: now.toISOString(),
            timeRemaining: timeRemaining + ' minutes'
        });

        // If token is expired, return specific error
        if (now > expirationDate) {
            console.log('Token has expired');
            if (!req.path.startsWith('/api/')) {
                // Store the current path in a cookie
                res.cookie('returnTo', req.originalUrl, { maxAge: 900000 }); // 15 minutes
                return res.redirect('/login');
            }
            return res.status(401).json({ 
                message: 'Token expired',
                expiredAt: expirationDate
            });
        }

        // Verify token
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        console.log('Token verified successfully');

        // Get user from the token
        const user = await User.findById(verified.id).select('-password');
        
        if (!user) {
            console.log('User not found for ID:', verified.id);
            if (!req.path.startsWith('/api/')) {
                // Store the current path in a cookie
                res.cookie('returnTo', req.originalUrl, { maxAge: 900000 }); // 15 minutes
                return res.redirect('/login');
            }
            return res.status(401).json({ message: 'Not authorized, user not found' });
        }

        // Check if user is banned
        if (user.isBanned) {
            console.log('User is banned:', {
                userId: user._id,
                reason: user.banReason,
                date: user.banDate
            });
            if (!req.path.startsWith('/api/')) {
                // Store the current path in a cookie
                res.cookie('returnTo', req.originalUrl, { maxAge: 900000 }); // 15 minutes
                return res.redirect('/login');
            }
            return res.status(403).json({
                message: 'Account is banned',
                banReason: user.banReason,
                banDate: user.banDate
            });
        }

        // Attach user to request
        req.user = user;
        console.log('User authenticated successfully:', {
            userId: user._id,
            role: user.role,
            email: user.email
        });
        
        next();
    } catch (error) {
        console.error('Token verification error:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });

        // For view routes, redirect to login
        if (!req.path.startsWith('/api/')) {
            // Store the current path in a cookie
            res.cookie('returnTo', req.originalUrl, { maxAge: 900000 }); // 15 minutes
            return res.redirect('/login');
        }

        // Handle specific JWT errors
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: 'Token expired',
                expiredAt: error.expiredAt
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                message: 'Invalid token',
                error: error.message
            });
        }

        return res.status(401).json({ 
            message: 'Authentication failed',
            error: error.message
        });
    }
};

// Admin middleware
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        console.log('Admin access granted for user:', {
            userId: req.user._id,
            role: req.user.role
        });
        next();
    } else {
        console.log('Admin access denied for user:', {
            userId: req.user?._id,
            role: req.user?.role
        });
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};

export { protect, admin }; 