import Product from '../models/Product.js';
import { Order } from '../models/orderModel.js';

// Create a new product
export const createProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            category,
            image,
            price,
            initialStock,
            reorderLevel,
            unit
        } = req.body;

        // Validate required fields
        if (!name || !description || !category || !image || !price || !initialStock || !unit) {
            return res.status(400).json({ 
                success: false,
                message: 'All fields are required' 
            });
        }

        // Validate numeric fields
        if (isNaN(price) || isNaN(initialStock) || isNaN(reorderLevel)) {
            return res.status(400).json({ 
                success: false,
                message: 'Price, initial stock, and reorder level must be numbers' 
            });
        }

        // Create new product
        const product = new Product({
            name: name.trim(),
            description: description.trim(),
            category,
            image,
            price: parseFloat(price),
            stock: parseInt(initialStock),
            reorderLevel: parseInt(reorderLevel) || 0,
            unit,
            initialStock: parseInt(initialStock)
        });

        await product.save();

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            product
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating product',
            error: error.message
        });
    }
};

// Get all products (optionally by category)
export const getProducts = async (req, res) => {
    try {
        const { category } = req.query;
        const filter = category ? { category } : {};
        const products = await Product.find(filter);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single product by ID
export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update a product
export const updateProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a product
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ 
                success: false,
                message: 'Product not found' 
            });
        }

        // Check if product is in any active orders
        const activeOrders = await Order.find({
            'items.product': product._id,
            status: { $in: ['pending', 'processing', 'preparing'] }
        });

        if (activeOrders.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete product as it is part of active orders'
            });
        }

        await product.deleteOne();

        res.json({ 
            success: true,
            message: 'Product deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error deleting product',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Update product stock (with action and reason)
export const updateStock = async (req, res) => {
    try {
        const { action, quantity, reason } = req.body;
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        let newStock = product.stock;
        if (action === 'add') newStock += quantity;
        else if (action === 'remove') newStock = Math.max(0, newStock - quantity);
        else if (action === 'set') newStock = quantity;
        else return res.status(400).json({ message: 'Invalid action' });
        product.stock = newStock;
        await product.save();
        // Optionally log the stock change with reason
        res.json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get total stock for each category
export const getCategoryTotals = async (req, res) => {
    try {
        const totals = await Product.aggregate([
            {
                $group: {
                    _id: '$category',
                    totalStock: { $sum: '$stock' }
                }
            },
            {
                $project: {
                    _id: 0,
                    category: '$_id',
                    totalStock: 1
                }
            }
        ]);
        res.json(totals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}; 