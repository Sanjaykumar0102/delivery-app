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

// Get current user profile
export const getCurrentUser = async () => {
  const res = await api.get("/users/profile");
  return res.data;
};

// Refresh user data in cookies
export const refreshUserData = async () => {
  try {
    const userData = await getCurrentUser();

    const user = {
      _id: userData._id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      isApproved: userData.isApproved,
      approvalStatus: userData.approvalStatus,
      isActive: userData.isActive,
      deactivationReason: userData.deactivationReason,
      isOnDuty: userData.isOnDuty,
      driverDetails: userData.driverDetails,
      earnings: userData.earnings,
      stats: userData.stats
    };

    Cookies.set("user", JSON.stringify(user), { expires: 30 });
    return user;
  } catch (error) {
    console.error("Error refreshing user data:", error);
    throw error;
  }
};

// Logout user
export const logout = () => {
  Cookies.remove("token");
  Cookies.remove("user");
};
