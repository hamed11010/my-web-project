import User from '../models/User.js';
import { Order } from '../models/orderModel.js';
import Product from '../models/Product.js';

// Get admin dashboard with real-time data
export const getDashboard = async (req, res) => {
    try {
        // Get real-time counts
        const [totalUsers, totalOrders, salesData] = await Promise.all([
            User.countDocuments(),
            Order.countDocuments({ status: 'completed' }),
            Order.aggregate([
                { $match: { status: 'completed' } },
                { $unwind: '$items' },
                { $lookup: {
                    from: 'products',
                    localField: 'items.product',
                    foreignField: '_id',
                    as: 'productDetails'
                }},
                { $unwind: '$productDetails' },
                { $group: {
                    _id: null,
                    totalSales: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                    totalCost: { 
                        $sum: { 
                            $multiply: [
                                { $ifNull: ['$productDetails.cost', 0] },
                                '$items.quantity'
                            ]
                        }
                    },
                    totalProfit: { 
                        $sum: { 
                            $multiply: [
                                { 
                                    $subtract: [
                                        '$items.price',
                                        { $ifNull: ['$productDetails.cost', 0] }
                                    ]
                                },
                                '$items.quantity'
                            ]
                        }
                    },
                    totalItemsSold: { $sum: '$items.quantity' }
                }}
            ])
        ]);

        // Get recent orders with populated data and calculate total amount
        const recentOrders = await Order.find({ status: 'completed' })
            .sort({ completedAt: -1 })
            .limit(5)
            .populate('user', 'name email')
            .populate('items.product')
            .lean();

        // Calculate total amount for each order
        const ordersWithTotal = recentOrders.map(order => {
            const totalAmount = order.items.reduce((sum, item) => {
                return sum + (item.price * item.quantity);
            }, 0);
            return {
                ...order,
                totalAmount
            };
        });

        // Get daily sales for the last 7 days
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);
        
        const dailySales = await Order.aggregate([
            { 
                $match: { 
                    status: 'completed',
                    completedAt: { $gte: last7Days }
                }
            },
            { $unwind: '$items' },
            { $lookup: {
                from: 'products',
                localField: 'items.product',
                foreignField: '_id',
                as: 'productDetails'
            }},
            { $unwind: '$productDetails' },
            { $group: {
                _id: {
                    year: { $year: '$completedAt' },
                    month: { $month: '$completedAt' },
                    day: { $dayOfMonth: '$completedAt' }
                },
                sales: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                profit: { 
                    $sum: { 
                        $multiply: [
                            { 
                                $subtract: [
                                    '$items.price',
                                    { $ifNull: ['$productDetails.cost', 0] }
                                ]
                            },
                            '$items.quantity'
                        ]
                    }
                }
            }},
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        // Get top selling products
        const topProducts = await Order.aggregate([
            { $match: { status: 'completed' } },
            { $unwind: '$items' },
            { $lookup: {
                from: 'products',
                localField: 'items.product',
                foreignField: '_id',
                as: 'productDetails'
            }},
            { $unwind: '$productDetails' },
            { $group: {
                _id: '$items.product',
                name: { $first: '$productDetails.name' },
                totalSold: { $sum: '$items.quantity' },
                totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                totalProfit: { 
                    $sum: { 
                        $multiply: [
                            { 
                                $subtract: [
                                    '$items.price',
                                    { $ifNull: ['$productDetails.cost', 0] }
                                ]
                            },
                            '$items.quantity'
                        ]
                    }
                }
            }},
            { $sort: { totalProfit: -1 } },
            { $limit: 5 }
        ]);

        // Calculate default values for when there's no data
        const defaultSalesData = {
            totalSales: 0,
            totalCost: 0,
            totalProfit: 0,
            totalItemsSold: 0
        };

        const salesDataResult = salesData[0] || defaultSalesData;
        const profitMargin = salesDataResult.totalSales > 0 
            ? (salesDataResult.totalProfit / salesDataResult.totalSales) * 100 
            : 0;

        res.render('admin-dashboard', {
            title: 'Admin Dashboard',
            user: req.user,
            totalUsers: totalUsers || 0,
            totalOrders: totalOrders || 0,
            totalSales: salesDataResult.totalSales || 0,
            totalCost: salesDataResult.totalCost || 0,
            totalProfit: salesDataResult.totalProfit || 0,
            totalItemsSold: salesDataResult.totalItemsSold || 0,
            profitMargin: profitMargin.toFixed(1),
            recentOrders: ordersWithTotal || [],
            dailySales: dailySales || [],
            topProducts: topProducts || []
        });
    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).render('error', { 
            message: 'Error loading dashboard data',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

// Get all users with their order statistics
export const getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        const userStats = await Promise.all(users.map(async (user) => {
            const [orderCount, userSales] = await Promise.all([
                Order.countDocuments({ user: user._id, status: 'completed' }),
                Order.aggregate([
                    { $match: { user: user._id, status: 'completed' } },
                    { $unwind: '$items' },
                    { $lookup: {
                        from: 'products',
                        localField: 'items.product',
                        foreignField: '_id',
                        as: 'productDetails'
                    }},
                    { $unwind: '$productDetails' },
                    { $group: {
                        _id: null,
                        totalSpent: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                        totalProfit: { 
                            $sum: { 
                                $multiply: [
                                    { $subtract: ['$items.price', '$productDetails.cost'] },
                                    '$items.quantity'
                                ]
                            }
                        },
                        lastOrderDate: { $max: '$completedAt' }
                    }}
                ])
            ]);

            return {
                ...user.toObject(),
                orderCount,
                totalSpent: userSales[0]?.totalSpent || 0,
                totalProfit: userSales[0]?.totalProfit || 0,
                lastOrderDate: userSales[0]?.lastOrderDate || null
            };
        }));

        res.json(userStats);
    } catch (error) {
        console.error('Users Error:', error);
        res.status(500).json({ error: 'Error loading users data' });
    }
};

// Get sales statistics with detailed tracking
export const getSales = async (req, res) => {
    try {
        const period = parseInt(req.query.period) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - period);

        const [salesData, productSales] = await Promise.all([
            // Daily sales data
            Order.aggregate([
                { 
                    $match: { 
                        status: 'completed',
                        completedAt: { $gte: startDate }
                    }
                },
                { $unwind: '$items' },
                { $lookup: {
                    from: 'products',
                    localField: 'items.product',
                    foreignField: '_id',
                    as: 'productDetails'
                }},
                { $unwind: '$productDetails' },
                { $group: {
                    _id: {
                        year: { $year: '$completedAt' },
                        month: { $month: '$completedAt' },
                        day: { $dayOfMonth: '$completedAt' }
                    },
                    totalSales: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                    totalCost: { $sum: { $multiply: ['$productDetails.cost', '$items.quantity'] } },
                    totalProfit: { 
                        $sum: { 
                            $multiply: [
                                { $subtract: ['$items.price', '$productDetails.cost'] },
                                '$items.quantity'
                            ]
                        }
                    },
                    itemsSold: { $sum: '$items.quantity' }
                }},
                { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } }
            ]),

            // Product sales data
            Order.aggregate([
                { 
                    $match: { 
                        status: 'completed',
                        completedAt: { $gte: startDate }
                    }
                },
                { $unwind: '$items' },
                { $lookup: {
                    from: 'products',
                    localField: 'items.product',
                    foreignField: '_id',
                    as: 'productDetails'
                }},
                { $unwind: '$productDetails' },
                { $group: {
                    _id: '$items.product',
                    totalSold: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                    totalCost: { $sum: { $multiply: ['$productDetails.cost', '$items.quantity'] } },
                    totalProfit: { 
                        $sum: { 
                            $multiply: [
                                { $subtract: ['$items.price', '$productDetails.cost'] },
                                '$items.quantity'
                            ]
                        }
                    },
                    productDetails: { $first: '$productDetails' }
                }},
                { $sort: { totalProfit: -1 } }
            ])
        ]);

        res.json({
            salesData,
            productSales
        });
    } catch (error) {
        console.error('Sales Error:', error);
        res.status(500).json({ error: 'Error loading sales data' });
    }
};

