const asyncHandler = require("express-async-handler");
const Order = require("../models/order");
const Vehicle = require("../models/vehicle");
const User = require("../models/user");

// 📊 Driver Performance
const driverPerformance = asyncHandler(async (req, res) => {
  const drivers = await User.find({ role: "Driver" });

  const results = await Promise.all(
    drivers.map(async (driver) => {
      const orders = await Order.find({
        driver: driver._id,
        status: "Delivered",
      });

      if (orders.length === 0) {
        return {
          driver: driver.name,
          totalDeliveries: 0,
          avgDeliveryTime: "N/A",
          onTimePercentage: "N/A",
        };
      }

      let totalTime = 0;
      let onTime = 0;

      orders.forEach((o) => {
        if (o.pickupTime && o.deliveredAt) {
          const diff = (o.deliveredAt - o.pickupTime) / 60000; // minutes
          totalTime += diff;
          if (diff <= 60) onTime++; // assume < 1hr = on time
        }
      });

      return {
        driver: driver.name,
        totalDeliveries: orders.length,
        avgDeliveryTime: (totalTime / orders.length).toFixed(2) + " mins",
        onTimePercentage: ((onTime / orders.length) * 100).toFixed(2) + "%",
      };
    })
  );

  res.json(results);
});

// 🚗 Vehicle Utilization
const vehicleUtilization = asyncHandler(async (req, res) => {
  const vehicles = await Vehicle.find({});

  const results = await Promise.all(
    vehicles.map(async (v) => {
      const orders = await Order.find({ vehicle: v._id, status: "Delivered" });
      const totalDistance = orders.reduce((acc, o) => acc + (o.distance || 0), 0);

      return {
        vehicle: v.registrationNumber,
        totalDeliveries: orders.length,
        totalDistance: totalDistance.toFixed(2) + " km",
        utilization: ((orders.length / 30) * 100).toFixed(2) + "%", // assume 30 deliveries/month
      };
    })
  );

  res.json(results);
});

// 👤 Customer Delivery History
const customerHistory = asyncHandler(async (req, res) => {
  const customerId = req.params.id;
  const customer = await User.findById(customerId);

  if (!customer || customer.role !== "Customer") {
    res.status(404);
    throw new Error("Customer not found");
  }

  const deliveries = await Order.find({ customer: customerId })
    .populate("driver", "name")
    .populate("vehicle", "registrationNumber");

  res.json({
    customer: customer.name,
    deliveries: deliveries.map((o) => ({
      pickup: o.pickup.address,
      dropoff: o.dropoff.address,
      status: o.status,
      fare: o.fare,
      date: o.createdAt,
    })),
  });
});

// 📅 Summary Report
const summaryReport = asyncHandler(async (req, res) => {
  const { period } = req.query; // daily / monthly
  const match = {};
  const now = new Date();

  if (period === "daily") {
    match.createdAt = {
      $gte: new Date(now.setHours(0, 0, 0, 0)),
      $lt: new Date(now.setHours(23, 59, 59, 999)),
    };
  } else if (period === "monthly") {
    match.createdAt = {
      $gte: new Date(now.getFullYear(), now.getMonth(), 1),
      $lt: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
    };
  }

  const orders = await Order.find(match);

  const summary = {
    totalDeliveries: orders.length,
    completed: orders.filter((o) => o.status === "Delivered").length,
    pending: orders.filter((o) => o.status === "Pending").length,
    cancelled: orders.filter((o) => o.status === "Cancelled").length,
    revenue: orders.reduce((acc, o) => acc + (Number(o.fare) || 0), 0),
  };

  res.json(summary);
});

module.exports = {
  driverPerformance,
  vehicleUtilization,
  customerHistory,
  summaryReport,
};
