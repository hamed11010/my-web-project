import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        name: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true,
            min: 0
        }
    }],
    deliveryInfo: {
        fullName: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        }
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card'],
        required: true
    },
    cardDetails: {
        cardName: String,
        cardNumber: String,
        expiry: String,
        cvv: String
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    discount: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'preparing', 'ready', 'delivered', 'cancelled'],
        default: 'pending'
    },
    estimatedWaitTime: {
        type: Number, // in minutes
        required: true
    },
    orderTime: {
        type: Date,
        default: Date.now
    },
    cancellationTime: {
        type: Date
    },
    cancellationFee: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Add method to check if order can be cancelled
orderSchema.methods.canBeCancelled = function() {
    const now = new Date();
    const orderTime = new Date(this.orderTime);
    const timeDiff = (now - orderTime) / 1000 / 60; // difference in minutes
    return timeDiff <= 1; // can be cancelled within 1 minute
};

// Add method to calculate cancellation fee
orderSchema.methods.calculateCancellationFee = function() {
    if (this.paymentMethod === 'card' && !this.canBeCancelled()) {
        return this.total * 0.1; // 10% fee for card payments after 1 minute
    }
    return 0;
};

// Check if the model exists before creating it
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export { Order }; 