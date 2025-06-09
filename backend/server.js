import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import orderRoutes from './routes/orderRoutes.js';
import promoRoutes from './routes/promoRoutes.js';
import userRoutes from './routes/userRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Order from './models/Order.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { protect, admin } from './middleware/authMiddleware.js';
import productRoutes from './routes/productRoutes.js';
import Product from './models/Product.js';
import Cart from './models/Cart.js';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));
app.use('/css', express.static(path.join(__dirname, '../public/css')));
app.use('/js', express.static(path.join(__dirname, '../public/js')));
app.use('/images', express.static(path.join(__dirname, '../public/images')));
app.use('/sounds', express.static(path.join(__dirname, '../public/sounds')));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/promos', promoRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);

// Public routes
app.get('/', async (req, res) => {
    try {
        // Get all products for the menu
        const products = await Product.find({}).sort({ category: 1, name: 1 });
        
        // If user is logged in and is admin, get admin data
        let adminData = null;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer')) {
            try {
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
                const user = await User.findById(decoded.id).select('-password');
                
                if (user && user.role === 'admin') {
                    // Get orders and banned users for admin
                    const orders = await Order.find({})
                        .populate('userId', 'name email')
                        .sort({ createdAt: -1 });
                    const bannedUsers = await User.find({ isBanned: true });
                    
                    adminData = {
                        orders,
                        bannedUsers,
                        user
                    };
                }
            } catch (error) {
                console.error('Token verification error:', error);
            }
        }

        res.render('ahmed', {
            products,
            adminData
        });
    } catch (error) {
        console.error('Error loading home page:', error);
        res.status(500).render('error', { message: 'Error loading home page' });
    }
});

app.get('/login', (req, res) => res.render('hamdii2'));
app.get('/register', (req, res) => res.render('hamdii2'));
app.get('/aboutus', (req, res) => res.render('aboutus'));

// Protected routes
app.get('/boudz', protect, async (req, res) => {
    try {
        const products = await Product.find({}).sort({ category: 1, name: 1 });
        res.render('boudz', { 
            products,
            categories: [
                'Cold Coffee',
                'Hot Drinks',
                'Smoothies',
                'Cold Drinks',
                'Breakfast',
                'Dessert'
            ],
            user: req.user
        });
    } catch (error) {
        console.error('Error loading menu:', error);
        res.status(500).send('Error loading menu');
    }
});

app.get('/hatem', protect, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user._id });
        res.render('hatem', { 
            cart,
            user: req.user
        });
    } catch (error) {
        console.error('Error loading cart:', error);
        res.status(500).send('Error loading cart');
    }
});

app.get('/order-confirmation/:orderId', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) {
            return res.status(404).render('error', { message: 'Order not found' });
        }
        // Verify order belongs to user or user is admin
        if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).render('error', { message: 'Not authorized to view this order' });
        }
        res.render('order-confirmation', { 
            order,
            user: req.user
        });
    } catch (error) {
        console.error('Error loading order confirmation:', error);
        res.status(500).render('error', { message: 'Error loading order confirmation' });
    }
});

// Admin routes
app.get('/rawan', protect, admin, async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });
        res.render('rawan', { 
            orders,
            user: req.user,
            activeSection: 'orders'
        });
    } catch (error) {
        console.error('Error loading store orders:', error);
        res.status(500).send('Error loading store orders');
    }
});

app.get('/rawan/warehouse', protect, admin, async (req, res) => {
    try {
        const products = await Product.find({}).sort({ category: 1, name: 1 });
        res.render('rawan', { 
            products,
            user: req.user,
            activeSection: 'warehouse'
        });
    } catch (error) {
        console.error('Error loading warehouse:', error);
        res.status(500).send('Error loading warehouse');
    }
});

app.get('/rawan/add-product', protect, admin, async (req, res) => {
    try {
        const products = await Product.find({}).sort({ category: 1, name: 1 });
        res.render('rawan', { 
            products,
            user: req.user,
            activeSection: 'add-product'
        });
    } catch (error) {
        console.error('Error loading add product page:', error);
        res.status(500).send('Error loading add product page');
    }
});

app.get('/rawan/add-supplier', protect, admin, async (req, res) => {
    try {
        res.render('rawan', { 
            user: req.user,
            activeSection: 'add-supplier'
        });
    } catch (error) {
        console.error('Error loading add supplier page:', error);
        res.status(500).send('Error loading add supplier page');
    }
});

app.get('/admin/banned-accounts', protect, admin, async (req, res) => {
    try {
        const bannedUsers = await User.find({ isBanned: true });
        res.render('banned-accounts', { 
            bannedUsers,
            user: req.user
        });
    } catch (error) {
        console.error('Error loading banned accounts:', error);
        res.status(500).send('Error loading banned accounts');
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 