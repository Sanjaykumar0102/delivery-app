import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./index.css";

export default function Home() {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: "🏍️",
      title: "Bike Delivery",
      desc: "Fast delivery for small packages",
      price: "₹30 base + ₹8/km",
    },
    {
      icon: "🛺",
      title: "Auto Delivery",
      desc: "Perfect for medium-sized items",
      price: "₹50 base + ₹12/km",
    },
    {
      icon: "🚐",
      title: "Mini Truck",
      desc: "For larger packages & furniture",
      price: "₹150 base + ₹20/km",
    },
    {
      icon: "🚛",
      title: "Large Truck",
      desc: "Heavy cargo & bulk deliveries",
      price: "₹300 base + ₹35/km",
    },
  ];

  const stats = [
    { icon: "📦", value: "10K+", label: "Deliveries" },
    { icon: "⭐", value: "4.8", label: "Rating" },
    { icon: "🚗", value: "500+", label: "Drivers" },
    { icon: "👥", value: "5K+", label: "Customers" },
  ];

  const howItWorks = [
    { step: "1", icon: "📍", title: "Enter Details", desc: "Pickup & drop location" },
    { step: "2", icon: "🚗", title: "Choose Vehicle", desc: "Select vehicle type" },
    { step: "3", icon: "💰", title: "Get Fare", desc: "Instant price estimate" },
    { step: "4", icon: "✅", title: "Book & Track", desc: "Real-time tracking" },
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <nav className="navbar">
          <div className="nav-logo">
            <span className="logo-icon">🚚</span>
            <span className="project-title">DelivraX</span>
          </div>
          <div className="nav-links">
            <button onClick={() => navigate("/login")} className="nav-btn-primary">
              Login
            </button>
            <button onClick={() => navigate("/register")} className="nav-btn-primary">
              Sign Up
            </button>
          </div>
        </nav>

        <div className="hero-content">
          <div className="hero-left">
            <h1 className="hero-title">
              <span className="gradient-text">Fast & Reliable</span>
              <br />
              Delivery Service
            </h1>
            <p className="hero-subtitle">
              From bikes to trucks, we deliver everything at your doorstep. 
              Track in real-time, pay securely, and enjoy hassle-free logistics.
            </p>
            <div className="hero-buttons">
              <button onClick={() => navigate("/register")} className="btn-get-started">
                Get Started 🚀
              </button>
              <button className="btn-learn-more">
                Learn More →
              </button>
            </div>
            <div className="hero-stats">
              {stats.map((stat, idx) => (
                <div key={idx} className="stat-item">
                  <span className="stat-icon">{stat.icon}</span>
                  <div>
                    <div className="stat-value">{stat.value}</div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="hero-right">
            <div className="hero-image-container">
              <div className="floating-card card-1">
                <span className="card-icon">📦</span>
                <span className="card-text">Package Picked Up</span>
              </div>
              <div className="floating-card card-2">
                <span className="card-icon">🚚</span>
                <span className="card-text">On The Way</span>
              </div>
              <div className="floating-card card-3">
                <span className="card-icon">✅</span>
                <span className="card-text">Delivered!</span>
              </div>
              <div className="hero-phone">
                <div className="phone-screen">
                  <div className="phone-header">
                    <div className="phone-time">9:41</div>
                    <div className="phone-icons">📶 📡 🔋</div>
                  </div>
                  <div className="phone-content">
                    <div className="tracking-map">
                      <div className="map-marker">📍</div>
                      <div className="map-route"></div>
                      <div className="map-truck">🚚</div>
                    </div>
                    <div className="tracking-info">
                      <div className="tracking-status">In Transit</div>
                      <div className="tracking-eta">Arriving in 15 mins</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">Choose Your Vehicle</h2>
          <p className="section-subtitle">We have the perfect vehicle for every delivery need</p>
        </div>
        <div className="features-grid">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className={`feature-card ${activeFeature === idx ? "active" : ""}`}
              onMouseEnter={() => setActiveFeature(idx)}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.desc}</p>
              <div className="feature-price">{feature.price}</div>
              <button className="feature-btn">Book Now →</button>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works-section">
        <div className="section-header">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Simple steps to get your delivery done</p>
        </div>
        <div className="steps-container">
          {howItWorks.map((item, idx) => (
            <div key={idx} className="step-card">
              <div className="step-number">{item.step}</div>
              <div className="step-icon">{item.icon}</div>
              <h3 className="step-title">{item.title}</h3>
              <p className="step-description">{item.desc}</p>
              {idx < howItWorks.length - 1 && <div className="step-arrow">→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="why-choose-section">
        <div className="section-header">
          <h2 className="section-title">Why Choose DelivraX?</h2>
        </div>
        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="benefit-icon">⚡</div>
            <h3>Lightning Fast</h3>
            <p>Get your packages delivered in record time with our efficient routing</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">🔒</div>
            <h3>100% Secure</h3>
            <p>Your packages are insured and tracked every step of the way</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">💰</div>
            <h3>Best Prices</h3>
            <p>Transparent pricing with no hidden charges. Pay only for what you use</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">📱</div>
            <h3>Real-Time Tracking</h3>
            <p>Track your delivery live on the map with accurate ETA</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">🎯</div>
            <h3>On-Time Delivery</h3>
            <p>98% on-time delivery rate. We value your time</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">🌟</div>
            <h3>Top Rated Drivers</h3>
            <p>Professional, verified drivers with excellent ratings</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Get Started?</h2>
          <p className="cta-subtitle">Join thousands of satisfied customers today!</p>
          <button onClick={() => navigate("/register")} className="cta-button">
            Create Free Account 🚀
          </button>
        </div>
        <div className="cta-decoration">
          <div className="decoration-circle circle-1"></div>
          <div className="decoration-circle circle-2"></div>
          <div className="decoration-circle circle-3"></div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="project-title">🚚 DelivraX</h3>
            <p>Fast, Reliable, Affordable Delivery Service</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <a href="#about">About Us</a>
            <a href="#services">Services</a>
            <a href="#pricing">Pricing</a>
            <a href="#contact">Contact</a>
          </div>
          <div className="footer-section">
            <h4>Support</h4>
            <a href="#help">Help Center</a>
            <a href="#terms">Terms of Service</a>
            <a href="#privacy">Privacy Policy</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="footer-section">
            <h4>Connect</h4>
            <div className="social-links">
              <a href="#facebook">📘 Facebook</a>
              <a href="#twitter">🐦 Twitter</a>
              <a href="#instagram">📷 Instagram</a>
              <a href="#linkedin">💼 LinkedIn</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2024 DelivraX. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}