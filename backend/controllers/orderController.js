const asyncHandler = require("express-async-handler");
const Order = require("../models/order");
const Vehicle = require("../models/vehicle");
const User = require("../models/user");
const calculateFare = require("../utils/calculateFare");
console.log("👉 calculateFare import:", calculateFare, "type:", typeof calculateFare);
// @desc    Customer creates order
// @route   POST /api/orders
// @access  Customer
// @desc    Customer creates order
// @route   POST /api/orders
// @access  Customer
const createOrder = asyncHandler(async (req, res) => {
  const { 
    pickup, 
    dropoff, 
    items, 
    vehicleType, 
    packageDetails, 
    scheduledPickup, 
    paymentMethod 
  } = req.body;

  // Validation
  if (!pickup) {
    res.status(400);
    throw new Error("Pickup object is required");
  }
  if (!pickup.address) {
    res.status(400);
    throw new Error("Pickup address is required");
  }

  if (!dropoff) {
    res.status(400);
    throw new Error("Dropoff object is required");
  }
  if (!dropoff.address) {
    res.status(400);
    throw new Error("Dropoff address is required");
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error("At least one item is required");
  }

  if (!vehicleType) {
    res.status(400);
    throw new Error("Vehicle type is required");
  }

  // Calculate distance & fare based on vehicle type
  const { distance, fare } = calculateFare(pickup, dropoff, vehicleType);

  const order = await Order.create({
    customer: req.user._id,
    pickup,
    dropoff,
    items,
    vehicleType,
    packageDetails: packageDetails || {},
    scheduledPickup: scheduledPickup || undefined,
    paymentMethod: paymentMethod || "Cash",
    status: "Pending",
    distance,
    fare,
  });

  // Update customer stats
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { 'stats.totalOrders': 1 }
  });

  // Populate customer details for notification
  await order.populate("customer", "name email phone");

  // Notify only ON DUTY drivers with MATCHING VEHICLE TYPE
  try {
    const io = req.app.get("io");
    const connectedDrivers = req.app.get("connectedDrivers");
    
    console.log("🔍 Checking notification system...");
    console.log("📡 IO available:", !!io);
    console.log("🗺️ connectedDrivers type:", typeof connectedDrivers);
    console.log("🗺️ connectedDrivers is Map:", connectedDrivers instanceof Map);
    console.log("🗺️ connectedDrivers value:", connectedDrivers);
    console.log("👥 Connected drivers map size:", connectedDrivers?.size || 0);
    console.log("🚗 Order vehicle type:", vehicleType);
    
    if (io && connectedDrivers) {
      // Get all APPROVED, ON DUTY drivers with MATCHING VEHICLE TYPE from connected drivers
      const matchingConnectedDrivers = Array.from(connectedDrivers.entries())
        .filter(([driverId, driverInfo]) => {
          return driverInfo.isOnDuty === true &&
                 driverInfo.isApproved === true &&
                 driverInfo.approvalStatus === "Approved" &&
                 driverInfo.vehicleType === vehicleType;
        })
        .map(([driverId, driverInfo]) => ({
          _id: driverId,
          ...driverInfo
        }));
      
      console.log(`📢 Found ${matchingConnectedDrivers.length} connected drivers with ${vehicleType} vehicle type`);
      
      if (matchingConnectedDrivers.length > 0) {
        console.log("👥 Matching connected drivers:", matchingConnectedDrivers.map(d => ({
          id: d._id.toString(),
          vehicleType: d.vehicleType,
          isOnDuty: d.isOnDuty,
          isApproved: d.isApproved
        })));
      }
      
      // Send notification to each connected matching driver
      let notifiedCount = 0;
      matchingConnectedDrivers.forEach((driver) => {
        const driverId = driver._id.toString();
        const socketId = driver.socketId;
        console.log(`🔍 Driver ${driverId}: socketId = ${socketId || 'NOT CONNECTED'}`);
        
        if (socketId) {
          io.to(socketId).emit("newOrderAvailable", {
            _id: order._id,
            customer: order.customer,
            pickup: order.pickup,
            dropoff: order.dropoff,
            items: order.items,
            vehicleType: order.vehicleType,
            distance: order.distance,
            fare: order.fare,
            paymentMethod: order.paymentMethod,
            createdAt: order.createdAt,
          });
          console.log(`✅ Notified driver ${driverId} (${driver.vehicleType}) via socket ${socketId}`);
          notifiedCount++;
        } else {
          console.log(`⚠️ Driver ${driverId} is on duty but not connected via socket`);
        }
      });

      console.log(`📨 Notified ${notifiedCount} out of ${matchingConnectedDrivers.length} connected matching drivers`);

      // Also check database for any drivers that might not be connected but are on duty
      const allMatchingDrivers = await User.find({ 
        role: "Driver", 
        isOnDuty: true,
        isApproved: true,
        approvalStatus: "Approved",
        "driverDetails.vehicleType": vehicleType
      });
      
      const connectedDriverIds = new Set(matchingConnectedDrivers.map(d => d._id.toString()));
      const disconnectedMatchingDrivers = allMatchingDrivers.filter(d => !connectedDriverIds.has(d._id.toString()));
      
      if (disconnectedMatchingDrivers.length > 0) {
        console.log(`⚠️ Found ${disconnectedMatchingDrivers.length} matching drivers who are on duty but not connected via socket`);
        console.log("🔌 Disconnected drivers:", disconnectedMatchingDrivers.map(d => ({
          id: d._id.toString(),
          name: d.name,
          vehicleType: d.driverDetails.vehicleType
        })));
      }

      // Notify admin dashboard
      io.emit("newOrderCreated", order);
    } else {
      console.log("❌ IO or connectedDrivers not available");
    }
  } catch (error) {
    console.error("❌ Error notifying drivers:", error.message);
    console.error("❌ Stack trace:", error.stack);
    // Don't fail the order creation if notification fails
  }

  res.status(201).json(order);
});


