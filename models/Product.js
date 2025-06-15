import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        minlength: 2,
        maxlength: 100,
        index: true
    },
    description: {
        type: String,
        required: true,
        trim: true,
        minlength: 10,
        maxlength: 500
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
        ],
        index: true
    },
    image: {
        type: String,
        required: true,
        trim: true
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
        min: 0,
        default: 0
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
    },
    initialStock: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    isAvailable: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true
});

productSchema.index({ category: 1, name: 1 });
productSchema.index({ isAvailable: 1, category: 1 });

const Product = mongoose.model('Product', productSchema);
export default Product; 