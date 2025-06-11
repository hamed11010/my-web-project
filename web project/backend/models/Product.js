import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        minlength: 2,
        maxlength: 100
    },
    category: {
        type: String,
        required: true,
        enum: [
            'Cold Coffee',
            'Hot Drinks',
            'Smoothies',
            'Cold Drinks',
            'Breakfast',
            'Dessert'
        ]
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    unit: {
        type: String,
        required: true,
        enum: ['pcs', 'kg', 'litre', 'box', 'other'],
        default: 'pcs'
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    cost: {
        type: Number,
        required: true,
        min: 0
    },
    supplier: {
        type: String,
        default: ''
    },
    reorderLevel: {
        type: Number,
        required: true,
        min: 0,
        default: 10
    }
}, {
    timestamps: true
});

const Product = mongoose.model('Product', productSchema);
export default Product; 