// @desc    Get available orders for drivers (vehicle-type aware)
// @route   GET /api/orders/available
// @access  Driver
const getAvailableOrders = asyncHandler(async (req, res) => {
  const driver = await User.findById(req.user._id);

  if (!driver) {
    res.status(404);
    throw new Error("Driver not found");
  }

  if (driver.role !== "Driver") {
    res.status(403);
    throw new Error("Only drivers can view available orders");
  }

  if (!driver.isApproved || driver.approvalStatus !== "Approved") {
    res.status(403);
    throw new Error("Your account must be approved before viewing orders");
  }

  if (!driver.isOnDuty) {
    res.status(403);
    throw new Error("You must be on duty to view available orders");
  }

  const vehicleTypeFromQuery = req.query.vehicleType;
  const vehicleType = vehicleTypeFromQuery || driver.driverDetails?.vehicleType;

  if (!vehicleType) {
    res.status(400);
    throw new Error("Driver vehicle type is missing");
  }

  const orders = await Order.find({
    status: "Pending",
    driver: { $exists: false },
    vehicleType,
  })
    .sort({ createdAt: -1 })
    .limit(25)
    .populate("customer", "name phone")
    .lean();

  res.json(orders);
});

// @desc    Get orders (based on role)
// @route   GET /api/orders
// @access  Customer/Admin/Driver
const getOrders = asyncHandler(async (req, res) => {
  let orders;

  if (req.user.role === "Admin") {
    orders = await Order.find({})
      .populate("customer", "name email")
      .populate("driver", "name email")
      .populate("vehicle");
  } else if (req.user.role === "Driver") {
    orders = await Order.find({ driver: req.user._id })
      .populate("customer", "name email")
      .populate("vehicle");
  } else {
    // Customer
    orders = await Order.find({ customer: req.user._id })
      .populate("driver", "name email")
      .populate("vehicle");
  }

  res.json(orders);
});

// @desc    Admin assigns driver & vehicle to an order
// @route   PUT /api/orders/:id/assign
// @access  Admin
const assignOrder = asyncHandler(async (req, res) => {
  const { driverId, vehicleId } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const driver = await User.findById(driverId);
  const vehicle = await Vehicle.findById(vehicleId);

  if (!driver || driver.role !== "Driver") {
    res.status(400);
    throw new Error("Invalid driver");
  }

  if (!vehicle) {
    res.status(400);
    throw new Error("Invalid vehicle");
  }

  // ✅ Check for scheduling conflicts
  const { checkAvailability } = require("../utils/scheduler");
  const availability = await checkAvailability(driverId, vehicleId);

  if (!availability.available) {
    res.status(409); // Conflict
    throw new Error(availability.message);
  }

  order.driver = driverId;
  order.vehicle = vehicleId;
  order.status = "Assigned";

  await order.save();
  res.json(order);
});

