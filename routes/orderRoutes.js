// routes/orderRoutes.js

import express from "express";
import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  cancelOrder,
  getMyOrders,
  rateOrder,
  deleteOrder,
  editOrderItem,
  completeOrder,
  getUserOrders
} from "../controllers/orderController.js";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protected routes
router.use(protect);

// Create a new order
router.post("/", createOrder);

// Get all orders (admin only)
router.get("/", isAdmin, getAllOrders);

// Get my orders
router.get("/my-orders", getMyOrders);

// Get a specific order by ID
router.get("/:id", getOrderById);

// Update an existing order
router.put("/:id", updateOrder);

// Cancel an order
router.post("/:id/cancel", cancelOrder);

// Delete an order (admin only)
router.delete("/:id", isAdmin, deleteOrder);

// Rate an order
router.post("/:id/rate", rateOrder);

// Edit an item in an order
router.put("/:id/items", editOrderItem);

// Complete an order (admin only)
router.post("/:id/complete", completeOrder);

// Get user's orders
router.get("/user-orders", getUserOrders);

export default router;
