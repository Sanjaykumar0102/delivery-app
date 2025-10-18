# Troubleshooting Guide - DelivraX Delivery App

## Issues Reported & Solutions

### 1. Customer Dashboard - Map & Location Autocomplete

**Status:** ✅ **ALREADY IMPLEMENTED**

**Features Available:**
- Interactive map with Leaflet showing pickup/dropoff locations
- Location autocomplete with OpenStreetMap Nominatim API
- Current location detection
- Popular locations suggestions
- Route preview on map

**How to Use:**
1. Navigate to Customer Dashboard
2. Click "Book Delivery" tab
3. Click on "Pickup Location" or "Dropoff Location" input
4. Type at least 3 characters to see suggestions
5. Click the 📍 button to use current location
6. Map will automatically show selected locations

**If Not Working:**
- Ensure backend server is running on `http://localhost:5000`
- Check browser console for errors
- Verify internet connection (map tiles load from OpenStreetMap)
- Enable location permissions in browser for current location feature

---

### 2. Driver Dashboard - Duty Toggle Issue

**Status:** ✅ **WORKING - Requires Admin Approval**

**Root Cause:**
The duty toggle is **intentionally disabled** until admin approves the driver account.

**Backend Logic (userController.js line 144-146):**
```javascript
if (!user.isApproved || user.approvalStatus !== 'Approved') {
  res.status(403);
  throw new Error('Your account is pending approval. Please wait for admin approval before going on duty.');
}
```

**Solution Steps:**

#### For New Drivers:
1. Register as a driver
2. Wait for admin approval (check "Approvals" tab in Admin Dashboard)
3. Once approved, you can toggle duty status

#### For Admins:
1. Login to Admin Dashboard
2. Click "⏳ Approvals" tab
3. Review pending driver applications
4. Click "✅ Approve" or "❌ Reject"
5. Driver will receive real-time notification via Socket.IO

#### If Driver Still Can't Toggle After Approval:
Run this MongoDB query to manually approve:
```javascript
db.users.updateOne(
  { email: "driver@example.com" },
  { 
    $set: { 
      isApproved: true, 
      approvalStatus: "Approved" 
    } 
  }
)
```

Then refresh the driver dashboard.

---

### 3. Admin Dashboard - Not Receiving Approval Requests

**Status:** ✅ **WORKING - Socket.IO Real-time Updates**

**How It Works:**
1. When a driver registers, backend emits `newDriverRegistration` event
2. Admin dashboard listens for this event via Socket.IO
3. Pending drivers list auto-refreshes
4. Badge count updates in real-time

**Backend Event (userController.js line 61):**
```javascript
io.emit("newDriverRegistration", {
  driverId: user._id,
  name: user.name,
  email: user.email,
  approvalStatus: user.approvalStatus,
});
```

**Frontend Listener (AdminDashboard.jsx line 102):**
```javascript
socket.on("newDriverRegistration", (data) => {
  console.log("🚗 New driver registration:", data);
  fetchPendingDrivers();
  setSuccess(`New driver registration: ${data.name} - Please review in Approvals tab`);
});
```

**If Not Receiving Requests:**

#### Check 1: Socket Connection
Open browser console and look for:
```
✅ Socket connected: <socket-id>
```

#### Check 2: Backend Server Running
Ensure backend is running on port 5000:
```bash
cd backend
npm start
```

#### Check 3: Manually Fetch Pending Drivers
Click the "⏳ Approvals" tab - it will fetch pending drivers from API:
```
GET /api/users/drivers/pending
```

#### Check 4: Database Query
Run this in MongoDB to see pending drivers:
```javascript
db.users.find({ role: "Driver", approvalStatus: "Pending" })
```

#### Check 5: Test Driver Registration
1. Open a new incognito window
2. Register as a new driver
3. Check admin dashboard - should see notification immediately
4. Check "Approvals" tab - should see new driver in list

---

## System Architecture

### Frontend (Port 5173)
- React + Vite
- Socket.IO Client
- Leaflet Maps
- React Router

