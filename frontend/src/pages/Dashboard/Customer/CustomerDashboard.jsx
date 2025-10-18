import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createOrder, getOrders } from "../../../services/orderService";
import { logout } from "../../../services/authService";
import Cookies from "js-cookie";
import axios from "../../../utils/axios";
import { io } from "socket.io-client";
import LocationAutocomplete from "../../../components/LocationAutocomplete";
import OrderMap from "../../../components/OrderMap";
import SearchingDriver from "../../../components/SearchingDriver";
import MyProfile from "../../../components/MyProfile";
import "./CustomerDashboard.css";

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("book");
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [socket, setSocket] = useState(null);

  // Booking form state
  const [vehicleType, setVehicleType] = useState("");
  const [pickup, setPickup] = useState({ address: "", lat: null, lng: null });
  const [dropoff, setDropoff] = useState({ address: "", lat: null, lng: null });
  const [items, setItems] = useState([{ name: "", quantity: 1, weight: 0 }]);
  const [packageDetails, setPackageDetails] = useState({
    totalWeight: 0,
    dimensions: { length: 0, width: 0, height: 0 },
    fragile: false,
  });
  const [scheduledPickup, setScheduledPickup] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [estimatedFare, setEstimatedFare] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchingForDriver, setSearchingForDriver] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);

  // Vehicle types with pricing
  const vehicleTypes = [
    {
      type: "Bike",
      icon: "🏍️",
      capacity: "Up to 20kg",
      baseFare: 30,
      perKm: 8,
      description: "Small packages, documents",
    },
    {
      type: "Auto",
      icon: "🛺",
      capacity: "Up to 50kg",
      baseFare: 50,
      perKm: 12,
      description: "Medium packages, groceries",
    },
    {
      type: "Mini Truck",
      icon: "🚐",
      capacity: "Up to 500kg",
      baseFare: 150,
      perKm: 20,
      description: "Furniture, appliances",
    },
    {
      type: "Large Truck",
      icon: "🚚",
      capacity: "Up to 2000kg",
      baseFare: 300,
      perKm: 35,
      description: "Heavy goods, bulk items",
    },
  ];

  // Initialize user
  useEffect(() => {
    const userCookie = Cookies.get("user");
    if (!userCookie) {
      navigate("/login");
      return;
    }
    
    const parsedUser = JSON.parse(userCookie);
    setUser(parsedUser);

    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    // Register customer with socket server
    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", newSocket.id);
      newSocket.emit("register", {
        userId: parsedUser._id,
        role: parsedUser.role,
      });
    });

    return () => {
      newSocket.close();
    };
  }, [navigate]);

  // Fetch orders
  useEffect(() => {
    if (activeTab === "orders" || activeTab === "track") {
      fetchOrders();
    }
  }, [activeTab]);

  // Listen for real-time updates
  useEffect(() => {
    if (socket) {
      // Location updates for tracking
      const handleLocationUpdate = (data) => {
        if (selectedOrder && data.orderId === selectedOrder._id) {
          setSelectedOrder((prev) => ({
            ...prev,
            tracking: {
              lat: data.lat,
              lng: data.lng,
              lastUpdated: new Date(),
            },
          }));
        }
      };

      // Order status updates
      const handleOrderStatusUpdate = (data) => {
        // Update selected order if it matches
        if (selectedOrder && data.orderId === selectedOrder._id) {
          setSelectedOrder((prev) => ({
            ...prev,
            status: data.status,
          }));
        }

        // If the pending order gets assigned a driver, hide the searching overlay and switch to tracking
        if (pendingOrderId && data.orderId === pendingOrderId &&
            (data.status === "Assigned" || data.status === "Accepted")) {
          setSearchingForDriver(false);
          setPendingOrderId(null);

          // Fetch updated orders first
          fetchOrders().then(() => {
            // Find the assigned order from the updated orders list
            getOrders().then((updatedOrders) => {
              const assignedOrder = updatedOrders.find(order => order._id === data.orderId);
              if (assignedOrder) {
                // Set the order for tracking
                setSelectedOrder(assignedOrder);
                
                // Automatically switch to tracking tab
                setActiveTab("track");
                
                // Show success notification
                setSuccess("✅ Driver assigned! Track your order in real-time.");
                setTimeout(() => setSuccess(""), 5000);
              }
            });
          });
        }

        // Refresh orders list
        fetchOrders();
      };

      socket.on("locationUpdate", handleLocationUpdate);
      socket.on("orderStatusUpdate", handleOrderStatusUpdate);

      return () => {
        socket.off("locationUpdate", handleLocationUpdate);
        socket.off("orderStatusUpdate", handleOrderStatusUpdate);
      };
    }
  }, [socket, selectedOrder, pendingOrderId, orders]);

  // Calculate fare estimation
  useEffect(() => {
    if (vehicleType && pickup.lat && dropoff.lat) {
      const selectedVehicle = vehicleTypes.find((v) => v.type === vehicleType);
      if (selectedVehicle) {
        // Calculate distance using Haversine formula
        const distance = calculateDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
        const fare = selectedVehicle.baseFare + distance * selectedVehicle.perKm;
        setEstimatedFare(Math.round(fare));
      }
    }
  }, [vehicleType, pickup, dropoff]);

  // Haversine formula to calculate distance between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };

  const fetchOrders = async () => {
    try {
      const data = await getOrders();
      setOrders(data);
      
      // Check if customer has any active orders (with assigned driver)
      const activeOrder = data.find(order => 
        ["Assigned", "Accepted", "Arrived", "Picked-Up", "In-Transit"].includes(order.status)
      );
      setHasActiveOrder(!!activeOrder);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) {
      return;
    }
    
    try {
      console.log("🚫 Cancelling order:", orderId);
      
      // Use axios which automatically uses cookies
      const response = await axios.put(`/orders/${orderId}/cancel`);
      
      console.log("✅ Cancel response:", response.data);
      alert("✅ " + response.data.message);
      fetchOrders(); // Refresh order list
    } catch (error) {
      console.error("❌ Error cancelling order:", error);
      console.error("Error response:", error.response);
      alert("❌ " + (error.response?.data?.message || error.message || "Failed to cancel order"));
    }
  };

  const handleCancelSearching = async () => {
    if (pendingOrderId) {
      await handleCancelOrder(pendingOrderId);
      setSearchingForDriver(false);
      setPendingOrderId(null);
    }
  };

  const handleSearchTimeout = async () => {
    console.log("⏰ Search timeout - no drivers available");
    // The SearchingDriver component will show the timeout UI
    // User can click "Close" to dismiss
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const addItem = () => {
    setItems([...items, { name: "", quantity: 1, weight: 0 }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Check if customer already has an active order
    if (hasActiveOrder) {
      setError("⚠️ You already have an active order. Please wait until it's completed before booking another delivery.");
      setTimeout(() => {
        setError("");
        setActiveTab("track"); // Redirect to track their current order
      }, 3000);
      return;
    }

    if (!vehicleType) {
      setError("Please select a vehicle type");
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        vehicleType,
        pickup: {
          address: pickup.address,
          lat: pickup.lat,
          lng: pickup.lng,
        },
        dropoff: {
          address: dropoff.address,
          lat: dropoff.lat,
          lng: dropoff.lng,
        },
        items: items.filter((item) => item.name.trim() !== ""),
        packageDetails,
        scheduledPickup: scheduledPickup || undefined,
        paymentMethod,
      };

      const response = await createOrder(orderData);
      setSuccess("✅ Order placed successfully! Finding a driver for you...");
      
      // Show searching driver overlay
      setSearchingForDriver(true);
      setPendingOrderId(response._id);
      
      // Reset form
      setVehicleType("");
      setPickup({ address: "", lat: null, lng: null });
      setDropoff({ address: "", lat: null, lng: null });
      setItems([{ name: "", quantity: 1, weight: 0 }]);
      setPackageDetails({
        totalWeight: 0,
        dimensions: { length: 0, width: 0, height: 0 },
        fragile: false,
      });
      setScheduledPickup("");
      setEstimatedFare(0);

      setTimeout(() => {
        setSuccess("");
      }, 2000);
    } catch (err) {
      console.error("Error booking order:", err);
      setError(err.response?.data?.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: "#FFA500",
      Assigned: "#2196F3",
      Accepted: "#00BCD4",
      Arrived: "#9C27B0",
      "Picked-Up": "#FF9800",
      "In-Transit": "#4CAF50",
      Delivered: "#8BC34A",
      Cancelled: "#F44336",
    };
    return colors[status] || "#757575";
  };

  const getStatusIcon = (status) => {
    const icons = {
      Pending: "⏳",
      Assigned: "👤",
      Accepted: "✓",
      Arrived: "📍",
      "Picked-Up": "📦",
      "In-Transit": "🚚",
      Delivered: "✅",
      Cancelled: "❌",
    };
    return icons[status] || "📦";
  };

  const handleRateDriver = async (orderId, rating, review = "") => {
    // If rating is null, get it from the clicked star
    if (rating === null) {
      const activeStars = document.querySelectorAll('.star-btn.active');
      if (activeStars.length === 0) {
        alert("Please select a rating first");
        return;
      }
      rating = activeStars.length;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/rate-driver`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('token')}`
        },
        body: JSON.stringify({ rating, review })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit rating');
      }

      const data = await response.json();
      alert("✅ Rating submitted successfully!");
      fetchOrders(); // Refresh orders to update the UI
    } catch (error) {
      console.error("Error rating driver:", error);
      alert("❌ " + (error.message || "Failed to submit rating"));
    }
  };

  return (
    <div className="customer-dashboard-v2">
      {/* Header */}
      <header className="dashboard-header-v2">
        <div className="header-content">
          <div className="header-left">
            <div className="logo-section">
              <div className="logo-icon">🚚</div>
              <div className="logo-text">
                <h1>DelivraX</h1>
                <p>Fast & Reliable Delivery</p>
              </div>
            </div>
          </div>
          <div className="header-right">
            <div className="user-info">
              <div className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
              <div className="user-details">
                <span className="user-name">{user?.name}</span>
                <span className="user-role">{user?.role}</span>
              </div>
            </div>
            <button className="logout-btn-v2" onClick={handleLogout}>
              <span>🚪</span> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="dashboard-nav-v2">
        <div className="nav-container">
          <button
            className={`nav-btn-v2 ${activeTab === "book" ? "active" : ""}`}
            onClick={() => setActiveTab("book")}
          >
            <span className="nav-icon">📦</span>
            <span className="nav-text">Book Delivery</span>
          </button>
          <button
            className={`nav-btn-v2 ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            <span className="nav-icon">📋</span>
            <span className="nav-text">My Orders</span>
            {orders.length > 0 && <span className="badge">{orders.length}</span>}
          </button>
          <button
            className={`nav-btn-v2 ${activeTab === "track" ? "active" : ""}`}
            onClick={() => setActiveTab("track")}
          >
            <span className="nav-icon">📍</span>
            <span className="nav-text">Track Order</span>
          </button>
          <button
            className={`nav-btn-v2 ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <span className="nav-icon">👤</span>
            <span className="nav-text">My Profile</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="dashboard-content-v2">
        {/* Book Delivery Tab */}
        {activeTab === "book" && (
          <div className="book-section-v2">
            <div className="section-header-v2">
              <h2>📦 Book a Delivery</h2>
              <p>Choose your vehicle and enter delivery details</p>
            </div>

            {/* Vehicle Selection */}
            <div className="vehicle-selection">
              <h3>Select Vehicle Type</h3>
              <div className="vehicle-grid">
                {vehicleTypes.map((vehicle) => (
                  <div
                    key={vehicle.type}
                    className={`vehicle-card ${
                      vehicleType === vehicle.type ? "selected" : ""
                    }`}
                    onClick={() => setVehicleType(vehicle.type)}
                  >
                    <div className="vehicle-icon">{vehicle.icon}</div>
                    <h4>{vehicle.type}</h4>
                    <p className="vehicle-capacity">{vehicle.capacity}</p>
                    <p className="vehicle-description">{vehicle.description}</p>
                    <div className="vehicle-pricing">
                      <span className="base-fare">₹{vehicle.baseFare} base</span>
                      <span className="per-km">+ ₹{vehicle.perKm}/km</span>
                    </div>
                    {vehicleType === vehicle.type && (
                      <div className="selected-badge">✓ Selected</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Booking Form */}
            <form onSubmit={handleBooking} className="booking-form-v2">
              <div className="form-row">
                <div className="form-group-v2">
                  <LocationAutocomplete
                    value={pickup}
                    onChange={setPickup}
                    placeholder="Search pickup location..."
                    label="📍 Pickup Location"
                    required
                  />
                </div>

                <div className="form-group-v2">
                  <LocationAutocomplete
                    value={dropoff}
                    onChange={setDropoff}
                    placeholder="Search dropoff location..."
                    label="🎯 Dropoff Location"
                    required
                  />
                </div>
              </div>

              {/* Map Display */}
              {(pickup.lat || dropoff.lat) && (
                <div className="map-section">
                  <h3>📍 Route Preview</h3>
                  <OrderMap pickup={pickup} dropoff={dropoff} />
                </div>
              )}

              {/* Items List */}
              <div className="form-group-v2">
                <label>
                  <span className="label-icon">📦</span>
                  Items to Deliver
                </label>
                {items.map((item, index) => (
                  <div key={index} className="item-row-v2">
                    <input
                      type="text"
                      value={item.name}
                      placeholder="Item name"
                      onChange={(e) => handleItemChange(index, "name", e.target.value)}
                      required
                    />
                    <input
                      type="number"
                      value={item.quantity}
                      min="1"
                      placeholder="Qty"
                      onChange={(e) =>
                        handleItemChange(index, "quantity", parseInt(e.target.value))
                      }
                      required
                    />
                    <input
                      type="number"
                      value={item.weight}
                      min="0"
                      step="0.1"
                      placeholder="Weight (kg)"
                      onChange={(e) =>
                        handleItemChange(index, "weight", parseFloat(e.target.value))
                      }
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        className="remove-btn-v2"
                        onClick={() => removeItem(index)}
                      >
                        ❌
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="add-item-btn-v2" onClick={addItem}>
                  ➕ Add Another Item
                </button>
              </div>

              {/* Package Details */}
              <div className="form-row">
                <div className="form-group-v2">
                  <label>
                    <span className="label-icon">⚖️</span>
                    Total Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={packageDetails.totalWeight}
                    onChange={(e) =>
                      setPackageDetails({
                        ...packageDetails,
                        totalWeight: parseFloat(e.target.value),
                      })
                    }
                    placeholder="Total weight"
                    min="0"
                    step="0.1"
                  />
                </div>

                <div className="form-group-v2">
                  <label>
                    <span className="label-icon">📏</span>
                    Dimensions (L × W × H cm)
                  </label>
                  <div className="dimensions-input">
                    <input
                      type="number"
                      placeholder="L"
                      value={packageDetails.dimensions.length}
                      onChange={(e) =>
                        setPackageDetails({
                          ...packageDetails,
                          dimensions: {
                            ...packageDetails.dimensions,
                            length: parseFloat(e.target.value),
                          },
                        })
                      }
                    />
                    <span>×</span>
                    <input
                      type="number"
                      placeholder="W"
                      value={packageDetails.dimensions.width}
                      onChange={(e) =>
                        setPackageDetails({
                          ...packageDetails,
                          dimensions: {
                            ...packageDetails.dimensions,
                            width: parseFloat(e.target.value),
                          },
                        })
                      }
                    />
                    <span>×</span>
                    <input
                      type="number"
                      placeholder="H"
                      value={packageDetails.dimensions.height}
                      onChange={(e) =>
                        setPackageDetails({
                          ...packageDetails,
                          dimensions: {
                            ...packageDetails.dimensions,
                            height: parseFloat(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group-v2">
                  <label>
                    <span className="label-icon">🕐</span>
                    Schedule Pickup (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledPickup}
                    onChange={(e) => setScheduledPickup(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>

                <div className="form-group-v2">
                  <label>
                    <span className="label-icon">💳</span>
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="Cash">💵 Cash on Delivery</option>
                    <option value="Online">💳 Online Payment</option>
                    <option value="Wallet">👛 Wallet</option>
                  </select>
                </div>
              </div>

              <div className="form-group-v2 checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={packageDetails.fragile}
                    onChange={(e) =>
                      setPackageDetails({
                        ...packageDetails,
                        fragile: e.target.checked,
                      })
                    }
                  />
                  <span>⚠️ Fragile Item - Handle with Care</span>
                </label>
              </div>

              {/* Fare Estimation */}
              {estimatedFare > 0 && (
                <div className="fare-estimation">
                  <div className="fare-content">
                    <span className="fare-label">Estimated Fare:</span>
                    <span className="fare-amount">₹{estimatedFare}</span>
                  </div>
                  <p className="fare-note">*Final fare may vary based on actual distance</p>
                </div>
              )}

              <button type="submit" className="submit-btn-v2" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner"></span> Placing Order...
                  </>
                ) : (
                  <>
                    <span>🚀</span> Place Order
                  </>
                )}
              </button>
            </form>

            {error && <div className="error-msg-v2">{error}</div>}
            {success && <div className="success-msg-v2">{success}</div>}
          </div>
        )}

        {/* My Orders Tab */}
        {activeTab === "orders" && (
          <div className="orders-section-v2">
            <div className="section-header-v2">
              <h2>📋 My Orders</h2>
              <p>Track all your deliveries</p>
            </div>

            {orders.length === 0 ? (
              <div className="empty-state-v2">
                <div className="empty-icon">📭</div>
                <h3>No orders yet</h3>
                <p>Book your first delivery to get started</p>
                <button onClick={() => setActiveTab("book")} className="book-now-btn-v2">
                  📦 Book Now
                </button>
              </div>
            ) : (
              <div className="orders-grid-v2">
                {orders.map((order) => (
                  <div key={order._id} className="order-card-v2">
                    <div className="order-header-v2">
                      <div
                        className="status-badge-v2"
                        style={{ backgroundColor: getStatusColor(order.status) }}
                      >
                        {getStatusIcon(order.status)} {order.status}
                      </div>
                      <span className="order-id">#{order._id.slice(-6)}</span>
                    </div>

                    <div className="order-vehicle">
                      <span className="vehicle-icon">
                        {vehicleTypes.find((v) => v.type === order.vehicleType)?.icon || "🚚"}
                      </span>
                      <span className="vehicle-type">{order.vehicleType}</span>
                    </div>

                    <div className="order-route">
                      <div className="route-point">
                        <span className="route-icon pickup">📍</span>
                        <div className="route-details">
                          <span className="route-label">Pickup</span>
                          <span className="route-address">{order.pickup.address}</span>
                        </div>
                      </div>
                      <div className="route-line"></div>
                      <div className="route-point">
                        <span className="route-icon dropoff">🎯</span>
                        <div className="route-details">
                          <span className="route-label">Dropoff</span>
                          <span className="route-address">{order.dropoff.address}</span>
                        </div>
                      </div>
                    </div>

                    <div className="order-details-v2">
                      <div className="detail-item">
                        <span className="detail-label">📦 Items:</span>
                        <span className="detail-value">
                          {order.items.map((item) => item.name).join(", ")}
                        </span>
                      </div>
                      {order.driver && (
                        <div className="detail-item">
                          <span className="detail-label">👤 Driver:</span>
                          <span className="detail-value">{order.driver.name}</span>
                        </div>
                      )}
                      <div className="detail-item">
                        <span className="detail-label">💰 Fare:</span>
                        <span className="detail-value fare">₹{order.fare}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">💳 Payment:</span>
                        <span className="detail-value">{order.paymentMethod}</span>
                      </div>
                    </div>

                    <div className="order-actions">
                      {/* Cancel button - only for Pending, Assigned, or Accepted orders */}
                      {["Pending", "Assigned", "Accepted"].includes(order.status) && (
                        <button
                          className="cancel-order-btn"
                          onClick={() => handleCancelOrder(order._id)}
                        >
                          <span className="cta-icon">⚠️</span>
                          <span className="cta-text">Cancel Order</span>
                          <span className="cta-flare" aria-hidden="true"></span>
                          <span className="cta-underline" aria-hidden="true"></span>
                        </button>
                      )}

                      {/* Track button - for active orders */}
                      {["Assigned", "Accepted", "Arrived", "Picked-Up", "In-Transit"].includes(
                        order.status
                      ) && (
                        <button
                          className="track-btn-v2"
                          onClick={() => {
                            console.log("Track Live clicked for order:", order._id);
                            setSelectedOrder(order);
                            setActiveTab("track");
                          }}
                        >
                          📍 Track Live
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Track Order Tab */}
        {activeTab === "track" && (
          <div className="track-section-v2">
            <div className="section-header-v2">
              <h2>📍 Live Tracking</h2>
              <p>Real-time delivery tracking</p>
            </div>

            {!selectedOrder ? (
              <div className="empty-state-v2">
                <div className="empty-icon">📍</div>
                <h3>No order selected</h3>
                <p>Select an active order to track</p>
                <button onClick={() => setActiveTab("orders")} className="book-now-btn-v2">
                  📋 View Orders
                </button>
              </div>
            ) : (
              <div className="tracking-container-v2">
                <div className="tracking-header">
                  <h3>Order #{selectedOrder._id.slice(-6)}</h3>
                  <div
                    className="status-badge-v2 large"
                    style={{ backgroundColor: getStatusColor(selectedOrder.status) }}
                  >
                    {getStatusIcon(selectedOrder.status)} {selectedOrder.status}
                  </div>
                </div>

                {/* Progress Timeline */}
                <div className="progress-timeline">
                  {[
                    "Pending",
                    "Assigned",
                    "Accepted",
                    "Arrived",
                    "Picked-Up",
                    "In-Transit",
                    "Delivered",
                  ].map((status, index) => {
                    const statusIndex = [
                      "Pending",
                      "Assigned",
                      "Accepted",
                      "Arrived",
                      "Picked-Up",
                      "In-Transit",
                      "Delivered",
                    ].indexOf(selectedOrder.status);
                    const isCompleted = index <= statusIndex;
                    const isCurrent = index === statusIndex;

                    return (
                      <div
                        key={status}
                        className={`timeline-step ${isCompleted ? "completed" : ""} ${
                          isCurrent ? "current" : ""
                        }`}
                      >
                        <div className="timeline-dot">
                          {isCompleted ? "✓" : index + 1}
                        </div>
                        <span className="timeline-label">{status}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Tracking Details */}
                <div className="tracking-details-v2">
                  <div className="tracking-card">
                    <h4>📍 Route Information</h4>
                    <div className="tracking-route">
                      <div className="tracking-point">
                        <span className="point-icon">📍</span>
                        <div>
                          <p className="point-label">Pickup</p>
                          <p className="point-address">{selectedOrder.pickup.address}</p>
                        </div>
                      </div>
                      <div className="tracking-point">
                        <span className="point-icon">🎯</span>
                        <div>
                          <p className="point-label">Dropoff</p>
                          <p className="point-address">{selectedOrder.dropoff.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedOrder.driver && (
                    <div className="tracking-card">
                      <h4>👤 Driver Information</h4>
                      <div className="driver-info-v2">
                        <div className="driver-avatar-large">
                          {selectedOrder.driver.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="driver-details-v2">
                          <p className="driver-name">{selectedOrder.driver.name}</p>
                          
                          {/* Phone with call button */}
                          <div className="driver-contact">
                            <p className="driver-phone">
                              📱 {selectedOrder.driver.phone || selectedOrder.driver.phoneNumber || "N/A"}
                            </p>
                            {(selectedOrder.driver.phone || selectedOrder.driver.phoneNumber) && (
                              <a 
                                href={`tel:${selectedOrder.driver.phone || selectedOrder.driver.phoneNumber}`}
                                className="call-driver-btn"
                                title="Call Driver"
                              >
                                📞 Call
                              </a>
                            )}
                          </div>

                          {/* Driver Rating */}
                          {selectedOrder.driver.stats && (
                            <div className="driver-rating-display">
                              <span className="rating-label">Rating:</span>
                              <span className="rating-stars">
                                {[...Array(5)].map((_, i) => (
                                  <span key={i} className={i < Math.round(selectedOrder.driver.stats.averageRating || 0) ? 'star-filled' : 'star-empty'}>
                                    ⭐
                                  </span>
                                ))}
                              </span>
                              <span className="rating-value">
                                {(selectedOrder.driver.stats.averageRating || 0).toFixed(1)}/5
                              </span>
                              {selectedOrder.driver.stats.totalRatings && (
                                <span className="rating-count">
                                  ({selectedOrder.driver.stats.totalRatings} ratings)
                                </span>
                              )}
                            </div>
                          )}
                          
                          {/* Vehicle Details */}
                          {selectedOrder.vehicle && (
                            <div className="vehicle-details-display">
                              <p className="vehicle-info">
                                <span className="vehicle-icon">🚗</span>
                                <strong>{selectedOrder.vehicle.type}</strong>
                              </p>
                              <p className="vehicle-plate">
                                <span className="plate-icon">🔢</span>
                                {selectedOrder.vehicle.plateNumber}
                              </p>
                              {selectedOrder.vehicle.model && (
                                <p className="vehicle-model">
                                  {selectedOrder.vehicle.model} {selectedOrder.vehicle.year && `(${selectedOrder.vehicle.year})`}
                                </p>
                              )}
                              {selectedOrder.vehicle.color && (
                                <p className="vehicle-color">
                                  <span className="color-icon">🎨</span>
                                  {selectedOrder.vehicle.color}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedOrder.tracking && (
                    <div className="tracking-card">
                      <h4>🗺️ Current Location</h4>
                      <div className="location-info">
                        <p>
                          <strong>Latitude:</strong> {selectedOrder.tracking.lat}
                        </p>
                        <p>
                          <strong>Longitude:</strong> {selectedOrder.tracking.lng}
                        </p>
                        <p className="last-updated">
                          Last updated:{" "}
                          {new Date(selectedOrder.tracking.lastUpdated).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="map-placeholder">
                        <p>🗺️ Map integration coming soon</p>
                        <small>Google Maps / Leaflet will be integrated here</small>
                      </div>
                    </div>
                  )}
                </div>

                {/* Rating Section - Show after delivery */}
                {selectedOrder.status === "Delivered" && (
                  <div className="modern-rating-card">
                    <div className="rating-card-header">
                      <div className="rating-icon-wrapper">
                        <span className="rating-icon">⭐</span>
                      </div>
                      <h3 className="rating-title">Rate Your Experience</h3>
                      <p className="rating-subtitle">Help us serve you better</p>
                    </div>

                    <div className="rating-card-body">
                      {!selectedOrder.customerRating ? (
                        <>
                          <div className="star-rating-container">
                            <div className="star-rating-wrapper">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  className="star-button"
                                  onClick={() => handleRateDriver(selectedOrder._id, star)}
                                  title={`${star} star${star > 1 ? 's' : ''}`}
                                >
                                  <svg className="star-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
                                          fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </button>
                              ))}
                            </div>
                            <p className="rating-hint">Tap to rate</p>
                          </div>

                          <div className="review-input-container">
                            <label className="review-label">Share your thoughts (optional)</label>
                            <textarea
                              placeholder="Tell us about your delivery experience..."
                              className="review-textarea-modern"
                              id={`review-${selectedOrder._id}`}
                              rows="4"
                            />
                          </div>

                          <button
                            className="submit-rating-button"
                            onClick={() => {
                              const review = document.getElementById(`review-${selectedOrder._id}`).value;
                              handleRateDriver(selectedOrder._id, null, review);
                            }}
                          >
                            <span className="button-icon">✨</span>
                            <span className="button-text">Submit Feedback</span>
                          </button>
                        </>
                      ) : (
                        <div className="rating-submitted-container">
                          <div className="success-checkmark">
                            <svg className="checkmark-svg" viewBox="0 0 52 52">
                              <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                              <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                            </svg>
                          </div>
                          <h4 className="thank-you-title">Thank You!</h4>
                          <p className="thank-you-subtitle">Your feedback helps us improve</p>
                          <div className="submitted-rating-display">
                            <div className="submitted-stars">
                              {[...Array(5)].map((_, index) => (
                                <svg key={index} className={`submitted-star ${index < selectedOrder.customerRating.rating ? 'filled' : ''}`} 
                                     viewBox="0 0 24 24" fill="none">
                                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
                                        fill="currentColor" stroke="currentColor" strokeWidth="2"/>
                                </svg>
                              ))}
                            </div>
                            <span className="rating-score-badge">{selectedOrder.customerRating.rating}/5</span>
                          </div>
                          {selectedOrder.customerRating.review && (
                            <div className="review-bubble">
                              <div className="quote-icon">"</div>
                              <p className="review-text">{selectedOrder.customerRating.review}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Quick action buttons for delivered orders */}
                {selectedOrder.status === "Delivered" && (
                  <div className="order-completed-card">
                    <div className="confetti-background"></div>
                    <div className="completion-icon-wrapper">
                      <div className="completion-icon-circle">
                        <svg className="completion-icon" viewBox="0 0 24 24" fill="none">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div className="celebration-emoji">🎉</div>
                    </div>
                    <h3 className="completion-title">Delivery Completed!</h3>
                    <p className="completion-message">Your package has been delivered successfully</p>
                    <div className="completion-stats">
                      <div className="stat-item">
                        <span className="stat-icon">📦</span>
                        <span className="stat-label">Delivered</span>
                      </div>
                      <div className="stat-divider"></div>
                      <div className="stat-item">
                        <span className="stat-icon">✅</span>
                        <span className="stat-label">Verified</span>
                      </div>
                      <div className="stat-divider"></div>
                      <div className="stat-item">
                        <span className="stat-icon">⭐</span>
                        <span className="stat-label">Rate Now</span>
                      </div>
                    </div>
                    <div className="completion-actions">
                      <button
                        className="completion-btn primary-completion"
                        onClick={() => setActiveTab("book")}
                      >
                        <span className="btn-icon-completion">📦</span>
                        <span className="btn-text-completion">Book Another Delivery</span>
                      </button>
                      <button
                        className="completion-btn secondary-completion"
                        onClick={() => setActiveTab("orders")}
                      >
                        <span className="btn-icon-completion">📋</span>
                        <span className="btn-text-completion">View All Orders</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* My Profile Tab */}
        {activeTab === "profile" && (
          <MyProfile user={user} onUpdate={(updatedUser) => setUser(updatedUser)} />
        )}
      </main>

      {/* Searching for Driver Overlay */}
      {searchingForDriver && pendingOrderId && (
        <SearchingDriver 
          orderId={pendingOrderId}
          onCancel={handleCancelSearching}
          onTimeout={handleSearchTimeout}
          onRetry={async () => {
            console.log("🔄 Retrying driver search...");
            try {
              // Call API to re-notify drivers
              const response = await axios.put(`/orders/${pendingOrderId}/retry-search`);
              console.log("✅ Retry response:", response.data);
              alert(`🔄 Search restarted! ${response.data.driversNotified} drivers notified.`);
            } catch (error) {
              console.error("❌ Error retrying search:", error);
              alert("❌ Failed to retry search. Please try again.");
            }
          }}
        />
      )}
    </div>
  );
};

export default CustomerDashboard;