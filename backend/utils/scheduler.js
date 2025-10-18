// backend/utils/scheduler.js
const Order = require("../models/order");

/**
 * Check if a driver is available for a new delivery
 * @param {String} driverId - Driver's MongoDB ID
 * @param {Date} startTime - Proposed start time
 * @returns {Boolean} - true if available, false if busy
 */
const isDriverAvailable = async (driverId, startTime = new Date()) => {
  // Find active orders for this driver
  const activeOrders = await Order.find({
    driver: driverId,
    status: { $in: ["Assigned", "In-Progress"] },
  });

  // If driver has any active orders, they're not available
  return activeOrders.length === 0;
};

/**
 * Check if a vehicle is available for a new delivery
 * @param {String} vehicleId - Vehicle's MongoDB ID
 * @param {Date} startTime - Proposed start time
 * @returns {Boolean} - true if available, false if busy
 */
const isVehicleAvailable = async (vehicleId, startTime = new Date()) => {
  // Find active orders for this vehicle
  const activeOrders = await Order.find({
    vehicle: vehicleId,
    status: { $in: ["Assigned", "In-Progress"] },
  });

  // If vehicle has any active orders, it's not available
  return activeOrders.length === 0;
};

/**
 * Check if both driver and vehicle are available
 * @param {String} driverId
 * @param {String} vehicleId
 * @returns {Object} - { available: Boolean, message: String }
 */
const checkAvailability = async (driverId, vehicleId) => {
  const driverAvailable = await isDriverAvailable(driverId);
  const vehicleAvailable = await isVehicleAvailable(vehicleId);

  if (!driverAvailable && !vehicleAvailable) {
    return {
      available: false,
      message: "Both driver and vehicle are currently busy with other deliveries",
    };
  }

  if (!driverAvailable) {
    return {
      available: false,
      message: "Driver is currently busy with another delivery",
    };
  }

  if (!vehicleAvailable) {
    return {
      available: false,
      message: "Vehicle is currently assigned to another delivery",
    };
  }

  return {
    available: true,
    message: "Driver and vehicle are available",
  };
};

module.exports = {
  isDriverAvailable,
  isVehicleAvailable,
  checkAvailability,
};