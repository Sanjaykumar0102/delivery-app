import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../../services/authService";
import axios from "../../../utils/axios";
import Cookies from "js-cookie";
import { io } from "socket.io-client";
import OrderMap from "../../../components/OrderMap";
import OrderWorkflow from "../../../components/OrderWorkflow";
import EarningsChart from "../../../components/EarningsChart";
import MyProfile from "../../../components/MyProfile";
import "./DriverDashboard.css";

const DriverDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [socket, setSocket] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const [showCurrentOrderTab, setShowCurrentOrderTab] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [useWorkflowUI, setUseWorkflowUI] = useState(true); // Toggle for new UI
  
  // Orders state
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  
  // Earnings state
  const [earnings, setEarnings] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    total: 0,
  });
  
  // Stats state
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    completedDeliveries: 0,
    averageRating: 0,
  });
  
  // Location state
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [locationError, setLocationError] = useState("");
  
  // Notification state - persistent storage for notifications tab
  const [notifications, setNotifications] = useState(() => {
    // Load notifications from localStorage on component mount
    const saved = localStorage.getItem('driverNotifications');
    return saved ? JSON.parse(saved) : [];
  });

  // Modal notification state
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState(null);

  // Initialize user and socket
  useEffect(() => {
    const userCookie = Cookies.get("user");
    if (!userCookie) {
      navigate("/login");
      return;
    }
    
    const parsedUser = JSON.parse(userCookie);
    
    // Check if driver is deactivated
    if (parsedUser.isActive === false) {
      alert(`Your account has been deactivated. Reason: ${parsedUser.deactivationReason || 'No reason provided'}. Please contact admin.`);
      logout();
      navigate("/login");
      return;
    }
    
    console.log('🚗 Driver Dashboard Initialized');
    console.log('   User isOnDuty from session:', parsedUser.isOnDuty);
    console.log('   Setting state to:', parsedUser.isOnDuty || false);
    
    setUser(parsedUser);
    setIsOnDuty(parsedUser.isOnDuty || false);

    // Determine approval status explicitly
    if (parsedUser.approvalStatus) {
      setApprovalStatus(parsedUser.approvalStatus);
    } else if (parsedUser.isApproved) {
      setApprovalStatus("Approved");
    } else {
      setApprovalStatus("Pending");
    }
    
    // Load earnings and stats
    if (parsedUser.earnings) setEarnings(parsedUser.earnings);
    if (parsedUser.stats) setStats(parsedUser.stats);

    // Connect to socket
    console.log('🔌 Connecting to socket for driver:', parsedUser.name, parsedUser._id);
    const newSocket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    setSocket(newSocket);

    // Register driver with socket server
    newSocket.on("connect", () => {
      console.log("✅ Socket connected for driver:", parsedUser.name);
      console.log("   Socket ID:", newSocket.id);
      console.log("   Driver ID:", parsedUser._id);
      console.log("📋 Registering driver with details:", {
        userId: parsedUser._id,
        role: parsedUser.role,
        vehicleType: parsedUser?.driverDetails?.vehicleType,
        isOnDuty: parsedUser.isOnDuty,
        isApproved: parsedUser.isApproved,
        approvalStatus: parsedUser.approvalStatus
      });
      
      newSocket.emit("register", {
        userId: parsedUser._id,
        role: parsedUser.role,
        vehicleType: parsedUser?.driverDetails?.vehicleType,
        isOnDuty: parsedUser.isOnDuty,
        isApproved: parsedUser.isApproved,
        approvalStatus: parsedUser.approvalStatus
      });
      
      console.log("✅ Registration emitted for driver:", parsedUser.name);
      console.log("🔔 Driver should receive notifications for vehicle type:", parsedUser?.driverDetails?.vehicleType);
    });
    
    newSocket.on("connect_error", (error) => {
      console.error("❌ Socket connection error for driver:", parsedUser.name, error);
    });
    
    newSocket.on("disconnect", (reason) => {
      console.warn("⚠️ Socket disconnected for driver:", parsedUser.name, "Reason:", reason);
    });

    // Listen for new order notifications
    newSocket.on("newOrderAvailable", (orderData) => {
      console.log("🔔 RAW order notification received:", orderData);
      console.log("👤 Current driver vehicle type:", parsedUser?.driverDetails?.vehicleType);
      console.log("🚗 Order vehicle type:", orderData.vehicleType);

      const driverVehicleType = parsedUser?.driverDetails?.vehicleType;
      if (driverVehicleType && orderData.vehicleType !== driverVehicleType) {
        console.log(
          "🚫 Ignoring order for different vehicle type",
          orderData.vehicleType,
          "vs",
          driverVehicleType
        );
        return;
      }

      // ✅ Check if driver already has an active order
      // This check happens in the state, so we need to use a callback
      setCurrentOrder(prevCurrentOrder => {
        if (prevCurrentOrder) {
          console.log("🚫 Driver already has an active order, ignoring notification");
          return prevCurrentOrder; // Don't change current order
        }

        // No active order, show notification and store persistently
        console.log("✅ SHOWING NOTIFICATION for order:", orderData._id);
        console.log("📱 Notification data:", {
          orderId: orderData._id,
          vehicleType: orderData.vehicleType,
          pickup: orderData.pickup?.address,
          dropoff: orderData.dropoff?.address,
          fare: orderData.fare
        });

        // Store notification persistently
        const newNotification = {
          id: orderData._id,
          orderId: orderData._id,
          timestamp: new Date().toISOString(),
          status: 'pending',
          ...orderData
        };

        setNotifications(prev => {
          const updated = [newNotification, ...prev];
          localStorage.setItem('driverNotifications', JSON.stringify(updated));
          return updated;
        });

        // Show modal notification (existing behavior)
        setNotification(orderData);
        setShowNotification(true);
        playNotificationSound();

        // Auto-hide modal after 30 seconds (but keep in persistent storage)
        setTimeout(() => {
          console.log("⏰ Auto-hiding notification modal after 30 seconds");
          setShowNotification(false);
        }, 30000);

        return prevCurrentOrder; // Return unchanged
      });
    });

    // Listen for order updates
    newSocket.on("orderAssigned", (data) => {
      if (data.driverId === parsedUser._id) {
        fetchMyOrders();
      }
    });

    // Listen for order accepted by another driver
    newSocket.on("orderAcceptedByOther", (data) => {
      console.log(`ℹ️ Order ${data.orderId} was accepted by ${data.acceptedBy}`);
      // Remove from notification if showing
      if (notification && notification._id === data.orderId) {
        setShowNotification(false);
        setNotification(null);
      }
      // Remove from persistent notifications
      setNotifications(prev => {
        const updated = prev.filter(n => n.orderId !== data.orderId);
        localStorage.setItem('driverNotifications', JSON.stringify(updated));
        return updated;
      });
      // Refresh available orders
      fetchAvailableOrders();
    });

    // Listen for customer search timeout
    newSocket.on("customerSearchTimeout", (data) => {
      console.log(`⏰ Customer search timed out for order ${data.orderId}`);
      // Remove from notification if showing
      if (notification && notification._id === data.orderId) {
        setShowNotification(false);
        setNotification(null);
      }
      // Remove from persistent notifications
      setNotifications(prev => {
        const updated = prev.filter(n => n.orderId !== data.orderId);
        localStorage.setItem('driverNotifications', JSON.stringify(updated));
        return updated;
      });
    });

    // Listen for order cancellation
    newSocket.on("orderCancelled", (data) => {
      console.log(`❌ Order ${data.orderId} was cancelled`);
      // Remove from notification if showing
      if (notification && notification._id === data.orderId) {
        setShowNotification(false);
        setNotification(null);
        alert("⚠️ " + (data.message || "This order was cancelled"));
      }
      // Remove from persistent notifications
      setNotifications(prev => {
        const updated = prev.filter(n => n.orderId !== data.orderId);
        localStorage.setItem('driverNotifications', JSON.stringify(updated));
        return updated;
      });
      // Refresh orders
      fetchAvailableOrders();
      fetchMyOrders();
    });

    // Listen for account status updates (deactivation/activation)
    newSocket.on("accountStatusUpdate", (data) => {
      console.log("⚠️ Account status updated:", data);
      if (!data.isActive) {
        alert(`Your account has been deactivated. Reason: ${data.reason || 'No reason provided'}. You will be logged out.`);
        logout();
        navigate("/login");
      } else {
        alert("✅ Your account has been activated! You can now continue working.");
        window.location.reload();
      }
    });

    // Listen for approval status updates
    newSocket.on("approvalStatusUpdate", (data) => {
      console.log("🎉 Approval status updated:", data);
      setApprovalStatus(data.approvalStatus);
      
      // Update cookies
      const cookies = document.cookie.split("; ");
      const userCookie = cookies.find((row) => row.startsWith("user="));
      if (userCookie) {
        const userData = JSON.parse(decodeURIComponent(userCookie.split("=")[1]));
        userData.isApproved = data.isApproved;
        userData.approvalStatus = data.approvalStatus;
        if (data.rejectionReason) {
          userData.rejectionReason = data.rejectionReason;
        }
        document.cookie = `user=${encodeURIComponent(JSON.stringify(userData))}; path=/; max-age=${30 * 24 * 60 * 60}`;
      }
      
      // Show notification
      if (data.approvalStatus === 'Approved') {
        alert(data.message || 'Congratulations! Your driver application has been approved. You can now go online!');
        // Reload to update UI
        window.location.reload();
      } else if (data.approvalStatus === 'Rejected') {
        alert(data.message || 'Your driver application has been rejected.');
        // Reload to update UI
        window.location.reload();
      }
    });

    // Listen for earnings updates
    newSocket.on("earningsUpdate", (data) => {
      console.log("💰 Earnings updated:", data);
      console.log("📊 New earnings:", data.earnings);
      console.log("📈 New stats:", data.stats);
      
      // Update state immediately
      setEarnings(data.earnings);
      setStats(data.stats);
      
      // Update user state
      setUser(prevUser => ({
        ...prevUser,
        earnings: data.earnings,
        stats: data.stats
      }));
      
      // Update user cookie
      const updatedUser = { ...parsedUser, earnings: data.earnings, stats: data.stats };
      Cookies.set("user", JSON.stringify(updatedUser), { expires: 30 });
      
      // Show notification
      if (data.orderEarning) {
        alert(`🎉 Order completed! You earned ₹${Number(data.orderEarning).toFixed(2)}`);
      }
      
      // Refresh profile to ensure sync
      fetchDriverProfile();
    });

    // Listen for order status updates (to refresh current order in real-time)
    newSocket.on("orderStatusUpdate", (data) => {
      console.log("📦 Order status updated via socket:", data);
      
      // Refresh orders to get the latest status
      // This will update currentOrder if it's the active order
      console.log("🔄 Refreshing orders after status update");
      fetchMyOrders();
    });

    return () => {
      newSocket.off("newOrderAvailable");
      newSocket.off("orderAssigned");
      newSocket.off("orderAcceptedByOther");
      newSocket.off("customerSearchTimeout");
      newSocket.off("orderCancelled");
      newSocket.off("approvalStatusUpdate");
      newSocket.off("earningsUpdate");
      newSocket.off("orderStatusUpdate");
      newSocket.close();
    };
  }, [navigate]);

  // Get current location
  useEffect(() => {
    if (isOnDuty && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(newLocation);
          setLocationError("");
          
          // Broadcast location to server
          if (socket && currentOrder) {
            socket.emit("updateLocation", {
              orderId: currentOrder._id,
              lat: newLocation.lat,
              lng: newLocation.lng,
            });
          }
        },
        (error) => {
          setLocationError("Unable to get location. Please enable GPS.");
          console.error("Location error:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isOnDuty, socket, currentOrder]);

  // Don't fetch available orders - driver should only receive notifications
  // Available orders are shown via socket notifications only
  useEffect(() => {
    if (!isOnDuty) {
      setAvailableOrders([]);
    }
  }, [isOnDuty]);

  // Fetch my orders
  useEffect(() => {
    if (activeTab === "orders") {
      fetchMyOrders();
    }
  }, [activeTab]);

  // Fetch driver profile on mount and when switching to home/earnings tab
  useEffect(() => {
    if (user && (activeTab === "home" || activeTab === "earnings")) {
      fetchDriverProfile();
    }
  }, [activeTab]);

  // Initial profile fetch
  useEffect(() => {
    if (user) {
      fetchDriverProfile();
    }
  }, []);

  const playNotificationSound = () => {
    // Play notification sound (you can add audio file)
    const audio = new Audio("/notification.mp3");
    audio.play().catch((e) => console.log("Audio play failed:", e));
  };

  // Available orders are now handled via socket notifications only
  // Driver receives one notification at a time and must accept/reject before seeing next order

  const fetchMyOrders = async () => {
    try {
      console.log("🔍 Fetching driver orders...");
      const response = await axios.get("/orders");
      console.log("📦 Fetched orders:", response.data);
      console.log("📦 Number of orders:", response.data.length);
      setMyOrders(response.data);
      
      // Find current active order (exclude delivered orders)
      const active = response.data.find(
        (order) =>
          order.status === "Accepted" ||
          order.status === "Arrived" ||
          order.status === "Picked-Up" ||
          order.status === "In-Transit"
      );
      console.log("🎯 Active order found:", active);
      console.log("🎯 Active order status:", active?.status);
      console.log("🎯 Active order has pickup:", !!active?.pickup);
      console.log("🎯 Active order has dropoff:", !!active?.dropoff);
      setCurrentOrder(active || null);
    } catch (error) {
      console.error("❌ Error fetching my orders:", error);
    }
  };

  const fetchDriverProfile = async () => {
    try {
      const response = await axios.get("/users/profile");
      const driverData = response.data;
      
      // Update earnings and stats
      if (driverData.earnings) {
        setEarnings(driverData.earnings);
      }
      if (driverData.stats) {
        setStats(driverData.stats);
      }
      
      // Update user cookie
      const updatedUser = { ...user, earnings: driverData.earnings, stats: driverData.stats };
      setUser(updatedUser);
      Cookies.set("user", JSON.stringify(updatedUser), { expires: 30 });
      
      console.log("✅ Driver profile refreshed:", driverData);
    } catch (error) {
      console.error("Error fetching driver profile:", error);
    }
  };

  const handleDutyToggle = async () => {
    // Check approval status first
    if (approvalStatus !== "Approved") {
      let message = "Your account is pending approval. Please wait for admin approval before going on duty.";
      if (approvalStatus === "Rejected") {
        message = "Your driver application has been rejected. Please contact support.";
      }
      alert(message);
      return;
    }

    console.log('🔄 Duty toggle clicked');
    console.log('   Current duty status:', isOnDuty);
    console.log('   Will change to:', !isOnDuty);

    try {
      const response = await axios.put("/users/duty", {
        isOnDuty: !isOnDuty,
      });
      
      console.log('✅ Duty toggle API response:', response.data);
      
      setIsOnDuty(response.data.isOnDuty);
      
      // Update cookie with new duty status
      const updatedUser = { ...user, isOnDuty: response.data.isOnDuty };
      Cookies.set("user", JSON.stringify(updatedUser), { expires: 30 });
      setUser(updatedUser);
      
      // Emit duty status change via socket
      if (socket) {
        socket.emit("dutyStatusChange", {
          driverId: user._id,
          isOnDuty: response.data.isOnDuty,
        });
      }
      
      if (!response.data.isOnDuty) {
        setAvailableOrders([]);
      }
      
      // Show success message
      const successMessage = response.data.message || (response.data.isOnDuty ? "✅ You are now on duty" : "🔴 You are now off duty");
      alert(successMessage);
    } catch (error) {
      console.error("Error toggling duty:", error);
      let errorMessage = "Failed to update duty status";
      
      if (error.response?.status === 403) {
        errorMessage = error.response.data?.message || "Your account is not approved yet. Please wait for admin approval.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert("❌ " + errorMessage);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      console.log("🎯 ===== ACCEPT ORDER DEBUG =====");
      console.log("📦 Order ID:", orderId);
      console.log("👤 User data:", user);
      
      if (!user || user.role !== "Driver") {
        console.error("❌ User is not a driver! Role:", user?.role);
        alert("❌ Only drivers can accept orders.");
        return;
      }

      console.log("✅ Sending accept request...");
      const response = await axios.put(`/orders/${orderId}/accept`);
      console.log("✅ Accept response:", response.data);

      // Remove from persistent notifications
      setNotifications(prev => {
        const updated = prev.filter(n => n.orderId !== orderId);
        localStorage.setItem('driverNotifications', JSON.stringify(updated));
        return updated;
      });

      setShowNotification(false);
      setNotification(null);

      // Immediately fetch orders to update currentOrder
      await fetchMyOrders();

      // Show current order tab and navigate to it
      setShowCurrentOrderTab(true);
      setActiveTab("current-order");

      // Switch to workflow UI to show the order
      setUseWorkflowUI(true);

      alert("✅ Order accepted successfully! Track your delivery in the Current Order tab.");
    } catch (error) {
      console.error("❌ ===== ACCEPT ORDER ERROR =====");
      console.error("Error:", error);
      console.error("Error response:", error.response);
      console.error("Error response data:", error.response?.data);
      console.error("Request config:", error.config);
      console.error("Request headers:", error.config?.headers);

      let errorMessage = "Failed to accept order";

      if (error.response?.status === 403) {
        errorMessage = error.response.data?.message || "Access denied. Please make sure you're logged in as a driver.";
        console.error("❌ 403 Forbidden - Current user role:", user?.role);
        console.error("❌ Token being used:", error.config?.headers?.Authorization);
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || "Order is no longer available";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      alert("❌ " + errorMessage);
    }
  };

  // Reject accepted order function removed - drivers cannot cancel after accepting
  // If customer cancels after driver accepts, customer pays 50% cancellation fee to driver

  const handleRejectOrder = () => {
    if (notification) {
      // Remove from persistent notifications
      setNotifications(prev => {
        const updated = prev.filter(n => n.orderId !== notification._id);
        localStorage.setItem('driverNotifications', JSON.stringify(updated));
        return updated;
      });
    }

    setShowNotification(false);
    setNotification(null);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      console.log(`📦 Updating order ${orderId} to status: ${newStatus}`);
      console.log("📋 Current order before update:", currentOrder);

      const response = await axios.put(`/orders/${orderId}/status`, { status: newStatus });
      console.log("✅ Status update response:", response.data);

      // Immediately update the current order status optimistically
      if (currentOrder && currentOrder._id === orderId) {
        console.log("🔄 Optimistically updating current order status");
        setCurrentOrder(prev => ({
          ...prev,
          status: newStatus
        }));
      }

      // Refresh orders immediately
      console.log("🔄 Fetching updated orders...");
      await fetchMyOrders();

      // Wait a bit for state to update
      setTimeout(() => {
        console.log("📋 Current order after fetch (delayed check):", currentOrder);
      }, 100);

      // If delivered, refresh earnings and clear current order
      if (newStatus === "Delivered") {
        console.log("💰 Order delivered, refreshing earnings...");
        await fetchDriverProfile();

        // Clear current order since it's no longer active
        console.log("🧹 Clearing current order after delivery");
        setCurrentOrder(null);
        setUseWorkflowUI(false);
        setShowCurrentOrderTab(false); // Hide current order tab
        setActiveTab("home"); // Navigate back to home
      }

      // Emit status update via socket
      if (socket) {
        socket.emit("orderStatusUpdate", { orderId, status: newStatus });
      }

      // Show success message
      alert(`✅ Order status updated to ${newStatus}`);
    } catch (error) {
      console.error("❌ Error updating status:", error);
      console.error("❌ Error details:", error.response?.data);

      // Revert optimistic update if there was an error
      if (currentOrder && currentOrder._id === orderId) {
        console.log("🔄 Reverting optimistic update due to error");
        await fetchMyOrders(); // Refresh to get correct state
      }

      alert("❌ Failed to update order status: " + (error.response?.data?.message || error.message));
    }
  };

  const handleNavigate = (order) => {
    // Determine destination based on order status
    let destination;
    let destinationName;

    if (order.status === "Picked-Up" || order.status === "In-Transit") {
      // Navigate to dropoff location
      destination = order.dropoff;
      destinationName = "Dropoff Location";
    } else {
      // Navigate to pickup location
      destination = order.pickup;
      destinationName = "Pickup Location";
    }

    // Always use driver's current location as origin
    const origin = location.lat && location.lng ? { lat: location.lat, lng: location.lng } : null;

    // Open Google Maps with directions
    if (destination.lat && destination.lng) {
      let url;
      if (origin && origin.lat && origin.lng) {
        // Use driver's current location as origin and destination for directions
        url = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`;
      } else {
        // Fallback: Use device's current location (Google Maps will auto-detect)
        url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`;
      }

      // Open in new tab
      window.open(url, '_blank');
    } else {
      // Fallback to address search if coordinates are not available
      const address = encodeURIComponent(destination.address);
      const url = `https://www.google.com/maps/search/?api=1&query=${address}`;
      window.open(url, '_blank');
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

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      Assigned: "Accepted",
      Accepted: "Arrived",
      Arrived: "Picked-Up",
      "Picked-Up": "In-Transit",
      "In-Transit": "Delivered",
    };
    return statusFlow[currentStatus];
  };

  const getNextStatusLabel = (currentStatus) => {
    const labels = {
      Assigned: "Accept Order",
      Accepted: "Arrived at Pickup",
      Arrived: "Picked Up Package",
      "Picked-Up": "Start Delivery",
      "In-Transit": "Mark as Delivered",
    };
    return labels[currentStatus];
  };

  const getNextStatusIcon = (currentStatus) => {
    const icons = {
      Assigned: "✅",
      Accepted: "📍",
      Arrived: "📦",
      "Picked-Up": "🚚",
      "In-Transit": "✓",
    };
    return icons[currentStatus] || "→";
  };

  const getStatusIcon = (status) => {
    const icons = {
      Pending: "⏳",
      Assigned: "📋",
      Accepted: "✅",
      Arrived: "📍",
      "Picked-Up": "📦",
      "In-Transit": "🚚",
      Delivered: "✅",
      Cancelled: "❌",
    };
    return icons[status] || "📦";
  };

  return (
    <div className="driver-dashboard">
      {/* Header */}
      <header className="driver-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo-section">
              <div className="logo-icon">🚚</div>
              <div className="logo-text">
                <h1>DelivraX Driver</h1>
                <p>Earn on your schedule</p>
              </div>
            </div>
          </div>
          <div className="header-right">
            <div className="duty-toggle">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={isOnDuty}
                  onChange={handleDutyToggle}
                  disabled={approvalStatus !== "Approved"}
                  title={approvalStatus !== "Approved" ? "Wait for admin approval" : ""}
                />
                <span className="slider"></span>
              </label>
              <span className={`duty-status ${isOnDuty ? "on" : "off"}`}>
                {isOnDuty ? "🟢 On Duty" : "🔴 Off Duty"}
              </span>
            </div>
            {currentOrder && (
              <button 
                className="ui-toggle-btn"
                onClick={() => setUseWorkflowUI(!useWorkflowUI)}
                title="Toggle UI Style"
              >
                {useWorkflowUI ? "📱 Classic UI" : "🎨 Workflow UI"}
              </button>
            )}
            <div className="user-info">
              <div className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
              <div className="user-details">
                <span className="user-name">{user?.name}</span>
                <span className="user-rating">⭐ {stats.averageRating.toFixed(1)}</span>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="driver-nav">
        <div className="nav-container">
          <button
            className={`nav-btn ${activeTab === "home" ? "active" : ""}`}
            onClick={() => setActiveTab("home")}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Home</span>
          </button>
          {showCurrentOrderTab && currentOrder && (
            <button
              className={`nav-btn ${activeTab === "current-order" ? "active" : ""}`}
              onClick={() => setActiveTab("current-order")}
            >
              <span className="nav-icon">🚚</span>
              <span className="nav-text">Current Order</span>
              <span className="badge pulse">LIVE</span>
            </button>
          )}
          <button
            className={`nav-btn ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            <span className="nav-icon">📦</span>
            <span className="nav-text">My Orders</span>
            {myOrders.filter(order => order.status === "Delivered").length > 0 && <span className="badge">{myOrders.filter(order => order.status === "Delivered").length}</span>}
          </button>
          <button
            className={`nav-btn ${activeTab === "notifications" ? "active" : ""}`}
            onClick={() => setActiveTab("notifications")}
          >
            <span className="nav-icon">🔔</span>
            <span className="nav-text">Notifications</span>
            {notifications.filter(n => n.status === 'pending').length > 0 && (
              <span className="badge urgent">
                {notifications.filter(n => n.status === 'pending').length}
              </span>
            )}
          </button>
          <button
            className={`nav-btn ${activeTab === "earnings" ? "active" : ""}`}
            onClick={() => setActiveTab("earnings")}
          >
            <span className="nav-icon">💰</span>
            <span className="nav-text">Earnings</span>
          </button>
          <button
            className={`nav-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <span className="nav-icon">👤</span>
            <span className="nav-text">Profile</span>
          </button>
        </div>
      </nav>

      {/* Order Notification Modal */}
      {showNotification && notification && (
        <div className="notification-overlay">
          <div className="notification-modal">
            <div className="notification-header">
              <h2>🔔 New Order Available!</h2>
              <button className="close-btn" onClick={handleRejectOrder}>
                ✕
              </button>
            </div>
            <div className="notification-body">
              <div className="order-info">
                <div className="info-row">
                  <span className="label">📍 Pickup:</span>
                  <span className="value">{notification.pickup?.address}</span>
                </div>
                <div className="info-row">
                  <span className="label">🎯 Dropoff:</span>
                  <span className="value">{notification.dropoff?.address}</span>
                </div>
                <div className="info-row">
                  <span className="label">💰 Fare:</span>
                  <span className="value fare">₹{notification.fare}</span>
                </div>
                <div className="info-row">
                  <span className="label">📦 Items:</span>
                  <span className="value">
                    {(notification.items || []).map((item) => item.name).join(", ")}
                  </span>
                </div>
              </div>
            </div>
            <div className="notification-actions">
              <button className="reject-btn" onClick={handleRejectOrder}>
                ❌ Reject
              </button>
              <button
                className="accept-btn"
                onClick={() => handleAcceptOrder(notification._id)}
              >
                ✅ Accept Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="driver-content">
        {/* Approval Status Banner */}
        {approvalStatus && approvalStatus !== "Approved" && (
          <div className={`approval-banner ${approvalStatus.toLowerCase()}`}>
            {approvalStatus === "Pending" && (
              <>
                <span className="banner-icon">⏳</span>
                <div className="banner-content">
                  <strong>Approval Pending</strong>
                  <p>Your driver application is under review. You'll be notified once approved.</p>
                </div>
              </>
            )}
            {approvalStatus === "Rejected" && (
              <>
                <span className="banner-icon">❌</span>
                <div className="banner-content">
                  <strong>Application Rejected</strong>
                  <p>Your driver application was not approved. Please contact support for more information.</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Home Tab */}
        {activeTab === "home" && (
          <div className="home-section">
            {!isOnDuty ? (
              <div className="duty-off-state">
                <div className="duty-icon">🌙</div>
                <h2>You're currently off duty</h2>
                <p>Turn on duty to start receiving orders</p>
                <button 
                  className="duty-on-btn" 
                  onClick={handleDutyToggle}
                  disabled={approvalStatus !== "Approved"}
                  title={approvalStatus !== "Approved" ? "Wait for admin approval to go online" : ""}
                >
                  🟢 Go Online
                </button>
                {approvalStatus !== "Approved" && (
                  <p style={{ color: "#ff9800", marginTop: "1rem", fontSize: "0.9rem" }}>
                    ⚠️ You need admin approval before going online
                  </p>
                )}
              </div>
            ) : (
              <>
                {/* Earnings Summary - Enhanced UI */}
                <div className="earnings-summary-modern">
                  <div className="earnings-header">
                    <div className="earnings-title">
                      <span className="earnings-icon">💰</span>
                      <h3>Your Earnings</h3>
                    </div>
                    <div className="earnings-info-badge">
                      <span className="info-icon">ℹ️</span>
                      <span className="info-text">You earn 80% of each delivery fare</span>
                    </div>
                  </div>
                  
                  <div className="earnings-grid-modern">
                    <div className="earning-card-modern today">
                      <div className="card-header">
                        <span className="card-icon">📅</span>
                        <span className="card-label">Today</span>
                      </div>
                      <div className="card-amount">₹{Number(earnings.today || 0).toFixed(2)}</div>
                      <div className="card-footer">
                        <span className="trend-indicator">📈</span>
                      </div>
                    </div>
                    
                    <div className="earning-card-modern week">
                      <div className="card-header">
                        <span className="card-icon">📊</span>
                        <span className="card-label">This Week</span>
                      </div>
                      <div className="card-amount">₹{Number(earnings.thisWeek || 0).toFixed(2)}</div>
                      <div className="card-footer">
                        <span className="trend-indicator">💪</span>
                      </div>
                    </div>
                    
                    <div className="earning-card-modern month">
                      <div className="card-header">
                        <span className="card-icon">📆</span>
                        <span className="card-label">This Month</span>
                      </div>
                      <div className="card-amount">₹{Number(earnings.thisMonth || 0).toFixed(2)}</div>
                      <div className="card-footer">
                        <span className="trend-indicator">🚀</span>
                      </div>
                    </div>
                    
                    <div className="earning-card-modern total">
                      <div className="card-header">
                        <span className="card-icon">🏆</span>
                        <span className="card-label">Total Earnings</span>
                      </div>
                      <div className="card-amount highlight">₹{Number(earnings.total || 0).toFixed(2)}</div>
                      <div className="card-footer">
                        <span className="achievement-badge">⭐ Keep Going!</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Summary - Enhanced UI */}
                <div className="stats-summary-modern">
                  <div className="stats-header">
                    <span className="stats-icon">📊</span>
                    <h3>Performance Stats</h3>
                  </div>
                  
                  <div className="stats-grid-modern">
                    <div className="stat-card-modern deliveries">
                      <div className="stat-icon-wrapper">
                        <span className="stat-icon-large">📦</span>
                      </div>
                      <div className="stat-content">
                        <div className="stat-value-large">{stats.totalDeliveries}</div>
                        <div className="stat-label-modern">Total Deliveries</div>
                        <div className="stat-progress">
                          <div className="progress-bar" style={{width: `${Math.min((stats.totalDeliveries / 100) * 100, 100)}%`}}></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="stat-card-modern completed">
                      <div className="stat-icon-wrapper">
                        <span className="stat-icon-large">✅</span>
                      </div>
                      <div className="stat-content">
                        <div className="stat-value-large">{stats.completedDeliveries}</div>
                        <div className="stat-label-modern">Completed</div>
                        <div className="stat-badge success">
                          {stats.totalDeliveries > 0 
                            ? `${((stats.completedDeliveries / stats.totalDeliveries) * 100).toFixed(0)}% Success Rate`
                            : '0% Success Rate'
                          }
                        </div>
                      </div>
                    </div>
                    
                    <div className="stat-card-modern rating">
                      <div className="stat-icon-wrapper">
                        <span className="stat-icon-large">⭐</span>
                      </div>
                      <div className="stat-content">
                        <div className="stat-value-large">{stats.averageRating.toFixed(1)}</div>
                        <div className="stat-label-modern">Average Rating</div>
                        <div className="rating-stars">
                          {[1, 2, 3, 4, 5].map(star => (
                            <span key={star} className={star <= Math.round(stats.averageRating) ? 'star-filled' : 'star-empty'}>
                              ⭐
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Current Order - Workflow UI */}
                {currentOrder ? (
                  useWorkflowUI ? (
                    <OrderWorkflow
                      key={`${currentOrder._id}-${currentOrder.status}`}
                      order={currentOrder}
                      onStatusUpdate={handleUpdateStatus}
                      onNavigate={handleNavigate}
                      driverLocation={location}
                    />
                  ) : (
                  <div className="current-order-section rapido-style">
                    <div className="section-header-rapido">
                      <h3>📦 Job Assignment</h3>
                      <span className="order-id-badge">#{currentOrder._id.slice(-6)}</span>
                    </div>
                    
                    <div className="rapido-order-card">
                      {/* Status Banner */}
                      <div 
                        className="status-banner"
                        style={{ background: `linear-gradient(135deg, ${getStatusColor(currentOrder.status)}, ${getStatusColor(currentOrder.status)}dd)` }}
                      >
                        <span className="status-text">{currentOrder.status}</span>
                        <span className="status-icon">{getStatusIcon(currentOrder.status)}</span>
                      </div>

                      {/* Customer Info */}
                      {currentOrder.customer && (
                        <div className="customer-info-card">
                          <div className="customer-avatar">
                            {currentOrder.customer.name?.charAt(0).toUpperCase() || 'C'}
                          </div>
                          <div className="customer-details">
                            <h4>{currentOrder.customer.name || 'Customer'}</h4>
                            <p>{currentOrder.customer.phone || 'No phone'}</p>
                          </div>
                          <button className="call-btn" onClick={() => window.open(`tel:${currentOrder.customer.phone}`)}>
                            📞
                          </button>
                        </div>
                      )}

                      {/* Pickup Location Card */}
                      <div className="location-card pickup-card">
                        <div className="location-header">
                          <div className="location-icon-wrapper pickup-icon">
                            <span>📍</span>
                          </div>
                          <div className="location-info">
                            <h4>PICK-UP</h4>
                            <p className="location-address">{currentOrder.pickup.address}</p>
                            {currentOrder.pickup.instructions && (
                              <p className="location-instructions">💬 {currentOrder.pickup.instructions}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Route Connector */}
                      <div className="route-connector">
                        <div className="connector-line"></div>
                        <div className="connector-dots">
                          <span className="dot"></span>
                          <span className="dot"></span>
                          <span className="dot"></span>
                        </div>
                      </div>

                      {/* Dropoff Location Card */}
                      <div className="location-card dropoff-card">
                        <div className="location-header">
                          <div className="location-icon-wrapper dropoff-icon">
                            <span>🎯</span>
                          </div>
                          <div className="location-info">
                            <h4>DROP-OFF</h4>
                            <p className="location-address">{currentOrder.dropoff.address}</p>
                            {currentOrder.dropoff.instructions && (
                              <p className="location-instructions">💬 {currentOrder.dropoff.instructions}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Order Details Grid */}
                      <div className="order-details-grid">
                        <div className="detail-card">
                          <span className="detail-icon">💰</span>
                          <div className="detail-content">
                            <span className="detail-label">Fare</span>
                            <span className="detail-value">₹{currentOrder.fare}</span>
                          </div>
                        </div>
                        <div className="detail-card">
                          <span className="detail-icon">💳</span>
                          <div className="detail-content">
                            <span className="detail-label">Payment</span>
                            <span className="detail-value">{currentOrder.paymentMethod}</span>
                          </div>
                        </div>
                        <div className="detail-card">
                          <span className="detail-icon">📏</span>
                          <div className="detail-content">
                            <span className="detail-label">Distance</span>
                            <span className="detail-value">{currentOrder.distance?.toFixed(1)} km</span>
                          </div>
                        </div>
                        <div className="detail-card">
                          <span className="detail-icon">🚗</span>
                          <div className="detail-content">
                            <span className="detail-label">Vehicle</span>
                            <span className="detail-value">{currentOrder.vehicleType}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="action-buttons-rapido">
                        {getNextStatus(currentOrder.status) && (
                          <button
                            className="primary-action-btn"
                            onClick={() =>
                              handleUpdateStatus(
                                currentOrder._id,
                                getNextStatus(currentOrder.status)
                              )
                            }
                          >
                            <span className="btn-icon">{getNextStatusIcon(currentOrder.status)}</span>
                            <span className="btn-text">{getNextStatusLabel(currentOrder.status)}</span>
                          </button>
                        )}

                        <button 
                          className="secondary-action-btn"
                          onClick={() => handleNavigate(currentOrder)}
                        >
                          <span className="btn-icon">🗺️</span>
                          <span className="btn-text">
                            Navigate to {currentOrder.status === "Picked-Up" || currentOrder.status === "In-Transit" ? "Drop-off" : "Pick-up"}
                          </span>
                        </button>
                      </div>

                      {/* Map showing route */}
                      <div className="order-map-wrapper-rapido">
                        <h4>📍 Route Map</h4>
                        <OrderMap 
                          pickup={currentOrder.pickup}
                          dropoff={currentOrder.dropoff}
                          driverLocation={location.lat && location.lng ? location : null}
                        />
                      </div>
                    </div>
                  </div>
                  )
                ) : (
                  <div className="waiting-state">
                    {notification && showNotification ? (
                      <div className="order-notification-card">
                        <div className="notification-header-inline">
                          <h3>🔔 New Order Available!</h3>
                          <button className="close-notification-btn" onClick={handleRejectOrder}>
                            ✕
                          </button>
                        </div>
                        <div className="notification-content">
                          <div className="order-info-grid">
                            <div className="info-item">
                              <span className="info-label">📍 Pickup:</span>
                              <span className="info-value">{notification.pickup?.address}</span>
                            </div>
                            <div className="info-item">
                              <span className="info-label">🎯 Dropoff:</span>
                              <span className="info-value">{notification.dropoff?.address}</span>
                            </div>
                            <div className="info-item">
                              <span className="info-label">💰 Fare:</span>
                              <span className="info-value fare-highlight">₹{notification.fare}</span>
                            </div>
                            <div className="info-item">
                              <span className="info-label">📦 Items:</span>
                              <span className="info-value">
                                {(notification.items || []).map((item) => item.name).join(", ")}
                              </span>
                            </div>
                            <div className="info-item">
                              <span className="info-label">🚗 Vehicle:</span>
                              <span className="info-value">{notification.vehicleType}</span>
                            </div>
                            <div className="info-item">
                              <span className="info-label">💳 Payment:</span>
                              <span className="info-value">{notification.paymentMethod}</span>
                            </div>
                          </div>
                          <div className="notification-actions-inline">
                            <button className="reject-btn-inline" onClick={handleRejectOrder}>
                              ❌ Reject
                            </button>
                            <button
                              className="accept-btn-inline"
                              onClick={() => handleAcceptOrder(notification._id)}
                            >
                              ✅ Accept Order
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="waiting-icon">⏳</div>
                        <h3>Waiting for orders...</h3>
                        <p>You'll be notified when a new order is available</p>
                        {locationError && (
                          <p className="location-error">⚠️ {locationError}</p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Current Order Tab */}
        {activeTab === "current-order" && currentOrder && (
          <div className="current-order-tab-section">
            <div className="section-header">
              <h2>🚚 Current Order - Live Tracking</h2>
              <p>Complete this delivery to earn ₹{currentOrder.fare}</p>
            </div>

            {useWorkflowUI ? (
              <OrderWorkflow
                key={`${currentOrder._id}-${currentOrder.status}`}
                order={currentOrder}
                onStatusUpdate={handleUpdateStatus}
                onNavigate={handleNavigate}
                driverLocation={location}
              />
            ) : (
              <div className="current-order-section rapido-style">
                <div className="section-header-rapido">
                  <h3>📦 Active Delivery</h3>
                  <span className="order-id-badge">#{currentOrder._id.slice(-6)}</span>
                </div>
                
                <div className="rapido-order-card">
                  {/* Status Banner */}
                  <div 
                    className="status-banner"
                    style={{ background: `linear-gradient(135deg, ${getStatusColor(currentOrder.status)}, ${getStatusColor(currentOrder.status)}dd)` }}
                  >
                    <span className="status-text">{currentOrder.status}</span>
                    <span className="status-icon">{getStatusIcon(currentOrder.status)}</span>
                  </div>

                  {/* Customer Info */}
                  {currentOrder.customer && (
                    <div className="customer-info-card">
                      <div className="customer-avatar">
                        {currentOrder.customer.name?.charAt(0).toUpperCase() || 'C'}
                      </div>
                      <div className="customer-details">
                        <h4>{currentOrder.customer.name || 'Customer'}</h4>
                        <p>{currentOrder.customer.phone || 'No phone'}</p>
                      </div>
                      <button className="call-btn" onClick={() => window.open(`tel:${currentOrder.customer.phone}`)}>
                        📞
                      </button>
                    </div>
                  )}

                  {/* Pickup Location Card */}
                  <div className="location-card pickup-card">
                    <div className="location-header">
                      <div className="location-icon-wrapper pickup-icon">
                        <span>📍</span>
                      </div>
                      <div className="location-info">
                        <h4>PICK-UP</h4>
                        <p className="location-address">{currentOrder.pickup.address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Route Connector */}
                  <div className="route-connector">
                    <div className="connector-line"></div>
                    <div className="connector-dots">
                      <span className="dot"></span>
                      <span className="dot"></span>
                      <span className="dot"></span>
                    </div>
                  </div>

                  {/* Dropoff Location Card */}
                  <div className="location-card dropoff-card">
                    <div className="location-header">
                      <div className="location-icon-wrapper dropoff-icon">
                        <span>🎯</span>
                      </div>
                      <div className="location-info">
                        <h4>DROP-OFF</h4>
                        <p className="location-address">{currentOrder.dropoff.address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Order Details Grid */}
                  <div className="order-details-grid">
                    <div className="detail-card">
                      <span className="detail-icon">💰</span>
                      <div className="detail-content">
                        <span className="detail-label">Fare</span>
                        <span className="detail-value">₹{currentOrder.fare}</span>
                      </div>
                    </div>
                    <div className="detail-card">
                      <span className="detail-icon">💳</span>
                      <div className="detail-content">
                        <span className="detail-label">Payment</span>
                        <span className="detail-value">{currentOrder.paymentMethod}</span>
                      </div>
                    </div>
                    <div className="detail-card">
                      <span className="detail-icon">📏</span>
                      <div className="detail-content">
                        <span className="detail-label">Distance</span>
                        <span className="detail-value">{currentOrder.distance?.toFixed(1)} km</span>
                      </div>
                    </div>
                    <div className="detail-card">
                      <span className="detail-icon">🚗</span>
                      <div className="detail-content">
                        <span className="detail-label">Vehicle</span>
                        <span className="detail-value">{currentOrder.vehicleType}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="action-buttons-rapido">
                    {getNextStatus(currentOrder.status) && (
                      <button
                        className="primary-action-btn"
                        onClick={() =>
                          handleUpdateStatus(
                            currentOrder._id,
                            getNextStatus(currentOrder.status)
                          )
                        }
                      >
                        <span className="btn-icon">{getNextStatusIcon(currentOrder.status)}</span>
                        <span className="btn-text">{getNextStatusLabel(currentOrder.status)}</span>
                      </button>
                    )}

                    <button 
                      className="secondary-action-btn"
                      onClick={() => handleNavigate(currentOrder)}
                    >
                      <span className="btn-icon">🗺️</span>
                      <span className="btn-text">
                        Navigate to {currentOrder.status === "Picked-Up" || currentOrder.status === "In-Transit" ? "Drop-off" : "Pick-up"}
                      </span>
                    </button>
                  </div>

                  {/* Map showing route */}
                  <div className="order-map-wrapper-rapido">
                    <h4>📍 Route Map</h4>
                    <OrderMap 
                      pickup={currentOrder.pickup}
                      dropoff={currentOrder.dropoff}
                      driverLocation={location.lat && location.lng ? location : null}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* My Orders Tab */}
        {activeTab === "orders" && (
          <div className="orders-section">
            <div className="section-header">
              <h2>📦 My Orders</h2>
              <p>View your completed deliveries</p>
            </div>

            {myOrders.filter(order => order.status === "Delivered").length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>No completed orders yet</h3>
                <p>Your delivered orders will appear here</p>
              </div>
            ) : (
              <div className="orders-grid">
                {myOrders.filter(order => order.status === "Delivered").map((order) => (
                  <div key={order._id} className="order-card">
                    <div className="order-header">
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(order.status) }}
                      >
                        {order.status}
                      </span>
                      <span className="order-id">#{order._id.slice(-6)}</span>
                    </div>

                    <div className="order-route">
                      <div className="route-point">
                        <span className="route-icon">📍</span>
                        <div>
                          <p className="route-label">Pickup</p>
                          <p className="route-address">{order.pickup.address}</p>
                        </div>
                      </div>
                      <div className="route-line"></div>
                      <div className="route-point">
                        <span className="route-icon">🎯</span>
                        <div>
                          <p className="route-label">Dropoff</p>
                          <p className="route-address">{order.dropoff.address}</p>
                        </div>
                      </div>
                    </div>

                    <div className="order-details">
                      <div className="detail-row">
                        <span>💰 Fare:</span>
                        <span className="fare">₹{order.fare}</span>
                      </div>
                      <div className="detail-row">
                        <span>💳 Payment:</span>
                        <span>{order.paymentMethod}</span>
                      </div>
                      {order.deliveredAt && (
                        <div className="detail-row">
                          <span>✅ Delivered:</span>
                          <span>{new Date(order.deliveredAt).toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {order.status === "Delivered" && order.customerRating && (
                      <div className="customer-rating-section">
                        <div className="rating-header">
                          <span className="rating-icon">⭐</span>
                          <span className="rating-title">Customer Rating</span>
                        </div>
                        <div className="rating-stars">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={star <= Math.round(order.customerRating?.rating || 0) ? "star-filled" : "star-empty"}
                            >
                              ★
                            </span>
                          ))}
                          <span className="rating-value">({order.customerRating?.rating || 0}/5)</span>
                        </div>
                        {order.customerRating?.review && (
                          <div className="customer-feedback">
                            <p className="feedback-label">💬 Feedback:</p>
                            <p className="feedback-text">"{order.customerRating.review}"</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="order-actions">
                      {/* No actions for completed orders */}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="notifications-section">
            <div className="section-header">
              <h2>🔔 Notifications</h2>
              <p>Order notifications and missed opportunities</p>
            </div>

            {notifications.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>No notifications</h3>
                <p>All caught up! New order notifications will appear here.</p>
              </div>
            ) : (
              <div className="notifications-grid">
                {notifications.map((notification) => (
                  <div key={notification.id} className="notification-card">
                    <div className="notification-header">
                      <span className="notification-timestamp">
                        {new Date(notification.timestamp).toLocaleString()}
                      </span>
                      <span className={`notification-status ${notification.status}`}>
                        {notification.status === 'pending' ? '🔴 Customer Waiting' : '✅ Accepted'}
                      </span>
                      {notification.status === 'pending' && (
                        <span className="waiting-indicator">
                          ⏰ {Math.floor((Date.now() - new Date(notification.timestamp)) / 60000)}m ago
                        </span>
                      )}
                    </div>

                    <div className="notification-body">
                      <div className="notification-route">
                        <div className="route-point">
                          <span className="route-icon">📍</span>
                          <div>
                            <p className="route-label">Pickup</p>
                            <p className="route-address">{notification.pickup?.address}</p>
                          </div>
                        </div>
                        <div className="route-line"></div>
                        <div className="route-point">
                          <span className="route-icon">🎯</span>
                          <div>
                            <p className="route-label">Dropoff</p>
                            <p className="route-address">{notification.dropoff?.address}</p>
                          </div>
                        </div>
                      </div>

                      <div className="notification-details">
                        <div className="detail-row">
                          <span>💰 Fare:</span>
                          <span className="fare">₹{notification.fare}</span>
                        </div>
                        <div className="detail-row">
                          <span>🚗 Vehicle:</span>
                          <span>{notification.vehicleType}</span>
                        </div>
                        <div className="detail-row">
                          <span>💳 Payment:</span>
                          <span>{notification.paymentMethod}</span>
                        </div>
                        <div className="detail-row">
                          <span>📦 Items:</span>
                          <span>{(notification.items || []).map((item) => item.name).join(", ")}</span>
                        </div>
                      </div>

                      {notification.status === 'pending' && (
                        <div className="notification-actions">
                          <div className="urgency-indicator">
                            🚨 Customer is actively waiting for a driver!
                          </div>
                          <button
                            className="accept-btn-notification priority"
                            onClick={() => handleAcceptOrder(notification.orderId)}
                          >
                            ✅ Accept & Help Customer
                          </button>
                          <button
                            className="reject-btn-notification"
                            onClick={() => {
                              setNotifications(prev => {
                                const updated = prev.filter(n => n.id !== notification.id);
                                localStorage.setItem('driverNotifications', JSON.stringify(updated));
                                return updated;
                              });
                            }}
                          >
                            🗑️ Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )} 

        {/* Earnings Tab */}
        {activeTab === "earnings" && (
          <div className="earnings-section">
            <div className="section-header">
              <h2>💰 Earnings</h2>
              <p>Track your income</p>
            </div>

            <div className="earnings-detailed">
              <div className="earnings-card-large">
                <h3>Today</h3>
                <p className="amount">₹{Number(earnings.today || 0).toFixed(2)}</p>
              </div>
              <div className="earnings-card-large">
                <h3>This Week</h3>
                <p className="amount">₹{Number(earnings.thisWeek || 0).toFixed(2)}</p>
              </div>
              <div className="earnings-card-large">
                <h3>This Month</h3>
                <p className="amount">₹{Number(earnings.thisMonth || 0).toFixed(2)}</p>
              </div>
              <div className="earnings-card-large highlight">
                <h3>Total Earnings</h3>
                <p className="amount">₹{Number(earnings.total || 0).toFixed(2)}</p>
              </div>
            </div>

            <div className="earnings-chart">
              <h3>📈 Earnings Overview</h3>
              <EarningsChart
                earningsData={{
                  labels: ['Today', 'This Week', 'This Month', 'Total'],
                  daily: [
                    earnings?.today || 0,
                    earnings?.thisWeek || 0,
                    earnings?.thisMonth || 0,
                    earnings?.total || 0,
                  ]
                }}
                chartType="bar"
              />
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <MyProfile user={user} onUpdate={(updatedUser) => setUser(updatedUser)} />
        )}
      </main>
    </div>
  );
};

export default DriverDashboard;