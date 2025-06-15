import express from 'express';
import { getDashboard, getUsers, getSales, getUserDetails, deleteUser } from '../controllers/adminController.js';
import { protect, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin dashboard routes - protect first, then check admin role
router.get('/dashboard', protect, isAdmin, getDashboard);
router.get('/users', protect, isAdmin, getUsers);
router.get('/sales', protect, isAdmin, getSales);
router.get('/users/:id', protect, isAdmin, getUserDetails);
router.delete('/users/:id', protect, isAdmin, deleteUser);

export default router; 