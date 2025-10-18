const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const roleCheck = require("../middleware/roleMiddleware");
const {
  createOrder,
  getAvailableOrders,
  getOrders,
  assignOrder,
  acceptOrder,
  rejectAcceptedOrder,
  retryDriverSearch,
  updateStatus,
  payOrder,
  confirmCashPayment,
  trackOrder,
  cancelOrder,
  rateDriver
} = require("../controllers/orderController");

const router = express.Router();

// Customer creates order
router.post("/", protect, roleCheck("Customer"), createOrder);

// Driver available orders filtered by vehicle type
router.get("/available", protect, roleCheck("Driver"), getAvailableOrders);

// Admin/Driver/Customer can view (filtered automatically)
router.get("/", protect, getOrders);

// Track order
router.get("/:id/track", protect, trackOrder);

// Admin assigns driver + vehicle
router.put("/:id/assign", protect, roleCheck("Admin"), assignOrder);

// Driver accepts order
router.put("/:id/accept", protect, roleCheck("Driver"), acceptOrder);

// Driver rejects accepted order
router.put("/:id/reject-accepted", protect, roleCheck("Driver"), rejectAcceptedOrder);

// Customer retries driver search for pending order
router.put("/:id/retry-search", protect, roleCheck("Customer"), retryDriverSearch);

// Driver updates order status
router.put("/:id/status", protect, roleCheck("Driver"), updateStatus);

// Customer cancels order
router.put("/:id/cancel", protect, roleCheck("Customer"), cancelOrder);

// Customer/Admin confirms payment
router.put("/:id/pay", protect, payOrder);

router.put("/:id/confirm-cash", protect, roleCheck("Driver"), confirmCashPayment);

// Customer rates driver after delivery
router.put("/:id/rate-driver", protect, roleCheck("Customer"), rateDriver);

module.exports = router;
