const asyncHandler = require("express-async-handler");
const Order = require("../models/order");
const User = require("../models/user");

/**
 * @desc    Get detailed statistics for admin dashboard
 * @route   GET /api/stats/overview
 * @access  Admin
 */
const getStatsOverview = asyncHandler(async (req, res) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ message: "Forbidden: insufficient role" });
  }

  try {
    const { period = "all" } = req.query; // all, week, month, year

    // Calculate date ranges
    const now = new Date();
    let startDate;
    
    switch (period) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = null;
    }

    // Build query filter
    const dateFilter = startDate ? { createdAt: { $gte: startDate } } : {};

    // Get orders data
    const [
      totalOrders,
      completedOrders,
      cancelledOrders,
      pendingOrders,
      revenueData
    ] = await Promise.all([
      Order.countDocuments(dateFilter),
      Order.countDocuments({ ...dateFilter, status: "Delivered" }),
      Order.countDocuments({ ...dateFilter, status: "Cancelled" }),
      Order.countDocuments({ ...dateFilter, status: "Pending" }),
      Order.aggregate([
        { $match: { ...dateFilter, status: "Delivered" } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$fare" },
            platformFee: { $sum: "$platformFee" },
            driverEarnings: { $sum: "$driverEarnings" }
          }
        }
      ])
    ]);

    // Get user statistics
    const [totalCustomers, totalDrivers, activeDrivers] = await Promise.all([
      User.countDocuments({ role: "Customer", isActive: true }),
      User.countDocuments({ role: "Driver", isApproved: true, isActive: true }),
      User.countDocuments({ role: "Driver", isOnDuty: true, isActive: true })
    ]);

    const revenue = revenueData[0] || { totalRevenue: 0, platformFee: 0, driverEarnings: 0 };

    res.json({
      period,
      orders: {
        total: totalOrders,
        completed: completedOrders,
        cancelled: cancelledOrders,
        pending: pendingOrders,
        completionRate: totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(2) : 0
      },
      revenue: {
        total: revenue.totalRevenue,
        platform: revenue.platformFee,
        drivers: revenue.driverEarnings
      },
      users: {
        customers: totalCustomers,
        drivers: totalDrivers,
        activeDrivers: activeDrivers
      }
    });
  } catch (error) {
    console.error("Error fetching stats overview:", error);
    res.status(500).json({ message: "Failed to fetch statistics" });
  }
});

/**
 * @desc    Get order statistics by time period (for charts)
 * @route   GET /api/stats/orders-timeline
 * @access  Admin
 */
const getOrdersTimeline = asyncHandler(async (req, res) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ message: "Forbidden: insufficient role" });
  }

  try {
    const { period = "month" } = req.query; // week, month, year

    let groupBy, dateFormat, startDate;
    const now = new Date();

    switch (period) {
      case "week":
        groupBy = { $dayOfWeek: "$createdAt" };
        dateFormat = "day";
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        groupBy = { $dayOfMonth: "$createdAt" };
        dateFormat = "day";
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        groupBy = { $month: "$createdAt" };
        dateFormat = "month";
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        groupBy = { $month: "$createdAt" };
        dateFormat = "month";
        startDate = new Date(now.getFullYear(), 0, 1);
    }

    const pipeline = [
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: groupBy,
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] }
          },
          totalRevenue: {
            $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, "$fare", 0] }
          }
        }
      },
      { $sort: { "_id": 1 } }
    ];

    const timelineData = await Order.aggregate(pipeline);

    res.json({
      period,
      dateFormat,
      data: timelineData
    });
  } catch (error) {
    console.error("Error fetching orders timeline:", error);
    res.status(500).json({ message: "Failed to fetch orders timeline" });
  }
});

/**
 * @desc    Get revenue analytics
 * @route   GET /api/stats/revenue
 * @access  Admin
 */
const getRevenueAnalytics = asyncHandler(async (req, res) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ message: "Forbidden: insufficient role" });
  }

  try {
    const { period = "month" } = req.query;

    let startDate;
    const now = new Date();

    switch (period) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const revenueData = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate },
          status: "Delivered"
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          },
          totalRevenue: { $sum: "$fare" },
          platformFee: { $sum: "$platformFee" },
          driverEarnings: { $sum: "$driverEarnings" },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    res.json({
      period,
      data: revenueData
    });
  } catch (error) {
    console.error("Error fetching revenue analytics:", error);
    res.status(500).json({ message: "Failed to fetch revenue analytics" });
  }
});

module.exports = {
  getStatsOverview,
  getOrdersTimeline,
  getRevenueAnalytics
};
