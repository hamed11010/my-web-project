// controllers/pageController.js
import Product from '../models/Product.js';
import { Order } from '../models/orderModel.js';
import User from '../models/User.js';
import Cart from '../models/Cart.js';
import jwt from 'jsonwebtoken';
import NodeCache from 'node-cache';

const performanceLog = (pageName, startTime) => {
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    console.log(`⏱️ ${pageName} page loaded in ${loadTime}ms`);
    return loadTime;
};

// Create a cache with 5 minutes TTL
const cache = new NodeCache({ stdTTL: 300 });

export const renderHome = async (req, res) => {
    const startTime = Date.now();
    try {
        const products = await Product.find({}).sort({ category: 1, name: 1 });
        let adminData = null;
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer')) {
            try {
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
                const user = await User.findById(decoded.id).select('-password');
                if (user && user.role === 'admin') {
                    const orders = await Order.find({}).populate('userId', 'name email').sort({ createdAt: -1 });
                    const bannedUsers = await User.find({ isBanned: true });
                    adminData = { orders, bannedUsers, user };
                }
                req.user = user; // Set the user info in the request object
            } catch (error) {
                console.error('Token verification error:', error);
            }
        }

        const loadTime = performanceLog('Home', startTime);
        res.render('ahmed', { products, adminData, loadTime });
    } catch (error) {
        console.error('Error loading home page:', error);
        res.status(500).render('error', { 
            message: 'Failed to load home page',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

export const renderLogin = (req, res) => res.render('hamdii2');
export const renderSignup = (req, res) => res.render('hamdii');
export const renderAboutUs = (req, res) => res.render('aboutus');

export const renderBoudz = async (req, res) => {
    console.log('🔄 Starting boudz page render');
    console.time('boudz-page');
    try {
        if (!req.user) {
            console.log('❌ No user found, redirecting to login');
            return res.redirect('/login');
        }

        console.log('🔍 Checking cache for products');
        // Try to get products from cache first
        let products = cache.get('menu_products');
        
        if (!products) {
            console.log('📥 Cache miss, fetching from database');
            console.time('boudz-db-query');
            products = await Product.find({ isAvailable: true })
                .select('name price image category description')
                .sort({ category: 1, name: 1 })
                .lean();
            console.timeEnd('boudz-db-query');
            console.log(`✅ Found ${products.length} products`);
            
            // Cache the products
            cache.set('menu_products', products);
        } else {
            console.log('✅ Using cached products');
        }

        console.time('boudz-render');
        res.render('boudz', {
            products,
            categories: ['Cold Coffee', 'Hot Drinks', 'Smoothies', 'Cold Drinks', 'Breakfast', 'Dessert'],
            user: req.user
        });
        console.timeEnd('boudz-render');
    } catch (error) {
        console.error('❌ Error loading menu:', error);
        res.status(500).render('error', { message: 'Failed to load menu' });
    } finally {
        console.timeEnd('boudz-page');
    }
};

export const renderHatem = async (req, res) => {
    console.log('🔄 Starting hatem page render');
    console.time('hatem-page');
    try {
        if (!req.user) {
            console.log('❌ No user found, redirecting to login');
            return res.redirect('/login');
        }

        console.log('🔍 Fetching cart for user:', req.user._id);
        const cart = await Cart.findOne({ userId: req.user._id }).lean();
        console.log('✅ Cart fetched:', cart ? 'Found' : 'Not found');

        // Ensure cart has the required structure
        const cartData = cart || { 
            items: [], 
            subtotal: 0, 
            total: 0, 
            discount: 0 
        };

        console.log('📦 Cart data prepared:', {
            itemsCount: cartData.items.length,
            subtotal: cartData.subtotal,
            total: cartData.total
        });

        console.time('hatem-render');
        res.render('hatem', { 
            cart: cartData,
            user: req.user,
            process: { env: { API_URL: process.env.API_URL } }
        });
        console.timeEnd('hatem-render');
    } catch (error) {
        console.error('❌ Error loading cart:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
        res.status(500).render('error', { 
            message: 'Failed to load cart',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    } finally {
        console.timeEnd('hatem-page');
    }
};

export const renderHatem2 = async (req, res) => {
    console.log('🔄 Starting hatem2 (checkout) page render');
    console.time('hatem2-page');
    try {
        if (!req.user) {
            console.log('❌ No user found, redirecting to login');
            return res.redirect('/login');
        }

        console.log('🔍 Fetching cart for user:', req.user._id);
        const cart = await Cart.findOne({ userId: req.user._id }).lean();
        console.log('✅ Cart fetched:', cart ? 'Found' : 'Not found');

        // Ensure cart has the required structure
        const cartData = cart || { 
            items: [], 
            subtotal: 0, 
            total: 0, 
            discount: 0 
        };

        console.log('📦 Cart data prepared:', {
            itemsCount: cartData.items.length,
            subtotal: cartData.subtotal,
            total: cartData.total
        });

        console.time('hatem2-render');
        res.render('hatem2', { 
            cart: cartData,
            user: req.user,
            process: { env: { API_URL: process.env.API_URL } }
        });
        console.timeEnd('hatem2-render');
    } catch (error) {
        console.error('❌ Error loading checkout page:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
        res.status(500).render('error', { 
            message: 'Failed to load checkout page',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    } finally {
        console.timeEnd('hatem2-page');
    }
};

export const renderOrderConfirmation = async (req, res) => {
    const startTime = Date.now();
    try {
        if (!req.user) {
            return res.redirect('/login');
        }

        const order = await Order.findOne({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .populate('items.productId')
            .lean();
        
        const loadTime = performanceLog('Order Confirmation', startTime);
        res.render('orderconfirmation', { 
            order,
            user: req.user,
            loadTime
        });
    } catch (error) {
        console.error('Error loading order confirmation:', error);
        res.status(500).render('error', { 
            message: 'Failed to load order confirmation',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

export const renderAdminOrders = async (req, res) => {
    const startTime = Date.now();
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.redirect('/login');
        }

        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .populate('user', 'name email')
            .populate('items.product')
            .lean();
        
        const loadTime = performanceLog('Admin Orders', startTime);
        res.render('rawan', { 
            orders,
            user: req.user,
            loadTime
        });
    } catch (error) {
        console.error('Error loading admin orders:', error);
        res.status(500).render('error', { 
            message: 'Failed to load admin orders',
            error: process.env.NODE_ENV === 'development' ? error : {},
            statusCode: 500
        });
    }
};

export const renderAdminWarehouse = async (req, res) => {
    try {
        const products = await Product.find({}).sort({ category: 1, name: 1 });
        res.render('rawan', { products, user: req.user, activeSection: 'warehouse' });
    } catch (error) {
        console.error('Error loading warehouse:', error);
        res.status(500).send('Error loading warehouse');
    }
};

export const renderAddProduct = async (req, res) => {
    try {
        const products = await Product.find({}).sort({ category: 1, name: 1 });
        res.render('rawan', { products, user: req.user, activeSection: 'add-product' });
    } catch (error) {
        console.error('Error loading add product page:', error);
        res.status(500).send('Error loading add product page');
    }
};

export const renderAddSupplier = async (req, res) => {
    try {
        res.render('rawan', { user: req.user, activeSection: 'add-supplier' });
    } catch (error) {
        console.error('Error loading add supplier page:', error);
        res.status(500).send('Error loading add supplier page');
    }
};

export const renderBannedAccounts = async (req, res) => {
    const startTime = Date.now();
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.redirect('/login');
        }

        const bannedUsers = await User.find({ isBanned: true })
            .select('name email banReason bannedAt')
            .sort({ bannedAt: -1 })
            .lean();
        
        const loadTime = performanceLog('Banned Accounts', startTime);
        res.render('banned-accounts', { 
            bannedUsers,
            user: req.user,
            loadTime
        });
    } catch (error) {
        console.error('Error loading banned accounts:', error);
        res.status(500).render('error', { 
            message: 'Failed to load banned accounts',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};


