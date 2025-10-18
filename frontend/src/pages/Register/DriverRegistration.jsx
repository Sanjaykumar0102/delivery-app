import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../../services/authService";
import "./DriverRegistration.css";

export default function DriverRegistration() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Basic Info
  const [basicInfo, setBasicInfo] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  // Step 2: Documents
  const [documents, setDocuments] = useState({
    licenseNumber: "",
    licenseExpiry: "",
    panNumber: "",
    aadharNumber: "",
  });

  // Step 3: Vehicle Details
  const [vehicleDetails, setVehicleDetails] = useState({
    vehicleType: "",
    vehicleNumber: "",
    vehicleModel: "",
    vehicleYear: "",
    insuranceExpiry: "",
  });

  const vehicleTypes = [
    { type: "Bike", icon: "🏍️", capacity: "20kg", desc: "Two-wheeler delivery" },
    { type: "Auto", icon: "🛺", capacity: "50kg", desc: "Auto rickshaw" },
    { type: "Mini Truck", icon: "🚐", capacity: "500kg", desc: "Small commercial vehicle" },
    { type: "Large Truck", icon: "🚚", capacity: "2000kg", desc: "Heavy goods vehicle" },
  ];

  const handleBasicInfoChange = (e) => {
    setBasicInfo({ ...basicInfo, [e.target.name]: e.target.value });
    setError("");
  };

  const handleDocumentsChange = (e) => {
    setDocuments({ ...documents, [e.target.name]: e.target.value });
    setError("");
  };

  const handleVehicleChange = (e) => {
    setVehicleDetails({ ...vehicleDetails, [e.target.name]: e.target.value });
    setError("");
  };

  const validateStep1 = () => {
    if (!basicInfo.name || !basicInfo.email || !basicInfo.password || !basicInfo.phone) {
      setError("Please fill all basic information fields");
      return false;
    }
    if (basicInfo.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (basicInfo.phone.length !== 10) {
      setError("Phone number must be 10 digits");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!documents.licenseNumber || !documents.licenseExpiry || !documents.panNumber || !documents.aadharNumber) {
      setError("Please fill all document details");
      return false;
    }
    if (documents.aadharNumber.length !== 12) {
      setError("Aadhar number must be 12 digits");
      return false;
    }
    if (documents.panNumber.length !== 10) {
      setError("PAN number must be 10 characters");
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!vehicleDetails.vehicleType || !vehicleDetails.vehicleNumber || !vehicleDetails.vehicleModel || !vehicleDetails.vehicleYear || !vehicleDetails.insuranceExpiry) {
      setError("Please fill all vehicle details");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
      setError("");
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
      setError("");
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep3()) return;

    setLoading(true);
    setError("");

    try {
      const registrationData = {
        ...basicInfo,
        role: "Driver",
        driverDetails: {
          ...documents,
          ...vehicleDetails,
        },
      };

      await register(registrationData);

      // Success message
      const successMsg = document.createElement("div");
      successMsg.className = "success-toast";
      successMsg.innerHTML = "✅ Registration Submitted! Waiting for admin approval...";
      document.body.appendChild(successMsg);

      // Remove toast after 3 seconds
      setTimeout(() => {
        successMsg.remove();
      }, 3000);

      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      setError(error.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = () => (
    <div className="progress-bar-container">
      <div className="progress-steps">
        <div className={`progress-step ${currentStep >= 1 ? "active" : ""} ${currentStep > 1 ? "completed" : ""}`}>
          <div className="step-circle">
            {currentStep > 1 ? "✓" : "1"}
          </div>
          <span className="step-label">Basic Info</span>
        </div>
        <div className={`progress-line ${currentStep > 1 ? "completed" : ""}`}></div>
        <div className={`progress-step ${currentStep >= 2 ? "active" : ""} ${currentStep > 2 ? "completed" : ""}`}>
          <div className="step-circle">
            {currentStep > 2 ? "✓" : "2"}
          </div>
          <span className="step-label">Documents</span>
        </div>
        <div className={`progress-line ${currentStep > 2 ? "completed" : ""}`}></div>
        <div className={`progress-step ${currentStep >= 3 ? "active" : ""}`}>
          <div className="step-circle">3</div>
          <span className="step-label">Vehicle</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="driver-registration-page">
      <div className="driver-reg-container">
        {/* Header */}
        <div className="driver-reg-header">
          <div className="brand-logo">
            <span className="brand-icon">🚚</span>
            <span className="brand-name">DelivraX</span>
          </div>
          <h1>Driver Registration</h1>
          <p>Join our delivery network and start earning today!</p>
        </div>

        {/* Progress Bar */}
        {renderProgressBar()}

        {/* Form */}
        <div className="driver-reg-form-container">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="form-step">
                <h2>📋 Basic Information</h2>
                <p className="step-desc">Let's start with your personal details</p>

                <div className="input-group">
                  <label>Full Name *</label>
                  <div className="input-wrapper">
                    <span className="input-icon">👤</span>
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter your full name"
                      value={basicInfo.name}
                      onChange={handleBasicInfoChange}
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Email Address *</label>
                  <div className="input-wrapper">
                    <span className="input-icon">📧</span>
                    <input
                      type="email"
                      name="email"
                      placeholder="your.email@example.com"
                      value={basicInfo.email}
                      onChange={handleBasicInfoChange}
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Phone Number *</label>
                  <div className="input-wrapper">
                    <span className="input-icon">📱</span>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="10-digit mobile number"
                      value={basicInfo.phone}
                      onChange={handleBasicInfoChange}
                      maxLength="10"
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Password *</label>
                  <div className="input-wrapper">
                    <span className="input-icon">🔒</span>
                    <input
                      type="password"
                      name="password"
                      placeholder="Create a strong password"
                      value={basicInfo.password}
                      onChange={handleBasicInfoChange}
                      required
                    />
                  </div>
                  <small className="input-hint">Minimum 6 characters</small>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => navigate("/register")}>
                    Back to Register
                  </button>
                  <button type="button" className="btn-primary" onClick={handleNext}>
                    Next Step →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Documents */}
            {currentStep === 2 && (
              <div className="form-step">
                <h2>📄 Document Details</h2>
                <p className="step-desc">Provide your license and identity documents</p>

                <div className="input-group">
                  <label>Driving License Number *</label>
                  <div className="input-wrapper">
                    <span className="input-icon">🪪</span>
                    <input
                      type="text"
                      name="licenseNumber"
                      placeholder="DL-XXXXXXXXXX"
                      value={documents.licenseNumber}
                      onChange={handleDocumentsChange}
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>License Expiry Date *</label>
                  <div className="input-wrapper">
                    <span className="input-icon">📅</span>
                    <input
                      type="date"
                      name="licenseExpiry"
                      value={documents.licenseExpiry}
                      onChange={handleDocumentsChange}
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>PAN Number *</label>
                  <div className="input-wrapper">
                    <span className="input-icon">💳</span>
                    <input
                      type="text"
                      name="panNumber"
                      placeholder="ABCDE1234F"
                      value={documents.panNumber}
                      onChange={handleDocumentsChange}
                      maxLength="10"
                      style={{ textTransform: "uppercase" }}
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Aadhar Number *</label>
                  <div className="input-wrapper">
                    <span className="input-icon">🆔</span>
                    <input
                      type="text"
                      name="aadharNumber"
                      placeholder="XXXX-XXXX-XXXX"
                      value={documents.aadharNumber}
                      onChange={handleDocumentsChange}
                      maxLength="12"
                      required
                    />
                  </div>
                  <small className="input-hint">12-digit Aadhar number</small>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={handleBack}>
                    ← Back
                  </button>
                  <button type="button" className="btn-primary" onClick={handleNext}>
                    Next Step →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Vehicle Details */}
            {currentStep === 3 && (
              <div className="form-step">
                <h2>🚗 Vehicle Details</h2>
                <p className="step-desc">Tell us about your vehicle</p>

                <div className="input-group">
                  <label>Vehicle Type *</label>
                  <div className="vehicle-type-grid">
                    {vehicleTypes.map((vehicle) => (
                      <label
                        key={vehicle.type}
                        className={`vehicle-type-card ${vehicleDetails.vehicleType === vehicle.type ? "selected" : ""}`}
                      >
                        <input
                          type="radio"
                          name="vehicleType"
                          value={vehicle.type}
                          checked={vehicleDetails.vehicleType === vehicle.type}
                          onChange={handleVehicleChange}
                          required
                        />
                        <div className="vehicle-type-content">
                          <span className="vehicle-icon">{vehicle.icon}</span>
                          <div className="vehicle-type-info">
                            <div className="vehicle-type-name">{vehicle.type}</div>
                            <div className="vehicle-type-desc">{vehicle.desc}</div>
                            <div className="vehicle-capacity">Capacity: {vehicle.capacity}</div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <label>Vehicle Registration Number *</label>
                  <div className="input-wrapper">
                    <span className="input-icon">🔢</span>
                    <input
                      type="text"
                      name="vehicleNumber"
                      placeholder="KA-01-AB-1234"
                      value={vehicleDetails.vehicleNumber}
                      onChange={handleVehicleChange}
                      style={{ textTransform: "uppercase" }}
                      required
                    />
                  </div>
                </div>

                <div className="input-row">
                  <div className="input-group">
                    <label>Vehicle Model *</label>
                    <div className="input-wrapper">
                      <span className="input-icon">🚙</span>
                      <input
                        type="text"
                        name="vehicleModel"
                        placeholder="e.g., Honda Activa"
                        value={vehicleDetails.vehicleModel}
                        onChange={handleVehicleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Manufacturing Year *</label>
                    <div className="input-wrapper">
                      <span className="input-icon">📆</span>
                      <input
                        type="number"
                        name="vehicleYear"
                        placeholder="2020"
                        value={vehicleDetails.vehicleYear}
                        onChange={handleVehicleChange}
                        min="2000"
                        max={new Date().getFullYear()}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="input-group">
                  <label>Insurance Expiry Date *</label>
                  <div className="input-wrapper">
                    <span className="input-icon">📅</span>
                    <input
                      type="date"
                      name="insuranceExpiry"
                      value={vehicleDetails.insuranceExpiry}
                      onChange={handleVehicleChange}
                      required
                    />
                  </div>
                </div>

                <div className="info-box">
                  <span className="info-icon">ℹ️</span>
                  <div className="info-content">
                    <strong>What happens next?</strong>
                    <p>Your application will be reviewed by our admin team. You'll receive an email once approved. This usually takes 24-48 hours.</p>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={handleBack}>
                    ← Back
                  </button>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner"></span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Application ✓
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}