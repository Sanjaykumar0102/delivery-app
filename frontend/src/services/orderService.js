// src/services/orderService.js
import api from "../utils/axios";

// Create a new order
export const createOrder = async (orderData) => {
  const res = await api.post("/orders", orderData);
  return res.data;
};

// Get all orders for the logged-in user
export const getOrders = async () => {
  const res = await api.get("/orders");
  return res.data;
};

// Get single order by ID
export const getOrderById = async (orderId) => {
  const res = await api.get(`/orders/${orderId}`);
  return res.data;
};

// Track order (real-time location)
export const trackOrder = async (orderId) => {
  const res = await api.get(`/orders/${orderId}/track`);
  return res.data;
};

// Update order status (Driver only)
export const updateOrderStatus = async (orderId, status) => {
  const res = await api.put(`/orders/${orderId}/status`, { status });
  return res.data;
};

// Assign driver and vehicle (Admin only)
export const assignOrder = async (orderId, driverId, vehicleId) => {
  const res = await api.put(`/orders/${orderId}/assign`, { driverId, vehicleId });
  return res.data;
};

// Pay for order
export const payOrder = async (orderId) => {
  const res = await api.put(`/orders/${orderId}/pay`);
  return res.data;
};

// Confirm cash payment (Driver only)
export const confirmCashPayment = async (orderId) => {
  const res = await api.put(`/orders/${orderId}/confirm-cash`);
  return res.data;
};

// Accept order (Driver only)
export const acceptOrder = async (orderId) => {
  const res = await api.put(`/orders/${orderId}/accept`);
  return res.data;
};

// Reject accepted order (Driver only)
export const rejectAcceptedOrder = async (orderId) => {
  const res = await api.put(`/orders/${orderId}/reject-accepted`);
  return res.data;
};

// Cancel order (Customer only)
export const cancelOrder = async (orderId) => {
  const res = await api.put(`/orders/${orderId}/cancel`);
  return res.data;
};

// Rate driver (Customer only)
export const rateDriver = async (orderId, ratingData) => {
  const res = await api.put(`/orders/${orderId}/rate-driver`, ratingData);
  return res.data;
};

export default {
  createOrder,
  getOrders,
  getOrderById,
  trackOrder,
  updateOrderStatus,
  assignOrder,
  payOrder,
  confirmCashPayment,
  acceptOrder,
  rejectAcceptedOrder,
  cancelOrder,
  rateDriver,
};
