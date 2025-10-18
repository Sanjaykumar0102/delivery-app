import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { logout } from "../../../services/authService";
import Cookies from "js-cookie";
import { getDashboardStats, assignOrderToDriver, getPendingDrivers, approveDriver, rejectDriver, getAllCustomers, getAllAdmins, toggleUserActive } from "../../../services/adminService";
import "./AdminDashboard.css";
import "./DriverCardModern.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, orders, drivers, vehicles, approvals, customers, admins
  const [socket, setSocket] = useState(null);
  
  // Dashboard data
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Driver approvals
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const [driverForApproval, setDriverForApproval] = useState(null);
  const [showDriverDetails, setShowDriverDetails] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // User management
  const [customers, setCustomers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deactivationReason, setDeactivationReason] = useState("");

  // Assignment modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");

  // Filters
  const [orderFilter, setOrderFilter] = useState("all"); // all, pending, active, completed
  const [driverFilter, setDriverFilter] = useState("all"); // all, active, offline

  // Revenue modal
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [liveDriverMetrics, setLiveDriverMetrics] = useState(null);

  // Initialize user and socket
  useEffect(() => {
    const userCookie = Cookies.get("user");
    if (!userCookie) {
      navigate("/login");
      return;
    }
    
    const parsedUser = JSON.parse(userCookie);
    if (parsedUser.role !== "Admin") {
      navigate("/login");
      return;
    }
    
    setUser(parsedUser);

    // Connect to socket for real-time updates
    const newSocket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000");
    setSocket(newSocket);

    // Register admin with socket server
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

  // Fetch dashboard stats and pending drivers on load
  useEffect(() => {
    if (user) {
      fetchStats();
      fetchPendingDrivers();
    }
  }, [user]);

  // Listen for real-time updates
  useEffect(() => {
    if (socket) {
      socket.on("orderStatusUpdate", () => {
        fetchStats();
      });

      socket.on("driverOnline", () => {
        fetchStats();
      });

      socket.on("driverOffline", () => {
        fetchStats();
      });

      socket.on("newOrderCreated", () => {
        fetchStats();
      });

      socket.on("newDriverRegistration", (data) => {
        console.log("🚗 New driver registration:", data);
        // Always refresh pending drivers
        fetchPendingDrivers();
        // Show notification
        setSuccess(`New driver registration: ${data.name} - Please review in Approvals tab`);
        setTimeout(() => setSuccess(""), 5000);
      });

      socket.on("adminDriversSnapshot", (snapshot) => {
        console.log("📊 Admin received driver snapshot:", snapshot);
        console.log("   Total drivers:", snapshot?.drivers?.length);
        console.log("   Totals:", snapshot?.totals);
        setLiveDriverMetrics(snapshot);
      });
    }

    return () => {
      if (socket) {
        socket.off("orderStatusUpdate");
        socket.off("driverOnline");
        socket.off("driverOffline");
        socket.off("newOrderCreated");
        socket.off("newDriverRegistration");
        socket.off("adminDriversSnapshot");
      }
    };
  }, [socket, activeTab]);

  const fetchStats = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(""); // Clear previous errors
      
      const data = await getDashboardStats();
      setStats(data);
      if (data?.liveDriverMetrics) {
        setLiveDriverMetrics(data.liveDriverMetrics);
      }
      console.log("✅ Dashboard stats loaded successfully");
    } catch (err) {
      console.error("❌ Error fetching stats:", err);
      console.error("Error details:", err.response?.data);
      
      // Retry once if it's a network error
      if (retryCount === 0 && (err.code === 'ECONNABORTED' || err.message.includes('Network'))) {
        console.log("🔄 Retrying fetchStats...");
        setTimeout(() => fetchStats(1), 1000);
        return;
      }
      
      setError("Failed to load dashboard data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingDrivers = async (retryCount = 0) => {
    try {
      setError(""); // Clear previous errors
      
      const data = await getPendingDrivers();
      setPendingDrivers(data);
      console.log("✅ Pending drivers loaded successfully");
    } catch (err) {
      console.error("❌ Error fetching pending drivers:", err);
      console.error("Error details:", err.response?.data);
      
      // Retry once if it's a network error
      if (retryCount === 0 && (err.code === 'ECONNABORTED' || err.message.includes('Network'))) {
        console.log("🔄 Retrying fetchPendingDrivers...");
        setTimeout(() => fetchPendingDrivers(1), 1000);
        return;
      }
      
      setError("Failed to load pending drivers. Please refresh the page.");
    }
  };

  const fetchCustomers = async (retryCount = 0) => {
    try {
      const data = await getAllCustomers();
      setCustomers(data);
      console.log("✅ Customers loaded successfully");
    } catch (err) {
      console.error("❌ Error fetching customers:", err);
      
      // Retry once if it's a network error
      if (retryCount === 0 && (err.code === 'ECONNABORTED' || err.message.includes('Network'))) {
        console.log("🔄 Retrying fetchCustomers...");
        setTimeout(() => fetchCustomers(1), 1000);
        return;
      }
      
      setError("Failed to load customers");
    }
  };

  const fetchAdmins = async (retryCount = 0) => {
    try {
      const data = await getAllAdmins();
      setAdmins(data);
      console.log("✅ Admins loaded successfully");
    } catch (err) {
      console.error("❌ Error fetching admins:", err);
      
      // Retry once if it's a network error
      if (retryCount === 0 && (err.code === 'ECONNABORTED' || err.message.includes('Network'))) {
        console.log("🔄 Retrying fetchAdmins...");
        setTimeout(() => fetchAdmins(1), 1000);
        return;
      }
      
      setError("Failed to load admins");
    }
  };

  // Fetch data when tabs are active
  useEffect(() => {
    if (activeTab === "approvals" && user) {
      fetchPendingDrivers();
    } else if (activeTab === "customers" && user) {
      fetchCustomers();
    } else if (activeTab === "admins" && user) {
      fetchAdmins();
    }
  }, [activeTab, user]);

  const handleApproveDriver = async (driverId) => {
    try {
      await approveDriver(driverId);
      setSuccess("✅ Driver approved successfully!");
      setShowDriverDetails(false); // Close the modal
      setDriverForApproval(null); // Clear driver data
      setActiveTab("dashboard"); // Navigate back to dashboard
      fetchPendingDrivers();
      fetchStats();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error approving driver:", err);
      setError(err.response?.data?.message || "Failed to approve driver");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleRejectDriver = async (driverId) => {
    if (!rejectionReason.trim()) {
      setError("Please provide a rejection reason");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      await rejectDriver(driverId, rejectionReason);
      setSuccess("Driver application rejected");
      setShowDriverDetails(false);
      setRejectionReason("");
      fetchPendingDrivers();
      fetchStats();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error rejecting driver:", err);
      setError(err.response?.data?.message || "Failed to reject driver");
      setTimeout(() => setError(""), 3000);
    }
  };

  const openDriverDetails = (driver) => {
    setDriverForApproval(driver);
    setShowDriverDetails(true);
    setRejectionReason("");
  };

  const openDeactivateModal = (user) => {
    setSelectedUser(user);
    setShowDeactivateModal(true);
    setDeactivationReason("");
  };

  const handleToggleUserActive = async () => {
    if (!selectedUser) return;

    // If deactivating and no reason provided
    if (selectedUser.isActive && !deactivationReason.trim()) {
      setError("Please provide a reason for deactivation");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      await toggleUserActive(selectedUser._id, deactivationReason);
      setSuccess(`User ${selectedUser.isActive ? 'deactivated' : 'activated'} successfully!`);
      setShowDeactivateModal(false);
      setSelectedUser(null);
      setDeactivationReason("");
      
      // Refresh the appropriate list
      if (selectedUser.role === "Customer") {
        fetchCustomers();
      } else if (selectedUser.role === "Driver") {
        fetchStats();
      } else if (selectedUser.role === "Admin") {
        fetchAdmins();
      }
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error toggling user status:", err);
      setError(err.response?.data?.message || "Failed to update user status");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const openAssignModal = (order) => {
    setSelectedOrder(order);
    setShowAssignModal(true);
    setSelectedDriver("");
    setSelectedVehicle("");
  };

  // Auto-fill vehicle when driver is selected
  const handleDriverSelection = (driverId) => {
    setSelectedDriver(driverId);
    
    console.log('=== Vehicle Auto-Selection Debug ===');
    console.log('Selected driverId:', driverId);
    console.log('stats.activeDriversList:', stats?.activeDriversList);
    console.log('stats.drivers:', stats?.drivers);
    
    // Find the selected driver from active drivers list or all drivers
    let driver = stats?.activeDriversList?.find(d => d._id === driverId);
    if (!driver) {
      console.log('Driver not found in activeDriversList, checking drivers array...');
      driver = stats?.drivers?.find(d => d._id === driverId);
    }
    
    console.log('Found driver:', driver);
    console.log('Driver vehicleAssigned:', driver?.vehicleAssigned);
    console.log('Driver vehicle:', driver?.vehicle);
    
    // If driver from activeDriversList doesn't have vehicle, check stats.drivers
    if (!driver?.vehicleAssigned && !driver?.vehicle) {
      const driverFromDb = stats?.drivers?.find(d => d._id === driverId);
      console.log('Checking stats.drivers for vehicle:', driverFromDb);
      if (driverFromDb?.vehicleAssigned) {
        driver = { ...driver, vehicleAssigned: driverFromDb.vehicleAssigned };
        console.log('Found vehicleAssigned in stats.drivers:', driverFromDb.vehicleAssigned);
      }
    }
    
    console.log('Available vehicles:', stats?.vehicles);
    
    // Auto-fill vehicle if driver has an assigned vehicle
    if (driver?.vehicleAssigned) {
      const vehicleId = typeof driver.vehicleAssigned === 'object' 
        ? driver.vehicleAssigned._id 
        : driver.vehicleAssigned;
      console.log('✅ Setting vehicle to:', vehicleId);
      setSelectedVehicle(vehicleId);
    } else if (driver?.vehicle) {
      // Fallback to vehicle property if vehicleAssigned is not available
      const vehicleId = typeof driver.vehicle === 'object' 
        ? driver.vehicle._id 
        : driver.vehicle;
      console.log('✅ Setting vehicle (fallback) to:', vehicleId);
      setSelectedVehicle(vehicleId);
    } else {
      console.log('❌ No vehicle found for driver');
      setSelectedVehicle("");
    }
    console.log('=== End Debug ===');
  };

  const handleAssignOrder = async () => {
    if (!selectedDriver || !selectedVehicle) {
      setError("Please select both driver and vehicle");
      return;
    }

    try {
      await assignOrderToDriver(selectedOrder._id, selectedDriver, selectedVehicle);
      setSuccess("✅ Order assigned successfully!");
      setShowAssignModal(false);
      fetchStats();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error assigning order:", err);
      setError(err.response?.data?.message || "Failed to assign order");
      setTimeout(() => setError(""), 3000);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: "#FFA500",
      Assigned: "#2196F3",
      Accepted: "#00BCD4",
      Arrived: "#9C27B0",
      "Picked-Up": "#673AB7",
      "In-Transit": "#3F51B5",
      Delivered: "#4CAF50",
      Cancelled: "#F44336"
    };
    return colors[status] || "#757575";
  };

  const getStatusIcon = (status) => {
    const icons = {
      Pending: "⏳",
      Assigned: "👤",
      Accepted: "✅",
      Arrived: "📍",
      "Picked-Up": "📦",
      "In-Transit": "🚚",
      Delivered: "✅",
      Cancelled: "❌"
    };
    return icons[status] || "📦";
  };

  const getVehicleIcon = (type) => {
    const icons = {
      // Standard names
      "Bike": "🏍️",
      "Auto": "🛺",
      "Mini Truck": "🚐",
      "Large Truck": "🚛",
      // Alternative names (from database)
      "2 wheeler": "🏍️",
      "Truck": "🚐",
      "Lorry": "🚛",
      "Car": "🚗",
      "Van": "🚐"
    };
    return icons[type] || "🚗";
  };

  const filteredOrders = stats?.orders?.filter(order => {
    if (orderFilter === "all") return true;
    if (orderFilter === "pending") return order.status === "Pending";
    if (orderFilter === "active") return ["Assigned", "Accepted", "Arrived", "Picked-Up", "In-Transit"].includes(order.status);
    if (orderFilter === "completed") return order.status === "Delivered";
    return true;
  }) || [];

  const driversWithLiveStatus = useMemo(() => {
    const baseDrivers = stats?.drivers || [];
    if (!liveDriverMetrics) return baseDrivers;

    const liveDrivers = liveDriverMetrics.drivers || [];
    const liveById = new Map(liveDrivers.map((driver) => [driver.driverId, driver]));
    const baseIds = new Set(baseDrivers.map((driver) => driver._id));

    const mergedBaseDrivers = baseDrivers.map((driver) => {
      const liveInfo = liveById.get(driver._id);
      if (!liveInfo) {
        return driver;
      }

      return {
        ...driver,
        isOnDuty: liveInfo.isOnDuty,
        isApproved: liveInfo.isApproved ?? driver.isApproved,
        approvalStatus: liveInfo.approvalStatus || driver.approvalStatus,
        vehicle: driver.vehicle || (liveInfo.vehicleType ? { type: liveInfo.vehicleType } : driver.vehicle),
        liveStatus: {
          lastHeartbeat: liveInfo.lastHeartbeat,
        },
      };
    });

    const unmatchedDrivers = liveDrivers
      .filter((liveInfo) => !baseIds.has(liveInfo.driverId))
      .map((liveInfo) => ({
        _id: liveInfo.driverId,
        name: "Unknown Driver",
        email: "Unknown",
        phone: "N/A",
        phoneNumber: "N/A",
        stats: {},
        isOnDuty: liveInfo.isOnDuty,
        isApproved: liveInfo.isApproved,
        approvalStatus: liveInfo.approvalStatus,
        vehicle: liveInfo.vehicleType ? { type: liveInfo.vehicleType } : null,
        liveStatus: {
          lastHeartbeat: liveInfo.lastHeartbeat,
        },
      }));

    return [...mergedBaseDrivers, ...unmatchedDrivers];
  }, [stats?.drivers, liveDriverMetrics]);

  const filteredDrivers = (driversWithLiveStatus || []).filter(driver => {
    if (driverFilter === "all") return true;
    if (driverFilter === "active") return driver.isOnDuty;
    if (driverFilter === "offline") return !driver.isOnDuty;
    return true;
  });

  const liveMetricsOverlay = useMemo(() => {
    if (!liveDriverMetrics) return null;

    // The socket now sends merged data directly
    const mergedDrivers = (liveDriverMetrics.drivers || [])
      .sort((a, b) => {
        // Sort by connection status first (online first), then by on-duty status
        if (a.isConnected !== b.isConnected) {
          return a.isConnected ? -1 : 1;
        }
        if (a.isOnDuty === b.isOnDuty) {
          return (b.liveStatus?.lastHeartbeat || 0) - (a.liveStatus?.lastHeartbeat || 0);
        }
        return a.isOnDuty ? -1 : 1;
      });

    return {
      mergedDrivers,
      totals: liveDriverMetrics.totals,
      vehicleTypeBreakdown: liveDriverMetrics.vehicleTypeBreakdown,
    };
  }, [liveDriverMetrics]);

  const dashboardDriverTotals = useMemo(() => {
    const totalOnDutyDrivers = liveMetricsOverlay?.totals?.totalOnDutyDrivers ?? (stats?.activeDrivers || 0);
    const totalConnectedDrivers = liveMetricsOverlay?.totals?.totalConnectedDrivers ?? totalOnDutyDrivers;
    const totalApprovedDrivers = liveMetricsOverlay?.totals?.totalApprovedDrivers ?? (stats?.drivers?.filter((driver) => driver.isApproved).length || 0);

    return {
      totalOnDutyDrivers,
      totalConnectedDrivers,
      totalApprovedDrivers,
      vehicleTypeBreakdown: liveMetricsOverlay?.vehicleTypeBreakdown || (stats?.drivers
        ? stats.drivers.reduce((breakdown, driver) => {
            const key = driver.vehicleAssigned?.type || driver.vehicle?.type || driver.vehicleType || "Unknown";
            if (!breakdown[key]) {
              breakdown[key] = { total: 0, onDuty: 0 };
            }
            breakdown[key].total += 1;
            if (driver.isOnDuty) {
              breakdown[key].onDuty += 1;
            }
            return breakdown;
          }, {})
        : null),
    };
  }, [liveMetricsOverlay, stats?.activeDrivers, stats?.drivers]);

  const activeDriversDisplay = useMemo(() => {
    if (liveMetricsOverlay?.mergedDrivers) {
      return liveMetricsOverlay.mergedDrivers.filter((driver) => driver.isOnDuty);
    }
    return stats?.activeDriversList || [];
  }, [liveMetricsOverlay, stats?.activeDriversList]);

  if (loading && !stats) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <div className="header-left">
          <h1>🛠️ Admin Dashboard</h1>
          <p>Welcome, {user?.name}!</p>
        </div>
        <div className="header-right">
          <div className="refresh-btn" onClick={fetchStats} title="Refresh">
            🔄
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="admin-nav">
        <button
          className={activeTab === "dashboard" ? "nav-btn active" : "nav-btn"}
          onClick={() => setActiveTab("dashboard")}
        >
          📊 Dashboard
        </button>
        <button
          className={activeTab === "approvals" ? "nav-btn active" : "nav-btn"}
          onClick={() => setActiveTab("approvals")}
        >
          ⏳ Approvals {pendingDrivers.length > 0 && <span className="badge-count">({pendingDrivers.length})</span>}
        </button>
        <button
          className={activeTab === "orders" ? "nav-btn active" : "nav-btn"}
          onClick={() => setActiveTab("orders")}
        >
          📦 Orders ({stats?.totalOrders || 0})
        </button>
        <button
          className={activeTab === "drivers" ? "nav-btn active" : "nav-btn"}
          onClick={() => setActiveTab("drivers")}
        >
          🚗 Drivers ({stats?.totalDrivers || 0})
        </button>
        <button
          className={activeTab === "vehicles" ? "nav-btn active" : "nav-btn"}
          onClick={() => setActiveTab("vehicles")}
        >
          🚚 Vehicles ({stats?.totalVehicles || 0})
        </button>
        <button
          className={activeTab === "customers" ? "nav-btn active" : "nav-btn"}
          onClick={() => setActiveTab("customers")}
        >
          👥 Customers ({stats?.totalCustomers || 0})
        </button>
        <button
          className={activeTab === "admins" ? "nav-btn active" : "nav-btn"}
          onClick={() => setActiveTab("admins")}
        >
          🛡️ Admins ({stats?.totalAdmins || 0})
        </button>
      </nav>

      {/* Messages */}
      {error && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      {/* Main Content */}
      <main className="admin-content">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="dashboard-section">
            {/* Statistics Cards */}
            <div className="stats-grid">
              <div 
                className="stat-card blue clickable" 
                onClick={() => {
                  setActiveTab("orders");
                  setOrderFilter("all");
                }}
                title="Click to view all orders"
              >
                <div className="stat-icon">📦</div>
                <div className="stat-info">
                  <h3>{stats?.totalOrders || 0}</h3>
                  <p>Total Orders</p>
                </div>
              </div>

              <div 
                className="stat-card orange clickable"
                onClick={() => {
                  setActiveTab("orders");
                  setOrderFilter("pending");
                }}
                title="Click to view pending orders"
              >
                <div className="stat-icon">⏳</div>
                <div className="stat-info">
                  <h3>{stats?.pendingOrders || 0}</h3>
                  <p>Pending Orders</p>
                </div>
              </div>

              <div 
                className="stat-card purple clickable"
                onClick={() => {
                  setActiveTab("orders");
                  setOrderFilter("active");
                }}
                title="Click to view active orders"
              >
                <div className="stat-icon">🚚</div>
                <div className="stat-info">
                  <h3>{stats?.activeOrders || 0}</h3>
                  <p>Active Orders</p>
                </div>
              </div>

              <div 
                className="stat-card green clickable"
                onClick={() => {
                  setActiveTab("orders");
                  setOrderFilter("completed");
                }}
                title="Click to view completed orders"
              >
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <h3>{stats?.completedOrders || 0}</h3>
                  <p>Completed</p>
                </div>
              </div>

              <div 
                className="stat-card teal clickable"
                onClick={() => {
                  setActiveTab("drivers");
                  setDriverFilter("all");
                }}
                title="Click to view all drivers"
              >
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>{stats?.totalDrivers || 0}</h3>
                  <p>Total Drivers</p>
                </div>
              </div>

              <div 
                className="stat-card success clickable"
                onClick={() => {
                  setActiveTab("drivers");
                  setDriverFilter("active");
                }}
                title="Click to view active drivers"
              >
                <div className="stat-icon">🟢</div>
                <div className="stat-info">
                  <h3>{dashboardDriverTotals.totalOnDutyDrivers}</h3>
                  <p>On-Duty Drivers</p>
                  {liveDriverMetrics && (
                    <span className="stat-subtext">
                      🟢 {stats?.onlineDrivers || 0} online • 🔴 {stats?.offlineDrivers || 0} offline
                    </span>
                  )}
                </div>
              </div>

              <div className="stat-card indigo">
                <div className="stat-icon">👤</div>
                <div className="stat-info">
                  <h3>{stats?.totalCustomers || 0}</h3>
                  <p>Customers</p>
                </div>
              </div>

              <div 
                className="stat-card gold clickable"
                onClick={() => setShowRevenueModal(true)}
                title="Click to view revenue details"
              >
                <div className="stat-icon">💰</div>
                <div className="stat-info">
                  <h3>₹{stats?.totalRevenue?.toFixed(2) || 0}</h3>
                  <p>Total Revenue</p>
                </div>
              </div>
            </div>

            {/* Active Drivers Section */}
            <div className="section-card">
              <div className="section-header-flex">
                <h2>🟢 Active Drivers ({dashboardDriverTotals.totalOnDutyDrivers})</h2>
                {dashboardDriverTotals.vehicleTypeBreakdown && (
                  <div className="metrics-pill-group">
                    {Object.entries(dashboardDriverTotals.vehicleTypeBreakdown).map(([vehicleType, counts]) => (
                      <span key={vehicleType} className="metrics-pill" title={`On duty: ${counts.onDuty} / Total: ${counts.total}`}>
                        {getVehicleIcon(vehicleType)} {vehicleType}: {counts.onDuty}/{counts.total}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {activeDriversDisplay.length === 0 ? (
                <div className="empty-state">
                  <p>No drivers are currently on duty</p>
                </div>
              ) : (
                <div className="active-drivers-grid">
                  {activeDriversDisplay.map((driver) => (
                    <div key={driver._id} className={`driver-card ${driver.isConnected ? 'active' : 'offline'}`}>
                      <div className="driver-avatar">
                        {driver.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div className="driver-info">
                        <h4>{driver.name || "Unknown Driver"}</h4>
                        <p className="driver-email">{driver.email || "Unknown"}</p>
                        <div className="driver-stats">
                          <span>📦 {driver.stats?.completedDeliveries || 0} deliveries</span>
                          <span>⭐ {driver.stats?.averageRating?.toFixed(1) || "N/A"}</span>
                        </div>
                        {driver.isConnected && driver.liveStatus?.lastHeartbeat && (
                          <p className="location-info">
                            ⏱️ Last heartbeat: {new Date(driver.liveStatus.lastHeartbeat).toLocaleTimeString()}
                          </p>
                        )}
                        {driver.currentLocation && (
                          <p className="location-info">
                            📍 Lat: {driver.currentLocation.lat?.toFixed(4)}, 
                            Lng: {driver.currentLocation.lng?.toFixed(4)}
                          </p>
                        )}
                        {!driver.isConnected && driver.isOnDuty && (
                          <p className="location-info muted">🟡 On Duty (Not connected)</p>
                        )}
                        {!driver.isConnected && !driver.isOnDuty && (
                          <p className="location-info muted">⚪ Off Duty</p>
                        )}
                        {driver.isConnected && !driver.liveStatus?.lastHeartbeat && !driver.currentLocation && (
                          <p className="location-info muted">Live data pending…</p>
                        )}
                      </div>
                      <div className={`status-indicator ${driver.isConnected ? 'online' : (driver.isOnDuty ? 'on-duty' : 'offline')}`}>
                        {driver.isConnected ? '🟢 Online' : (driver.isOnDuty ? '🟡 On Duty' : '🔴 Off Duty')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Orders */}
            <div className="section-card">
              <h2>📦 Recent Orders</h2>
              <div className="orders-table-container">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Vehicle</th>
                      <th>Pickup</th>
                      <th>Dropoff</th>
                      <th>Fare</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.orders?.slice(0, 10).map((order) => (
                      <tr key={order._id}>
                        <td>#{order._id.slice(-6)}</td>
                        <td>{order.customer?.name || "N/A"}</td>
                        <td>{getVehicleIcon(order.vehicleType)} {order.vehicleType}</td>
                        <td className="address-cell">{order.pickup?.address}</td>
                        <td className="address-cell">{order.dropoff?.address}</td>
                        <td className="fare-cell">₹{order.fare}</td>
                        <td>
                          <span
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(order.status) }}
                          >
                            {getStatusIcon(order.status)} {order.status}
                          </span>
                        </td>
                        <td>
                          {order.status === "Pending" && (
                            <button
                              className="assign-btn"
                              onClick={() => openAssignModal(order)}
                            >
                              Assign
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="orders-section">
            <div className="section-header">
              <h2>📦 All Orders</h2>
              <div className="filter-buttons">
                <button
                  className={orderFilter === "all" ? "filter-btn active" : "filter-btn"}
                  onClick={() => setOrderFilter("all")}
                >
                  All ({stats?.totalOrders || 0})
                </button>
                <button
                  className={orderFilter === "pending" ? "filter-btn active" : "filter-btn"}
                  onClick={() => setOrderFilter("pending")}
                >
                  Pending ({stats?.pendingOrders || 0})
                </button>
                <button
                  className={orderFilter === "active" ? "filter-btn active" : "filter-btn"}
                  onClick={() => setOrderFilter("active")}
                >
                  Active ({stats?.activeOrders || 0})
                </button>
                <button
                  className={orderFilter === "completed" ? "filter-btn active" : "filter-btn"}
                  onClick={() => setOrderFilter("completed")}
                >
                  Completed ({stats?.completedOrders || 0})
                </button>
              </div>
            </div>

            <div className="orders-grid">
              {filteredOrders.map((order) => (
                <div key={order._id} className="order-card">
                  <div className="order-header">
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(order.status) }}
                    >
                      {getStatusIcon(order.status)} {order.status}
                    </span>
                    <span className="order-id">#{order._id.slice(-6)}</span>
                  </div>

                  <div className="order-details">
                    <div className="detail-row">
                      <span className="label">👤 Customer:</span>
                      <span className="value">{order.customer?.name || "N/A"}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">{getVehicleIcon(order.vehicleType)} Vehicle:</span>
                      <span className="value">{order.vehicleType}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">📍 Pickup:</span>
                      <span className="value">{order.pickup?.address}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">📍 Dropoff:</span>
                      <span className="value">{order.dropoff?.address}</span>
                    </div>
                    {order.driver && (
                      <div className="detail-row">
                        <span className="label">🚗 Driver:</span>
                        <span className="value">{order.driver.name}</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <span className="label">💰 Fare:</span>
                      <span className="value fare">₹{order.fare}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">💳 Payment:</span>
                      <span className="value">{order.paymentMethod || "Cash"}</span>
                    </div>
                  </div>

                  {order.status === "Pending" && (
                    <button
                      className="assign-btn-full"
                      onClick={() => openAssignModal(order)}
                    >
                      Assign Driver
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Drivers Tab */}
        {activeTab === "drivers" && (
          <div className="drivers-section">
            <div className="section-header">
              <h2>🚗 All Drivers</h2>
              <div className="filter-buttons">
                <button
                  className={driverFilter === "all" ? "filter-btn active" : "filter-btn"}
                  onClick={() => setDriverFilter("all")}
                >
                  All ({stats?.totalDrivers || 0})
                </button>
                <button
                  className={driverFilter === "active" ? "filter-btn active" : "filter-btn"}
                  onClick={() => setDriverFilter("active")}
                >
                  🟢 Active ({dashboardDriverTotals.totalOnDutyDrivers})
                </button>
                <button
                  className={driverFilter === "offline" ? "filter-btn active" : "filter-btn"}
                  onClick={() => setDriverFilter("offline")}
                >
                  🔴 Offline ({(stats?.totalDrivers || 0) - (stats?.activeDrivers || 0)})
                </button>
              </div>
            </div>

            <div className="drivers-grid">
              {filteredDrivers.map((driver) => (
                <div key={driver._id} className={`driver-card-modern ${driver.isOnDuty ? 'active' : 'offline'} ${!driver.isActive ? 'deactivated' : ''}`}>
                  {!driver.isActive && (
                    <div className="deactivated-badge">🚫 Deactivated</div>
                  )}
                  
                  {/* Header Section */}
                  <div className="driver-card-header">
                    <div className="driver-avatar-modern">
                      {driver.name.charAt(0).toUpperCase()}
                      <div className={`status-dot ${driver.isOnDuty ? 'online' : 'offline'}`}></div>
                    </div>
                    <div className="driver-header-info">
                      <h3 className="driver-name">{driver.name}</h3>
                      <span className={`duty-badge ${driver.isOnDuty ? 'on-duty' : 'off-duty'}`}>
                        {driver.isOnDuty ? '🟢 On Duty' : '🔴 Off Duty'}
                      </span>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="driver-contact">
                    <div className="contact-item">
                      <span className="contact-icon">📧</span>
                      <span className="contact-text">{driver.email}</span>
                    </div>
                    <div className="contact-item">
                      <span className="contact-icon">📱</span>
                      <span className="contact-text">{driver.phone || "N/A"}</span>
                    </div>
                  </div>

                  {/* Stats Section */}
                  <div className="driver-stats-modern">
                    <div className="stat-box">
                      <div className="stat-icon">📦</div>
                      <div className="stat-content">
                        <span className="stat-number">{driver.stats?.totalDeliveries || 0}</span>
                        <span className="stat-label">Total</span>
                      </div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-icon">✅</div>
                      <div className="stat-content">
                        <span className="stat-number">{driver.stats?.completedDeliveries || 0}</span>
                        <span className="stat-label">Completed</span>
                      </div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-icon">⭐</div>
                      <div className="stat-content">
                        <span className="stat-number">{driver.stats?.averageRating?.toFixed(1) || "N/A"}</span>
                        <span className="stat-label">Rating</span>
                      </div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-icon">💰</div>
                      <div className="stat-content">
                        <span className="stat-number">₹{driver.earnings?.total?.toFixed(0) || 0}</span>
                        <span className="stat-label">Earnings</span>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Info */}
                  {driver.vehicleAssigned && (
                    <div className="vehicle-info-modern">
                      <div className="vehicle-icon-badge">{getVehicleIcon(driver.vehicleAssigned.type)}</div>
                      <div className="vehicle-details">
                        <span className="vehicle-type">{driver.vehicleAssigned.type}</span>
                        <span className="vehicle-plate">🔢 {driver.vehicleAssigned.plateNumber}</span>
                      </div>
                    </div>
                  )}

                  {/* Deactivation Reason */}
                  {!driver.isActive && driver.deactivationReason && (
                    <div className="deactivation-info">
                      <span className="deactivation-label">Reason:</span>
                      <span className="deactivation-text">{driver.deactivationReason}</span>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="driver-card-footer">
                    <button 
                      className={driver.isActive ? "btn-deactivate" : "btn-activate"}
                      onClick={() => openDeactivateModal(driver)}
                    >
                      {driver.isActive ? '🚫 Deactivate' : '✅ Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vehicles Tab */}
        {activeTab === "vehicles" && (
          <div className="vehicles-section">
            <div className="section-header">
              <h2>🚚 All Vehicles</h2>
              <p>Total: {stats?.totalVehicles || 0} vehicles</p>
            </div>

            <div className="vehicles-grid">
              {stats?.vehicles?.map((vehicle) => (
                <div key={vehicle._id} className="vehicle-card-modern">
                  <div className="vehicle-card-header">
                    <div className="vehicle-icon-badge">
                      {getVehicleIcon(vehicle.type)}
                    </div>
                    <div className="vehicle-type-label">{vehicle.type}</div>
                  </div>
                  
                  <div className="vehicle-card-body">
                    <div className="vehicle-detail-row">
                      <span className="detail-icon">🔢</span>
                      <div className="detail-content">
                        <span className="detail-label">Plate Number</span>
                        <span className="detail-value">{vehicle.plateNumber}</span>
                      </div>
                    </div>
                    
                    <div className="vehicle-detail-row">
                      <span className="detail-icon">📦</span>
                      <div className="detail-content">
                        <span className="detail-label">Capacity</span>
                        <span className="detail-value">{vehicle.capacity} kg</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="vehicle-card-footer">
                    <span className="vehicle-status-badge">✅ Active</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "approvals" && (
          <div className="approvals-section">
            <div className="section-header">
              <h2>📋 Driver Approvals</h2>
              <p>Pending Applications: {pendingDrivers.length}</p>
            </div>

            {pendingDrivers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✅</div>
                <h3>No Pending Applications</h3>
                <p>All driver applications have been reviewed</p>
              </div>
            ) : (
              <div className="drivers-grid">
                {pendingDrivers.map((driver) => (
                  <div key={driver._id} className="driver-approval-card">
                    <div className="driver-header">
                      <div className="driver-avatar">
                        {driver.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="driver-basic-info">
                        <h3>{driver.name}</h3>
                        <p className="driver-email">📧 {driver.email}</p>
                        <p className="driver-phone">📱 {driver.phone}</p>
                      </div>
                    </div>
                    
                    <div className="driver-meta">
                      <p className="registration-date">
                        📅 Registered: {new Date(driver.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="driver-actions">
                      <button 
                        className="view-details-btn"
                        onClick={() => openDriverDetails(driver)}
                      >
                        👁️ View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      {activeTab === "customers" && (
          <div className="customers-section">
            <div className="section-header">
              <h2>👥 All Customers</h2>
              <p>Total: {customers.length} customers</p>
            </div>

            <div className="users-grid">
              {customers.map((customer) => (
                <div key={customer._id} className={`user-card ${!customer.isActive ? 'deactivated' : ''}`}>
                  <div className="user-avatar-large">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-info-full">
                    <h3>{customer.name}</h3>
                    <p className="user-email">📧 {customer.email}</p>
                    <p className="user-phone">📱 {customer.phone || "N/A"}</p>
                    
                    <div className="user-meta">
                      <p>📅 Joined: {new Date(customer.createdAt).toLocaleDateString()}</p>
                      {!customer.isActive && customer.deactivationReason && (
                        <p className="deactivation-reason">🚫 {customer.deactivationReason}</p>
                      )}
                    </div>

                    <div className="user-actions">
                      <button 
                        className={customer.isActive ? "deactivate-btn" : "activate-btn"}
                        onClick={() => openDeactivateModal(customer)}
                      >
                        {customer.isActive ? '🚫 Block Customer' : '✅ Unblock Customer'}
                      </button>
                    </div>
                  </div>
                  {!customer.isActive && (
                    <div className="deactivated-badge">🚫 Blocked</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admins Tab */}
        {activeTab === "admins" && (
          <div className="admins-section">
            <div className="section-header">
              <h2>🛡️ All Admins</h2>
              <p>Total: {admins.length} admins</p>
            </div>

            <div className="users-grid">
              {admins.map((admin) => (
                <div key={admin._id} className={`user-card admin-card ${!admin.isActive ? 'deactivated' : ''}`}>
                  <div className="user-avatar-large admin-avatar">
                    {admin.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-info-full">
                    <h3>{admin.name} 🛡️</h3>
                    <p className="user-email">📧 {admin.email}</p>
                    <p className="user-phone">📱 {admin.phone || "N/A"}</p>
                    
                    <div className="user-meta">
                      <p>📅 Joined: {new Date(admin.createdAt).toLocaleDateString()}</p>
                      {!admin.isActive && admin.deactivationReason && (
                        <p className="deactivation-reason">🚫 {admin.deactivationReason}</p>
                      )}
                    </div>
                  </div>
                  {!admin.isActive && (
                    <div className="deactivated-badge">🚫 Deactivated</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Assign Order #{selectedOrder?._id.slice(-6)}</h2>
              <button className="close-btn" onClick={() => setShowAssignModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="order-summary">
                <p><strong>Pickup:</strong> {selectedOrder?.pickup?.address}</p>
                <p><strong>Dropoff:</strong> {selectedOrder?.dropoff?.address}</p>
                <p><strong>Vehicle Type:</strong> {getVehicleIcon(selectedOrder?.vehicleType)} {selectedOrder?.vehicleType}</p>
                <p><strong>Fare:</strong> ₹{selectedOrder?.fare}</p>
              </div>

              <div className="form-group">
                <label>Select Driver</label>
                <select
                  value={selectedDriver}
                  onChange={(e) => handleDriverSelection(e.target.value)}
                  className="select-input"
                >
                  <option value="">-- Choose Driver --</option>
                  {stats?.activeDriversList?.filter(driver => driver.isActive !== false).map((driver) => (
                    <option key={driver._id} value={driver._id}>
                      {driver.name} - {driver.stats?.completedDeliveries || 0} deliveries - ⭐ {driver.stats?.averageRating?.toFixed(1) || "N/A"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Select Vehicle</label>
                <select
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  className="select-input"
                >
                  <option value="">-- Choose Vehicle --</option>
                  {stats?.vehicles?.map((vehicle) => (
                    <option key={vehicle._id} value={vehicle._id}>
                      {getVehicleIcon(vehicle.type)} {vehicle.type} - {vehicle.plateNumber} ({vehicle.capacity}kg)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowAssignModal(false)}>
                Cancel
              </button>
              <button className="confirm-btn" onClick={handleAssignOrder}>
                Assign Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Driver Details Modal */}
      {showDriverDetails && driverForApproval && (
        <div className="modal-overlay" onClick={() => setShowDriverDetails(false)}>
          <div className="modal-content driver-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Driver Application Details</h2>
              <button className="close-btn" onClick={() => setShowDriverDetails(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Personal Information */}
              <div className="details-section">
                <h3>👤 Personal Information</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <label>Full Name:</label>
                    <p>{driverForApproval.name}</p>
                  </div>
                  <div className="detail-item">
                    <label>Email:</label>
                    <p>{driverForApproval.email}</p>
                  </div>
                  <div className="detail-item">
                    <label>Phone:</label>
                    <p>{driverForApproval.phone}</p>
                  </div>
                  <div className="detail-item">
                    <label>Registration Date:</label>
                    <p>{new Date(driverForApproval.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* License Details */}
              {driverForApproval.driverDetails && (
                <div className="details-section">
                  <h3>🪪 License Details</h3>
                  <div className="details-grid">
                    <div className="detail-item">
                      <label>License Number:</label>
                      <p>{driverForApproval.driverDetails.licenseNumber || "Not provided"}</p>
                    </div>
                    <div className="detail-item">
                      <label>Expiry Date:</label>
                      <p>{driverForApproval.driverDetails.licenseExpiry ? new Date(driverForApproval.driverDetails.licenseExpiry).toLocaleDateString() : "Not provided"}</p>
                    </div>
                    {driverForApproval.driverDetails.licenseDocument && (
                      <div className="detail-item full-width">
                        <label>License Document:</label>
                        <a href={driverForApproval.driverDetails.licenseDocument} target="_blank" rel="noopener noreferrer" className="document-link">
                          📄 View Document
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Identity Documents */}
              {driverForApproval.driverDetails && (driverForApproval.driverDetails.panNumber || driverForApproval.driverDetails.aadharNumber) && (
                <div className="details-section">
                  <h3>🆔 Identity Documents</h3>
                  <div className="details-grid">
                    {driverForApproval.driverDetails.panNumber && (
                      <div className="detail-item">
                        <label>PAN Number:</label>
                        <p>{driverForApproval.driverDetails.panNumber}</p>
                      </div>
                    )}
                    {driverForApproval.driverDetails.panDocument && (
                      <div className="detail-item">
                        <label>PAN Document:</label>
                        <a href={driverForApproval.driverDetails.panDocument} target="_blank" rel="noopener noreferrer" className="document-link">
                          📄 View PAN
                        </a>
                      </div>
                    )}
                    {driverForApproval.driverDetails.aadharNumber && (
                      <div className="detail-item">
                        <label>Aadhar Number:</label>
                        <p>{driverForApproval.driverDetails.aadharNumber}</p>
                      </div>
                    )}
                    {driverForApproval.driverDetails.aadharDocument && (
                      <div className="detail-item">
                        <label>Aadhar Document:</label>
                        <a href={driverForApproval.driverDetails.aadharDocument} target="_blank" rel="noopener noreferrer" className="document-link">
                          📄 View Aadhar
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Vehicle Details */}
              {driverForApproval.driverDetails && (
                <div className="details-section">
                  <h3>🚚 Vehicle Details</h3>
                  <div className="details-grid">
                    <div className="detail-item">
                      <label>Vehicle Type:</label>
                      <p>{driverForApproval.driverDetails.vehicleType || "Not provided"}</p>
                    </div>
                    <div className="detail-item">
                      <label>Vehicle Number:</label>
                      <p>{driverForApproval.driverDetails.vehicleNumber || "Not provided"}</p>
                    </div>
                    <div className="detail-item">
                      <label>Model:</label>
                      <p>{driverForApproval.driverDetails.vehicleModel || "Not provided"}</p>
                    </div>
                    <div className="detail-item">
                      <label>Year:</label>
                      <p>{driverForApproval.driverDetails.vehicleYear || "Not provided"}</p>
                    </div>
                    <div className="detail-item">
                      <label>Insurance Expiry:</label>
                      <p>{driverForApproval.driverDetails.insuranceExpiry ? new Date(driverForApproval.driverDetails.insuranceExpiry).toLocaleDateString() : "Not provided"}</p>
                    </div>
                    {driverForApproval.driverDetails.rcDocument && (
                      <div className="detail-item">
                        <label>RC Document:</label>
                        <a href={driverForApproval.driverDetails.rcDocument} target="_blank" rel="noopener noreferrer" className="document-link">
                          📄 View RC
                        </a>
                      </div>
                    )}
                    {driverForApproval.driverDetails.vehiclePhoto && (
                      <div className="detail-item full-width">
                        <label>Vehicle Photo:</label>
                        <img src={driverForApproval.driverDetails.vehiclePhoto} alt="Vehicle" className="vehicle-photo" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rejection Reason Input */}
              <div className="details-section">
                <h3>📝 Rejection Reason (Optional)</h3>
                <textarea
                  className="rejection-textarea"
                  placeholder="Enter reason for rejection (if rejecting)..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows="3"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="reject-btn" 
                onClick={() => handleRejectDriver(driverForApproval._id)}
              >
                ❌ Reject
              </button>
              <button 
                className="approve-btn" 
                onClick={() => handleApproveDriver(driverForApproval._id)}
              >
                ✅ Approve
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Deactivate/Activate User Modal */}
      {showDeactivateModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowDeactivateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedUser.isActive ? '🚫 Deactivate User' : '✅ Activate User'}</h2>
              <button className="close-btn" onClick={() => setShowDeactivateModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="user-summary">
                <p><strong>Name:</strong> {selectedUser.name}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Role:</strong> {selectedUser.role}</p>
                <p><strong>Current Status:</strong> {selectedUser.isActive ? '✅ Active' : '🚫 Deactivated'}</p>
              </div>

              {selectedUser.isActive && (
                <div className="form-group">
                  <label>Reason for Deactivation *</label>
                  <textarea
                    className="reason-textarea"
                    placeholder="Enter reason for deactivation..."
                    value={deactivationReason}
                    onChange={(e) => setDeactivationReason(e.target.value)}
                    rows="4"
                  />
                </div>
              )}

              {!selectedUser.isActive && selectedUser.deactivationReason && (
                <div className="info-box">
                  <p><strong>Previous Deactivation Reason:</strong></p>
                  <p>{selectedUser.deactivationReason}</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowDeactivateModal(false)}>
                Cancel
              </button>
              <button 
                className={selectedUser.isActive ? "deactivate-btn" : "activate-btn"}
                onClick={handleToggleUserActive}
              >
                {selectedUser.isActive ? '🚫 Deactivate' : '✅ Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Details Modal */}
      {showRevenueModal && (
        <div className="modal-overlay" onClick={() => setShowRevenueModal(false)}>
          <div className="modal-content revenue-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💰 Revenue Details</h2>
              <button className="close-btn" onClick={() => setShowRevenueModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Total Revenue Summary */}
              <div className="revenue-summary">
                <div className="revenue-total-card">
                  <h3>Total Revenue</h3>
                  <p className="revenue-total-amount">₹{stats?.totalRevenue?.toFixed(2) || 0}</p>
                  <p className="revenue-subtitle">From {stats?.completedOrders || 0} completed orders</p>
                </div>
              </div>

              {/* Revenue by Driver */}
              <div className="revenue-section">
                <h3>📊 Revenue by Driver</h3>
                <div className="revenue-list">
                  {stats?.drivers
                    ?.filter(driver => driver.earnings?.total > 0)
                    ?.sort((a, b) => (b.earnings?.total || 0) - (a.earnings?.total || 0))
                    ?.map((driver) => (
                      <div key={driver._id} className="revenue-item">
                        <div className="revenue-driver-info">
                          <div className="revenue-avatar">
                            {driver.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="revenue-driver-details">
                            <p className="revenue-driver-name">{driver.name}</p>
                            <p className="revenue-driver-stats">
                              {driver.stats?.completedDeliveries || 0} deliveries • 
                              ⭐ {driver.stats?.averageRating?.toFixed(1) || "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="revenue-amount-section">
                          <p className="revenue-driver-amount">₹{driver.earnings?.total?.toFixed(2) || 0}</p>
                          <p className="revenue-percentage">
                            {((driver.earnings?.total / stats?.totalRevenue) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  
                  {(!stats?.drivers || stats.drivers.filter(d => d.earnings?.total > 0).length === 0) && (
                    <div className="empty-revenue">
                      <p>No revenue data available yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Revenue Breakdown */}
              <div className="revenue-section">
                <h3>📈 Revenue Breakdown</h3>
                <div className="revenue-breakdown">
                  <div className="breakdown-item">
                    <span className="breakdown-label">Completed Orders:</span>
                    <span className="breakdown-value">{stats?.completedOrders || 0}</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Average per Order:</span>
                    <span className="breakdown-value">
                      ₹{stats?.completedOrders > 0 
                        ? (stats?.totalRevenue / stats?.completedOrders).toFixed(2) 
                        : 0}
                    </span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Total Drivers:</span>
                    <span className="breakdown-value">
                      {stats?.drivers?.filter(d => d.earnings?.total > 0).length || 0}
                    </span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Average per Driver:</span>
                    <span className="breakdown-value">
                      ₹{stats?.drivers?.filter(d => d.earnings?.total > 0).length > 0
                        ? (stats?.totalRevenue / stats?.drivers?.filter(d => d.earnings?.total > 0).length).toFixed(2)
                        : 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowRevenueModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;