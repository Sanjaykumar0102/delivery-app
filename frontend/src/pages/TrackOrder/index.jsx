import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import io from "socket.io-client";
import orderService from "../../services/orderService";
import "./TrackOrder.css";

// Custom icons
const pickupIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const dropoffIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const driverIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [30, 49],
  iconAnchor: [15, 49],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Component to auto-fit bounds
function MapBounds({ pickup, dropoff, driverLocation }) {
  const map = useMap();

  useEffect(() => {
    const bounds = [];
    if (pickup?.lat && pickup?.lng) {
      bounds.push([pickup.lat, pickup.lng]);
    }
    if (dropoff?.lat && dropoff?.lng) {
      bounds.push([dropoff.lat, dropoff.lng]);
    }
    if (driverLocation?.lat && driverLocation?.lng) {
      bounds.push([driverLocation.lat, driverLocation.lng]);
    }

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [pickup, dropoff, driverLocation, map]);

  return null;
}

const TrackOrder = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [eta, setEta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");

  useEffect(() => {
    fetchOrderDetails();
    
    // Setup socket connection
    const newSocket = io(process.env.REACT_APP_API_URL || "http://localhost:5000");
    setSocket(newSocket);

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, [orderId]);

  useEffect(() => {
    if (!socket || !order) return;

    // Listen for order status updates
    socket.on("orderStatusUpdate", (data) => {
      if (data.orderId === orderId) {
        setOrder((prev) => ({ ...prev, status: data.status }));
        
        // Show rating modal when delivered
        if (data.status === "Delivered" && !order.customerRating) {
          setTimeout(() => setShowRatingModal(true), 1000);
        }
      }
    });

    // Listen for driver location updates
    socket.on("driverLocationUpdate", (data) => {
      if (data.orderId === orderId) {
        setDriverLocation(data.location);
        calculateETA(data.location);
      }
    });

    return () => {
      socket.off("orderStatusUpdate");
      socket.off("driverLocationUpdate");
    };
  }, [socket, order, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrderById(orderId);
      setOrder(data);
      
      // If driver is assigned, get their location
      if (data.driver && data.tracking) {
        setDriverLocation(data.tracking);
        calculateETA(data.tracking);
      }
      
      // Show rating modal if delivered and not rated
      if (data.status === "Delivered" && !data.customerRating) {
        setShowRatingModal(true);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch order details");
    } finally {
      setLoading(false);
    }
  };

  const calculateETA = async (driverLoc) => {
    if (!order || !driverLoc) return;

    try {
      const destination = order.status === "Picked-Up" || order.status === "In-Transit" 
        ? order.dropoff 
        : order.pickup;

      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${driverLoc.lng},${driverLoc.lat};${destination.lng},${destination.lat}?overview=false`
      );
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const durationMinutes = Math.round(data.routes[0].duration / 60);
        const distanceKm = (data.routes[0].distance / 1000).toFixed(1);
        setEta({ duration: durationMinutes, distance: distanceKm });
      }
    } catch (error) {
      console.error("Error calculating ETA:", error);
    }
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      alert("Please select a rating");
      return;
    }

    try {
      await orderService.rateDriver(orderId, { rating, review });
      setShowRatingModal(false);
      fetchOrderDetails(); // Refresh order data
    } catch (error) {
      console.error("Error submitting rating:", error);
      alert("Failed to submit rating. Please try again.");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      "Pending": "#FFA726",
      "Assigned": "#42A5F5",
      "Accepted": "#66BB6A",
      "Arrived": "#AB47BC",
      "Picked-Up": "#26C6DA",
      "In-Transit": "#5C6BC0",
      "Delivered": "#4CAF50",
      "Cancelled": "#EF5350",
    };
    return colors[status] || "#9E9E9E";
  };

  const getStatusMessage = (status) => {
    const messages = {
      "Pending": "Looking for a driver...",
      "Assigned": "Driver assigned! Heading to pickup location",
      "Accepted": "Driver accepted your order",
      "Arrived": "Driver has arrived at pickup location",
      "Picked-Up": "Package picked up! On the way to delivery",
      "In-Transit": "Your package is on the way",
      "Delivered": "Package delivered successfully!",
      "Cancelled": "Order cancelled",
    };
    return messages[status] || status;
  };

  if (loading) {
    return (
      <div className="track-order-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="track-order-container">
        <div className="error-message">
          <h2>❌ Error</h2>
          <p>{error || "Order not found"}</p>
          <button onClick={() => navigate("/dashboard")} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="track-order-container">
      {/* Header */}
      <div className="track-header">
        <button onClick={() => navigate("/dashboard")} className="back-btn">
          ← Back
        </button>
        <h1>Track Order</h1>
        <div className="order-id">#{order._id.slice(-8)}</div>
      </div>

      {/* Status Banner */}
      <div 
        className="status-banner-track"
        style={{ backgroundColor: getStatusColor(order.status) }}
      >
        <div className="status-content">
          <div className="status-icon-large">
            {order.status === "Delivered" ? "✓" : "🚚"}
          </div>
          <div className="status-text-content">
            <h2>{order.status}</h2>
            <p>{getStatusMessage(order.status)}</p>
          </div>
        </div>
      </div>

      {/* ETA Card */}
      {eta && order.status !== "Delivered" && order.status !== "Cancelled" && (
        <div className="eta-card">
          <div className="eta-icon">🕐</div>
          <div className="eta-content">
            <h3>{eta.duration} minutes</h3>
            <p>
              {order.status === "Picked-Up" || order.status === "In-Transit"
                ? "Estimated delivery time"
                : "Driver arriving in"}
            </p>
          </div>
          <div className="eta-distance">{eta.distance} km</div>
        </div>
      )}

      {/* Map */}
      <div className="track-map-container">
        <MapContainer
          center={[order.pickup.lat, order.pickup.lng]}
          zoom={13}
          style={{ height: "100%", width: "100%", borderRadius: "12px" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Pickup Marker */}
          <Marker position={[order.pickup.lat, order.pickup.lng]} icon={pickupIcon}>
            <Popup>
              <div className="map-popup">
                <h4>📍 Pickup Location</h4>
                <p>{order.pickup.address}</p>
              </div>
            </Popup>
          </Marker>

          {/* Dropoff Marker */}
          <Marker position={[order.dropoff.lat, order.dropoff.lng]} icon={dropoffIcon}>
            <Popup>
              <div className="map-popup">
                <h4>🎯 Delivery Location</h4>
                <p>{order.dropoff.address}</p>
              </div>
            </Popup>
          </Marker>

          {/* Driver Location Marker */}
          {driverLocation?.lat && driverLocation?.lng && (
            <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
              <Popup>
                <div className="map-popup">
                  <h4>🚚 Driver Location</h4>
                  <p>{order.driver?.name || "Driver"}</p>
                  {driverLocation.lastUpdated && (
                    <small>Updated: {new Date(driverLocation.lastUpdated).toLocaleTimeString()}</small>
                  )}
                </div>
              </Popup>
            </Marker>
          )}

          <MapBounds pickup={order.pickup} dropoff={order.dropoff} driverLocation={driverLocation} />
        </MapContainer>
      </div>

      {/* Driver Info */}
      {order.driver && (
        <div className="driver-info-card">
          <div className="driver-avatar">
            {order.driver.name?.charAt(0).toUpperCase() || "D"}
          </div>
          <div className="driver-details">
            <h3>{order.driver.name || "Driver"}</h3>
            <p>{order.vehicleType} • {order.driver.phone || "No phone"}</p>
          </div>
          {order.driver.phone && (
            <a href={`tel:${order.driver.phone}`} className="call-driver-btn">
              📞 Call
            </a>
          )}
        </div>
      )}

      {/* Order Details */}
      <div className="order-details-card">
        <h3>Order Details</h3>
        <div className="detail-row">
          <span className="label">Pickup</span>
          <span className="value">{order.pickup.address}</span>
        </div>
        <div className="detail-row">
          <span className="label">Delivery</span>
          <span className="value">{order.dropoff.address}</span>
        </div>
        <div className="detail-row">
          <span className="label">Distance</span>
          <span className="value">{order.distance?.toFixed(1)} km</span>
        </div>
        <div className="detail-row">
          <span className="label">Fare</span>
          <span className="value">₹{order.fare?.toFixed(2)}</span>
        </div>
        <div className="detail-row">
          <span className="label">Payment</span>
          <span className="value">{order.paymentMethod}</span>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="rating-modal-overlay">
          <div className="rating-modal">
            <h2>Rate Your Driver</h2>
            <p>How was your delivery experience?</p>
            
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={`star-btn ${rating >= star ? "active" : ""}`}
                  onClick={() => setRating(star)}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              className="review-input"
              placeholder="Share your experience (optional)"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
            />

            <div className="modal-actions">
              <button 
                className="btn-secondary" 
                onClick={() => setShowRatingModal(false)}
              >
                Skip
              </button>
              <button 
                className="btn-primary" 
                onClick={handleSubmitRating}
                disabled={rating === 0}
              >
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackOrder;