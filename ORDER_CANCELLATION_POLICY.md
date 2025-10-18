# Order Cancellation Policy

## Summary of Changes

### ✅ Implemented Features

1. **Drivers Cannot Reject Accepted Orders**
   - Once a driver accepts an order, they cannot reject it
   - The `rejectAcceptedOrder` endpoint now returns a 403 error
   - Frontend already doesn't show reject button for accepted orders

2. **Customers Can Cancel Orders**
   - Customers can cancel orders in "Pending", "Assigned", or "Accepted" status
   - Cannot cancel once order reaches "Arrived", "Picked-Up", or later stages

3. **50% Cancellation Fee**
   - If customer cancels after driver has accepted the order:
     - Customer is charged 50% of the order fare as cancellation fee
     - The full cancellation fee is credited to the driver as compensation
     - Driver earnings are updated automatically

## Technical Implementation

### Backend Changes

**File: `backend/controllers/orderController.js`**

#### 1. Disabled Driver Order Rejection
```javascript
const rejectAcceptedOrder = asyncHandler(async (req, res) => {
  // FEATURE DISABLED: Drivers cannot reject orders after accepting
  res.status(403);
  throw new Error("Drivers cannot reject orders after accepting. Only customers can cancel orders.");
});
```

#### 2. Customer Cancellation with Fee (Already Implemented)
```javascript
const cancelOrder = asyncHandler(async (req, res) => {
  // ... existing code ...
  
  // Calculate cancellation fee if driver has accepted the order
  let cancellationFee = 0;
  let driverCompensation = 0;
  
  if (order.status === "Accepted" && order.driver) {
    // Customer pays 50% of fare as cancellation fee
    cancellationFee = order.fare * 0.5;
    driverCompensation = cancellationFee; // Full fee goes to driver
    
    // Update driver earnings
    const driver = await User.findById(order.driver);
    if (driver) {
      driver.earnings.today += driverCompensation;
      driver.earnings.thisWeek += driverCompensation;
      driver.earnings.thisMonth += driverCompensation;
      driver.earnings.total += driverCompensation;
      await driver.save();
    }
  }
  
  order.status = "Cancelled";
  order.cancellationFee = cancellationFee;
  order.driverCompensation = driverCompensation;
  await order.save();
});
```

### Frontend

**Driver Dashboard: `frontend/src/pages/Dashboard/Driver/index.jsx`**
- No "Reject Order" button shown for accepted orders
- Only shows status update buttons (Arrived, Picked Up, etc.)
- Reject buttons only appear for NEW order notifications (before acceptance)

## Order Lifecycle

```
1. Order Created (Pending)
   ├─ Customer can cancel: ✅ (No fee)
   └─ Driver can reject notification: ✅

2. Order Assigned (Admin assigns driver)
   ├─ Customer can cancel: ✅ (No fee)
   └─ Driver hasn't accepted yet

3. Order Accepted (Driver accepts)
   ├─ Customer can cancel: ✅ (50% fee charged, goes to driver)
   └─ Driver CANNOT reject: ❌

4. Driver Arrived at Pickup
   ├─ Customer CANNOT cancel: ❌
   └─ Driver CANNOT reject: ❌

5. Order Picked Up / In Transit / Delivered
   ├─ Customer CANNOT cancel: ❌
   └─ Driver CANNOT reject: ❌
```

## Cancellation Fee Breakdown

When customer cancels after driver acceptance:

| Item | Amount |
|------|--------|
| Original Order Fare | ₹100.00 |
| Cancellation Fee (50%) | ₹50.00 |
| Driver Compensation | ₹50.00 |
| Customer Charged | ₹50.00 |

**Note:** The entire cancellation fee goes to the driver as compensation for their time and effort.

## Benefits

1. **For Drivers:**
   - Protected from order cancellations after acceptance
   - Compensated fairly if customer cancels
   - Encourages commitment to accepted orders

2. **For Customers:**
   - Can still cancel if needed (with fee after acceptance)
   - Fair penalty system discourages frivolous cancellations
   - Clear understanding of cancellation policy

3. **For Platform:**
   - Reduces order cancellations
   - Improves driver satisfaction
   - Better service reliability

## Testing

To test the cancellation policy:

1. **Test Driver Cannot Reject:**
   - Driver accepts an order
   - Try to call reject endpoint → Should return 403 error
   - UI should not show reject button

2. **Test Customer Cancellation with Fee:**
   - Customer creates order
   - Admin assigns driver (or driver accepts)
   - Driver accepts order
   - Customer cancels order
   - Check: Customer charged 50% fee
   - Check: Driver earnings increased by 50% of fare

3. **Test Customer Cancellation without Fee:**
   - Customer creates order
   - Customer cancels before driver accepts
   - Check: No cancellation fee charged
