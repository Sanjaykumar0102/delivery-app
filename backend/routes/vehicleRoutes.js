const express = require("express");
const vehicleController = require("../controllers/vehicleController");
const { protect } = require("../middleware/authMiddleware");
const roleCheck = require("../middleware/roleMiddleware");

// console.log("👉 vehicleController:", vehicleController);

const router = express.Router();

// Use directly
router.post("/", protect, roleCheck("Admin", "Driver"), vehicleController.addVehicle);
router.get("/", protect, roleCheck("Admin", "Driver"), vehicleController.getVehicles);

module.exports = router;
