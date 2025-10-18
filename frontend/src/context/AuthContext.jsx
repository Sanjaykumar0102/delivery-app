// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import { logout as logoutService } from "../services/authService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // try to restore user info from cookie (if backend sends user details in a cookie or separate API)
    const savedUser = Cookies.get("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const login = (data) => {
    setUser(data.user);
    // store user in cookie (backend already stores JWT token cookie)
    Cookies.set("user", JSON.stringify(data.user));
  };

  const logout = async () => {
    await logoutService();
    setUser(null);
    Cookies.remove("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
