const asyncHandler = require("express-async-handler");
const Vehicle = require("../models/vehicle");

// @desc    Add a new vehicle
// @route   POST /api/vehicles
// @access  Admin + Driver
const addVehicle = asyncHandler(async (req, res) => {
  const { plateNumber, type, capacity } = req.body;
  //  console.log("👉 req.user inside addVehicle:", req.user); // 👈
  const exists = await Vehicle.findOne({ plateNumber });
  if (exists) {
    res.status(400);
    throw new Error("Vehicle already exists with this plate number");
  }

  const vehicle = await Vehicle.create({
    plateNumber,
    type,
    capacity,
    owner: req.user._id,  // 👈 track who added it (Admin or Driver)
  });

  res.status(201).json(vehicle);
});

// @desc    Get vehicles
// @route   GET /api/vehicles
// @access  Admin → all, Driver → only theirs
const getVehicles = asyncHandler(async (req, res) => {
  let vehicles;

  if (req.user.role === "Admin") {
    // Admin sees all
    vehicles = await Vehicle.find().populate("owner", "name email role");
  } else if (req.user.role === "Driver") {
    // Driver sees only their vehicles
    vehicles = await Vehicle.find({ owner: req.user._id });
  } else {
    return res.status(403).json({ message: "Forbidden: insufficient role" });
  }

  res.json(vehicles);
});

module.exports = { addVehicle, getVehicles };