### Backend (Port 5000)
- Express.js
- MongoDB + Mongoose
- Socket.IO Server
- JWT Authentication

### Real-time Features
- Order notifications to drivers
- Driver location tracking
- Approval status updates
- New driver registration alerts

---

## API Endpoints Reference

### User/Driver Routes
```
POST   /api/users/register          - Register new user
POST   /api/users/login             - Login
GET    /api/users/profile           - Get user profile
PUT    /api/users/duty              - Toggle driver duty status (Driver only)
PUT    /api/users/location          - Update driver location
GET    /api/users/drivers/pending   - Get pending driver approvals (Admin only)
PUT    /api/users/drivers/:id/approve  - Approve driver (Admin only)
PUT    /api/users/drivers/:id/reject   - Reject driver (Admin only)
```

### Order Routes
```
POST   /api/orders                  - Create new order
GET    /api/orders                  - Get user's orders
PUT    /api/orders/:id/assign       - Assign order to driver (Admin)
PUT    /api/orders/:id/accept       - Accept order (Driver)
PUT    /api/orders/:id/status       - Update order status
```

---

## Socket.IO Events

### Client → Server
```javascript
register              - Register user with socket
updateLocation        - Update driver location
dutyStatusChange      - Notify duty status change
```

### Server → Client
```javascript
newOrderAvailable     - New order notification to drivers
orderAssigned         - Order assigned to specific driver
orderStatusUpdate     - Order status changed
locationUpdate        - Driver location updated
approvalStatusUpdate  - Driver approval status changed
newDriverRegistration - New driver registered (to admins)
```

---

## Quick Fixes

### Reset Driver Approval Status
```javascript
// MongoDB Shell
db.users.updateMany(
  { role: "Driver" },
  { $set: { isApproved: true, approvalStatus: "Approved" } }
)
```

### Clear All Pending Approvals
```javascript
db.users.updateMany(
  { role: "Driver", approvalStatus: "Pending" },
  { $set: { isApproved: true, approvalStatus: "Approved" } }
)
```

### Check Socket Connections
```javascript
// In browser console (Admin Dashboard)
console.log("Socket connected:", socket.connected);
console.log("Socket ID:", socket.id);
```

---

## Testing Checklist

### Customer Dashboard Map
- [ ] Location autocomplete shows suggestions
- [ ] Current location button works
- [ ] Map displays pickup marker (green)
- [ ] Map displays dropoff marker (red)
- [ ] Route line appears between markers
- [ ] Fare estimation calculates correctly

### Driver Duty Toggle
- [ ] New driver sees "Pending Approval" banner
- [ ] Duty toggle is disabled until approved
- [ ] After approval, duty toggle works
- [ ] Going online shows "🟢 On Duty"
- [ ] Going offline shows "🔴 Off Duty"
- [ ] Location tracking starts when on duty

### Admin Approvals
- [ ] Pending drivers appear in Approvals tab
- [ ] Badge count shows number of pending drivers
- [ ] Real-time notification on new registration
- [ ] Approve button works
- [ ] Reject button with reason works
- [ ] Driver receives approval notification

---

## Common Errors & Solutions

### Error: "Failed to update duty status"
**Cause:** Driver not approved
**Solution:** Admin must approve driver first

### Error: "No locations found"
**Cause:** API rate limit or network issue
**Solution:** Wait a few seconds and try again

### Error: "Socket connection failed"
**Cause:** Backend server not running
**Solution:** Start backend server: `cd backend && npm start`

### Error: "Map not loading"
**Cause:** Missing Leaflet CSS or internet connection
**Solution:** Check network tab for failed requests

---

## Support

For additional help:
1. Check browser console for errors
2. Check backend terminal for logs
3. Verify MongoDB connection
4. Ensure all npm packages are installed:
   ```bash
   cd frontend && npm install
   cd backend && npm install
   ```

---

**Last Updated:** 2025-10-07
**Version:** 1.0.0
