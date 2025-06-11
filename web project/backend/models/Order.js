import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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
        quantity: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
            required: true
        }
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    discountApplied: {
        type: Number,
        default: 0
    },
    promoCodeUsed: {
        type: String,
        default: null
    },
    finalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        required: true,
        default: 'pending',
        enum: ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['cash', 'card']
    },
    paymentStatus: {
        type: String,
        required: true,
        default: 'pending',
        enum: ['pending', 'completed', 'failed', 'refunded']
    },
    estimatedCompletionTime: {
        type: Date,
        required: true
    },
    actualCompletionTime: {
        type: Date
    },
    customerDetails: {
        name: String,
        email: String,
        phone: String
    },
    customerUsername: {
        type: String
    },
    customerEmail: {
        type: String
    },
    shippingAddress: {
        type: String,
        required: true
    },
    specialInstructions: {
        type: String,
        default: ''
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: null
    },
    ratingComment: {
        type: String,
        default: null
    },
    modifiedAt: {
        type: Date
    },
    modificationCount: {
        type: Number,
        default: 0
    },
    modificationHistory: [{
        timestamp: {
            type: Date,
            required: true
        },
        changes: {
            itemsAdded: [{
                productId: String,
                name: String,
                quantity: Number,
                price: Number
            }],
            itemsRemoved: [{
                productId: String,
                name: String,
                quantity: Number,
                price: Number
            }],
            itemsModified: [{
                productId: String,
                name: String,
                oldQuantity: Number,
                newQuantity: Number,
                price: Number
            }]
        },
        previousTotal: Number,
        newTotal: Number
    }],
    cancelledAt: {
        type: Date
    },
    cancellationReason: {
        type: String,
        enum: ['user_request', 'late_cancellation', null],
        default: null
    }
}, {
    timestamps: true
});

const Order = mongoose.model('Order', orderSchema);
export default Order; 