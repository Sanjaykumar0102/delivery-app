// src/services/authService.js
import api from "../utils/axios";
import Cookies from "js-cookie";

// Register user
export const register = async (userData) => {
  const res = await api.post("/users/register", userData, { withCredentials: true });
  
  // Store in cookies (backend already sets them)
  if (res.data.token) {
    Cookies.set("token", res.data.token, { expires: 30 });
  }
  if (res.data.user) {
    Cookies.set("user", JSON.stringify(res.data.user), { expires: 30 });
  }
  
  return res.data;
};

// Login user
export const login = async (userData) => {
  const res = await api.post("/users/login", userData, { withCredentials: true });

  // Store in cookies (backend already sets them)
  if (res.data.token) {
    Cookies.set("token", res.data.token, { expires: 30 });
  }
  
  const user = {
    _id: res.data._id,
    name: res.data.name,
    email: res.data.email,
    role: res.data.role,
    isApproved: res.data.isApproved,
    approvalStatus: res.data.approvalStatus,
    isActive: res.data.isActive,
    deactivationReason: res.data.deactivationReason,
    isOnDuty: res.data.isOnDuty,
    driverDetails: res.data.driverDetails,
    earnings: res.data.earnings,
    stats: res.data.stats
  };
  
  Cookies.set("user", JSON.stringify(user), { expires: 30 });

  return { ...res.data, user };
};

// Logout user
export const logout = () => {
  Cookies.remove("token");
  Cookies.remove("user");
};
