const asyncHandler = require("express-async-handler");
const { serializeConnectedDrivers } = require("../utils/driverMetrics");
const User = require("../models/user");

/**
 * @desc    Summaries of currently connected drivers (merged with DB on-duty drivers).
 * @route   GET /api/metrics/connected-drivers
 * @access  Admin
 */
const getConnectedDriversSummary = asyncHandler(async (req, res) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ message: "Forbidden: insufficient role" });
  }

  const connectedDrivers = req.app.get("connectedDrivers");
  if (!connectedDrivers || !(connectedDrivers instanceof Map)) {
    return res.status(500).json({ message: "Connected drivers map unavailable" });
  }

  // Get all drivers with isOnDuty: true from database
  const onDutyDrivers = await User.find({ 
    role: "Driver", 
    isOnDuty: true,
    isApproved: true 
  })
  .select('_id name email driverDetails isOnDuty isApproved isActive currentLocation stats vehicleAssigned')
  .populate('vehicleAssigned');

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
      vehicleAssigned: driver.vehicleAssigned,
      isOnDuty: driver.isOnDuty,
      isApproved: driver.isApproved,
      isActive: driver.isActive,
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

  // Get the original socket summary for totals
  const socketSummary = serializeConnectedDrivers(connectedDrivers);

  // Calculate merged totals
  const mergedTotals = {
    totalOnDutyDrivers: mergedDrivers.length,
    totalConnectedDrivers: connectedDriverIds.size,
    totalApprovedDrivers: mergedDrivers.filter(d => d.isApproved).length,
    onlineDrivers: mergedDrivers.filter(d => d.isConnected).length,
    offlineDrivers: mergedDrivers.filter(d => !d.isConnected).length
  };

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

  res.json({
    totals: mergedTotals,
    vehicleTypeBreakdown,
    drivers: mergedDrivers,
    // Keep original socket data for reference
    socketOnly: socketSummary
  });
});

module.exports = {
  getConnectedDriversSummary,
};