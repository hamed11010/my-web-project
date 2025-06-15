// controllers/promoController.js
import PromoCode from '../models/PromoCode.js';

// Validate promo code (no auth required)
export const validatePromoCode = async (req, res) => {
    try {
        const { code } = req.body;
        const promoCode = await PromoCode.findOne({ code: code.toUpperCase() });

        if (!promoCode) {
            return res.status(404).json({ success: false, message: 'Invalid promo code' });
        }

        if (!promoCode.isActive) {
            return res.status(400).json({ success: false, message: 'Promo code is inactive' });
        }

        if (promoCode.expiryDate < new Date()) {
            return res.status(400).json({ success: false, message: 'Promo code has expired' });
        }

        res.json({
            success: true,
            discountPercentage: promoCode.discountPercentage
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Apply promo code (requires auth)
export const     applyPromo = async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.user._id;
        const promoCode = await PromoCode.findOne({ code: code.toUpperCase() });

        if (!promoCode || !promoCode.isActive || promoCode.expiryDate < new Date()) {
            return res.status(400).json({ success: false, message: 'Invalid or expired promo code' });
        }

        const hasUsed = promoCode.usedBy.some(usage => usage.userId.toString() === userId.toString());
        if (hasUsed) {
            return res.status(400).json({ success: false, message: 'You have already used this promo code' });
        }

        promoCode.usedBy.push({ userId });
        await promoCode.save();

        res.json({
            success: true,
            discountPercentage: promoCode.discountPercentage,
            message: 'Promo code applied successfully'
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Check promo usage (requires auth)
export const checkPromoUsage = async (req, res) => {
    try {
        const promoCode = await PromoCode.findOne({ code: req.params.code.toUpperCase() });

        if (!promoCode) {
            return res.status(404).json({ success: false, message: 'Promo code not found' });
        }

        const hasUsed = promoCode.usedBy.some(usage => usage.userId.toString() === req.user._id.toString());

        res.json({
            success: true,
            hasUsed,
            discountPercentage: promoCode.discountPercentage
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Create promo code (admin only)
export const createPromo = async (req, res) => {
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
        res.status(400).json({ success: false, message: error.message });
    }
};
