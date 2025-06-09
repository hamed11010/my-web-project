const mongoose = require('mongoose');
const Order = require('../models/Order');
require('dotenv').config();

async function cleanupOrders() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('Connected to MongoDB');

        // Find and delete all pending orders
        const result = await Order.deleteMany({ status: 'pending' });
        
        console.log(`Successfully deleted ${result.deletedCount} pending orders`);

        // Close the connection
        await mongoose.connection.close();
        console.log('Database connection closed');

    } catch (error) {
        console.error('Error cleaning up orders:', error);
        process.exit(1);
    }
}

// Run the cleanup
cleanupOrders(); 