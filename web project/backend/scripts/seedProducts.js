import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Product from '../models/Product.js';
import connectDB from '../config/db.js';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the correct path
dotenv.config({ path: join(__dirname, '../.env') });

// Log the environment variable to debug
console.log('Environment variables loaded:', {
    MONGODB_URI: process.env.MONGODB_URI || process.env.MONGO_URI
});

connectDB();

const categories = [
  'Cold Coffee',
  'Hot Drinks',
  'Smoothies',
  'Cold Drinks',
  'Breakfast',
  'Dessert'
];

const products = [
  // Cold Coffeew
  { name: 'White Mocha', category: 'Cold Coffee' },
  { name: 'Ice Spanish Latte', category: 'Cold Coffee' },
  { name: 'Flat White', category: 'Cold Coffee' },

  // Smoothies
  { name: 'Mango Smoothie', category: 'Smoothies' },
  { name: 'Strawberry Smoothie', category: 'Smoothies' },
  { name: 'Blueberry Smoothie', category: 'Smoothies' },

  // Hot Drinks
  { name: 'Black Tea', category: 'Hot Drinks' },
  { name: 'Green Tea', category: 'Hot Drinks' },
  { name: 'Hot Chocolate', category: 'Hot Drinks' },

  // Cold Drinks
  { name: 'Pepsi', category: 'Cold Drinks' },
  { name: 'Sprite', category: 'Cold Drinks' },
  { name: 'Fanta', category: 'Cold Drinks' },

  // Breakfast
  { name: 'Croissant', category: 'Breakfast' },
  { name: 'Cinnamon', category: 'Breakfast' },
  { name: 'Turkey and Cheese sandwidch', category: 'Breakfast' },
  { name: 'Tuna Melt Toastie', category: 'Breakfast' },

  // Dessert
  { name: 'Molten Cake', category: 'Dessert' },
  { name: 'Pain Au Chocolat', category: 'Dessert' },
  { name: 'Brownies', category: 'Dessert' },
  { name: 'Apple Pie', category: 'Dessert' }
];

async function seedProducts() {
  try {
    await Product.deleteMany({});
    const seeded = await Product.insertMany(
      products.map(p => ({
        ...p,
        stock: 100,
        unit: 'pcs',
        price: 50,
        cost: 30,
        supplier: 'Default Supplier',
        reorderLevel: 10
      }))
    );
    console.log('Seeded products:', seeded);
    process.exit();
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedProducts(); 