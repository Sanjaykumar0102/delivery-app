# Profile & Driver Info Integration Guide

## Overview
This guide will help you add profile sections to Customer and Driver dashboards, plus enhanced driver information display with call functionality.

---

## ✅ Features to Add

### 1. Customer Profile Section
- View personal information
- See order statistics
- View recent activity
- Quick access to booking

### 2. Driver Profile Section
- View personal and vehicle information
- See performance statistics
- View earnings summary
- Quick action buttons

### 3. Enhanced Driver Info for Customers
- Complete driver details when assigned
- Driver rating and reviews
- Vehicle information
- Call driver button
- Track live button

---

## 🔧 Integration Steps

### STEP 1: Customer Dashboard Profile

**File**: `frontend/src/pages/Dashboard/Customer/CustomerDashboard.jsx`

#### 1.1 Add Profile Tab to Navigation

Find the navigation section (around line 384-407) and add this button after the "Track" button:

```jsx
<button
  className={`nav-btn-v2 ${activeTab === "profile" ? "active" : ""}`}
  onClick={() => setActiveTab("profile")}
>
  <span className="nav-icon">👤</span>
  <span className="nav-text">My Profile</span>
</button>
```

#### 1.2 Add Profile Section Content

Find the end of the main content area (after the track section, before `</main>`) and add the complete profile section from `CUSTOMER_PROFILE_ADDITION.jsx`.

---

### STEP 2: Driver Dashboard Profile

**File**: `frontend/src/pages/Dashboard/Driver/index.jsx`

#### 2.1 Add Profile Tab to Navigation

Find the navigation/tabs section and add this button:

```jsx
<button
  className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
  onClick={() => setActiveTab("profile")}
>
  <span className="tab-icon">👤</span>
  <span className="tab-text">My Profile</span>
</button>
```

#### 2.2 Add Profile Section Content

Add the complete profile section from `DRIVER_PROFILE_ADDITION.jsx` after the earnings section.

---

### STEP 3: Enhanced Driver Info in Customer Orders

**File**: `frontend/src/pages/Dashboard/Customer/CustomerDashboard.jsx`

#### 3.1 Find the Orders Display Section

Look for where orders are displayed (in the "orders" tab section).

#### 3.2 Replace Simple Driver Display

Find where driver information is currently shown (usually just the name) and replace it with the enhanced driver info card from `DRIVER_INFO_COMPONENT.jsx`.

**Options:**
- **Full Card**: Use for detailed order view
- **Compact View**: Use for order list
- **Modal**: Use for popup detailed view

#### 3.3 Add Driver Info Modal (Optional but Recommended)

Add the driver info modal code at the end of the component (before the closing `</div>` of the dashboard).

---

### STEP 4: Add CSS Styles

**Files**: 
- `frontend/src/pages/Dashboard/Customer/CustomerDashboard.css`
- `frontend/src/pages/Dashboard/Driver/DriverDashboard.css`

Copy all styles from `PROFILE_AND_DRIVER_INFO_CSS.css` and add to the respective CSS files.

---

## 📝 Detailed Implementation

### Customer Profile Section Features

```jsx
// Profile displays:
- Customer name and avatar
- Email and phone
- Customer ID
- Member since date
- Total orders count
- Completed orders
- Active orders
- Pending orders
- Recent activity list (last 5 orders)
```

### Driver Profile Section Features

```jsx
// Profile displays:
- Driver name and avatar
- Email and phone
- Driver ID
- Joined date
- Approval status
- Duty status
- Vehicle type and details
- License information
- Insurance expiry
- Total deliveries
- Completed deliveries
- Average rating
- Total ratings
- Earnings breakdown (today, week, month, total)
- Quick action buttons
```

### Enhanced Driver Info Features

```jsx
// When driver is assigned, customer sees:
- Driver photo (avatar)
- Driver name
- Driver rating (stars + count)
- Completed deliveries count
- Phone number
- Email
- Vehicle type
- Vehicle plate number
- Call driver button (tel: link)
- Track live button
```

---

## 🎨 UI Components Breakdown

### 1. Profile Avatar
```jsx
<div className="profile-avatar-large">
  {user?.name?.charAt(0).toUpperCase()}
</div>
```
- Large circular avatar
- Gradient background
- First letter of name
- Responsive sizing

### 2. Info Grid
```jsx
<div className="profile-details-grid">
  <div className="profile-detail-item">
    <span className="detail-label">📧 Email</span>
    <span className="detail-value">{user?.email}</span>
  </div>
</div>
```
- Responsive grid layout
- Icon + label + value
- Clean card design

### 3. Statistics Cards
```jsx
<div className="stats-grid">
  <div className="stat-item">
    <div className="stat-icon">📦</div>
    <div className="stat-info">
      <span className="stat-value">{count}</span>
      <span className="stat-label">Label</span>
    </div>
  </div>
</div>
```
- Visual statistics display
- Hover effects
- Color-coded icons

### 4. Call Driver Button
```jsx
<a href={`tel:${order.driver.phone}`} className="call-driver-btn">
  <span className="btn-icon">📞</span>
  <span className="btn-text">Call Driver</span>
</a>
```
- Direct phone call link
- Works on mobile and desktop
- Gradient button style

---

## 🧪 Testing Checklist

