# Admin Portal - "Failed to Load Admins" Fix

## 🎯 Issue: Failed to Load Admins

### **Root Cause:**

Same issue as the duty toggle - the axios interceptor was reading tokens from cookies instead of sessionStorage. When you have multiple tabs open:

```
Tab 1: Admin logged in
├─ sessionStorage: { token: "adminToken", user: { role: "Admin" } }
└─ Cookies: { token: "adminToken" }

Tab 2: Driver logs in
├─ sessionStorage: { token: "driverToken", user: { role: "Driver" } }
└─ Cookies: { token: "driverToken" } (OVERWRITES admin's cookie)

Tab 1: Admin tries to load admins
├─ OLD: Reads token from cookies → Gets "driverToken"
├─ Backend: Decodes driverToken → req.user.role = "Driver"
├─ Check: req.user.role !== 'Admin' → FAIL
└─ Error: "Not authorized - Admin only" ❌
```

### **Solution:**

The fix has already been applied in `axios.js`:

```javascript
// Try sessionStorage first (tab-specific)
let token = sessionStorage.getItem("token");
if (!token) {
  token = Cookies.get("token");
}
```

Now each tab uses its own token from sessionStorage.

## ✅ How to Fix

### **Step 1: Refresh the Admin Dashboard**

The axios.js file has been updated, but the browser is still using the old cached version. You need to:

1. **Hard refresh** the admin dashboard page:
   - Windows: `Ctrl + Shift + R` or `Ctrl + F5`
   - Mac: `Cmd + Shift + R`

2. Or **clear browser cache** and refresh normally

### **Step 2: Verify the Fix**

After refreshing, check the browser console. You should see:

```
✅ No errors
✅ Admins tab loads successfully
✅ All API calls use correct token
```

### **Step 3: Test All Tabs**

1. **Admin Dashboard** - Should load admins, customers, drivers
2. **Driver Dashboard** - Should toggle duty successfully
3. **Customer Dashboard** - Should create orders successfully

## 🔍 Diagnostic Steps

If the issue persists after refresh:

### **1. Check Browser Console**

Open DevTools (F12) → Console tab

Look for:
```
❌ 403 Forbidden - Not authorized
❌ Failed to load admins
```

### **2. Check Network Tab**

Open DevTools (F12) → Network tab

1. Click on the failed request to `/api/users/admins`
2. Check **Headers** → **Request Headers**
3. Look at `Authorization: Bearer <token>`
4. Copy the token and decode it at jwt.io
5. Check if the token's role is "Admin"

### **3. Check SessionStorage**

Open DevTools (F12) → Application tab → Session Storage

Should show:
```
token: <adminToken>
user: { role: "Admin", _id: "...", name: "..." }
tabId: tab_...
```

### **4. Check Axios Interceptor**

Add this to the browser console:
```javascript
console.log('SessionStorage token:', sessionStorage.getItem('token'));
console.log('Cookie token:', document.cookie);
```

The sessionStorage token should be the admin's token.

## 🛠️ Manual Fix (If Refresh Doesn't Work)

If hard refresh doesn't work, try this:

### **Option 1: Clear All Storage**

1. Open DevTools (F12)
2. Application tab → Clear storage
3. Click "Clear site data"
4. Close all tabs
5. Open new tab and login as admin

### **Option 2: Logout and Login Again**

1. Click logout in admin dashboard
2. Close all tabs
3. Open new tab
4. Login as admin
5. Try loading admins tab

### **Option 3: Restart Browser**

1. Close all browser windows
2. Reopen browser
3. Login as admin
4. Try loading admins tab

## 📋 Backend Code (Already Correct)

The backend code is correct:

```javascript
// userController.js
const getAllAdmins = asyncHandler(async (req, res) => {
  if (req.user.role !== 'Admin') {
    res.status(403);
    throw new Error('Not authorized - Admin only');
  }

  const admins = await User.find({ role: 'Admin' })
    .select('-password')
    .sort({ createdAt: -1 });
  res.json(admins);
});
```

The issue is purely on the frontend - the axios interceptor needs to use the updated code.

## ✨ Expected Result After Fix

### **Admin Dashboard Should Show:**

1. ✅ **Dashboard Tab** - All stats load correctly
2. ✅ **Drivers Tab** - All drivers listed
3. ✅ **Customers Tab** - All customers listed
4. ✅ **Admins Tab** - All admins listed (NO ERROR)
5. ✅ **Orders Tab** - All orders listed
6. ✅ **Approvals Tab** - Pending drivers listed

### **All Tabs Should Work:**

```
Tab 1 (Admin):
├─ Uses adminToken from sessionStorage
├─ All API calls authorized as Admin
└─ All tabs load successfully ✅

Tab 2 (Driver):
├─ Uses driverToken from sessionStorage
├─ All API calls authorized as Driver
└─ Duty toggle works ✅

Tab 3 (Customer):
├─ Uses customerToken from sessionStorage
├─ All API calls authorized as Customer
└─ Order creation works ✅
```

## 🎉 Summary

The fix has been applied to `axios.js`. You just need to:

1. **Hard refresh** the admin dashboard (`Ctrl + Shift + R`)
2. **Try loading the Admins tab** again
3. **Should work without errors** ✅

If it still doesn't work after refresh, try clearing browser cache or logging out and back in.

---

## 🔧 Technical Details

### **What Changed:**

**File:** `frontend/src/utils/axios.js`

**Before:**
```javascript
const token = Cookies.get("token");  // ❌ Shared across tabs
```

**After:**
```javascript
let token = sessionStorage.getItem("token");  // ✅ Tab-specific
if (!token) {
  token = Cookies.get("token");  // Fallback
}
```

### **Impact:**

- ✅ Each tab uses its own token
- ✅ Admin API calls use admin token
- ✅ Driver API calls use driver token
- ✅ No cross-tab interference
- ✅ All protected routes work correctly

The same fix resolves:
- ❌ "Only drivers can toggle duty status"
- ❌ "Failed to load admins"
- ❌ "Not authorized - Admin only"
- ❌ Any other 403 Forbidden errors in multi-tab scenarios
