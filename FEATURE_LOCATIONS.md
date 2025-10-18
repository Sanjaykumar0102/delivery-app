# Feature Locations Guide

## 🗺️ Where to Find Each Feature

### 1. Customer Dashboard - Map & Location Picker

**URL:** `http://localhost:5173/dashboard` (when logged in as Customer)

**Navigation:**
```
Login as Customer → Dashboard → "📦 Book Delivery" Tab
```

**What You'll See:**
```
┌─────────────────────────────────────────┐
│  📦 Book a Delivery                     │
├─────────────────────────────────────────┤
│  Select Vehicle Type                    │
│  [🏍️ Bike] [🛺 Auto] [🚐 Truck] [🚚]   │
├─────────────────────────────────────────┤
│  📍 Pickup Location                     │
│  [Search pickup location...] [📍]       │  ← Type here!
│  ┌───────────────────────────────┐     │
│  │ 📍 Search Results             │     │  ← Suggestions appear
│  │ • Bangalore, Karnataka        │     │
│  │ • Bangalore Airport           │     │
│  │ • Bangalore City Center       │     │
│  └───────────────────────────────┘     │
├─────────────────────────────────────────┤
│  🎯 Dropoff Location                    │
│  [Search dropoff location...] [📍]      │
├─────────────────────────────────────────┤
│  📍 Route Preview                       │  ← Map appears here!
│  ┌───────────────────────────────┐     │
│  │         🗺️ MAP                │     │
│  │    📍 (green) ─────→ 🎯 (red) │     │
│  │                                │     │
│  └───────────────────────────────┘     │
├─────────────────────────────────────────┤
│  Estimated Fare: ₹150                   │  ← Auto-calculated
│  [🚀 Place Order]                       │
└─────────────────────────────────────────┘
```

**Features:**
- Type in location input → See suggestions
- Click 📍 button → Use current GPS location
- Select location → Map appears automatically
- Both locations selected → Route line appears
- Fare updates in real-time

---

### 2. Driver Dashboard - Duty Toggle

**URL:** `http://localhost:5173/dashboard` (when logged in as Driver)

**Navigation:**
```
Login as Driver → Dashboard → Header (Top Right)
```

**What You'll See (BEFORE Approval):**
```
┌─────────────────────────────────────────────────────┐
│  🚚 DelivraX Driver                                 │
│  [🔴 Off Duty] [Toggle Switch - DISABLED]  [Logout]│  ← Can't toggle!
├─────────────────────────────────────────────────────┤
│  ⏳ Approval Pending                                │  ← Banner shows
│  Your driver application is under review.           │
│  You'll be notified once approved.                  │
├─────────────────────────────────────────────────────┤
│  🌙 You're currently off duty                       │
│  Turn on duty to start receiving orders             │
│  [🟢 Go Online - DISABLED]                          │  ← Can't click!
│  ⚠️ You need admin approval before going online    │
└─────────────────────────────────────────────────────┘
```

**What You'll See (AFTER Approval):**
```
┌─────────────────────────────────────────────────────┐
│  🚚 DelivraX Driver                                 │
│  [🟢 On Duty] [Toggle Switch - ENABLED]   [Logout] │  ← Can toggle!
├─────────────────────────────────────────────────────┤
│  💰 Today's Earnings                                │
│  Today: ₹0  |  Week: ₹0  |  Month: ₹0              │
├─────────────────────────────────────────────────────┤
│  ⏳ Waiting for orders...                           │
│  You'll be notified when a new order is available   │
└─────────────────────────────────────────────────────┘
```

**How to Get Approved:**
1. Admin must approve you first
2. You'll see a popup notification when approved
3. Banner changes from "Pending" to removed
4. Toggle switch becomes enabled
5. You can now go online

---

### 3. Admin Dashboard - Approval Requests

**URL:** `http://localhost:5173/dashboard` (when logged in as Admin)

**Navigation:**
```
Login as Admin → Dashboard → "⏳ Approvals" Tab
```

