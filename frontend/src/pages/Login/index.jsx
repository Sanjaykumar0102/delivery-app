import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../../services/authService";
import "./index.css";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState(null);
  const [touchedFields, setTouchedFields] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleFocus = (fieldName) => {
    setFocusedField(fieldName);
  };

  const handleBlur = (fieldName) => {
    setFocusedField(null);
    setTouchedFields({ ...touchedFields, [fieldName]: true });
  };

  const getInputClass = (fieldName) => {
    const isFocused = focusedField === fieldName;
    const isTouched = touchedFields[fieldName];
    const hasValue = formData[fieldName] && formData[fieldName].length > 0;
    
    return `${isFocused ? 'focused' : ''} ${isTouched && hasValue ? 'filled' : ''} ${isTouched && !hasValue ? 'empty-touched' : ''}`.trim();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await login(formData);
      console.log("Login success:", res);

      const role = res?.user?.role || res?.role;
      const isApproved = res?.user?.isApproved !== undefined ? res.user.isApproved : res?.isApproved;
      const approvalStatus = res?.user?.approvalStatus || res?.approvalStatus;
      const isActive = res?.user?.isActive !== undefined ? res.user.isActive : res?.isActive;
      
      if (!role) throw new Error("Role missing in response");

      // Check if account is deactivated
      if (isActive === false) {
        navigate("/account-deactivated");
        return;
      }

      // Check if driver is pending approval
      if (role === "Driver" && !isApproved && approvalStatus === "Pending") {
        navigate("/pending-approval");
        return;
      }

      // Check if driver is rejected
      if (role === "Driver" && approvalStatus === "Rejected") {
        setError("Your driver application has been rejected. Please contact support.");
        return;
      }

      // Success animation
      const successMsg = document.createElement("div");
      successMsg.className = "success-toast";
      successMsg.innerHTML = "✅ Login Successful!";
      document.body.appendChild(successMsg);

      // Remove toast after 2 seconds
      setTimeout(() => {
        successMsg.remove();
      }, 2000);

      setTimeout(() => {
        if (role === "Admin") navigate("/dashboard/admin");
        else if (role === "Driver") navigate("/dashboard/driver");
        else navigate("/dashboard/customer");
      }, 1000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left Side - Form */}
        <div className="login-left">
          <div className="login-header">
            <div className="logo-section">
              <span className="logo-icon">🚚</span>
              <span className="logo-text">DelivraX</span>
            </div>
            <h2 className="login-title">Welcome Back!</h2>
            <p className="login-subtitle">Sign in to continue your delivery journey</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <div className={`input-wrapper ${getInputClass('email')}`}>
                <span className="input-icon">📧</span>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => handleFocus('email')}
                  onBlur={() => handleBlur('email')}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className={`input-wrapper ${getInputClass('password')}`}>
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => handleFocus('password')}
                  onBlur={() => handleBlur('password')}
                  required
                />
              </div>
            </div>

            <div className="form-options">
              <a href="#forgot" className="forgot-link">
                Forgot Password?
              </a>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <span className="btn-arrow">→</span>
                </>
              )}
            </button>


            <p className="signup-link">
              Don't have an account?{" "}
              <Link to="/register">Create Account</Link>
            </p>
          </form>
        </div>

        {/* Right Side - Welcome Section */}
        <div className="login-right">
          <div className="welcome-content">
            <div className="welcome-animation">
              <div className="delivery-truck">🚚</div>
              <div className="delivery-path"></div>
              <div className="delivery-marker">📍</div>
            </div>
            <h1 className="welcome-title">Fast & Reliable Delivery</h1>
            <p className="welcome-text">
              Track your deliveries in real-time, manage orders, and enjoy seamless logistics
            </p>
            <div className="features-list">
              <div className="feature-item">
                <span className="feature-icon">⚡</span>
                <span>Lightning Fast Delivery</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📱</span>
                <span>Real-Time Tracking</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">💰</span>
                <span>Best Prices Guaranteed</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔒</span>
                <span>100% Secure & Safe</span>
              </div>
            </div>
          </div>
          <div className="decorative-circles">
            <div className="circle circle-1"></div>
            <div className="circle circle-2"></div>
            <div className="circle circle-3"></div>
          </div>
        </div>
      </div>
    </div>
  );
}