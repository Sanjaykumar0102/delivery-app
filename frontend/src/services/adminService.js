// src/services/adminService.js
import api from "../utils/axios";

// Get all users (Admin only)
export const getAllUsers = async () => {
  const res = await api.get("/users");
  return res.data;
};

// Get all drivers
export const getAllDrivers = async () => {
  const res = await api.get("/users");
  return res.data;
};

// Get all vehicles
export const getAllVehicles = async () => {
  const res = await api.get("/vehicles");
  return res.data;
};

// Get all orders (Admin view)
export const getAllOrders = async () => {
  const res = await api.get("/orders");
  return res.data;
};

// Assign order to driver
export const assignOrderToDriver = async (orderId, driverId, vehicleId) => {
  const res = await api.put(`/orders/${orderId}/assign`, { driverId, vehicleId });
  return res.data;
};

const baseMetricsPath = "/metrics";

// Fetch live connected driver metrics
export const getConnectedDriversMetrics = async () => {
  const res = await api.get(`${baseMetricsPath}/connected-drivers`);
  return res.data;
};

// Get dashboard statistics
export const getDashboardStats = async () => {
  try {
    const [users, orders, vehicles, liveDriverMetrics] = await Promise.all([
      getAllUsers(),
      getAllOrders(),
      getAllVehicles(),
      getConnectedDriversMetrics()
    ]);

    const drivers = users.filter(u => u.role === "Driver");
    const customers = users.filter(u => u.role === "Customer");
    const admins = users.filter(u => u.role === "Admin");
    const activeDrivers = drivers.filter(d => d.isOnDuty);
    
    const pendingOrders = orders.filter(o => o.status === "Pending");
    const activeOrders = orders.filter(o => 
      ["Assigned", "Accepted", "Arrived", "Picked-Up", "In-Transit"].includes(o.status)
    );
    const completedOrders = orders.filter(o => o.status === "Delivered");
    const cancelledOrders = orders.filter(o => o.status === "Cancelled");

    const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.fare || 0), 0);
    const platformRevenue = completedOrders.reduce((sum, order) => sum + (order.platformFee || 0), 0);

    // Use merged drivers from liveDriverMetrics if available, otherwise fall back to DB drivers
    const mergedActiveDrivers = liveDriverMetrics?.drivers || activeDrivers;
    
    return {
      totalUsers: users.length,
      totalDrivers: drivers.length,
      totalCustomers: customers.length,
      totalAdmins: admins.length,
      activeDrivers: liveDriverMetrics?.totals?.totalOnDutyDrivers ?? activeDrivers.length,
      onlineDrivers: liveDriverMetrics?.totals?.onlineDrivers ?? 0,
      offlineDrivers: liveDriverMetrics?.totals?.offlineDrivers ?? 0,
      totalVehicles: vehicles.length,
      totalOrders: orders.length,
      pendingOrders: pendingOrders.length,
      activeOrders: activeOrders.length,
      completedOrders: completedOrders.length,
      cancelledOrders: cancelledOrders.length,
      totalRevenue,
      platformRevenue,
      drivers,
      orders,
      vehicles,
      activeDriversList: mergedActiveDrivers, // Now includes connection status
      liveDriverMetrics,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
};

// Update user status (suspend/activate)
export const updateUserStatus = async (userId, status) => {
  const res = await api.put(`/users/${userId}/status`, { status });
  return res.data;
};

// Delete user
export const deleteUser = async (userId) => {
  const res = await api.delete(`/users/${userId}`);
  return res.data;
};

// Get pending driver approvals
export const getPendingDrivers = async () => {
  const res = await api.get("/users/drivers/pending");
  return res.data;
};

// Approve driver
export const approveDriver = async (driverId) => {
  const res = await api.put(`/users/drivers/${driverId}/approve`);
  return res.data;
};

// Reject driver
export const rejectDriver = async (driverId, reason) => {
  const res = await api.put(`/users/drivers/${driverId}/reject`, { reason });
  return res.data;
};

// Get all customers
export const getAllCustomers = async () => {
  const res = await api.get("/users/customers");
  return res.data;
};

// Get all admins
export const getAllAdmins = async () => {
  const res = await api.get("/users/admins");
  return res.data;
};

// Toggle user active status (deactivate/activate)
export const toggleUserActive = async (userId, reason) => {
  const res = await api.put(`/users/${userId}/toggle-active`, { reason });
  return res.data;
};