// @desc    Driver accepts order
// @route   PUT /api/orders/:id/accept
// @access  Driver
const acceptOrder = asyncHandler(async (req, res) => {
  console.log("🎯 ===== ACCEPT ORDER BACKEND =====");
  console.log("📦 Order ID:", req.params.id);
  console.log("👤 User ID:", req.user._id);
  console.log("👤 User Role:", req.user.role);
  
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    console.log("❌ Order not found");
    res.status(404);
    throw new Error("Order not found");
  }

  console.log("📋 Order status:", order.status);
  console.log("🚗 Order vehicle type:", order.vehicleType);

  // Check if order is still pending
  if (order.status !== "Pending" && order.status !== "Assigned") {
    console.log("❌ Order no longer available, status:", order.status);
    res.status(400);
    throw new Error("Order is no longer available");
  }

  // Check if driver is on duty and approved
  const driver = await User.findById(req.user._id);
  if (!driver) {
    console.log("❌ Driver not found");
    res.status(404);
    throw new Error("Driver not found");
  }

  console.log("👤 Driver name:", driver.name);
  console.log("✅ Driver isOnDuty:", driver.isOnDuty);
  console.log("✅ Driver isApproved:", driver.isApproved);
  console.log("✅ Driver approvalStatus:", driver.approvalStatus);
  console.log("🚗 Driver vehicleType:", driver.driverDetails?.vehicleType);

  if (!driver.isOnDuty) {
    console.log("❌ Driver not on duty");
    res.status(400);
    throw new Error("You must be on duty to accept orders");
  }

  if (!driver.isApproved || driver.approvalStatus !== "Approved") {
    console.log("❌ Driver not approved");
    console.log("   isApproved:", driver.isApproved);
    console.log("   approvalStatus:", driver.approvalStatus);
    res.status(403);
    throw new Error("Your account must be approved before accepting orders");
  }

  const driverVehicleType = driver.driverDetails?.vehicleType;
  if (!driverVehicleType) {
    console.log("❌ Driver vehicle type missing");
    res.status(400);
    throw new Error("Driver vehicle type is missing");
  }

  if (order.vehicleType !== driverVehicleType) {
    console.log("❌ Vehicle type mismatch");
    console.log("   Order needs:", order.vehicleType);
    console.log("   Driver has:", driverVehicleType);
    res.status(400);
    throw new Error("This order requires a different vehicle type");
  }

  console.log("✅ All checks passed, accepting order...");

  // Assign driver to order
  order.driver = req.user._id;
  order.status = "Accepted";
  order.acceptedAt = new Date();

  await order.save();

  // Populate driver and vehicle info
  await order.populate("driver", "name email phone");
  await order.populate("vehicle");
  await order.populate("customer", "name email phone");

  // Notify all other drivers that this order is no longer available
  try {
    const io = req.app.get("io");
    const connectedDrivers = req.app.get("connectedDrivers");
    const connectedUsers = req.app.get("connectedUsers");
    
    if (io && connectedDrivers) {
      // Get all ON DUTY drivers
      const onDutyDrivers = await User.find({ 
        role: "Driver", 
        isOnDuty: true,
        isApproved: true,
        approvalStatus: "Approved"
      });
      
      // Notify all drivers that this order was accepted
      onDutyDrivers.forEach((otherDriver) => {
        const socketId = connectedDrivers.get(otherDriver._id.toString());
        if (socketId) {
          io.to(socketId).emit("orderAcceptedByOther", {
            orderId: order._id,
            acceptedBy: driver.name
          });
        }
      });

      // Notify customer that order was accepted
      const customerSocketId = connectedUsers.get(order.customer._id.toString());
      if (customerSocketId) {
        io.to(customerSocketId).emit("orderAccepted", {
          orderId: order._id,
          driver: {
            name: driver.name,
            phone: driver.phone,
            email: driver.email
          }
        });
      }

      // Notify admin
      io.emit("orderStatusUpdate", {
        orderId: order._id,
        status: "Accepted",
        driver: driver.name
      });
    }
  } catch (error) {
    console.error("❌ Error notifying about order acceptance:", error.message);
  }

  res.json(order);
});

