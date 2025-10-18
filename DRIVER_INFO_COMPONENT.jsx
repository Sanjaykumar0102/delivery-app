// Enhanced Driver Info Component for Customer Dashboard
// Add this to CustomerDashboard.jsx in the orders section

// When displaying order details, replace the simple driver name with this component:

{/* Driver Information Card - Add this in the order details section */}
{order.driver && (
  <div className="driver-info-card">
    <div className="driver-info-header">
      <h4>🚗 Your Driver</h4>
      <span className={`driver-status ${order.status === "In-Transit" ? "active" : ""}`}>
        {order.status === "In-Transit" ? "🟢 On the way" : "📍 " + order.status}
      </span>
    </div>
    
    <div className="driver-details-content">
      {/* Driver Avatar and Basic Info */}
      <div className="driver-profile-section">
        <div className="driver-avatar-circle">
          {order.driver.name?.charAt(0).toUpperCase()}
        </div>
        <div className="driver-basic-info">
          <h5 className="driver-name">{order.driver.name}</h5>
          {order.driver.stats?.averageRating && (
            <div className="driver-rating">
              <span className="stars">⭐ {order.driver.stats.averageRating.toFixed(1)}</span>
              <span className="rating-count">
                ({order.driver.stats.totalRatings || 0} ratings)
              </span>
            </div>
          )}
          <p className="driver-deliveries">
            📦 {order.driver.stats?.completedDeliveries || 0} completed deliveries
          </p>
        </div>
      </div>

      {/* Contact Information */}
      <div className="driver-contact-section">
        <div className="contact-item">
          <span className="contact-label">📱 Phone</span>
          <span className="contact-value">{order.driver.phone || "Not available"}</span>
        </div>
        
        <div className="contact-item">
          <span className="contact-label">📧 Email</span>
          <span className="contact-value">{order.driver.email}</span>
        </div>
      </div>

      {/* Vehicle Information */}
      {order.vehicle && (
        <div className="vehicle-info-section">
          <h5>🚙 Vehicle Details</h5>
          <div className="vehicle-details-grid">
            <div className="vehicle-detail">
              <span className="detail-label">Type</span>
              <span className="detail-value">{order.vehicle.type || order.vehicleType}</span>
            </div>
            <div className="vehicle-detail">
              <span className="detail-label">Plate Number</span>
              <span className="detail-value">{order.vehicle.plateNumber || "N/A"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="driver-actions">
        {order.driver.phone && (
          <a 
            href={`tel:${order.driver.phone}`}
            className="call-driver-btn"
          >
            <span className="btn-icon">📞</span>
            <span className="btn-text">Call Driver</span>
          </a>
        )}
        
        {["Accepted", "Arrived", "Picked-Up", "In-Transit"].includes(order.status) && (
          <button
            className="track-driver-btn"
            onClick={() => navigate(`/track-order/${order._id}`)}
          >
            <span className="btn-icon">📍</span>
            <span className="btn-text">Track Live</span>
          </button>
        )}
      </div>
    </div>
  </div>
)}

// Alternative: Compact Driver Info (for list view)
{order.driver && (
  <div className="driver-info-compact">
    <div className="driver-compact-left">
      <div className="driver-avatar-small">
        {order.driver.name?.charAt(0).toUpperCase()}
      </div>
      <div className="driver-compact-details">
        <p className="driver-compact-name">{order.driver.name}</p>
        <p className="driver-compact-rating">
          ⭐ {order.driver.stats?.averageRating?.toFixed(1) || "N/A"}
        </p>
      </div>
    </div>
    <div className="driver-compact-actions">
      {order.driver.phone && (
        <a 
          href={`tel:${order.driver.phone}`}
          className="call-btn-compact"
          title="Call Driver"
        >
          📞
        </a>
      )}
      <button
        className="info-btn-compact"
        onClick={() => setSelectedOrder(order)}
        title="View Details"
      >
        ℹ️
      </button>
    </div>
  </div>
)}

// Driver Info Modal (for detailed view)
{selectedOrder && selectedOrder.driver && (
  <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
    <div className="modal-content driver-modal" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h3>🚗 Driver Information</h3>
        <button className="close-btn" onClick={() => setSelectedOrder(null)}>
          ✕
        </button>
      </div>
      
      <div className="modal-body">
        {/* Driver Profile */}
        <div className="driver-modal-profile">
          <div className="driver-avatar-large">
            {selectedOrder.driver.name?.charAt(0).toUpperCase()}
          </div>
          <h4>{selectedOrder.driver.name}</h4>
          {selectedOrder.driver.stats?.averageRating && (
            <div className="driver-modal-rating">
              <span className="stars-large">⭐ {selectedOrder.driver.stats.averageRating.toFixed(1)}</span>
              <span className="rating-text">
                Based on {selectedOrder.driver.stats.totalRatings || 0} ratings
              </span>
            </div>
          )}
        </div>

        {/* Contact Details */}
        <div className="driver-modal-section">
          <h5>📞 Contact Information</h5>
          <div className="contact-details">
            <div className="contact-row">
              <span className="label">Phone:</span>
              <span className="value">{selectedOrder.driver.phone || "Not available"}</span>
            </div>
            <div className="contact-row">
              <span className="label">Email:</span>
              <span className="value">{selectedOrder.driver.email}</span>
            </div>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="driver-modal-section">
          <h5>📊 Performance</h5>
          <div className="performance-stats">
            <div className="stat-box">
              <span className="stat-number">{selectedOrder.driver.stats?.completedDeliveries || 0}</span>
              <span className="stat-label">Completed Deliveries</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{selectedOrder.driver.stats?.totalDeliveries || 0}</span>
              <span className="stat-label">Total Deliveries</span>
            </div>
          </div>
        </div>

        {/* Vehicle Info */}
        {selectedOrder.vehicle && (
          <div className="driver-modal-section">
            <h5>🚙 Vehicle Details</h5>
            <div className="vehicle-details">
              <div className="vehicle-row">
                <span className="label">Type:</span>
                <span className="value">{selectedOrder.vehicle.type || selectedOrder.vehicleType}</span>
              </div>
              <div className="vehicle-row">
                <span className="label">Plate Number:</span>
                <span className="value">{selectedOrder.vehicle.plateNumber || "N/A"}</span>
              </div>
              {selectedOrder.vehicle.capacity && (
                <div className="vehicle-row">
                  <span className="label">Capacity:</span>
                  <span className="value">{selectedOrder.vehicle.capacity} kg</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Order Status */}
        <div className="driver-modal-section">
          <h5>📦 Order Status</h5>
          <div className="order-status-info">
            <span className={`status-badge-large ${selectedOrder.status.toLowerCase()}`}>
              {selectedOrder.status}
            </span>
            {selectedOrder.status === "In-Transit" && (
              <p className="status-message">Your driver is on the way to delivery location</p>
            )}
            {selectedOrder.status === "Picked-Up" && (
              <p className="status-message">Package picked up and ready for delivery</p>
            )}
            {selectedOrder.status === "Arrived" && (
              <p className="status-message">Driver has arrived at pickup location</p>
            )}
          </div>
        </div>
      </div>

      <div className="modal-footer">
        {selectedOrder.driver.phone && (
          <a 
            href={`tel:${selectedOrder.driver.phone}`}
            className="btn-primary-large"
          >
            📞 Call Driver
          </a>
        )}
        {["Accepted", "Arrived", "Picked-Up", "In-Transit"].includes(selectedOrder.status) && (
          <button
            className="btn-secondary-large"
            onClick={() => {
              setSelectedOrder(null);
              navigate(`/track-order/${selectedOrder._id}`);
            }}
          >
            📍 Track Live
          </button>
        )}
      </div>
    </div>
  </div>
)}
