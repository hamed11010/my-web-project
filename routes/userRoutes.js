import express from 'express';
import {
    getUsers,
    //getUserById,
    updateUser,
    deleteUser,
    banUser,
    unbanUser,
    getBannedUsers,
    login,
    verifyUserToken,
    verifyAdminRole
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { logout } from '../controllers/authcontroller.js';

const router = express.Router();

// User routes
router.get('/', getUsers);
router.get('/banned', getBannedUsers);
//router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.post('/:id/ban', banUser);
router.post('/:id/unban', unbanUser);
router.post('/login', login);
router.post('/logout', logout);
router.get('/verify', protect, verifyUserToken);
router.get('/verify-admin', protect, verifyAdminRole);

export default router;