// @desc    Driver updates order status
// @route   PUT /api/orders/:id/status
// @access  Driver
const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const validStatuses = ["Accepted", "Arrived", "Picked-Up", "In-Transit", "Delivered", "Cancelled"];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error("Invalid status update");
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // Only assigned driver can update
  if (order.driver.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to update this order");
  }

  order.status = status;

  // ✅ Track pickup and delivery times
  if (status === "Picked-Up" && !order.pickupTime) {
    order.pickupTime = new Date();
  }

  if (status === "Delivered" && !order.deliveredAt) {
    order.deliveredAt = new Date();
    
    // Update customer stats
    await User.findByIdAndUpdate(order.customer, {
      $inc: { 
        'stats.completedOrders': 1,
        'stats.totalSpent': order.fare
      }
    });
    
    // Update driver earnings and stats (only if not already calculated)
    if (!order.driverEarnings) {
      const driver = await User.findById(req.user._id);
      if (driver) {
        const driverEarning = order.fare * 0.8; // 80% to driver, 20% platform fee
        driver.earnings.today += driverEarning;
        driver.earnings.thisWeek += driverEarning;
        driver.earnings.thisMonth += driverEarning;
        driver.earnings.total += driverEarning;
        driver.stats.completedDeliveries += 1;
        driver.stats.totalDeliveries += 1;
        
        await driver.save();
        
        // Update order with earnings breakdown
        order.driverEarnings = driverEarning;
        order.platformFee = order.fare * 0.2;
        
        console.log(`💰 Earnings updated for driver ${driver._id}: +₹${driverEarning.toFixed(2)} (Total: ₹${driver.earnings.total.toFixed(2)})`);
        
        // Notify driver about earnings update via socket
        try {
          const io = req.app.get("io");
          const connectedDrivers = req.app.get("connectedDrivers");
          
          if (io && connectedDrivers) {
            const driverSocketId = connectedDrivers.get(driver._id.toString());
            if (driverSocketId) {
              io.to(driverSocketId).emit("earningsUpdate", {
                earnings: driver.earnings,
                stats: driver.stats,
                orderEarning: driverEarning
              });
            }
          }
        } catch (error) {
          console.error("❌ Error notifying driver about earnings:", error.message);
        }
      }
    } else {
      console.log(`⚠️ Earnings already calculated for order ${order._id}`);
    }
  }

  await order.save();

  // Populate order details for socket notification and response
  await order.populate("driver", "name email phone");
  await order.populate("customer", "name email phone");
  await order.populate("vehicle", "type licensePlate");

  console.log("✅ Order updated successfully:", {
    orderId: order._id,
    status: order.status,
    hasPickup: !!order.pickup,
    hasDropoff: !!order.dropoff,
    hasDriver: !!order.driver,
    hasCustomer: !!order.customer,
    hasVehicle: !!order.vehicle
  });

  // Notify customer about status update via socket
  try {
    const io = req.app.get("io");
    const connectedUsers = req.app.get("connectedUsers");
    
    if (io && connectedUsers && order.customer) {
      const customerSocketId = connectedUsers.get(order.customer._id.toString());
      if (customerSocketId) {
        io.to(customerSocketId).emit("orderStatusUpdate", {
          orderId: order._id,
          status: order.status,
          driver: order.driver ? {
            name: order.driver.name,
            phone: order.driver.phone
          } : null
        });
      }
    }

    // Notify admin dashboard
    if (io) {
      io.emit("orderStatusUpdate", {
        orderId: order._id,
        status: order.status
      });
    }
  } catch (error) {
    console.error("❌ Error notifying about status update:", error.message);
  }

  res.json(order);
});

// @desc    Mark order as paid (Cash/Online)
// @route   PUT /api/orders/:id/pay
// @access  Customer/Admin
const payOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // Customer can only pay for his own order
  if (req.user.role === "Customer" && order.customer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to pay for this order");
  }

  order.isPaid = true;
  order.paidAt = Date.now();
  await order.save();

  res.json({ message: "✅ Payment successful", order });
});

// @desc    Driver confirms cash payment after delivery
// @route   PUT /api/orders/:id/confirm-cash
// @access  Driver
const confirmCashPayment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // Only assigned driver can confirm cash
  if (order.driver.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to confirm payment for this order");
  }

  // Must be Cash payment & Delivered
  if (order.paymentMethod !== "Cash") {
    res.status(400);
    throw new Error("Only cash payments require driver confirmation");
  }

  if (order.status !== "Delivered") {
    res.status(400);
    throw new Error("Payment can only be confirmed after delivery");
  }

  order.isPaid = true;
  order.paidAt = Date.now();

  await order.save();
  res.json({ message: "💰 Cash payment confirmed", order });
});


