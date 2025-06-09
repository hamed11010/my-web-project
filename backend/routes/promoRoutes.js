import express from 'express';
import PromoCode from '../models/PromoCode.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Validate promo code (no authentication required - compatible with existing frontend)
router.post('/validate', async (req, res) => {
    try {
        const { code } = req.body;
        const promoCode = await PromoCode.findOne({ code: code.toUpperCase() });

        if (!promoCode) {
            return res.status(404).json({ 
                success: false,
                message: 'Invalid promo code' 
            });
        }

        if (!promoCode.isActive) {
            return res.status(400).json({ 
                success: false,
                message: 'Promo code is inactive' 
            });
        }

        if (promoCode.expiryDate < new Date()) {
            return res.status(400).json({ 
                success: false,
                message: 'Promo code has expired' 
            });
        }

        // For non-authenticated users, just validate the code
        res.json({
            success: true,
            discountPercentage: promoCode.discountPercentage
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            message: error.message 
        });
    }
});

// Apply promo code (authenticated version - for order history)
router.post('/apply', protect, async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.user._id;
        const promoCode = await PromoCode.findOne({ code: code.toUpperCase() });

        if (!promoCode || !promoCode.isActive || promoCode.expiryDate < new Date()) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid or expired promo code' 
            });
        }

        // Check if user has already used this code
        const hasUsed = promoCode.usedBy.some(usage => usage.userId.toString() === userId.toString());
        if (hasUsed) {
            return res.status(400).json({ 
                success: false,
                message: 'You have already used this promo code' 
            });
        }

        // Add user to usedBy array
        promoCode.usedBy.push({ userId });
        await promoCode.save();

        res.json({
            success: true,
            discountPercentage: promoCode.discountPercentage,
            message: 'Promo code applied successfully'
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            message: error.message 
        });
    }
});

// Check if user has used a promo code (authenticated)
router.get('/check/:code', protect, async (req, res) => {
    try {
        const promoCode = await PromoCode.findOne({ code: req.params.code.toUpperCase() });
        
        if (!promoCode) {
            return res.status(404).json({ 
                success: false,
                message: 'Promo code not found' 
            });
        }

        const hasUsed = promoCode.usedBy.some(usage => 
            usage.userId.toString() === req.user._id.toString()
        );

        res.json({
            success: true,
            hasUsed,
            discountPercentage: promoCode.discountPercentage
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            message: error.message 
        });
    }
});

// Create new promo code (admin only)
router.post('/', protect, admin, async (req, res) => {
    try {
        const { code, discountPercentage, expiryDate } = req.body;
        
        const promoCode = new PromoCode({
            code: code.toUpperCase(),
            discountPercentage,
            expiryDate: new Date(expiryDate)
        });

        const createdPromoCode = await promoCode.save();
        res.status(201).json({
            success: true,
            promoCode: createdPromoCode
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            message: error.message 
        });
    }
});

export default router; 