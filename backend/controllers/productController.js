import Product from '../models/Product.js';

// Create a new product
export const createProduct = async (req, res) => {
    try {
        const product = await Product.create(req.body);
        res.status(201).json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
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
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json({ message: 'Product deleted' });
    } catch (error) {
        res.status(400).json({ message: error.message });
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