import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    items: [{
        productId: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        }
    }],
    subtotal: {
        type: Number,
        required: true,
        default: 0
    },
    total: {
        type: Number,
        required: true,
        default: 0
    },
    discount: {
        type: Number,
        required: true,
        default: 0
    },
    appliedPromoCode: {
        type: String,
        default: null
    },
    usedPromoCodes: [{
        code: {
            type: String,
            required: true
        },
        usedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Add compound index for faster cart lookups
cartSchema.index({ userId: 1, createdAt: -1 });

// Update totals before saving
cartSchema.pre('save', async function(next) {
    try {
        if (this.isModified('items')) {
            let subtotal = 0;
            for (const item of this.items) {
                subtotal += item.price * item.quantity;
            }
            this.subtotal = subtotal;
            this.total = subtotal - (this.discount || 0);
        }
        next();
    } catch (error) {
        next(error);
    }
});

const Cart = mongoose.model('Cart', cartSchema);

export default Cart; 