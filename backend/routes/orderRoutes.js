import express from 'express';
import Order from '../models/Order.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';

const router = express.Router();

// @desc    Get all orders (admin only)
// @route   GET /api/orders
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Error fetching orders' });
    }
});

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const {
            items,
            totalAmount,
            discountApplied,
            promoCodeUsed,
            finalAmount,
            paymentMethod,
            customerDetails
        } = req.body;

        // Fetch user details from DB for integrity
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check and update stock for each product
        for (const item of items) {
            let product = null;
            // Try to find by ObjectId
            if (mongoose.Types.ObjectId.isValid(item.productId)) {
                product = await Product.findById(item.productId);
            }
            // If not found, try by name (case-insensitive)
            if (!product) {
                product = await Product.findOne({ name: new RegExp('^' + item.name + '$', 'i') });
            }
            if (!product) {
                return res.status(400).json({ message: `Sorry, we couldn't find the product "${item.name}" in our menu. Please refresh the page and try again.` });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({ message: `Not enough stock for ${product.name}` });
            }
            product.stock -= item.quantity;
            await product.save();
            // Update productId in item to the real ObjectId for order record
            item.productId = product._id;
        }

        // Calculate estimated completion time (3 minutes from now)
        const estimatedCompletionTime = new Date(Date.now() + 3 * 60 * 1000);

        // Format shipping address as a string
        let shippingAddress = '';
        if (user.address) {
            if (typeof user.address === 'string' && user.address.trim()) {
                shippingAddress = user.address;
            } else if (typeof user.address === 'object') {
                shippingAddress = Object.values(user.address).filter(Boolean).join(', ');
            }
        }
        // If still empty, use the address from the checkout form
        if (!shippingAddress && customerDetails?.address) {
            shippingAddress = customerDetails.address;
        }
        // If still empty, fallback to a default
        if (!shippingAddress) {
            shippingAddress = 'No address provided';
        }

        const order = await Order.create({
            userId: req.user._id,
            items,
            totalAmount,
            discountApplied,
            promoCodeUsed,
            finalAmount,
            paymentMethod,
            estimatedCompletionTime,
            customerDetails: {
                name: user.name,
                email: user.email,
                phone: customerDetails?.phone || '',
                address: customerDetails?.address || ''
            },
            customerUsername: user.name,
            customerEmail: user.email,
            shippingAddress,
        });

        // Send response with order ID
        res.status(201).json({
            success: true,
            orderId: order._id,
            message: 'Order created successfully'
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Get user's orders
// @route   GET /api/orders/myorders
// @access  Private
router.get('/myorders', protect, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user._id })
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private
router.put('/:id/status', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if user is admin
        const user = await User.findById(req.user._id);
        if (!user || user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized. Admin only.' });
        }

        const { status } = req.body;

        // Only allow status updates if order is not completed or cancelled
        if (order.status === 'completed' || order.status === 'cancelled') {
            return res.status(400).json({ message: 'Cannot update completed or cancelled order' });
        }

        // Handle status changes
        switch (status) {
            case 'completed':
                order.status = 'completed';
                order.actualCompletionTime = new Date();
                order.paymentStatus = 'completed';
                break;
            case 'cancelled':
                order.status = 'cancelled';
                order.cancelledAt = new Date();
                order.cancellationReason = 'admin_cancellation';
                // If payment was made, mark as refunded
                if (order.paymentMethod === 'card') {
                    order.paymentStatus = 'refunded';
                }
                // Restore product stock
                for (const item of order.items) {
                    const product = await Product.findById(item.productId);
                    if (product) {
                        product.stock += item.quantity;
                        await product.save();
                    }
                }
                break;
            case 'preparing':
                order.status = 'preparing';
                break;
            case 'ready':
                order.status = 'ready';
                break;
            default:
                return res.status(400).json({ message: 'Invalid status' });
        }

        await order.save();

        // Send response with updated order
        res.json({
            success: true,
            order,
            message: `Order ${status} successfully`
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Cancel order (customer)
// @route   PUT /api/orders/:id/cancel
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if user owns the order
        if (order.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Check if order is already cancelled
        if (order.status === 'cancelled') {
            return res.status(400).json({ message: 'Order is already cancelled' });
        }

        // Check if order is completed
        if (order.status === 'completed') {
            return res.status(400).json({ message: 'Cannot cancel completed order' });
        }

        // Check if order can be cancelled (within 1 minute of creation)
        const timeElapsed = Date.now() - new Date(order.createdAt).getTime();
        console.log('Time elapsed since order creation (ms):', timeElapsed);
        
        if (timeElapsed > 60 * 1000) {
            return res.status(400).json({ 
                message: 'Order can only be cancelled within 1 minute of creation',
                timeElapsed: timeElapsed,
                createdAt: order.createdAt
            });
        }

        // Update order status
        order.status = 'cancelled';
        order.cancelledAt = new Date();
        order.cancellationReason = 'user_request';
        
        // If payment was made, mark as refunded
        if (order.paymentMethod === 'card') {
            order.paymentStatus = 'refunded';
        }

        // Restore product stock
        for (const item of order.items) {
            const product = await Product.findById(item.productId);
            if (product) {
                product.stock += item.quantity;
                await product.save();
            }
        }

        await order.save();

        res.json({
            success: true,
            order,
            message: 'Order cancelled successfully'
        });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all orders (admin only)
// @route   GET /api/orders/all
// @access  Private/Admin
router.get('/all', protect, async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            console.error('No req.user or req.user._id in /api/orders/all');
            return res.status(401).json({ message: 'Not authenticated' });
        }
        const user = await User.findById(req.user._id);
        if (!user) {
            console.error('User not found for _id:', req.user._id);
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.role !== 'admin') {
            console.error('User is not admin:', user.email);
            return res.status(403).json({ message: 'Not authorized' });
        }
        const orders = await Order.find({}).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error('Error in /api/orders/all:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get single order details
router.get('/:orderId', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate('userId', 'name email');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if user is admin or the order owner
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.role !== 'admin' && order.userId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this order'
            });
        }

        res.json({
            success: true,
            order
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// @desc    Add rating to completed order
// @route   PUT /api/orders/:id/rate
// @access  Private
router.put('/:id/rate', protect, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if user owns the order
        if (order.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Check if order is completed
        if (order.status !== 'completed') {
            return res.status(400).json({ message: 'Can only rate completed orders' });
        }

        // Check if order already has a rating
        if (order.rating !== null) {
            return res.status(400).json({ message: 'Order already rated' });
        }

        // Validate rating
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        // Update order with rating
        order.rating = rating;
        order.ratingComment = comment || null;
        await order.save();

        res.json({
            success: true,
            order,
            message: 'Rating added successfully'
        });
    } catch (error) {
        console.error('Error adding rating:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update order items
// @route   PUT /api/orders/:orderId/items
// @access  Private
router.put('/:orderId/items', protect, async (req, res) => {
    try {
        const order = await Order.findOne({ 
            _id: req.params.orderId,
            userId: req.user._id
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if order can be edited (within 1 minute)
        const timeElapsed = Date.now() - new Date(order.createdAt).getTime();
        if (timeElapsed > 60000) {
            return res.status(400).json({ 
                message: 'Order can only be edited within 1 minute of placement' 
            });
        }

        const { items, specialInstructions } = req.body;
        const originalItems = [...order.items];

        // Calculate new total
        const totalAmount = items.reduce((total, item) => 
            total + (item.price * item.quantity), 0);

        // Calculate changes for tracking
        const changes = {
            itemsAdded: items.filter(newItem => 
                !originalItems.some(oldItem => 
                    oldItem.productId.toString() === newItem.productId || 
                    oldItem.name.toLowerCase() === newItem.name.toLowerCase()
                )
            ),
            itemsRemoved: originalItems.filter(oldItem => 
                !items.some(newItem => 
                    newItem.productId.toString() === oldItem.productId || 
                    newItem.name.toLowerCase() === newItem.name.toLowerCase()
                )
            ),
            itemsModified: items.filter(newItem => {
                const oldItem = originalItems.find(oldItem => 
                    oldItem.productId.toString() === newItem.productId || 
                    oldItem.name.toLowerCase() === newItem.name.toLowerCase()
                );
                return oldItem && oldItem.quantity !== newItem.quantity;
            }).map(newItem => {
                const oldItem = originalItems.find(oldItem => 
                    oldItem.productId.toString() === newItem.productId || 
                    oldItem.name.toLowerCase() === newItem.name.toLowerCase()
                );
                return {
                    ...newItem,
                    oldQuantity: oldItem.quantity,
                    newQuantity: newItem.quantity
                };
            })
        };

        // Update stock for removed items
        for (const item of changes.itemsRemoved) {
            const product = await Product.findById(item.productId);
            if (product) {
                product.stock += item.quantity;
                await product.save();
            }
        }

        // Update stock for modified items
        for (const item of changes.itemsModified) {
            const product = await Product.findById(item.productId);
            if (product) {
                const quantityDiff = item.oldQuantity - item.newQuantity;
                product.stock += quantityDiff;
                await product.save();
            }
        }

        // Check stock for new items
        for (const item of changes.itemsAdded) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(400).json({ 
                    message: `Product ${item.name} not found` 
                });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({ 
                    message: `Not enough stock for ${item.name}` 
                });
            }
            product.stock -= item.quantity;
            await product.save();
        }

        // Update order
        order.items = items;
        order.totalAmount = totalAmount;
        order.finalAmount = totalAmount - (order.discountApplied || 0);
        order.modifiedAt = new Date();
        order.modificationCount = (order.modificationCount || 0) + 1;
        order.modificationHistory = order.modificationHistory || [];
        order.modificationHistory.push({
            timestamp: new Date(),
            changes,
            previousTotal: order.totalAmount,
            newTotal: totalAmount
        });

        if (specialInstructions) {
            order.specialInstructions = specialInstructions;
        }

        await order.save();

        res.json({ 
            success: true,
            message: 'Order updated successfully',
            order,
            changes
        });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Restore product stock before deleting
        for (const item of order.items) {
            const product = await Product.findById(item.productId);
            if (product) {
                product.stock += item.quantity;
                await product.save();
            }
        }

        // Delete the order
        await Order.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Order deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router; 