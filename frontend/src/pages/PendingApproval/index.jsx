import React from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../services/authService";
import "./index.css";

export default function PendingApproval() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="pending-approval-page">
      <div className="pending-container">
        <div className="pending-icon-wrapper">
          <div className="pending-icon">⏳</div>
        </div>

        <h1>Application Under Review</h1>
        <p className="pending-message">
          Thank you for registering as a driver with DelivraX!
        </p>

        <div className="info-card">
          <div className="info-item">
            <span className="info-icon">📋</span>
            <div className="info-content">
              <h3>What's Next?</h3>
              <p>Our admin team is reviewing your documents and vehicle details.</p>
            </div>
          </div>

          <div className="info-item">
            <span className="info-icon">⏱️</span>
            <div className="info-content">
              <h3>Review Time</h3>
              <p>This usually takes 24-48 hours. We'll notify you via email once approved.</p>
            </div>
          </div>

          <div className="info-item">
            <span className="info-icon">✅</span>
            <div className="info-content">
              <h3>After Approval</h3>
              <p>You'll be able to log in and start accepting delivery orders immediately.</p>
            </div>
          </div>
        </div>

        <div className="contact-section">
          <p>Have questions? Contact us at:</p>
          <div className="contact-details">
            <a href="mailto:support@delivrax.com">📧 support@delivrax.com</a>
            <a href="tel:+911234567890">📞 +91 123-456-7890</a>
          </div>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}