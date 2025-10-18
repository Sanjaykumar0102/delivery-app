const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const roleCheck = require("../middleware/roleMiddleware");
const { getConnectedDriversSummary } = require("../controllers/driverMetricsController");

const router = express.Router();

// GET /api/metrics/connected-drivers
router.get(
  "/connected-drivers",
  protect,
  roleCheck("Admin"),
  getConnectedDriversSummary
);

module.exports = router;