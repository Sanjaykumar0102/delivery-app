// backend/controllers/userController.js
const asyncHandler = require("express-async-handler");
const User = require("../models/user");
const generateToken = require("../utils/jwt");

// @desc    Register user
// @route   POST /api/users/register
// @access  Public
// @desc    Register user
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, adminCode, phone, driverDetails } = req.body;

  // check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }
  const existingName = await User.findOne({ name });
    if (existingName) {
      return res.status(400).json({ message: "Username already taken" });
  }
  // role logic
  let finalRole = "Customer"; // default
  if (role === "Admin") {
    if (adminCode === process.env.ADMIN_SECRET) {
      finalRole = "Admin";
    } else {
      res.status(403);
      throw new Error("Invalid Admin code");
    }
  } else if (role === "Driver") {
    finalRole = "Driver";
  }
  console.log(role)
  console.log(finalRole)
  
  // Prepare user data
  const userData = {
    name,
    email,
    password,
    role: finalRole,   // ✅ make sure role is saved
  };

  if (phone) {
    userData.phone = phone;
  }
  
  // If driver registration, set approval status to Pending
  if (finalRole === "Driver") {
    if (!driverDetails || !driverDetails.vehicleType) {
      res.status(400);
      throw new Error("Driver vehicle type is required");
    }

    userData.isApproved = false;
    userData.approvalStatus = "Pending";
    userData.driverDetails = {
      ...driverDetails,
      vehicleType: driverDetails.vehicleType,
    };
  }
  
  const user = await User.create(userData);
  console.log(user)
  if (user) {
    // If driver registration, emit socket event to admin
    if (finalRole === "Driver") {
      const io = req.app.get("io");
      if (io) {
        io.emit("newDriverRegistration", {
          driverId: user._id,
          name: user.name,
          email: user.email,
          approvalStatus: user.approvalStatus,
        });
      }
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,   // ✅ confirm
      isApproved: user.isApproved,
      approvalStatus: user.approvalStatus,
      driverDetails: user.driverDetails,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});


// @desc    Login user
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).populate('vehicleAssigned');

  if (user && (await user.matchPassword(password))) {
    const response = {
      _id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      deactivationReason: user.deactivationReason,
      token: generateToken(user._id),
    };

    // Add driver-specific fields if user is a driver
    if (user.role === 'Driver') {
      response.isOnDuty = user.isOnDuty;
      response.earnings = user.earnings;
      response.stats = user.stats;
      response.vehicleAssigned = user.vehicleAssigned;
      response.isApproved = user.isApproved;
      response.approvalStatus = user.approvalStatus;
      response.rejectionReason = user.rejectionReason;
      response.driverDetails = user.driverDetails;
    }

    res.json(response);
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  // Fetch fresh user data from database to ensure latest earnings and stats
  const user = await User.findById(req.user._id).select('-password').populate('vehicleAssigned');
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  // If user is a driver, calculate earnings dynamically from orders
  if (user.role === 'Driver') {
    const Order = require('../models/order');
    
    // Get current date boundaries
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    
    // Fetch all delivered orders for this driver
    const deliveredOrders = await Order.find({
      driver: user._id,
      status: 'Delivered',
      driverEarnings: { $exists: true, $ne: null }
    });
    
    // Calculate earnings
    let todayEarnings = 0;
    let weekEarnings = 0;
    let monthEarnings = 0;
    let totalEarnings = 0;
    
    deliveredOrders.forEach(order => {
      const orderDate = new Date(order.deliveredAt || order.updatedAt);
      const earning = order.driverEarnings || 0;
      
      totalEarnings += earning;
      
      if (orderDate >= startOfToday) {
        todayEarnings += earning;
      }
      
      if (orderDate >= startOfWeek) {
        weekEarnings += earning;
      }
      
      if (orderDate >= startOfMonth) {
        monthEarnings += earning;
      }
    });
    
    // Update user earnings
    user.earnings = {
      today: todayEarnings,
      thisWeek: weekEarnings,
      thisMonth: monthEarnings,
      total: totalEarnings
    };
    
    // Save updated earnings to database
    await user.save();
  }
  
  res.json(user);
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Update basic fields
  user.name = req.body.name || user.name;
  user.phone = req.body.phone || user.phone;

  // Update driver-specific fields
  if (user.role === 'Driver' && req.body.driverDetails) {
    user.driverDetails = {
      ...user.driverDetails,
      ...req.body.driverDetails
    };
  }

  const updatedUser = await user.save();

  res.json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    phone: updatedUser.phone,
    role: updatedUser.role,
    driverDetails: updatedUser.driverDetails,
    isApproved: updatedUser.isApproved,
    isActive: updatedUser.isActive,
    isOnDuty: updatedUser.isOnDuty,
    stats: updatedUser.stats,
    earnings: updatedUser.earnings,
  });
});

