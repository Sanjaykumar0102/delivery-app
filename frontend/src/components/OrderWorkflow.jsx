import React, { useState, useEffect } from "react";
import OrderMap from "./OrderMap";
import "./OrderWorkflow.css";

const OrderWorkflow = ({ order, onStatusUpdate, onNavigate, onRejectAcceptedOrder, driverLocation }) => {
  const [currentScreen, setCurrentScreen] = useState("assignment");
  const [promoCode, setPromoCode] = useState("");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  console.log("🎯 OrderWorkflow: Component rendered with order:", order);
  console.log("🎯 OrderWorkflow: Order status:", order?.status);
  console.log("🎯 OrderWorkflow: Order ID:", order?._id);

  // Determine current screen based on order status
  useEffect(() => {
    if (!order) {
      console.log("⚠️ OrderWorkflow: No order provided in useEffect");
      return;
    }

    console.log("🔄 OrderWorkflow: Order status changed to:", order.status);
    console.log("📦 OrderWorkflow: Full order data:", order);

    switch (order.status) {
      case "Assigned":
      case "Accepted":
        console.log("📋 Showing Assignment screen");
        setCurrentScreen("assignment");
        break;
      case "Arrived":
        console.log("📍 Showing Pickup screen");
        setCurrentScreen("pickup");
        break;
      case "Picked-Up":
      case "In-Transit":
        console.log("🚚 Showing Dropoff screen");
        setCurrentScreen("dropoff");
        break;
      case "Delivered":
        if (!paymentConfirmed) {
          console.log("💳 Showing Payment screen");
          setCurrentScreen("payment");
        } else {
          console.log("✅ Showing Receipt screen");
          setCurrentScreen("receipt");
        }
        break;
      default:
        console.log("❓ Unknown status, showing Assignment screen");
        setCurrentScreen("assignment");
    }
  }, [order?.status, paymentConfirmed]);

  // Reset payment confirmation when order changes
  useEffect(() => {
    if (order && order.status !== "Delivered") {
      setPaymentConfirmed(false);
    }
  }, [order?._id, order?.status]);

  if (!order) {
    console.log("⚠️ OrderWorkflow: No order, showing loading screen");
    return (
      <div className="workflow-screen">
        <div className="screen-header">
          <h2>Loading Order...</h2>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>🔄 Loading order details...</p>
        </div>
      </div>
    );
  }

  console.log("✅ OrderWorkflow: Rendering with order:", order._id, order.status);

  if (!order.pickup || !order.dropoff) {
    console.error("❌ OrderWorkflow: Missing pickup or dropoff data", order);
    return (
      <div className="workflow-screen">
        <div className="screen-header">
          <h2>Error</h2>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>⚠️ Order data is incomplete. Please refresh the page.</p>
          <button
            className="btn-primary"
            onClick={() => window.location.reload()}
            style={{ marginTop: '1rem' }}
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  const driverEarning = (order.fare * 0.8).toFixed(2);
  const platformFee = (order.fare * 0.2).toFixed(2);

  const packageWeightValue =
    order.packageDetails?.weight ??
    order.packageDetails?.totalWeight ??
    order.packageDetails?.packageWeight ??
    null;

  const formattedWeight =
    typeof packageWeightValue === "number" && packageWeightValue > 0
      ? `${packageWeightValue} kg`
      : null;

  const dimensions = order.packageDetails?.dimensions;
  const dimensionValues = dimensions
    ? ["length", "width", "height"]
        .map((key) =>
          typeof dimensions[key] === "number" && dimensions[key] > 0
            ? `${dimensions[key]} cm`
            : null
        )
        .filter(Boolean)
    : [];

  const formattedDimensions =
    dimensionValues.length > 0 ? dimensionValues.join(" × ") : null;

  // Job Assignment Screen
  const renderAssignmentScreen = () => (
    <div className="workflow-screen">
      <div className="screen-header">
        <h2>Job Assignment</h2>
        <div className="fare-display">
          <span className="vehicle-type">{order.vehicleType}</span>
          <span className="fare-amount">₹{order.fare.toFixed(2)}</span>
        </div>
      </div>

      <div className="location-cards">
        <div className="location-card pickup-card">
          <div className="location-icon">📍</div>
          <div className="location-details">
            <h3>PICK-UP</h3>
            <p className="address">{order.pickup.address}</p>
            {order.pickup.instructions && (
              <p className="instructions">{order.pickup.instructions}</p>
            )}
          </div>
        </div>

        <div className="location-card dropoff-card">
          <div className="location-icon">🎯</div>
          <div className="location-details">
            <h3>DROP-OFF</h3>
            <p className="address">{order.dropoff.address}</p>
            {order.dropoff.instructions && (
              <p className="instructions">{order.dropoff.instructions}</p>
            )}
          </div>
        </div>
      </div>

      <div className="order-info-section">
        <div className="info-row">
          <span>Distance</span>
          <span>{order.distance?.toFixed(1)} km</span>
        </div>
        <div className="info-row">
          <span>Payment Method</span>
          <span>{order.paymentMethod}</span>
        </div>
        <div className="info-row">
          <span>Customer</span>
          <span>{order.customer?.name || "N/A"}</span>
        </div>
        {order.customer?.phone && (
          <div className="info-row">
            <span>Contact</span>
            <span>{order.customer.phone}</span>
          </div>
        )}
      </div>

      <div className="map-container">
        <OrderMap 
          pickup={order.pickup}
          dropoff={order.dropoff}
          driverLocation={driverLocation}
        />
      </div>

      <div className="action-buttons">
        <button className="btn-secondary" onClick={() => onNavigate(order)}>
          📍 Navigate
        </button>
        {order.status === "Assigned" && (
          <button
            className="btn-primary"
            onClick={() => onStatusUpdate(order._id, "Accepted")}
          >
            Accept Job
          </button>
        )}
        {order.status === "Accepted" && (
          <button
            className="btn-primary"
            onClick={() => onStatusUpdate(order._id, "Arrived")}
            style={{ width: '100%' }}
          >
            Arrived at Pickup
          </button>
        )}
      </div>
    </div>
  );

  // Pick-Up Screen
  const renderPickupScreen = () => (
    <div className="workflow-screen">
      <div className="screen-header">
        <h2>Pick-Up</h2>
        <div className="status-badge arrived">Arrived</div>
      </div>

      <div className="location-card-large">
        <div className="location-icon-large">📍</div>
        <h3>{order.pickup.address}</h3>
        {order.pickup.instructions && (
          <p className="instructions-large">{order.pickup.instructions}</p>
        )}
      </div>

      <div className="package-details">
        <h3>Package Details</h3>
        <div className="items-list">
          {order.items?.map((item, index) => (
            <div key={index} className="item-row">
              <span className="item-name">{item.name}</span>
              <span className="item-quantity">x{item.quantity}</span>
            </div>
          ))}
        </div>
        {formattedWeight && (
          <div className="package-info">
            <span>Weight: {formattedWeight}</span>
          </div>
        )}
        {formattedDimensions && (
          <div className="package-info">
            <span>Dimensions: {formattedDimensions}</span>
          </div>
        )}
      </div>

      <div className="customer-contact">
        <h3>Customer Contact</h3>
        <div className="contact-buttons">
          {order.customer?.phone && (
            <>
              <a href={`tel:${order.customer.phone}`} className="btn-contact">
                📞 Call
              </a>
              <a href={`sms:${order.customer.phone}`} className="btn-contact">
                💬 Chat
              </a>
            </>
          )}
        </div>
      </div>

      <div className="map-container">
        <OrderMap 
          pickup={order.pickup}
          dropoff={order.dropoff}
          driverLocation={driverLocation}
        />
      </div>

      <div className="action-buttons">
        <button className="btn-secondary" onClick={() => onNavigate(order)}>
          📍 Navigate
        </button>
        <button 
          className="btn-primary"
          onClick={() => onStatusUpdate(order._id, "Picked-Up")}
        >
          📦 Picked Up Package
        </button>
      </div>
    </div>
  );

  // Drop-Off Screen
  const renderDropoffScreen = () => (
    <div className="workflow-screen">
      <div className="screen-header">
        <h2>Drop-Off</h2>
        <div className="status-badge in-transit">
          {order.status === "Picked-Up" ? "Ready to Deliver" : "In Transit"}
        </div>
      </div>

      <div className="location-card-large">
        <div className="location-icon-large">🎯</div>
        <h3>{order.dropoff.address}</h3>
        {order.dropoff.instructions && (
          <p className="instructions-large">{order.dropoff.instructions}</p>
        )}
      </div>

      <div className="delivery-info">
        <h3>Delivery Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="label">Customer</span>
            <span className="value">{order.customer?.name || "N/A"}</span>
          </div>
          <div className="info-item">
            <span className="label">Payment</span>
            <span className="value">{order.paymentMethod}</span>
          </div>
          <div className="info-item">
            <span className="label">Fare</span>
            <span className="value">₹{order.fare.toFixed(2)}</span>
          </div>
          <div className="info-item">
            <span className="label">Your Earning</span>
            <span className="value earning">₹{driverEarning}</span>
          </div>
        </div>
      </div>

      <div className="customer-contact">
        <h3>Customer Contact</h3>
        <div className="contact-buttons">
          {order.customer?.phone && (
            <>
              <a href={`tel:${order.customer.phone}`} className="btn-contact">
                📞 Call
              </a>
              <a href={`sms:${order.customer.phone}`} className="btn-contact">
                💬 Chat
              </a>
            </>
          )}
        </div>
      </div>

      <div className="map-container">
        <OrderMap 
          pickup={order.pickup}
          dropoff={order.dropoff}
          driverLocation={driverLocation}
        />
      </div>

      <div className="action-buttons">
        <button className="btn-secondary" onClick={() => onNavigate(order)}>
          📍 Navigate
        </button>
        {order.status === "Picked-Up" && (
          <button 
            className="btn-primary"
            onClick={() => onStatusUpdate(order._id, "In-Transit")}
          >
            🚚 Start Delivery
          </button>
        )}
        {order.status === "In-Transit" && (
          <button 
            className="btn-primary"
            onClick={() => onStatusUpdate(order._id, "Delivered")}
          >
            ✓ Mark as Delivered
          </button>
        )}
      </div>
    </div>
  );

  // Payment Screen
  const renderPaymentScreen = () => (
    <div className="workflow-screen">
      <div className="screen-header">
        <h2>Payment</h2>
        <div className="customer-name">{order.customer?.name || "Customer"}</div>
      </div>

      <div className="payment-breakdown">
        <div className="breakdown-row">
          <span>Meter Fare</span>
          <span>₹{order.fare.toFixed(2)}</span>
        </div>
        <div className="breakdown-row">
          <span>Toll & Others</span>
          <span>₹0.00</span>
        </div>
        <div className="breakdown-row promo-row">
          <input 
            type="text" 
            placeholder="Promo code"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            className="promo-input"
          />
          <span className="promo-discount">-₹0.00</span>
        </div>
        <div className="breakdown-row total-row">
          <span>Total</span>
          <span className="total-amount">₹{order.fare.toFixed(2)}</span>
        </div>
      </div>

      <div className="payment-method-display">
        <div className="payment-icon">
          {order.paymentMethod === "Cash" ? "💵" : "💳"}
        </div>
        <div className="payment-details">
          <h3>{order.paymentMethod}</h3>
          <p>
            {order.paymentMethod === "Cash" 
              ? "Collect cash from customer" 
              : "Payment already processed"}
          </p>
        </div>
      </div>

      <div className="earning-display">
        <div className="earning-card">
          <span className="earning-label">Your Earning (80%)</span>
          <span className="earning-value">₹{driverEarning}</span>
        </div>
        <div className="fee-card">
          <span className="fee-label">Platform Fee (20%)</span>
          <span className="fee-value">₹{platformFee}</span>
        </div>
      </div>

      <div className="action-buttons">
        <button 
          className="btn-primary full-width"
          onClick={() => setPaymentConfirmed(true)}
        >
          {order.paymentMethod === "Cash" ? "Confirm Cash Received" : "Proceed"}
        </button>
      </div>
    </div>
  );

  // Receipt Screen
  const renderReceiptScreen = () => (
    <div className="workflow-screen">
      <div className="screen-header">
        <h2>Receipt</h2>
        <div className="success-icon">✓</div>
      </div>

      <div className="receipt-card">
        <div className="receipt-header">
          <h3>Delivery Completed</h3>
          <p className="order-id">Order #{order._id.slice(-8)}</p>
          <p className="timestamp">{new Date(order.deliveredAt).toLocaleString()}</p>
        </div>

        <div className="receipt-section">
          <h4>Route</h4>
          <div className="route-summary">
            <div className="route-point-small">
              <span className="icon">📍</span>
              <span className="address">{order.pickup.address}</span>
            </div>
            <div className="route-line-small"></div>
            <div className="route-point-small">
              <span className="icon">🎯</span>
              <span className="address">{order.dropoff.address}</span>
            </div>
          </div>
        </div>

        <div className="receipt-section">
          <h4>Payment Summary</h4>
          <div className="summary-row">
            <span>Meter Fare</span>
            <span>₹{order.fare.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Distance</span>
            <span>{order.distance?.toFixed(1)} km</span>
          </div>
          <div className="summary-row">
            <span>Payment Method</span>
            <span>{order.paymentMethod}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>₹{order.fare.toFixed(2)}</span>
          </div>
        </div>

        <div className="receipt-section earning-section">
          <h4>Your Earnings</h4>
          <div className="earning-breakdown">
            <div className="earning-row">
              <span>Driver Share (80%)</span>
              <span className="earning-amount">₹{driverEarning}</span>
            </div>
            <div className="earning-row">
              <span>Platform Fee (20%)</span>
              <span className="fee-amount">₹{platformFee}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <button 
          className="btn-primary full-width"
          onClick={() => window.location.reload()}
        >
          Done
        </button>
      </div>
    </div>
  );

  // Render appropriate screen
  return (
    <div className="order-workflow">
      {currentScreen === "assignment" && renderAssignmentScreen()}
      {currentScreen === "pickup" && renderPickupScreen()}
      {currentScreen === "dropoff" && renderDropoffScreen()}
      {currentScreen === "payment" && renderPaymentScreen()}
      {currentScreen === "receipt" && renderReceiptScreen()}
    </div>
  );
};

export default OrderWorkflow;