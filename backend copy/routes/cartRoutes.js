import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';

const router = express.Router();

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        console.log('GET /api/cart - User ID:', req.user._id);
        
        // Find or create cart for user
        let cart = await Cart.findOne({ userId: req.user._id });
        
        if (!cart) {
            cart = await Cart.create({
                userId: req.user._id,
                items: [],
                subtotal: 0,
                discount: 0,
                total: 0,
                appliedPromoCode: null
            });
        }

        console.log('Retrieved cart for user:', req.user._id);
        console.log('Cart contents:', JSON.stringify(cart, null, 2));

        res.json(cart);
    } catch (error) {
        console.error('Error getting cart:', error);
        res.status(500).json({ message: 'Error getting cart' });
    }
});

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
router.post('/add', protect, async (req, res) => {
    try {
        console.log('POST /api/cart/add - Request body:', req.body);
        console.log('User ID:', req.user._id);
        
        const { productId, name, price, quantity } = req.body;
        console.log('Adding item to cart:', { productId, name, price, quantity });

        if (!productId || !name || !price || !quantity) {
            console.log('Missing required fields:', { productId, name, price, quantity });
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Find or create cart for user
        let cart = await Cart.findOne({ userId: req.user._id });
        
        if (!cart) {
            cart = await Cart.create({
                userId: req.user._id,
                items: [],
                subtotal: 0,
                discount: 0,
                total: 0,
                appliedPromoCode: null
            });
        }

        // Check if item already exists in cart
        const existingItemIndex = cart.items.findIndex(item => item.productId === productId);
        if (existingItemIndex > -1) {
            // Update quantity if item exists
            cart.items[existingItemIndex].quantity += quantity;
            console.log('Updated existing item quantity:', cart.items[existingItemIndex]);
        } else {
            // Add new item
            cart.items.push({
                productId,
                name,
                price,
                quantity
            });
            console.log('Added new item:', cart.items[cart.items.length - 1]);
        }

        // Save cart (totals will be updated by pre-save middleware)
        await cart.save();
        console.log('Saved cart for user:', req.user._id);
        console.log('Current cart state:', JSON.stringify(cart, null, 2));

        res.json(cart);
    } catch (error) {
        console.error('Error adding item to cart:', error);
        res.status(500).json({ message: 'Error adding item to cart' });
    }
});

// @desc    Update item quantity
// @route   PUT /api/cart/update
// @access  Private
router.put('/update', protect, async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        if (!productId || !quantity) {
            return res.status(400).json({ message: 'Product ID and quantity are required' });
        }

        // Find cart
        const cart = await Cart.findOne({ userId: req.user._id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Update item quantity
        const itemIndex = cart.items.findIndex(item => item.productId === productId);
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        cart.items[itemIndex].quantity = quantity;
        await cart.save();

        res.json(cart);
    } catch (error) {
        console.error('Error updating item quantity:', error);
        res.status(500).json({ message: 'Error updating item quantity' });
    }
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove
// @access  Private
router.delete('/remove', protect, async (req, res) => {
    try {
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        // Find cart
        const cart = await Cart.findOne({ userId: req.user._id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Remove item
        cart.items = cart.items.filter(item => item.productId !== productId);
        await cart.save();

        res.json(cart);
    } catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).json({ message: 'Error removing item from cart' });
    }
});

// @desc    Clear cart
// @route   DELETE /api/cart/clear
// @access  Private
router.delete('/clear', protect, async (req, res) => {
    try {
        // Find and delete cart
        const cart = await Cart.findOne({ userId: req.user._id });
        if (cart) {
            cart.items = [];
            cart.subtotal = 0;
            cart.discount = 0;
            cart.total = 0;
            cart.appliedPromoCode = null;
            await cart.save();
        }

        res.json(cart || { items: [], subtotal: 0, discount: 0, total: 0, appliedPromoCode: null });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ message: 'Error clearing cart' });
    }
});

// @desc    Apply promo code
// @route   POST /api/cart/promo
// @access  Private
router.post('/promo', protect, async (req, res) => {
    try {
        const { promoCode } = req.body;

        if (!promoCode) {
            return res.status(400).json({ message: 'Promo code is required' });
        }

        // Validate promo code
        const validPromoCodes = {
            'SAVE10': 0.10,
            'SAVE20': 0.20,
            'COFFEE': 0.15
        };

        const discount = validPromoCodes[promoCode];
        if (!discount) {
            return res.status(400).json({ message: 'Invalid promo code' });
        }

        // Find cart
        const cart = await Cart.findOne({ userId: req.user._id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Apply discount
        cart.discount = cart.subtotal * discount;
        cart.appliedPromoCode = promoCode;
        cart.total = cart.subtotal - cart.discount;
        await cart.save();

        res.json(cart);
    } catch (error) {
        console.error('Error applying promo code:', error);
        res.status(500).json({ message: 'Error applying promo code' });
    }
});

export default router; 