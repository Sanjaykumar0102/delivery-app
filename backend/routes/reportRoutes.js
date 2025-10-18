const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const roleCheck = require("../middleware/roleMiddleware");
const {
  driverPerformance,
  vehicleUtilization,
  customerHistory,
  summaryReport,
} = require("../controllers/reportController");

const router = express.Router();

// ✅ Admin-only reporting routes
router.get("/driver-performance", protect, roleCheck("Admin"), driverPerformance);
router.get("/vehicle-utilization", protect, roleCheck("Admin"), vehicleUtilization);
router.get("/customer/:id/history", protect, roleCheck("Admin"), customerHistory);
router.get("/summary", protect, roleCheck("Admin"), summaryReport);

// 🔍 test route
router.get("/test", (req, res) => res.json({ msg: "reportRoutes working" }));

// console.log("✅ reportRoutes file loaded, exporting router");
module.exports = router;
