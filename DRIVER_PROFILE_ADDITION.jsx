// Add this to Driver Dashboard (frontend/src/pages/Dashboard/Driver/index.jsx)

// 1. Add "profile" to activeTab state (around line 16)
const [activeTab, setActiveTab] = useState("home"); // home, available, myorders, earnings, profile

// 2. Add this navigation button (find the navigation section and add after earnings tab)
<button
  className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
  onClick={() => setActiveTab("profile")}
>
  <span className="tab-icon">👤</span>
  <span className="tab-text">My Profile</span>
</button>

// 3. Add this Profile Tab section (after earnings section, before closing main content)
{/* My Profile Tab */}
{activeTab === "profile" && (
  <div className="profile-tab">
    <div className="tab-header">
      <h2>👤 My Profile</h2>
      <p>View your driver information and statistics</p>
    </div>

    <div className="profile-layout">
      {/* Personal Information Card */}
      <div className="profile-main-card">
        <div className="profile-header-section">
          <div className="profile-avatar-xl">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="profile-header-info">
            <h3>{user?.name}</h3>
            <p className="driver-badge">🚗 Professional Driver</p>
            <div className="rating-display">
              <span className="stars">⭐ {stats.averageRating?.toFixed(1) || "N/A"}</span>
              <span className="rating-count">({stats.totalRatings || 0} ratings)</span>
            </div>
          </div>
        </div>

        <div className="profile-details-section">
          <h4>📋 Personal Information</h4>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">📧 Email</span>
              <span className="info-value">{user?.email}</span>
            </div>
            
            <div className="info-item">
              <span className="info-label">📱 Phone</span>
              <span className="info-value">{user?.phone || "Not provided"}</span>
            </div>
            
            <div className="info-item">
              <span className="info-label">🆔 Driver ID</span>
              <span className="info-value">#{user?._id?.slice(-8).toUpperCase()}</span>
            </div>
            
            <div className="info-item">
              <span className="info-label">📅 Joined</span>
              <span className="info-value">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                }) : "N/A"}
              </span>
            </div>
            
            <div className="info-item">
              <span className="info-label">✅ Status</span>
              <span className={`status-badge ${user?.isApproved ? 'approved' : 'pending'}`}>
                {user?.approvalStatus || "Pending"}
              </span>
            </div>
            
            <div className="info-item">
              <span className="info-label">🚦 Duty Status</span>
              <span className={`duty-badge ${isOnDuty ? 'on-duty' : 'off-duty'}`}>
                {isOnDuty ? "On Duty" : "Off Duty"}
              </span>
            </div>
          </div>
        </div>

        {/* Vehicle Information */}
        {user?.driverDetails && (
          <div className="profile-details-section">
            <h4>🚗 Vehicle Information</h4>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">🚙 Vehicle Type</span>
                <span className="info-value">{user.driverDetails.vehicleType || "N/A"}</span>
              </div>
              
              <div className="info-item">
                <span className="info-label">🔢 Vehicle Number</span>
                <span className="info-value">{user.driverDetails.vehicleNumber || "N/A"}</span>
              </div>
              
              <div className="info-item">
                <span className="info-label">🏭 Model</span>
                <span className="info-value">{user.driverDetails.vehicleModel || "N/A"}</span>
              </div>
              
              <div className="info-item">
                <span className="info-label">📅 Year</span>
                <span className="info-value">{user.driverDetails.vehicleYear || "N/A"}</span>
              </div>
              
              {user.driverDetails.licenseNumber && (
                <div className="info-item">
                  <span className="info-label">🪪 License Number</span>
                  <span className="info-value">{user.driverDetails.licenseNumber}</span>
                </div>
              )}
              
              {user.driverDetails.insuranceExpiry && (
                <div className="info-item">
                  <span className="info-label">📄 Insurance Expiry</span>
                  <span className="info-value">
                    {new Date(user.driverDetails.insuranceExpiry).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Performance Statistics */}
      <div className="profile-stats-section">
        <div className="stats-card-profile">
          <h4>📊 Performance Stats</h4>
          <div className="stats-list">
            <div className="stat-row">
              <span className="stat-icon">📦</span>
              <div className="stat-content">
                <span className="stat-label">Total Deliveries</span>
                <span className="stat-number">{stats.totalDeliveries || 0}</span>
              </div>
            </div>
            
            <div className="stat-row">
              <span className="stat-icon">✅</span>
              <div className="stat-content">
                <span className="stat-label">Completed</span>
                <span className="stat-number">{stats.completedDeliveries || 0}</span>
              </div>
            </div>
            
            <div className="stat-row">
              <span className="stat-icon">⭐</span>
              <div className="stat-content">
                <span className="stat-label">Average Rating</span>
                <span className="stat-number">{stats.averageRating?.toFixed(1) || "N/A"}</span>
              </div>
            </div>
            
            <div className="stat-row">
              <span className="stat-icon">💬</span>
              <div className="stat-content">
                <span className="stat-label">Total Ratings</span>
                <span className="stat-number">{stats.totalRatings || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Earnings Summary */}
        <div className="stats-card-profile">
          <h4>💰 Earnings Summary</h4>
          <div className="earnings-list">
            <div className="earning-row">
              <span className="earning-label">Today</span>
              <span className="earning-amount">₹{earnings.today?.toFixed(2) || "0.00"}</span>
            </div>
            
            <div className="earning-row">
              <span className="earning-label">This Week</span>
              <span className="earning-amount">₹{earnings.thisWeek?.toFixed(2) || "0.00"}</span>
            </div>
            
            <div className="earning-row">
              <span className="earning-label">This Month</span>
              <span className="earning-amount">₹{earnings.thisMonth?.toFixed(2) || "0.00"}</span>
            </div>
            
            <div className="earning-row total">
              <span className="earning-label">Total Earnings</span>
              <span className="earning-amount">₹{earnings.total?.toFixed(2) || "0.00"}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-card">
          <h4>⚡ Quick Actions</h4>
          <div className="action-buttons">
            <button 
              className="action-btn"
              onClick={() => setActiveTab("home")}
            >
              <span>🏠</span>
              <span>Dashboard</span>
            </button>
            
            <button 
              className="action-btn"
              onClick={() => setActiveTab("myorders")}
            >
              <span>📦</span>
              <span>My Orders</span>
            </button>
            
            <button 
              className="action-btn"
              onClick={() => setActiveTab("earnings")}
            >
              <span>💰</span>
              <span>Earnings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
