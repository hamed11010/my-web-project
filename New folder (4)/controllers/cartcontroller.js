import Cart from '../models/Cart.js';
import Product from '../models/Product.js'; // Make sure this path is correct


// @desc    Get user's cart
export const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = await Cart.create({
        userId: req.user._id,
        items: [],
        subtotal: 0,
        discount: 0,
        total: 0,
        appliedPromoCode: null
      });
    }
    res.json(cart);
  } catch (error) {
    console.error('Error getting cart:', error);
    res.status(500).json({ message: 'Error getting cart' });
  }
};

// @desc    Add item to cart
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity, name, price } = req.body;
    const userId = req.user._id;

    if (!productId || !quantity || !name || !price) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check product stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!product.isAvailable) {
      return res.status(400).json({ message: 'Product is not available' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ 
        message: `Only ${product.stock} items available in stock`,
        availableStock: product.stock
      });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({
        userId,
        items: [],
        subtotal: 0,
        discount: 0,
        total: 0
      });
    }

    const existingItemIndex = cart.items.findIndex(item => item.productId === productId);
    if (existingItemIndex > -1) {
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      if (product.stock < newQuantity) {
        return res.status(400).json({ 
          message: `Only ${product.stock} items available in stock`,
          availableStock: product.stock
        });
      }
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      cart.items.push({
        productId,
        name,
        price,
        quantity
      });
    }

    // Update cart totals
    cart.subtotal = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    cart.total = cart.subtotal - (cart.discount || 0);

    await cart.save();
    res.json(cart);
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({ message: 'Error adding item to cart' });
  }
};


// @desc    Update item quantity
export const updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    if (!itemId || !quantity) {
      return res.status(400).json({ message: 'Item ID and quantity are required' });
    }

    // Check product stock
    const product = await Product.findById(itemId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!product.isAvailable) {
      return res.status(400).json({ message: 'Product is not available' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ 
        message: `Only ${product.stock} items available in stock`,
        availableStock: product.stock
      });
    }

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const itemIndex = cart.items.findIndex(item => item.productId === itemId);
    if (itemIndex === -1) return res.status(404).json({ message: 'Item not found in cart' });

    cart.items[itemIndex].quantity = quantity;

    // Update cart totals
    cart.subtotal = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    cart.total = cart.subtotal - (cart.discount || 0);

    await cart.save();
    res.json(cart);
  } catch (error) {
    console.error('Error updating item quantity:', error);
    res.status(500).json({ message: 'Error updating item quantity' });
  }
};

// @desc    Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    if (!itemId) return res.status(400).json({ message: 'Item ID is required' });

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter(item => item.productId !== itemId);
    await cart.save();

    res.json(cart);
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(500).json({ message: 'Error removing item from cart' });
  }
};

// @desc    Clear cart
export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (cart) {
      cart.items = [];
      cart.subtotal = 0;
      cart.discount = 0;
      cart.total = 0;
      cart.appliedPromoCode = null;
      await cart.save();
    }
    res.json(cart || { items: [], subtotal: 0, discount: 0, total: 0, appliedPromoCode: null });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ message: 'Error clearing cart' });
  }
};

// @desc    Apply promo code
export const applyPromoCode = async (req, res) => {
  try {
    const { promoCode } = req.body;
    if (!promoCode) return res.status(400).json({ message: 'Promo code is required' });

    const validPromoCodes = {
      'SAVE10': 0.10,
      'SAVE20': 0.20,
      'COFFEE': 0.15
    };

    const discount = validPromoCodes[promoCode];
    if (!discount) return res.status(400).json({ message: 'Invalid promo code' });

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    // Check if promo code has already been used
    const hasUsedPromo = cart.usedPromoCodes.some(used => used.code === promoCode);
    if (hasUsedPromo) {
      return res.status(400).json({ 
        message: 'This promo code has already been used',
        usedAt: cart.usedPromoCodes.find(used => used.code === promoCode).usedAt
      });
    }

    // Check if another promo code is already applied
    if (cart.appliedPromoCode) {
      return res.status(400).json({ 
        message: 'Another promo code is already applied',
        currentCode: cart.appliedPromoCode
      });
    }

    // Apply the promo code
    cart.discount = cart.subtotal * discount;
    cart.appliedPromoCode = promoCode;
    cart.total = cart.subtotal - cart.discount;

    // Add to used promo codes
    cart.usedPromoCodes.push({
      code: promoCode,
      usedAt: new Date()
    });

    await cart.save();
    res.json(cart);
  } catch (error) {
    console.error('Error applying promo code:', error);
    res.status(500).json({ message: 'Error applying promo code' });
  }
};
