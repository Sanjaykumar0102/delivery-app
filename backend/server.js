// backend/server.js
const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const morgan = require("morgan");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");

const userRoutes = require("./routes/userRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const orderRoutes = require("./routes/orderRoutes");
const reportRoutes = require("./routes/reportRoutes");
const metricsRoutes = require("./routes/metricsRoutes");
const { serializeConnectedDrivers } = require("./utils/driverMetrics");
const Order = require("./models/order"); // needed for tracking updates
const User = require("./models/user"); // needed for driver queries
// console.log("👉 Loading reportRoutes from", require.resolve("./routes/reportRoutes"));

// console.log("👉 userRoutes:", userRoutes);
// console.log("👉 vehicleRoutes:", vehicleRoutes);
// console.log("👉 orderRoutes:", orderRoutes);
// console.log("👉 reportRoutes:", reportRoutes);
const cookieParser = require("cookie-parser");

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: [
    "http://localhost:5173",   // ✅ Local development
    "http://localhost:3000",   // ✅ Alternative local port
    "https://delivery-app-two-vert.vercel.app"  // ✅ Deployed frontend
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(morgan("dev"));

// Test Vehicle Model Import
const Vehicle = require("./models/vehicle");
console.log("🚗 Vehicle test:", Vehicle);

// Routes
app.use("/api/users", userRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/metrics", metricsRoutes);

// Simple test route
app.get("/", (req, res) => {
  res.send("✅ API is running...");
});

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

// Create HTTP + WebSocket server
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://delivery-app-two-vert.vercel.app"
    ],
    credentials: true,
    methods: ["GET", "POST"]
  },
});

// Store connected drivers and their socket IDs
const connectedDrivers = new Map(); // Map<driverId, socketId>
const connectedUsers = new Map(); // Map<userId, socketId>

