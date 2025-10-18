// backend/routes/userRoutes.js
const express = require("express");
const {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  toggleDuty,
  updateLocation,
  getAllUsers,
  getAllDrivers,
  getAllCustomers,
  getAllAdmins,
  getPendingDrivers,
  approveDriver,
  rejectDriver,
  toggleUserActive,
  assignVehicleToDriver,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Test route
router.get("/test", (req, res) => {
  res.json({ message: "User routes working ✅" });
});

// Auth routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

// Admin routes
router.get("/", protect, getAllUsers); // Get all users (Admin only)
router.get("/drivers", protect, getAllDrivers); // Get all drivers (Admin only)
router.get("/customers", protect, getAllCustomers); // Get all customers (Admin only)
router.get("/admins", protect, getAllAdmins); // Get all admins (Admin only)
router.get("/drivers/pending", protect, getPendingDrivers); // Get pending drivers (Admin only)
router.put("/drivers/:id/approve", protect, approveDriver); // Approve driver (Admin only)
router.put("/drivers/:id/reject", protect, rejectDriver); // Reject driver (Admin only)
router.put("/drivers/:id/assign-vehicle", protect, assignVehicleToDriver); // Assign vehicle to driver (Admin only)
router.put("/:id/toggle-active", protect, toggleUserActive); // Deactivate/Activate user (Admin only)

// Driver routes
router.put("/duty", protect, toggleDuty);
router.put("/location", protect, updateLocation);

module.exports = router;