**What You'll See:**
```
┌─────────────────────────────────────────────────────┐
│  [🏠 Home] [📊 Analytics] [⏳ Approvals (2)] [📦]  │  ← Click here!
├─────────────────────────────────────────────────────┤
│  📋 Driver Approvals                                │
│  Pending Applications: 2                            │
├─────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────┐ │
│  │  👤 John Doe                                  │ │
│  │  📧 john@example.com                          │ │
│  │  📱 +91 9876543210                            │ │
│  │  🚗 Vehicle: Bike                             │ │
│  │  📅 Registered: 2 hours ago                   │ │
│  │                                                │ │
│  │  [✅ Approve]  [❌ Reject]  [👁️ View Details] │ │
│  └───────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────┐ │
│  │  👤 Jane Smith                                │ │
│  │  📧 jane@example.com                          │ │
│  │  📱 +91 9876543211                            │ │
│  │  🚗 Vehicle: Auto                             │ │
│  │  📅 Registered: 5 hours ago                   │ │
│  │                                                │ │
│  │  [✅ Approve]  [❌ Reject]  [👁️ View Details] │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Real-time Notification (when new driver registers):**
```
┌─────────────────────────────────────────┐
│  ✅ New driver registration:            │
│  John Doe - Please review in            │
│  Approvals tab                          │
└─────────────────────────────────────────┘
```

**Features:**
- Badge count shows number of pending drivers
- Real-time notification when new driver registers
- Click "Approvals" tab to see list
- Click "✅ Approve" to approve
- Click "❌ Reject" to reject with reason
- Driver receives instant notification

---

## 🔍 How to Test Each Feature

### Test 1: Customer Map (2 minutes)

1. **Login as Customer:**
   ```
   Email: customer@example.com
   Password: password123
   ```

2. **Navigate:**
   - Click "📦 Book Delivery" tab

3. **Test Location Autocomplete:**
   - Click "Pickup Location" input
   - Type: "Bangalore"
   - Wait 1 second
   - See suggestions appear
   - Click any suggestion

4. **Test Current Location:**
   - Click 📍 button next to input
   - Allow location permission
   - See current location filled

5. **Test Map:**
   - Select pickup location
   - Select dropoff location
   - See map appear below
   - See green marker (pickup)
   - See red marker (dropoff)
   - See route line connecting them

6. **Test Fare:**
   - Select vehicle type
   - See "Estimated Fare: ₹XXX"
   - Change vehicle → fare updates
   - Change locations → fare updates

---

### Test 2: Driver Duty Toggle (3 minutes)

**Part A: Before Approval**

1. **Register New Driver:**
   ```
   Go to: http://localhost:5173/register
   Role: Driver
   Name: Test Driver
   Email: testdriver@example.com
   Password: password123
   ```

2. **Login as Driver:**
   - See "⏳ Approval Pending" banner
   - Duty toggle is DISABLED (grayed out)
   - Hover over toggle → tooltip: "Wait for admin approval"
   - Can't click "Go Online" button

**Part B: Admin Approves**

3. **Login as Admin (new tab):**
   ```
   Email: admin@example.com
   Password: password123
   ```

4. **Approve Driver:**
   - Click "⏳ Approvals" tab
   - See "Test Driver" in list
   - Click "✅ Approve"
   - See success message

**Part C: After Approval**

5. **Back to Driver Tab:**
   - Refresh page (or wait for notification)
   - Banner is gone
   - Duty toggle is ENABLED
   - Click toggle → goes online
   - See "🟢 On Duty"
   - Click again → goes offline
   - See "🔴 Off Duty"

---

### Test 3: Admin Approvals (2 minutes)

1. **Open Two Browser Windows:**
   - Window 1: Admin Dashboard
   - Window 2: Registration Page

2. **Window 1 (Admin):**
   - Login as admin
   - Click "⏳ Approvals" tab
   - Note the count (e.g., "Approvals (0)")

3. **Window 2 (Register):**
   - Register new driver
   - Fill all details
   - Click "Register"

4. **Window 1 (Admin) - Watch:**
   - See notification popup immediately
   - See badge count increase: "Approvals (1)"
   - See new driver in list
   - No page refresh needed!

5. **Approve:**
   - Click "✅ Approve"
   - See success message
   - Driver disappears from list
   - Badge count decreases

6. **Window 2 (Driver):**
   - Login with new driver account
   - See approval notification
   - Duty toggle is enabled

---

## 🎯 Quick Reference

### Customer Dashboard Tabs:
```
📦 Book Delivery    ← Map & Location here
📋 My Orders        ← View all orders
📍 Track Order      ← Live tracking
```

### Driver Dashboard Tabs:
```
🏠 Home             ← Duty toggle in header
📦 My Orders        ← Accepted orders
💰 Earnings         ← Income stats
👤 Profile          ← Account info
```

### Admin Dashboard Tabs:
```
🏠 Home             ← Overview stats
📊 Analytics        ← Detailed reports
⏳ Approvals        ← Driver approvals here!
📦 Orders           ← All orders
🚗 Drivers          ← All drivers
👥 Customers        ← All customers
```

---

## 🚨 Common Mistakes

### ❌ "I don't see the map!"
**Mistake:** Not selecting both pickup AND dropoff locations
**Solution:** Select BOTH locations, then map appears

### ❌ "Duty toggle doesn't work!"
**Mistake:** Driver not approved yet
**Solution:** Admin must approve first in Approvals tab

### ❌ "No pending drivers showing!"
**Mistake:** Looking in wrong tab
**Solution:** Click "⏳ Approvals" tab, not "🚗 Drivers" tab

### ❌ "Location suggestions not appearing!"
**Mistake:** Typing less than 3 characters
**Solution:** Type at least 3 characters and wait 1 second

---

## 📱 Mobile View

All features work on mobile too!

**Customer Map:**
- Tap location input
- Keyboard appears
- Type location
- Suggestions appear below
- Tap suggestion
- Map appears (scrollable)

**Driver Duty:**
- Toggle switch at top
- Swipe to enable/disable
- Works same as desktop

**Admin Approvals:**
- Swipe through tabs
- Tap "Approvals"
- Scroll through list
- Tap approve/reject

---

## ✅ Success Indicators

### Customer Map Working:
- ✅ Suggestions appear when typing
- ✅ Map loads with OpenStreetMap tiles
- ✅ Green marker for pickup
- ✅ Red marker for dropoff
- ✅ Blue line connecting them
- ✅ Fare calculation shows

### Driver Duty Working:
- ✅ Toggle disabled when pending
- ✅ Toggle enabled when approved
- ✅ Status changes: 🔴 ↔️ 🟢
- ✅ Can receive orders when online

### Admin Approvals Working:
- ✅ Badge count shows number
- ✅ Notification on new registration
- ✅ List shows pending drivers
- ✅ Approve/reject buttons work
- ✅ Driver receives notification

---

**Last Updated:** 2025-10-07  
**All Features:** ✅ Working and Tested
