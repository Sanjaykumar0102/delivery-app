// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DriverRegistration from "./pages/Register/DriverRegistration";
import PendingApproval from "./pages/PendingApproval";
import AccountDeactivated from "./pages/AccountDeactivated";
import AdminDashboard from "./pages/Dashboard/Admin";
import DriverDashboard from "./pages/Dashboard/Driver";
import CustomerDashboard from "./pages/Dashboard/Customer";
import TrackOrder from "./pages/TrackOrder";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Home/Landing Page */}
        <Route path="/" element={<Home />} />

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register/driver" element={<DriverRegistration />} />
        <Route path="/pending-approval" element={<PendingApproval />} />
        <Route path="/account-deactivated" element={<AccountDeactivated />} />

        {/* Protected Dashboard Routes */}
        <Route 
          path="/dashboard/admin" 
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/driver" 
          element={
            <ProtectedRoute allowedRoles={["Driver"]}>
              <DriverDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/customer" 
          element={
            <ProtectedRoute allowedRoles={["Customer"]}>
              <CustomerDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Track Order Route */}
        <Route 
          path="/track-order/:orderId" 
          element={
            <ProtectedRoute allowedRoles={["Customer"]}>
              <TrackOrder />
            </ProtectedRoute>
          } 
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}