### Customer Profile
- [ ] Profile tab appears in navigation
- [ ] Avatar shows first letter of name
- [ ] Email and phone display correctly
- [ ] Customer ID shows last 8 characters
- [ ] Member since date formats correctly
- [ ] Order statistics calculate correctly
- [ ] Recent activity shows last 5 orders
- [ ] "Book Delivery" button works when no orders

### Driver Profile
- [ ] Profile tab appears in navigation
- [ ] Avatar shows first letter of name
- [ ] Personal info displays correctly
- [ ] Approval status shows correctly
- [ ] Duty status updates in real-time
- [ ] Vehicle information displays
- [ ] Performance stats show correct numbers
- [ ] Earnings display correctly
- [ ] Quick action buttons navigate properly

### Driver Info (Customer View)
- [ ] Driver info appears when order is assigned
- [ ] Driver avatar displays
- [ ] Driver name shows
- [ ] Rating displays with stars
- [ ] Completed deliveries count shows
- [ ] Phone number displays
- [ ] Email displays
- [ ] Vehicle info shows
- [ ] Call button works (opens phone dialer)
- [ ] Track button navigates to tracking page
- [ ] Modal opens with full details (if implemented)

---

## 📱 Mobile Responsiveness

All components are fully responsive:

### Breakpoints:
- **Desktop**: > 1024px - Full grid layout
- **Tablet**: 768px - 1024px - Adjusted grid
- **Mobile**: < 768px - Single column layout

### Mobile Optimizations:
- Stack layouts vertically
- Larger touch targets for buttons
- Simplified grids
- Readable text sizes
- Optimized spacing

---

## 🎯 Call Functionality

### How It Works:

```jsx
<a href={`tel:${phoneNumber}`}>Call Driver</a>
```

**On Mobile:**
- Opens native phone dialer
- Pre-fills driver's number
- User taps to call

**On Desktop:**
- Opens default calling app (Skype, FaceTime, etc.)
- Or shows "No app configured" message
- Still useful for copying number

**Security:**
- Phone numbers from database only
- No user input for phone numbers
- Validated on backend

---

## 🔒 Privacy Considerations

### Driver Information Visibility:
- Only shown to customers with assigned orders
- Phone/email only visible after driver accepts
- Driver can't see customer's full info until accepted

### Data Protection:
- No sensitive data in frontend state
- Phone numbers not stored in localStorage
- All data from authenticated API calls

---

## 💡 Customization Options

### Change Avatar Colors:
```css
.profile-avatar-large {
  background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
}
```

### Modify Statistics:
Add more stats in the stats grid:
```jsx
<div className="stat-item">
  <div className="stat-icon">🎯</div>
  <div className="stat-info">
    <span className="stat-value">{customStat}</span>
    <span className="stat-label">Custom Label</span>
  </div>
</div>
```

### Add More Profile Fields:
```jsx
<div className="profile-detail-item">
  <span className="detail-label">🏠 Address</span>
  <span className="detail-value">{user?.address}</span>
</div>
```

---

## 🐛 Troubleshooting

### Profile Not Showing:
- Check activeTab state includes "profile"
- Verify navigation button added
- Check CSS is imported
- Look for console errors

### Driver Info Not Displaying:
- Verify order has driver assigned
- Check order.driver object exists
- Ensure driver data populated from backend
- Check network tab for API response

### Call Button Not Working:
- Verify phone number exists
- Check tel: link format
- Test on mobile device
- Ensure no typos in href

### Styles Not Applied:
- Check CSS file imported
- Verify class names match
- Clear browser cache
- Check for CSS conflicts

---

## 📊 Data Requirements

### Customer Profile Needs:
```javascript
user: {
  _id, name, email, phone, createdAt
}
orders: [
  { _id, status, pickup, dropoff, fare, createdAt }
]
```

### Driver Profile Needs:
```javascript
user: {
  _id, name, email, phone, createdAt,
  isApproved, approvalStatus, isOnDuty,
  driverDetails: {
    vehicleType, vehicleNumber, vehicleModel,
    vehicleYear, licenseNumber, insuranceExpiry
  }
}
stats: {
  totalDeliveries, completedDeliveries,
  averageRating, totalRatings
}
earnings: {
  today, thisWeek, thisMonth, total
}
```

### Driver Info (Customer View) Needs:
```javascript
order: {
  driver: {
    _id, name, email, phone,
    stats: { averageRating, totalRatings, completedDeliveries }
  },
  vehicle: {
    type, plateNumber, capacity
  },
  status, vehicleType
}
```

---

## ✅ Completion Checklist

- [ ] Customer profile tab added
- [ ] Customer profile content added
- [ ] Driver profile tab added
- [ ] Driver profile content added
- [ ] Enhanced driver info added to orders
- [ ] Call driver button implemented
- [ ] CSS styles added
- [ ] Tested on desktop
- [ ] Tested on mobile
- [ ] All data displays correctly
- [ ] Navigation works properly
- [ ] Call functionality works
- [ ] Track button works
- [ ] No console errors

---

## 🎉 You're Done!

After completing these steps, you'll have:
✅ Professional profile sections for customers and drivers
✅ Complete driver information display
✅ Working call functionality
✅ Beautiful, responsive UI
✅ Enhanced user experience

**Estimated Time:** 15-20 minutes for full integration
