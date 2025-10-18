// Add this to CustomerDashboard.jsx

// 1. Add "profile" to activeTab state options (line 15)
const [activeTab, setActiveTab] = useState("book"); // book, orders, track, profile

// 2. Add this navigation button in the nav section (after track button, around line 407)
<button
  className={`nav-btn-v2 ${activeTab === "profile" ? "active" : ""}`}
  onClick={() => setActiveTab("profile")}
>
  <span className="nav-icon">👤</span>
  <span className="nav-text">My Profile</span>
</button>

// 3. Add this Profile Tab section in main content (after track section, before closing main tag)
{/* My Profile Tab */}
{activeTab === "profile" && (
  <div className="profile-section-v2">
    <div className="section-header-v2">
      <h2>👤 My Profile</h2>
      <p>View and manage your account information</p>
    </div>

    <div className="profile-container">
      {/* Profile Card */}
      <div className="profile-card">
        <div className="profile-avatar-large">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        
        <div className="profile-info-section">
          <h3 className="profile-name">{user?.name}</h3>
          <p className="profile-role">Customer Account</p>
          
          <div className="profile-details-grid">
            <div className="profile-detail-item">
              <span className="detail-label">📧 Email</span>
              <span className="detail-value">{user?.email}</span>
            </div>
            
            <div className="profile-detail-item">
              <span className="detail-label">📱 Phone</span>
              <span className="detail-value">{user?.phone || "Not provided"}</span>
            </div>
            
            <div className="profile-detail-item">
              <span className="detail-label">🆔 Customer ID</span>
              <span className="detail-value">#{user?._id?.slice(-8).toUpperCase()}</span>
            </div>
            
            <div className="profile-detail-item">
              <span className="detail-label">📅 Member Since</span>
              <span className="detail-value">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Order Statistics */}
      <div className="stats-card">
        <h3>📊 Order Statistics</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-icon">📦</div>
            <div className="stat-info">
              <span className="stat-value">{orders.length}</span>
              <span className="stat-label">Total Orders</span>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <span className="stat-value">
                {orders.filter(o => o.status === "Delivered").length}
              </span>
              <span className="stat-label">Completed</span>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon">🚚</div>
            <div className="stat-info">
              <span className="stat-value">
                {orders.filter(o => 
                  ["Assigned", "Accepted", "Arrived", "Picked-Up", "In-Transit"].includes(o.status)
                ).length}
              </span>
              <span className="stat-label">Active</span>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon">⏳</div>
            <div className="stat-info">
              <span className="stat-value">
                {orders.filter(o => o.status === "Pending").length}
              </span>
              <span className="stat-label">Pending</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="activity-card">
        <h3>🕐 Recent Activity</h3>
        {orders.length === 0 ? (
          <div className="empty-activity">
            <p>No orders yet. Book your first delivery!</p>
            <button 
              className="btn-primary"
              onClick={() => setActiveTab("book")}
            >
              📦 Book Delivery
            </button>
          </div>
        ) : (
          <div className="activity-list">
            {orders.slice(0, 5).map((order) => (
              <div key={order._id} className="activity-item">
                <div className="activity-icon">
                  {order.status === "Delivered" ? "✅" : 
                   order.status === "Cancelled" ? "❌" : "🚚"}
                </div>
                <div className="activity-details">
                  <p className="activity-title">
                    Order #{order._id.slice(-6)} - {order.status}
                  </p>
                  <p className="activity-subtitle">
                    {order.pickup?.address} → {order.dropoff?.address}
                  </p>
                  <p className="activity-time">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="activity-amount">
                  ₹{order.fare}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
)}
