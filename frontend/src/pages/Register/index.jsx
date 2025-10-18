import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../../services/authService";
import "./index.css";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Customer",
    adminCode: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState(null);
  const [touchedFields, setTouchedFields] = useState({});

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If driver is selected, redirect to driver registration
    if (name === "role" && value === "Driver") {
      navigate("/register/driver");
      return;
    }
    
    setFormData({ ...formData, [name]: value });
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

    // Validation
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    if (formData.role === "Admin" && !formData.adminCode) {
      setError("Admin code is required for admin registration");
      setLoading(false);
      return;
    }

    try {
      await register(formData);
      
      // Success animation
      const successMsg = document.createElement("div");
      successMsg.className = "success-toast";
      successMsg.innerHTML = "✅ Registration Successful! Redirecting to login...";
      document.body.appendChild(successMsg);

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    {
      value: "Customer",
      icon: "👤",
      title: "Customer",
      desc: "Order deliveries and track packages",
    },
    {
      value: "Driver",
      icon: "🚗",
      title: "Driver",
      desc: "Deliver packages and earn money",
      special: true, // Mark as special to redirect
    },
    {
      value: "Admin",
      icon: "🛠️",
      title: "Admin",
      desc: "Manage platform and operations",
    },
  ];

  return (
    <div className="register-page">
      <div className="register-container">
        {/* Left Side - Branding */}
        <div className="register-left">
          <div className="brand-content">
            <div className="brand-logo">
              <span className="brand-icon">🚚</span>
              <span className="brand-name">DelivraX</span>
            </div>
            <h1 className="brand-title">Join Our Delivery Network</h1>
            <p className="brand-subtitle">
              Whether you're a customer looking for fast delivery or a driver wanting to earn,
              we've got you covered!
            </p>

            <div className="stats-showcase">
              <div className="stat-box">
                <div className="stat-number">10K+</div>
                <div className="stat-label">Happy Customers</div>
              </div>
              <div className="stat-box">
                <div className="stat-number">500+</div>
                <div className="stat-label">Active Drivers</div>
              </div>
              <div className="stat-box">
                <div className="stat-number">4.8⭐</div>
                <div className="stat-label">Average Rating</div>
              </div>
            </div>

            <div className="features-showcase">
              <div className="showcase-item">
                <span className="showcase-icon">⚡</span>
                <span>Lightning Fast Delivery</span>
              </div>
              <div className="showcase-item">
                <span className="showcase-icon">📱</span>
                <span>Real-Time Tracking</span>
              </div>
              <div className="showcase-item">
                <span className="showcase-icon">💰</span>
                <span>Best Prices</span>
              </div>
              <div className="showcase-item">
                <span className="showcase-icon">🔒</span>
                <span>100% Secure</span>
              </div>
            </div>
          </div>

          <div className="decorative-elements">
            <div className="deco-circle deco-1"></div>
            <div className="deco-circle deco-2"></div>
            <div className="deco-circle deco-3"></div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="register-right">
          <div className="form-container">
            <div className="form-header">
              <h2 className="form-title">Create Account</h2>
              <p className="form-subtitle">Fill in your details to get started</p>
            </div>

            <form onSubmit={handleSubmit} className="register-form">
              {error && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  {error}
                </div>
              )}

              <div className="input-group">
                <label htmlFor="name">Full Name</label>
                <div className={`input-wrapper ${getInputClass('name')}`}>
                  <span className="input-icon">👤</span>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    onFocus={() => handleFocus('name')}
                    onBlur={() => handleBlur('name')}
                    required
                  />
                </div>
              </div>

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
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => handleFocus('password')}
                    onBlur={() => handleBlur('password')}
                    required
                  />
                </div>
                <small className="input-hint">Minimum 6 characters</small>
              </div>

              <div className="input-group">
                <label>Select Your Role</label>
                <div className="role-selector">
                  {roleOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`role-card ${
                        formData.role === option.value ? "selected" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={option.value}
                        checked={formData.role === option.value}
                        onChange={handleChange}
                      />
                      <div className="role-content">
                        <span className="role-icon">{option.icon}</span>
                        <div className="role-info">
                          <div className="role-title">{option.title}</div>
                          <div className="role-desc">{option.desc}</div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {formData.role === "Admin" && (
                <div className="input-group admin-code-group">
                  <label htmlFor="adminCode">Admin Code</label>
                  <div className={`input-wrapper ${getInputClass('adminCode')}`}>
                    <span className="input-icon">🔑</span>
                    <input
                      type="text"
                      id="adminCode"
                      name="adminCode"
                      placeholder="Enter admin code"
                      value={formData.adminCode}
                      onChange={handleChange}
                      onFocus={() => handleFocus('adminCode')}
                      onBlur={() => handleBlur('adminCode')}
                      required
                    />
                  </div>
                  <small className="input-hint">Contact support for admin code</small>
                </div>
              )}

              <button type="submit" className="register-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <span className="btn-arrow">→</span>
                  </>
                )}
              </button>

              <p className="login-link">
                Already have an account?{" "}
                <Link to="/login">Sign In</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}