// routes/pageRoutes.js
import express from 'express';
import { auth } from '../middleware/authMiddleware.js';
import {
    renderHome,
    renderLogin,
    renderSignup,
    //renderCart,
    //renderCheckout,
    renderAdminOrders,
    renderBoudz,
    renderHatem,
    renderHatem2,
    renderOrderConfirmation,
    renderBannedAccounts,
    renderAboutUs
} from '../controllers/pagecontroller.js';
import { Order } from '../models/orderModel.js';
import { protect, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', renderHome);
router.get('/login', renderLogin);
router.get('/signup', renderSignup);
router.get('/about-us', renderAboutUs);

// Protected routes
router.get('/storeOrdering', protect, isAdmin, renderAdminOrders);
router.get('/boudz', auth, renderBoudz);
router.get('/hatem', auth, renderHatem);
router.get('/hatem2', auth, renderHatem2);
//router.get('/checkout', renderCheckout);
router.get('/order-confirmation', auth, renderOrderConfirmation);
router.get('/admin/banned-accounts', protect, isAdmin, renderBannedAccounts);
router.get('/rawan', auth, renderAdminOrders);

router.get('/waiting/:orderId', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate('items.product')
            .populate('user', 'name email');

        if (!order) {
            return res.status(404).render('error', { message: 'Order not found' });
        }

        // Check if the order belongs to the current user
        if (order.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).render('error', { message: 'Access denied' });
        }

        res.render('waiting', {
            title: 'Order Confirmation',
            order,
            user: req.user
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).render('error', { message: 'Error fetching order details' });
    }
});

export default router;
