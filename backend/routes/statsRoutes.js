const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const roleCheck = require("../middleware/roleMiddleware");
const {
  getStatsOverview,
  getOrdersTimeline,
  getRevenueAnalytics
} = require("../controllers/statsController");

const router = express.Router();

// GET /api/stats/overview
router.get(
  "/overview",
  protect,
  roleCheck("Admin"),
  getStatsOverview
);

// GET /api/stats/orders-timeline
router.get(
  "/orders-timeline",
  protect,
  roleCheck("Admin"),
  getOrdersTimeline
);

// GET /api/stats/revenue
router.get(
  "/revenue",
  protect,
  roleCheck("Admin"),
  getRevenueAnalytics
);

module.exports = router;
