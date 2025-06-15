import mongoose from 'mongoose';

const promoCodeSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    discountPercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    isActive: {
        type: Boolean,
        default: true
    },
    usedBy: [{
        userId: {
            type: String,
            required: true
        },
        usedAt: {
            type: Date,
            default: Date.now
        }
    }],
    expiryDate: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

const PromoCode = mongoose.model('PromoCode', promoCodeSchema);
export default PromoCode; 