// @desc    Toggle driver duty status
// @route   PUT /api/users/duty
// @access  Private (Driver only)
const toggleDuty = asyncHandler(async (req, res) => {
  const { isOnDuty } = req.body;

  if (req.user.role !== 'Driver') {
    res.status(403);
    throw new Error('Only drivers can toggle duty status');
  }

  const user = await User.findById(req.user._id);

  if (user) {
    // Check if driver is approved
    if (!user.isApproved || user.approvalStatus !== 'Approved') {
      res.status(403);
      throw new Error('Your account is pending approval. Please wait for admin approval before going on duty.');
    }

    user.isOnDuty = isOnDuty;
    
    // Update location timestamp when going on duty
    if (isOnDuty && user.currentLocation) {
      user.currentLocation.lastUpdated = new Date();
    }

    await user.save();

    res.json({
      isOnDuty: user.isOnDuty,
      message: isOnDuty ? 'You are now on duty' : 'You are now off duty',
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update driver location
// @route   PUT /api/users/location
// @access  Private (Driver only)
const updateLocation = asyncHandler(async (req, res) => {
  const { lat, lng } = req.body;

  if (req.user.role !== 'Driver') {
    res.status(403);
    throw new Error('Only drivers can update location');
  }

  const user = await User.findById(req.user._id);

  if (user) {
    user.currentLocation = {
      lat,
      lng,
      lastUpdated: new Date(),
    };

    await user.save();

    // Broadcast location to customers tracking active orders
    try {
      const Order = require('../models/order');
      const activeOrders = await Order.find({
        driver: user._id,
        status: { $in: ['Accepted', 'Picked Up'] }
      }).populate('customer');

      const io = req.app.get('io');
      const connectedUsers = req.app.get('connectedUsers');

      if (io && connectedUsers && activeOrders.length > 0) {
        activeOrders.forEach(order => {
          if (order.customer) {
            const customerSocketId = connectedUsers.get(order.customer._id.toString());
            if (customerSocketId) {
              io.to(customerSocketId).emit('driverLocationUpdate', {
                orderId: order._id,
                location: {
                  lat,
                  lng
                },
                status: order.status
              });
            }
          }
        });
      }
    } catch (error) {
      console.error('❌ Error broadcasting driver location:', error.message);
    }

    res.json({
      message: 'Location updated successfully',
      location: user.currentLocation,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin only)
const getAllUsers = asyncHandler(async (req, res) => {
  if (req.user.role !== 'Admin') {
    res.status(403);
    throw new Error('Not authorized - Admin only');
  }

  const users = await User.find({}).select('-password').populate('vehicleAssigned');
  res.json(users);
});

// @desc    Get all drivers
// @route   GET /api/users/drivers
// @access  Private (Admin only)
const getAllDrivers = asyncHandler(async (req, res) => {
  if (req.user.role !== 'Admin') {
    res.status(403);
    throw new Error('Not authorized - Admin only');
  }

  const drivers = await User.find({ role: 'Driver' }).select('-password').populate('vehicleAssigned');
  res.json(drivers);
});

// @desc    Get pending driver approvals
// @route   GET /api/users/drivers/pending
// @access  Private (Admin only)
const getPendingDrivers = asyncHandler(async (req, res) => {
  if (req.user.role !== 'Admin') {
    res.status(403);
    throw new Error('Not authorized - Admin only');
  }

  const pendingDrivers = await User.find({ 
    role: 'Driver', 
    approvalStatus: 'Pending' 
  }).select('-password').sort({ createdAt: -1 });
  
  res.json(pendingDrivers);
});

// @desc    Approve driver
// @route   PUT /api/users/drivers/:id/approve
// @access  Private (Admin only)
const approveDriver = asyncHandler(async (req, res) => {
  if (req.user.role !== 'Admin') {
    res.status(403);
    throw new Error('Not authorized - Admin only');
  }

  const driver = await User.findById(req.params.id);

  if (!driver) {
    res.status(404);
    throw new Error('Driver not found');
  }

  if (driver.role !== 'Driver') {
    res.status(400);
    throw new Error('User is not a driver');
  }

  driver.isApproved = true;
  driver.approvalStatus = 'Approved';
  driver.rejectionReason = undefined;

  await driver.save();

  // Emit socket event to notify driver
  const io = req.app.get("io");
  const connectedUsers = req.app.get("connectedUsers");
  if (io && connectedUsers) {
    const driverSocketId = connectedUsers.get(driver._id.toString());
    if (driverSocketId) {
      io.to(driverSocketId).emit("approvalStatusUpdate", {
        isApproved: true,
        approvalStatus: 'Approved',
        message: 'Congratulations! Your driver application has been approved.'
      });
    }
  }

  res.json({
    message: 'Driver approved successfully',
    driver: {
      _id: driver._id,
      name: driver.name,
      email: driver.email,
      isApproved: driver.isApproved,
      approvalStatus: driver.approvalStatus
    }
  });
});

// @desc    Reject driver
// @route   PUT /api/users/drivers/:id/reject
// @access  Private (Admin only)
const rejectDriver = asyncHandler(async (req, res) => {
  if (req.user.role !== 'Admin') {
    res.status(403);
    throw new Error('Not authorized - Admin only');
  }

  const { reason } = req.body;

  if (!reason) {
    res.status(400);
    throw new Error('Rejection reason is required');
  }

  const driver = await User.findById(req.params.id);

  if (!driver) {
    res.status(404);
    throw new Error('Driver not found');
  }

  if (driver.role !== 'Driver') {
    res.status(400);
    throw new Error('User is not a driver');
  }

  driver.isApproved = false;
  driver.approvalStatus = 'Rejected';
  driver.rejectionReason = reason;

  await driver.save();

  // Emit socket event to notify driver
  const io = req.app.get("io");
  const connectedUsers = req.app.get("connectedUsers");
  if (io && connectedUsers) {
    const driverSocketId = connectedUsers.get(driver._id.toString());
    if (driverSocketId) {
      io.to(driverSocketId).emit("approvalStatusUpdate", {
        isApproved: false,
        approvalStatus: 'Rejected',
        rejectionReason: reason,
        message: `Your driver application has been rejected. Reason: ${reason}`
      });
    }
  }

  res.json({
    message: 'Driver rejected',
    driver: {
      _id: driver._id,
      name: driver.name,
      email: driver.email,
      isApproved: driver.isApproved,
      approvalStatus: driver.approvalStatus,
      rejectionReason: driver.rejectionReason
    }
  });
});

// @desc    Deactivate/Activate user (Admin only)
// @route   PUT /api/users/:id/toggle-active
// @access  Private (Admin only)
const toggleUserActive = asyncHandler(async (req, res) => {
  if (req.user.role !== 'Admin') {
    res.status(403);
    throw new Error('Not authorized - Admin only');
  }

  const { reason } = req.body;
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Toggle active status
  user.isActive = !user.isActive;
  
  if (!user.isActive) {
    user.deactivatedAt = new Date();
    user.deactivationReason = reason || 'Deactivated by admin';
    
    // If driver is deactivated, set them off duty
    if (user.role === 'Driver') {
      user.isOnDuty = false;
    }
  } else {
    user.deactivatedAt = undefined;
    user.deactivationReason = undefined;
  }

  await user.save();

  // Notify user via socket
  const io = req.app.get("io");
  const connectedUsers = req.app.get("connectedUsers");
  if (io && connectedUsers) {
    const userSocketId = connectedUsers.get(user._id.toString());
    if (userSocketId) {
      io.to(userSocketId).emit("accountStatusUpdate", {
        isActive: user.isActive,
        message: user.isActive 
          ? 'Your account has been reactivated.' 
          : `Your account has been deactivated. Reason: ${user.deactivationReason}`
      });
    }
  }

  res.json({
    message: user.isActive ? 'User activated successfully' : 'User deactivated successfully',
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      deactivationReason: user.deactivationReason
    }
  });
});

// @desc    Get all customers (Admin only)
// @route   GET /api/users/customers
// @access  Private (Admin only)
const getAllCustomers = asyncHandler(async (req, res) => {
  if (req.user.role !== 'Admin') {
    res.status(403);
    throw new Error('Not authorized - Admin only');
  }

  const customers = await User.find({ role: 'Customer' }).select('-password').sort({ createdAt: -1 });
  res.json(customers);
});

// @desc    Get all admins (Admin only)
// @route   GET /api/users/admins
// @access  Private (Admin only)
const getAllAdmins = asyncHandler(async (req, res) => {
  if (req.user.role !== 'Admin') {
    res.status(403);
    throw new Error('Not authorized - Admin only');
  }

  const admins = await User.find({ role: 'Admin' }).select('-password').sort({ createdAt: -1 });
  res.json(admins);
});

// @desc    Assign vehicle to driver
// @route   PUT /api/users/drivers/:id/assign-vehicle
// @access  Private (Admin only)
const assignVehicleToDriver = asyncHandler(async (req, res) => {
  if (req.user.role !== 'Admin') {
    res.status(403);
    throw new Error('Not authorized - Admin only');
  }

  const { vehicleId } = req.body;
  
  const driver = await User.findById(req.params.id);
  if (!driver) {
    res.status(404);
    throw new Error('Driver not found');
  }

  if (driver.role !== 'Driver') {
    res.status(400);
    throw new Error('User is not a driver');
  }

  const Vehicle = require('../models/vehicle');
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }

  driver.vehicleAssigned = vehicleId;
  await driver.save();

  const updatedDriver = await User.findById(req.params.id)
    .select('-password')
    .populate('vehicleAssigned');

  res.json({
    message: 'Vehicle assigned successfully',
    driver: updatedDriver
  });
});

module.exports = { 
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
  assignVehicleToDriver
};
