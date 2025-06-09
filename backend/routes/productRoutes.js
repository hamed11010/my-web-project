import express from 'express';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  updateStock,
  getCategoryTotals
} from '../controllers/productController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public: Get all products (optionally by category)
router.get('/', getProducts);

// Public: Get a single product by ID
router.get('/:id', getProductById);

// Admin: Create a new product
router.post('/', protect, createProduct);

// Admin: Update a product
router.put('/:id', protect, updateProduct);

// Admin: Delete a product
router.delete('/:id', protect, deleteProduct);

// Admin: Update product stock
router.put('/:id/stock', protect, updateStock);

// Admin: Get total stock for each category
router.get('/category/totals', protect, getCategoryTotals);

export default router; 