// Socket.io events
io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  // Helper function to update admin dashboard with driver data
  const updateAdminDashboard = async () => {
    try {
      console.log('📊 Updating admin dashboard...');
      
      // Get all on-duty drivers from database
      const onDutyDrivers = await User.find({ 
        role: "Driver", 
        isOnDuty: true,
        isApproved: true 
      }).select('_id name email driverDetails isOnDuty isApproved currentLocation stats');

      console.log(`   Found ${onDutyDrivers.length} on-duty drivers in database`);
      console.log(`   Found ${connectedDrivers.size} connected drivers in socket map`);

      // Create a map of connected driver IDs for quick lookup
      const connectedDriverIds = new Set(Array.from(connectedDrivers.keys()));

      // Merge database drivers with socket-connected drivers
      const mergedDrivers = onDutyDrivers.map(driver => {
        const driverId = driver._id.toString();
        const socketInfo = connectedDrivers.get(driverId);
        
        return {
          _id: driver._id,
          name: driver.name,
          email: driver.email,
          vehicleType: driver.driverDetails?.vehicleType || 'Unknown',
          isOnDuty: driver.isOnDuty,
          isApproved: driver.isApproved,
          currentLocation: driver.currentLocation,
          stats: driver.stats,
          // Connection status
          isConnected: connectedDriverIds.has(driverId),
          socketId: socketInfo?.socketId || null,
          lastHeartbeat: socketInfo?.lastHeartbeat || null,
          liveStatus: socketInfo ? {
            socketId: socketInfo.socketId,
            lastHeartbeat: socketInfo.lastHeartbeat,
            isOnDuty: socketInfo.isOnDuty
          } : null
        };
      });

      // Calculate merged totals
      const mergedTotals = {
        totalOnDutyDrivers: mergedDrivers.length,
        totalConnectedDrivers: connectedDriverIds.size,
        totalApprovedDrivers: mergedDrivers.filter(d => d.isApproved).length,
        onlineDrivers: mergedDrivers.filter(d => d.isConnected).length,
        offlineDrivers: mergedDrivers.filter(d => !d.isConnected).length
      };

      console.log('   Merged totals:', mergedTotals);

      // Vehicle type breakdown
      const vehicleTypeBreakdown = mergedDrivers.reduce((acc, driver) => {
        const type = driver.vehicleType;
        if (!acc[type]) {
          acc[type] = { total: 0, onDuty: 0, online: 0 };
        }
        acc[type].total += 1;
        if (driver.isOnDuty) acc[type].onDuty += 1;
        if (driver.isConnected) acc[type].online += 1;
        return acc;
      }, {});

      const snapshot = {
        totals: mergedTotals,
        vehicleTypeBreakdown,
        drivers: mergedDrivers
      };

      console.log('✅ Emitting adminDriversSnapshot with', mergedDrivers.length, 'drivers');
      io.emit("adminDriversSnapshot", snapshot);
    } catch (error) {
      console.error("❌ Error updating admin dashboard:", error);
      console.error("   Stack:", error.stack);
      // Fallback to socket-only data
      console.log("   Falling back to socket-only data");
      io.emit("adminDriversSnapshot", serializeConnectedDrivers(connectedDrivers));
    }
  };

  // Driver/User registers their connection
  socket.on("register", (data) => {
    const { userId, role, vehicleType, isOnDuty, isApproved, approvalStatus } = data;
    console.log(`👤 ${role} registered:`, userId, `(Socket ID: ${socket.id})`);

    if (role === "Driver") {
      connectedDrivers.set(userId, {
        socketId: socket.id,
        vehicleType: vehicleType,
        isOnDuty: isOnDuty,
        isApproved: isApproved,
        approvalStatus: approvalStatus,
        lastHeartbeat: Date.now(),
      });
      updateAdminDashboard();
      console.log(`🚗 Driver added to connectedDrivers map. Total drivers: ${connectedDrivers.size}`);
      console.log(`📋 Connected drivers:`, Array.from(connectedDrivers.entries()).map(([id, info]) => ({
        id,
        vehicleType: info.vehicleType,
        isOnDuty: info.isOnDuty,
        isApproved: info.isApproved
      })));
    }
    connectedUsers.set(userId, socket.id);

    socket.userId = userId;
    socket.userRole = role;
    socket.vehicleType = vehicleType;
    socket.isOnDuty = isOnDuty;

    // If this is a driver re-registering, update their status in the map
    if (role === "Driver" && isOnDuty !== undefined) {
      const driverInfo = connectedDrivers.get(userId);
      if (driverInfo && driverInfo.isOnDuty !== isOnDuty) {
        console.log(`🔄 Driver ${userId} re-registered with updated duty status: ${isOnDuty}`);
        driverInfo.isOnDuty = isOnDuty;
        connectedDrivers.set(userId, driverInfo);
      }
    }
  });

  // Driver sends live location
  socket.on("updateLocation", async (data) => {
    // Expected data: { driverId, orderId, lat, lng }
    console.log("📍 Location update:", data);

    try {
      const User = require("./models/user");
      
      // Update driver's current location in user model
      await User.findByIdAndUpdate(
        data.driverId,
        {
          currentLocation: {
            lat: data.lat,
            lng: data.lng,
            lastUpdated: new Date(),
          },
        }
      );

      // Update order tracking if orderId is provided
      if (data.orderId) {
        await Order.findByIdAndUpdate(
          data.orderId,
          {
            tracking: {
              lat: data.lat,
              lng: data.lng,
              lastUpdated: new Date(),
            },
          },
          { new: true }
        );

        // Broadcast location to customer tracking this order
        const order = await Order.findById(data.orderId);
        if (order && order.customer) {
          const customerSocketId = connectedUsers.get(order.customer.toString());
          if (customerSocketId) {
            io.to(customerSocketId).emit("driverLocationUpdate", {
              orderId: data.orderId,
              lat: data.lat,
              lng: data.lng,
              timestamp: new Date(),
            });
          }
        }
      }

      // Update driver's heartbeat when location is received
      const driverInfo = connectedDrivers.get(data.driverId);
      if (driverInfo) {
        driverInfo.lastHeartbeat = Date.now();
        connectedDrivers.set(data.driverId, driverInfo);
      }

      updateAdminDashboard();

      // Broadcast to admin dashboard
      io.emit("driverLocationBroadcast", {
        driverId: data.driverId,
        lat: data.lat,
        lng: data.lng,
        timestamp: new Date(),
      });
    } catch (err) {
      console.error("❌ Error updating driver location:", err.message);
    }
  });

  // Order status update
  socket.on("orderStatusUpdate", async (data) => {
    const { orderId, status } = data;
    console.log(`📦 Order ${orderId} status updated to: ${status}`);

    try {
      const order = await Order.findById(orderId).populate("customer driver");
      
      if (order) {
        // Notify customer
        const customerSocketId = connectedUsers.get(order.customer._id.toString());
        if (customerSocketId) {
          io.to(customerSocketId).emit("orderStatusChanged", {
            orderId,
            status,
            order,
          });
        }

        // Notify admin
        io.emit("adminOrderUpdate", {
          orderId,
          status,
          order,
        });
      }
    } catch (err) {
      console.error("❌ Error broadcasting order status:", err.message);
    }
  });

  // Listen for approval status updates
  socket.on("approvalStatusUpdate", (data) => {
    const { driverId, isApproved, approvalStatus } = data;
    console.log(`🎉 Driver ${driverId} approval status updated: ${approvalStatus}`);

    // Update the driver's approval status in connectedDrivers map
    const driverInfo = connectedDrivers.get(driverId);
    if (driverInfo) {
      driverInfo.isApproved = isApproved;
      driverInfo.approvalStatus = approvalStatus;
      connectedDrivers.set(driverId, driverInfo);
      console.log(`✅ Updated approval status for driver ${driverId} in connectedDrivers map`);
      updateAdminDashboard();
    } else {
      console.log(`⚠️ Driver ${driverId} not found in connectedDrivers map`);
    }
  });

  socket.on("disconnect", () => {
    if (socket.userId) {
      console.log(`❌ ${socket.userRole} disconnected:`, socket.userId);
      const driverInfo = connectedDrivers.get(socket.userId);
      if (driverInfo && driverInfo.socketId === socket.id) {
        connectedDrivers.delete(socket.userId);
      }
      connectedUsers.delete(socket.userId);
      updateAdminDashboard();
    } else {
      console.log("❌ Client disconnected:", socket.id);
    }
  });
});

// Make io accessible to routes
app.set("io", io);
app.set("connectedDrivers", connectedDrivers);
app.set("connectedUsers", connectedUsers);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(err.statusCode || 500).json({
    message: err.message || "Server error",
  });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, async () => {
  await connectDB();
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
