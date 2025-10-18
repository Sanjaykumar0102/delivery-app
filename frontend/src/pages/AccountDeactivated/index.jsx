import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../services/authService";
import Cookies from "js-cookie";
import "./index.css";

export default function AccountDeactivated() {
  const navigate = useNavigate();
  const [deactivationReason, setDeactivationReason] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    // Get user data from cookies
    const userCookie = Cookies.get("user");
    if (userCookie) {
      try {
        const user = JSON.parse(userCookie);
        setUserName(user.name || "User");
        setDeactivationReason(user.deactivationReason || "No reason provided");
      } catch (error) {
        console.error("Error parsing user cookie:", error);
      }
    }
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="deactivated-page">
      <div className="deactivated-container">
        <div className="deactivated-icon-wrapper">
          <div className="deactivated-icon">🚫</div>
        </div>

        <h1>Account Deactivated</h1>
        <p className="deactivated-subtitle">
          Hello {userName}, your account has been temporarily deactivated.
        </p>

        {deactivationReason && (
          <div className="reason-card">
            <h3>📋 Reason for Deactivation:</h3>
            <p className="reason-text">{deactivationReason}</p>
          </div>
        )}

        <div className="info-card">
          <div className="info-item">
            <span className="info-icon">⚠️</span>
            <div className="info-content">
              <h3>Account Status</h3>
              <p>Your driver account has been temporarily deactivated by the administrator. You cannot access the dashboard until your account is reactivated.</p>
            </div>
          </div>

          <div className="info-item">
            <span className="info-icon">📞</span>
            <div className="info-content">
              <h3>What should I do?</h3>
              <p>Please contact our support team to discuss the deactivation reason and steps to reactivate your account.</p>
            </div>
          </div>

          <div className="info-item">
            <span className="info-icon">🔄</span>
            <div className="info-content">
              <h3>Reactivation Process</h3>
              <p>Once the issue is resolved, an administrator will reactivate your account and you'll receive an email notification.</p>
            </div>
          </div>
        </div>

        <div className="contact-section">
          <p className="contact-title">Need Help? Contact Support:</p>
          <div className="contact-details">
            <a href="mailto:support@delivrax.com" className="contact-link">
              <span className="contact-icon">📧</span>
              support@delivrax.com
            </a>
            <a href="tel:+911234567890" className="contact-link">
              <span className="contact-icon">📞</span>
              +91 123-456-7890
            </a>
          </div>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          <span className="btn-icon">🚪</span>
          Logout
        </button>
      </div>
    </div>
  );
}
