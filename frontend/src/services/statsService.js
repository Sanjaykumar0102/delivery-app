// src/services/statsService.js
import api from "../utils/axios";

// Get statistics overview
export const getStatsOverview = async (period = "all") => {
  const res = await api.get(`/stats/overview?period=${period}`);
  return res.data;
};

// Get orders timeline data for charts
export const getOrdersTimeline = async (period = "month") => {
  const res = await api.get(`/stats/orders-timeline?period=${period}`);
  return res.data;
};

// Get revenue analytics
export const getRevenueAnalytics = async (period = "month") => {
  const res = await api.get(`/stats/revenue?period=${period}`);
  return res.data;
};