// @desc    Get order tracking info
// @route   GET /api/orders/:id/track
// @access  Customer/Admin/Driver
const trackOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("driver", "name email")
    .populate("vehicle", "plateNumber type")
    .populate("customer", "name email");

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // Authorization check
  const isCustomer = order.customer._id.toString() === req.user._id.toString();
  const isDriver = order.driver && order.driver._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "Admin";

  if (!isCustomer && !isDriver && !isAdmin) {
    res.status(403);
    throw new Error("Not authorized to track this order");
  }

  res.json({
    orderId: order._id,
    status: order.status,
    pickup: order.pickup,
    dropoff: order.dropoff,
    driver: order.driver,
    vehicle: order.vehicle,
    tracking: order.tracking,
    estimatedTime: order.pickupTime ? "In transit" : "Waiting for pickup",
  });
});

// @desc    Customer cancels order
// @route   PUT /api/orders/:id/cancel
// @access  Customer
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // Only the customer who created the order can cancel it
  if (order.customer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to cancel this order");
  }

  // Can only cancel if order is Pending, Assigned, or Accepted
  const cancellableStatuses = ["Pending", "Assigned", "Accepted"];
  if (!cancellableStatuses.includes(order.status)) {
    res.status(400);
    throw new Error(`Cannot cancel order with status: ${order.status}. Order can only be cancelled if it's Pending, Assigned, or Accepted.`);
  }

  // Calculate cancellation fee if driver has accepted the order
  let cancellationFee = 0;
  let driverCompensation = 0;
  
  if (order.status === "Accepted" && order.driver) {
    // Customer pays 50% of fare as cancellation fee
    cancellationFee = order.fare * 0.5;
    driverCompensation = cancellationFee; // Full cancellation fee goes to driver
    
    // Update driver earnings
    const driver = await User.findById(order.driver);
    if (driver) {
      if (!driver.earnings) {
        driver.earnings = { today: 0, thisWeek: 0, thisMonth: 0, total: 0 };
      }
      
      driver.earnings.today += driverCompensation;
      driver.earnings.thisWeek += driverCompensation;
      driver.earnings.thisMonth += driverCompensation;
      driver.earnings.total += driverCompensation;
      
      await driver.save();
      
      console.log(`💰 Driver ${driver.name} compensated ₹${driverCompensation.toFixed(2)} for order cancellation`);
    }
  }

  order.status = "Cancelled";
  order.cancelledAt = new Date();
  order.cancelledBy = "Customer";
  order.cancellationFee = cancellationFee;
  order.driverCompensation = driverCompensation;
  
  // Update customer stats
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { 'stats.cancelledOrders': 1 }
  });
  
  await order.save();

  // Notify driver if order was already assigned/accepted
  try {
    const io = req.app.get("io");
    const connectedDrivers = req.app.get("connectedDrivers");
    const connectedUsers = req.app.get("connectedUsers");
    
    if (io) {
      // Notify driver if assigned
      if (order.driver && connectedDrivers) {
        const driverSocketId = connectedDrivers.get(order.driver.toString());
        if (driverSocketId) {
          io.to(driverSocketId).emit("orderCancelled", {
            orderId: order._id,
            message: "Customer cancelled the order"
          });
        }
      }

      // Notify all drivers that this order is no longer available
      io.emit("orderCancelled", {
        orderId: order._id
      });

      // Notify admin
      io.emit("orderStatusUpdate", {
        orderId: order._id,
        status: "Cancelled",
        cancelledBy: "Customer"
      });
    }
  } catch (error) {
    console.error("❌ Error notifying about cancellation:", error.message);
  }

  // Prepare response message
  let message = "Order cancelled successfully";
  if (cancellationFee > 0) {
    message += `. Cancellation fee: ₹${cancellationFee.toFixed(2)} (50% of fare). This amount has been credited to the driver as compensation.`;
  }

  res.json({
    message,
    order,
    cancellationFee,
    driverCompensation
  });
});

