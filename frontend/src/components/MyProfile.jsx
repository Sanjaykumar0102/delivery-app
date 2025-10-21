import React, { useState } from "react";
import Cookies from "js-cookie";
import axios from "../utils/axios";
import "./MyProfile.css";

const MyProfile = ({ user, onUpdate, realTimeStats }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    vehicleType: user?.driverDetails?.vehicleType || "",
    vehicleNumber: user?.driverDetails?.vehicleNumber || "",
    vehicleModel: user?.driverDetails?.vehicleModel || "",
    licenseNumber: user?.driverDetails?.licenseNumber || "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const updateData = {
        name: formData.name,
        phone: formData.phone,
      };

      // Add driver-specific fields if user is a driver
      if (user.role === "Driver") {
        updateData.driverDetails = {
          vehicleType: formData.vehicleType,
          vehicleNumber: formData.vehicleNumber,
          vehicleModel: formData.vehicleModel,
          licenseNumber: formData.licenseNumber,
        };
      }

      const response = await axios.put("/users/profile", updateData);
      
      // Update cookie with new user data
      const updatedUser = { ...user, ...response.data };
      Cookies.set("user", JSON.stringify(updatedUser), { expires: 30 });
      
      setMessage("✅ Profile updated successfully!");
      setIsEditing(false);
      
      if (onUpdate) {
        onUpdate(updatedUser);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("❌ " + (error.response?.data?.message || "Failed to update profile"));
    } finally {
      setLoading(false);
    }
  };

  const vehicleTypes = ["Bike", "Auto", "Mini Truck", "Truck"];

  return (
    <div className="my-profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          {user?.name?.charAt(0).toUpperCase() || "U"}
        </div>
        <div className="profile-title">
          <h2>{user?.name}</h2>
          <p className="profile-role">{user?.role}</p>
        </div>
        {!isEditing && (
          <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
            ✏️ Edit Profile
          </button>
        )}
      </div>

      {message && (
        <div className={`profile-message ${message.includes("✅") ? "success" : "error"}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="profile-form">
        {/* Basic Information */}
        <div className="profile-section">
          <h3>📋 Basic Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!isEditing}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="disabled-input"
              />
              <small>Email cannot be changed</small>
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Enter phone number"
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <input
                type="text"
                value={user?.role}
                disabled
                className="disabled-input"
              />
            </div>
          </div>
        </div>

        {/* Driver-specific Information */}
        {user?.role === "Driver" && (
          <>
            <div className="profile-section">
              <h3>🚗 Vehicle Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Vehicle Type</label>
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleChange}
                    disabled={!isEditing}
                    required
                  >
                    <option value="">Select Vehicle Type</option>
                    {vehicleTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Vehicle Number</label>
                  <input
                    type="text"
                    name="vehicleNumber"
                    value={formData.vehicleNumber}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="e.g., TS09EA1234"
                  />
                </div>
                <div className="form-group">
                  <label>Vehicle Model</label>
                  <input
                    type="text"
                    name="vehicleModel"
                    value={formData.vehicleModel}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="e.g., Honda Activa"
                  />
                </div>
                <div className="form-group">
                  <label>License Number</label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="e.g., DL1234567890"
                  />
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h3>📊 Driver Stats</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-title">Total Deliveries</div>
                  <div className="stat-icon">🚚</div>
                  <div className="stat-value">{user?.stats?.totalDeliveries || 0}</div>
                  <div className="stat-label">Deliveries Completed</div>
                  <div className="stat-description">Total successful deliveries made</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">Average Rating</div>
                  <div className="stat-icon">⭐</div>
                  <div className="stat-value">{user?.stats?.averageRating?.toFixed(1) || "0.0"}</div>
                  <div className="stat-label">Customer Rating</div>
                  <div className="stat-description">Average rating from customers</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">Total Earnings</div>
                  <div className="stat-icon">💰</div>
                  <div className="stat-value currency-value">₹{user?.earnings?.totalEarnings?.toFixed(2) || "0.00"}</div>
                  <div className="stat-label">Total Earned</div>
                  <div className="stat-description">Money earned from deliveries</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">Current Status</div>
                  <div className="stat-icon">{user?.isOnDuty ? "🟢" : "🔴"}</div>
                  <div className={`stat-value status-value ${user?.isOnDuty ? 'active-status' : 'inactive-status'}`}>
                    {user?.isOnDuty ? "On Duty" : "Off Duty"}
                  </div>
                  <div className="stat-label">Duty Status</div>
                  <div className="stat-description">{user?.isOnDuty ? "Currently available for deliveries" : "Currently not accepting orders"}</div>
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h3>✅ Approval Status</h3>
              <div className="approval-status">
                <div className={`status-badge ${user?.isApproved ? "approved" : "pending"}`}>
                  {user?.isApproved ? "✅ Approved" : "⏳ Pending Approval"}
                </div>
                {!user?.isApproved && (
                  <p className="approval-note">
                    Your account is pending admin approval. You'll be notified once approved.
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Customer-specific Information */}
        {user?.role === "Customer" && (
          <div className="profile-section">
            <h3>📊 Order Stats</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-title">Total Orders</div>
                <div className="stat-icon">📦</div>
                <div className="stat-value">{realTimeStats?.totalOrders || user?.stats?.totalOrders || 0}</div>
                {/* <div className="stat-label">Total Orders Placed</div> */}
                <div className="stat-description">All orders you've created</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Completed</div>
                <div className="stat-icon">✅</div>
                <div className="stat-value">{realTimeStats?.completedOrders || user?.stats?.completedOrders || 0}</div>
                {/* <div className="stat-label">Successfully Delivered</div> */}
                <div className="stat-description">Orders completed successfully</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Total Spent</div>
                <div className="stat-icon">💰</div>
                <div className="stat-value currency-value">₹{realTimeStats?.totalSpent || user?.stats?.totalSpent?.toFixed(2) || "0.00"}</div>
                {/* <div className="stat-label">Total Amount Spent</div> */}
                <div className="stat-description">Money spent on deliveries</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Account Status</div>
                <div className="stat-icon">🎯</div>
                <div className={`stat-value status-value ${user?.isActive ? 'active-status' : 'inactive-status'}`}>
                  {user?.isActive ? "Active" : "Inactive"}
                </div>
                {/* <div className="stat-label">Account Status</div> */}
                <div className="stat-description">{user?.isActive ? "Account is active and can place orders" : "Account is inactive"}</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {isEditing && (
          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  name: user?.name || "",
                  email: user?.email || "",
                  phone: user?.phone || "",
                  vehicleType: user?.driverDetails?.vehicleType || "",
                  vehicleNumber: user?.driverDetails?.vehicleNumber || "",
                  vehicleModel: user?.driverDetails?.vehicleModel || "",
                  licenseNumber: user?.driverDetails?.licenseNumber || "",
                });
                setMessage("");
              }}
            >
              Cancel
            </button>
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? "Saving..." : "💾 Save Changes"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default MyProfile;
