# Driver Duty Status Persistence - Diagnostic Guide

## Issue Description
When a driver turns ON duty and then closes the browser tab, the duty status appears to turn OFF.

## Diagnostic Steps

### 1. Check Database Persistence
**Test:** Turn ON duty, close browser, check database directly

```bash
# Connect to MongoDB and check
use delivery_app
db.users.findOne({ email: "driver@test.com" }, { isOnDuty: 1, name: 1 })
```

**Expected Result:** `isOnDuty: true`

### 2. Check Login Response
**Test:** Turn ON duty, close browser, login again, check network tab

**Expected in Login Response:**
```json
{
  "isOnDuty": true,
  "name": "Driver Name",
  ...
}
```

### 3. Check Frontend State
**Test:** After login, check React DevTools or console

```javascript
// In Driver Dashboard component
console.log("User isOnDuty:", user.isOnDuty);
console.log("State isOnDuty:", isOnDuty);
```

**Expected:** Both should be `true`

### 4. Check Socket Registration
**Test:** Check backend logs when driver logs in

**Expected Log:**
```
👤 Driver registered: <driverId> (Socket ID: <socketId>)
isOnDuty: true
```

## Common Issues & Solutions

### Issue 1: Database Not Persisting
**Symptom:** Database shows `isOnDuty: false` after closing browser

**Cause:** Something is calling the duty toggle API on disconnect

**Solution:** Check for:
- `beforeunload` event listeners
- Cleanup functions in useEffect
- Socket disconnect handlers calling API

### Issue 2: Login Not Returning Duty Status
**Symptom:** Login response doesn't include `isOnDuty` or shows `false`

**Cause:** Backend not including field in response

**Solution:** Verify `authController.js` line 95 includes:
```javascript
isOnDuty: user.isOnDuty,
```

### Issue 3: Frontend Not Reading Duty Status
**Symptom:** Database has `true`, but UI shows OFF

**Cause:** Frontend not reading from login response

**Solution:** Check Driver Dashboard initialization:
```javascript
setIsOnDuty(parsedUser.isOnDuty || false);
```

Should be reading from `parsedUser.isOnDuty`

### Issue 4: SessionStorage/Cookie Issue
**Symptom:** Page refresh loses duty status

**Cause:** Session management not storing `isOnDuty`

**Solution:** Verify `authService.js` includes `isOnDuty` in user object:
```javascript
const user = {
  ...
  isOnDuty: res.data.isOnDuty,
  ...
};
```

## Verification Script

Run this in browser console after driver logs in:

```javascript
// Check sessionStorage
const session = JSON.parse(sessionStorage.getItem('user'));
console.log('SessionStorage isOnDuty:', session?.isOnDuty);

// Check cookies
const cookieUser = document.cookie
  .split('; ')
  .find(row => row.startsWith('user='))
  ?.split('=')[1];
if (cookieUser) {
  const user = JSON.parse(decodeURIComponent(cookieUser));
  console.log('Cookie isOnDuty:', user?.isOnDuty);
}

// Check component state (if React DevTools available)
// Look for DriverDashboard component and check:
// - user.isOnDuty
// - isOnDuty state
```

## Expected Flow

### Correct Flow:
```
1. Driver turns ON duty
   ├─ Frontend: setIsOnDuty(true)
   ├─ API Call: PUT /users/duty { isOnDuty: true }
   └─ Database: user.isOnDuty = true ✅

2. Driver closes browser
   ├─ Socket disconnects
   ├─ Removed from connectedDrivers map
   └─ Database: user.isOnDuty = true (unchanged) ✅

3. Driver opens browser and logs in
   ├─ API Call: POST /users/login
   ├─ Response: { isOnDuty: true, ... }
   ├─ SessionStorage: { user: { isOnDuty: true } }
   └─ Frontend: setIsOnDuty(true) ✅

4. UI shows: Duty toggle ON ✅
```

### Incorrect Flow (Bug):
```
1. Driver turns ON duty
   └─ Database: user.isOnDuty = true ✅

2. Driver closes browser
   └─ Something sets: user.isOnDuty = false ❌

3. Driver logs in again
   ├─ Response: { isOnDuty: false }
   └─ UI shows: Duty toggle OFF ❌
```

## Quick Fix Test

If the issue is confirmed, try this temporary fix to see if it helps:

### Backend: Add logging to duty toggle
```javascript
// In userController.js toggleDuty function
console.log('🔄 Duty toggle called by:', req.user.name);
console.log('   New status:', isOnDuty);
console.log('   Stack trace:', new Error().stack);
```

This will show if something is unexpectedly calling the duty toggle.

### Frontend: Add logging to duty toggle
```javascript
// In Driver Dashboard toggleDuty function
console.log('🔄 Frontend duty toggle clicked');
console.log('   Current status:', isOnDuty);
console.log('   New status:', !isOnDuty);
```

## Next Steps

1. Run diagnostic steps above
2. Check which specific issue matches your symptoms
3. Apply corresponding solution
4. Verify with test flow

## Need More Help?

If issue persists, provide:
1. Database value of `isOnDuty` after closing browser
2. Login API response (network tab)
3. Console logs from verification script
4. Backend logs showing duty toggle calls