// @desc    Rate driver after delivery
// @route   PUT /api/orders/:id/rate-driver
// @access  Customer
const rateDriver = asyncHandler(async (req, res) => {
  const { rating, review } = req.body;

  // Validate rating
  if (!rating || rating < 1 || rating > 5) {
    res.status(400);
    throw new Error("Rating must be between 1 and 5");
  }

  const order = await Order.findById(req.params.id).populate('driver');

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // Only the customer who placed the order can rate
  if (order.customer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to rate this order");
  }

  // Order must be delivered
  if (order.status !== "Delivered") {
    res.status(400);
    throw new Error("Can only rate after order is delivered");
  }

  // Check if already rated
  if (order.customerRating && order.customerRating.rating) {
    res.status(400);
    throw new Error("You have already rated this order");
  }

  // Save rating to order
  order.customerRating = {
    rating: Number(rating),
    review: review || "",
    ratedAt: new Date()
  };

  await order.save();

  // Update driver's overall rating
  if (order.driver) {
    const driver = await User.findById(order.driver._id);
    
    if (driver) {
      // Calculate new average rating
      const totalRatings = (driver.stats?.totalRatings || 0) + 1;
      const currentAverage = driver.stats?.averageRating || 0;
      const newAverage = ((currentAverage * (totalRatings - 1)) + Number(rating)) / totalRatings;

      // Update driver stats
      if (!driver.stats) {
        driver.stats = {};
      }
      driver.stats.totalRatings = totalRatings;
      driver.stats.averageRating = Math.round(newAverage * 10) / 10; // Round to 1 decimal

      await driver.save();

      console.log(`✅ Driver ${driver.name} rated: ${rating}/5. New average: ${driver.stats.averageRating} (${totalRatings} ratings)`);

      // Notify driver via socket
      try {
        const io = req.app.get("io");
        const connectedUsers = req.app.get("connectedUsers");
        
        if (io && connectedUsers) {
          const driverSocketId = connectedUsers.get(driver._id.toString());
          if (driverSocketId) {
            io.to(driverSocketId).emit("newRating", {
              orderId: order._id,
              rating: Number(rating),
              review: review || "",
              averageRating: driver.stats.averageRating,
              totalRatings: driver.stats.totalRatings
            });
          }
        }
      } catch (error) {
        console.error("❌ Error notifying driver about rating:", error.message);
      }
    }
  }

  res.json({
    message: "Rating submitted successfully",
    order: {
      _id: order._id,
      customerRating: order.customerRating
    }
  });
});

// @desc    Driver rejects accepted order (DISABLED - Drivers cannot reject after accepting)
// @route   PUT /api/orders/:id/reject-accepted
// @access  Driver
const rejectAcceptedOrder = asyncHandler(async (req, res) => {
  // FEATURE DISABLED: Drivers cannot reject orders after accepting
  res.status(403);
  throw new Error("Drivers cannot reject orders after accepting. Only customers can cancel orders.");
});

// Retry driver search - re-notify drivers about pending order
const retryDriverSearch = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  
  console.log("🔄 Retrying driver search for order:", orderId);

  const order = await Order.findById(orderId);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // Only allow retry for pending orders
  if (order.status !== "Pending") {
    res.status(400);
    throw new Error("Can only retry search for pending orders");
  }

  // Get IO instance and connected drivers
  const io = req.app.get("io");
  const connectedDrivers = req.app.get("connectedDrivers");

  if (io && connectedDrivers) {
    console.log("🔍 Finding on-duty drivers for vehicle type:", order.vehicleType);

    // Find all on-duty, approved drivers with matching vehicle type
    const onDutyDrivers = await User.find({
      role: "Driver",
      isOnDuty: true,
      isApproved: true,
      approvalStatus: "Approved",
      "driverDetails.vehicleType": order.vehicleType
    });

    console.log(`📢 Found ${onDutyDrivers.length} matching drivers`);

    let notifiedCount = 0;

    // Notify all matching drivers
    onDutyDrivers.forEach((driver) => {
      const socketId = connectedDrivers.get(driver._id.toString());
      if (socketId) {
        console.log(`   ✅ Notifying driver ${driver.name} (${driver._id})`);
        io.to(socketId).emit("newOrderAvailable", {
          _id: order._id,
          customer: order.customer,
          pickup: order.pickup,
          dropoff: order.dropoff,
          items: order.items,
          vehicleType: order.vehicleType,
          distance: order.distance,
          fare: order.fare,
          paymentMethod: order.paymentMethod,
          createdAt: order.createdAt,
        });
        notifiedCount++;
      } else {
        console.log(`   ⚠️ Driver ${driver.name} not connected`);
      }
    });

    console.log(`✅ Retry search complete: Notified ${notifiedCount} drivers`);

    res.json({
      message: "Driver search retried successfully",
      driversNotified: notifiedCount,
      totalDriversFound: onDutyDrivers.length
    });
  } else {
    console.log("❌ IO or connectedDrivers not available");
    res.status(500);
    throw new Error("Socket connection not available");
  }
});

module.exports = {
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
};
