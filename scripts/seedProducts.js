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
  // Cold Coffee
  { 
    name: 'White Mocha', 
    category: 'Cold Coffee',
    description: 'Rich espresso with white chocolate and steamed milk, served over ice',
    image: '/images/project-images/white-mocha.jpeg'
  },
  { 
    name: 'Ice Spanish Latte', 
    category: 'Cold Coffee',
    description: 'Espresso with sweetened condensed milk and ice',
    image: '/images/project-images/spanish-latte.jpeg'
  },
  { 
    name: 'Flat White', 
    category: 'Cold Coffee',
    description: 'Double espresso with steamed milk and microfoam',
    image: '/images/project-images/flat-white.jpeg'
  },

  // Smoothies
  { 
    name: 'Mango Smoothie', 
    category: 'Smoothies',
    description: 'Fresh mango blended with yogurt and ice',
    image: '/images/project-images/mango-smoothie.jpeg'
  },
  { 
    name: 'Strawberry Smoothie', 
    category: 'Smoothies',
    description: 'Fresh strawberries blended with yogurt and ice',
    image: '/images/project-images/strawberry-smoothie.jpeg'
  },
  { 
    name: 'Blueberry Smoothie', 
    category: 'Smoothies',
    description: 'Fresh blueberries blended with yogurt and ice',
    image: '/images/project-images/blueberry-smoothie.jpeg'
  },

  // Hot Drinks
  { 
    name: 'Black Tea', 
    category: 'Hot Drinks',
    description: 'Classic black tea served with optional milk and sugar',
    image: '/images/project-images/black-tea.jpeg'
  },
  { 
    name: 'Green Tea', 
    category: 'Hot Drinks',
    description: 'Premium green tea with natural antioxidants',
    image: '/images/project-images/green-tea.jpeg'
  },
  { 
    name: 'Hot Chocolate', 
    category: 'Hot Drinks',
    description: 'Rich chocolate drink topped with whipped cream',
    image: '/images/project-images/hot-chocolate.jpeg'
  },

  // Cold Drinks
  { 
    name: 'Pepsi', 
    category: 'Cold Drinks',
    description: 'Refreshing carbonated soft drink',
    image: '/images/project-images/pepsi.jpeg'
  },
  { 
    name: 'Sprite', 
    category: 'Cold Drinks',
    description: 'Lemon-lime flavored carbonated drink',
    image: '/images/project-images/sprite.jpeg'
  },
  { 
    name: 'Fanta', 
    category: 'Cold Drinks',
    description: 'Orange flavored carbonated drink',
    image: '/images/project-images/fanta.jpeg'
  },

  // Breakfast
  { 
    name: 'Croissant', 
    category: 'Breakfast',
    description: 'Buttery, flaky pastry in a crescent shape',
    image: '/images/project-images/Fotos Croissant _ Freepik.jpeg'
  },
  { 
    name: 'Cinnamon', 
    category: 'Breakfast',
    description: 'Sweet cinnamon roll with cream cheese frosting',
    image: '/images/project-images/cinnamon-roll.jpeg'
  },
  { 
    name: 'Turkey and Cheese sandwich', 
    category: 'Breakfast',
    description: 'Fresh turkey and cheese on artisan bread',
    image: '/images/project-images/turkey-sandwich.jpeg'
  },
  { 
    name: 'Tuna Melt Toastie', 
    category: 'Breakfast',
    description: 'Tuna and cheese grilled sandwich',
    image: '/images/project-images/tuna-melt.jpeg'
  },

  // Dessert
  { 
    name: 'Molten Cake', 
    category: 'Dessert',
    description: 'Warm chocolate cake with a molten center',
    image: '/images/project-images/molten-cake.jpeg'
  },
  { 
    name: 'Pain Au Chocolat', 
    category: 'Dessert',
    description: 'Buttery pastry filled with chocolate',
    image: '/images/project-images/pain-au-chocolat.jpeg'
  },
  { 
    name: 'Brownies', 
    category: 'Dessert',
    description: 'Rich chocolate brownie with walnuts',
    image: '/images/project-images/brownies.jpeg'
  },
  { 
    name: 'Apple Pie', 
    category: 'Dessert',
    description: 'Classic apple pie with cinnamon and sugar',
    image: '/images/project-images/apple-pie.jpeg'
  }
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
        reorderLevel: 10,
        isAvailable: true
      }))
    );
    console.log('✅ Products seeded successfully:', seeded.length);
    process.exit();
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedProducts(); 