// Get detailed user information
export const getUserDetails = async (req, res) => {
    try {
        const [user, orders, userStats] = await Promise.all([
            User.findById(req.params.id).select('-password'),
            Order.find({ user: req.params.id, status: 'completed' })
                .sort({ completedAt: -1 })
                .populate('items.product'),
            Order.aggregate([
                { $match: { user: req.params.id, status: 'completed' } },
                { $unwind: '$items' },
                { $lookup: {
                    from: 'products',
                    localField: 'items.product',
                    foreignField: '_id',
                    as: 'productDetails'
                }},
                { $unwind: '$productDetails' },
                { $group: {
                    _id: null,
                    totalSpent: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                    totalProfit: { 
                        $sum: { 
                            $multiply: [
                                { $subtract: ['$items.price', '$productDetails.cost'] },
                                '$items.quantity'
                            ]
                        }
                    },
                    averageOrderValue: { $avg: '$totalAmount' },
                    lastOrderDate: { $max: '$completedAt' }
                }}
            ])
        ]);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ 
            user, 
            orders,
            stats: userStats[0] || { 
                totalSpent: 0, 
                totalProfit: 0,
                averageOrderValue: 0,
                lastOrderDate: null
            }
        });
    } catch (error) {
        console.error('User Details Error:', error);
        res.status(500).json({ error: 'Error loading user details' });
    }
};

// Delete user with safety checks
export const deleteUser = async (req, res) => {
    try {
        const [user, hasOrders] = await Promise.all([
            User.findById(req.params.id),
            Order.exists({ user: req.params.id })
        ]);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (hasOrders) {
            return res.status(400).json({ error: 'Cannot delete user with existing orders' });
        }

        await user.remove();
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete User Error:', error);
        res.status(500).json({ error: 'Error deleting user' });
    }
}; 