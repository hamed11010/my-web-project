// controllers/orderController.js

import { Order } from "../models/orderModel.js";
import Product from "../models/Product.js";
import Cart from "../models/Cart.js";

// Create a new order
export const createOrder = async (req, res) => {
    try {
        console.log('Creating order with body:', JSON.stringify(req.body, null, 2));
        console.log('User:', req.user);

        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Validate delivery info with detailed logging
        console.log('Validating delivery info:', {
            hasDeliveryInfo: !!req.body.deliveryInfo,
            deliveryInfo: req.body.deliveryInfo,
            fullName: req.body.deliveryInfo?.fullName,
            email: req.body.deliveryInfo?.email,
            phone: req.body.deliveryInfo?.phone,
            address: req.body.deliveryInfo?.address
        });

        if (!req.body.deliveryInfo || 
            !req.body.deliveryInfo.fullName || 
            !req.body.deliveryInfo.email || 
            !req.body.deliveryInfo.phone || 
            !req.body.deliveryInfo.address) {
            return res.status(400).json({ 
                message: 'All delivery information fields are required',
                receivedData: {
                    deliveryInfo: req.body.deliveryInfo,
                    hasDeliveryInfo: !!req.body.deliveryInfo,
                    fullName: req.body.deliveryInfo?.fullName,
                    email: req.body.deliveryInfo?.email,
                    phone: req.body.deliveryInfo?.phone,
                    address: req.body.deliveryInfo?.address
                }
            });
        }

        // Validate payment method
        if (!req.body.paymentMethod || !['cash', 'card'].includes(req.body.paymentMethod)) {
            return res.status(400).json({ 
                message: 'Invalid payment method' 
            });
        }

        // Validate card details if card payment is selected
        if (req.body.paymentMethod === 'card') {
            if (!req.body.cardDetails || 
                !req.body.cardDetails.cardName || 
                !req.body.cardDetails.cardNumber || 
                !req.body.cardDetails.expiry || 
                !req.body.cardDetails.cvv) {
                return res.status(400).json({ 
                    message: 'All card details are required for card payment' 
                });
            }
        }

        const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
        console.log('Found cart:', cart);

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        if (!cart.items || cart.items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        // Calculate estimated wait time (15 minutes per item)
        const estimatedWaitTime = cart.items.reduce((total, item) => total + (item.quantity * 15), 0);

        const orderData = {
            user: req.user._id,
            items: cart.items.map(item => ({
                product: item.product._id,
                name: item.product.name,
                quantity: item.quantity,
                price: item.product.price
            })),
            deliveryInfo: {
                fullName: req.body.deliveryInfo.fullName,
                email: req.body.deliveryInfo.email,
                phone: req.body.deliveryInfo.phone,
                address: req.body.deliveryInfo.address
            },
            paymentMethod: req.body.paymentMethod,
            cardDetails: req.body.paymentMethod === 'card' ? req.body.cardDetails : undefined,
            subtotal: cart.subtotal,
            discount: cart.discount || 0,
            total: cart.total,
            estimatedWaitTime
        };

        console.log('Creating order with data:', orderData);

        const order = await Order.create(orderData);
        console.log('Order created:', order);

        // Clear the cart after successful order creation
        await Cart.findOneAndDelete({ user: req.user._id });

        res.status(201).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating order',
            error: error.message
        });
    }
};

// Cancel Order
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.user._id
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'Order is already cancelled' });
    }

    if (order.status === 'delivered') {
      return res.status(400).json({ message: 'Cannot cancel delivered order' });
    }

    // Check if order can be cancelled
    if (!order.canBeCancelled()) {
      if (order.paymentMethod === 'cash') {
        return res.status(400).json({ 
          message: 'Order cannot be cancelled after 1 minute. This may result in account suspension.' 
        });
      } else {
        // Calculate cancellation fee for card payments
        order.cancellationFee = order.calculateCancellationFee();
      }
    }

    order.status = 'cancelled';
    order.cancellationTime = new Date();
    await order.save();

    res.json({
      message: 'Order cancelled successfully',
      cancellationFee: order.cancellationFee
    });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling order', error: error.message });
  }
};

// Get All Orders (Admin)
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('items.product')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// Get Orders for Current User
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.product')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Error fetching my orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// Get Order by ID
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
};

// Update Order
export const updateOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('items.product');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order',
      error: error.message
    });
  }
};

// Rate an Order
export const rateOrder = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.rating = rating;
    order.comment = comment;
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order rated successfully',
      order
    });
  } catch (error) {
    console.error('Error rating order:', error);
    res.status(500).json({
      success: false,
      message: 'Error rating order',
      error: error.message
    });
  }
};

// Edit item in order
export const editOrderItem = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const item = order.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in order'
      });
    }

    item.quantity = quantity;
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order item updated successfully',
      order
    });
  } catch (error) {
    console.error('Error updating order item:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order item',
      error: error.message
    });
  }
};

// Delete Order
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting order',
      error: error.message
    });
  }
};

// Complete Order
export const completeOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = 'completed';
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order completed successfully',
      order
    });
  } catch (error) {
    console.error('Error completing order:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing order',
      error: error.message
    });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const orders = await Order.find({ user: req.user._id })
      .populate('items.product')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};
