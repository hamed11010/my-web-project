import express from 'express';
import { login, logout, register, getCurrentUser } from '../controllers/authcontroller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Login route
router.post('/login', login);

// Register route
router.post('/register', register);

// Logout route
router.post('/logout', logout);

// Get current user
router.get('/me', protect, getCurrentUser);

export default router;
