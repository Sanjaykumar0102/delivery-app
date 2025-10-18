// Session Manager - Handles multi-tab authentication
import Cookies from "js-cookie";

// Generate unique tab ID
const generateTabId = () => {
  return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get or create tab ID
const getTabId = () => {
  let tabId = sessionStorage.getItem('tabId');
  if (!tabId) {
    tabId = generateTabId();
    sessionStorage.setItem('tabId', tabId);
  }
  return tabId;
};

// Store user session for this specific tab
export const setTabSession = (user, token) => {
  const tabId = getTabId();
  
  // Store in sessionStorage (tab-specific)
  sessionStorage.setItem('user', JSON.stringify(user));
  sessionStorage.setItem('token', token);
  sessionStorage.setItem('tabId', tabId);
  
  // Also store in cookies for API requests (will be shared across tabs)
  Cookies.set("token", token, { expires: 1 });
  Cookies.set("user", JSON.stringify(user), { expires: 1 });
  
  // Store tab-to-user mapping in localStorage
  const tabSessions = JSON.parse(localStorage.getItem('tabSessions') || '{}');
  tabSessions[tabId] = {
    userId: user._id,
    role: user.role,
    name: user.name,
    timestamp: Date.now()
  };
  localStorage.setItem('tabSessions', JSON.stringify(tabSessions));
};

// Get user session for this specific tab
export const getTabSession = () => {
  const tabId = getTabId();
  
  // First try to get from sessionStorage (tab-specific)
  const sessionUser = sessionStorage.getItem('user');
  const sessionToken = sessionStorage.getItem('token');
  
  if (sessionUser && sessionToken && sessionUser !== 'undefined') {
    try {
      return {
        user: JSON.parse(sessionUser),
        token: sessionToken,
        tabId
      };
    } catch (error) {
      console.error('Error parsing session user:', error);
    }
  }
  
  // Fallback to cookies if sessionStorage is empty
  const cookieUser = Cookies.get("user");
  const cookieToken = Cookies.get("token");
  
  if (cookieUser && cookieToken && cookieUser !== 'undefined') {
    try {
      const user = JSON.parse(cookieUser);
      // Store in sessionStorage for this tab
      sessionStorage.setItem('user', cookieUser);
      sessionStorage.setItem('token', cookieToken);
      return {
        user,
        token: cookieToken,
        tabId
      };
    } catch (error) {
      console.error('Error parsing cookie user:', error);
    }
  }
  
  return null;
};

// Clear session for this tab
export const clearTabSession = () => {
  const tabId = getTabId();
  
  // Clear sessionStorage
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('token');
  
  // Remove from tab sessions mapping
  const tabSessions = JSON.parse(localStorage.getItem('tabSessions') || '{}');
  delete tabSessions[tabId];
  localStorage.setItem('tabSessions', JSON.stringify(tabSessions));
  
  // Only clear cookies if this is the last tab
  const remainingTabs = Object.keys(tabSessions);
  if (remainingTabs.length === 0) {
    Cookies.remove("token");
    Cookies.remove("user");
  }
};

// Check if user session is valid for this tab
export const isSessionValid = () => {
  const tabSession = getTabSession();
  if (!tabSession) return false;
  
  // Check if sessionStorage has valid user data
  const sessionUser = sessionStorage.getItem('user');
  const sessionToken = sessionStorage.getItem('token');
  
  if (!sessionUser || !sessionToken || sessionUser === 'undefined') {
    return false;
  }
  
  // Session is valid if sessionStorage has data
  return true;
};

// Listen for storage changes (when another tab logs in/out)
export const setupStorageListener = (onSessionChange) => {
  const handleStorageChange = (e) => {
    // Ignore changes from this tab
    if (e.key === 'tabSessions' && e.newValue !== e.oldValue) {
      // Another tab changed sessions, check if our session is still valid
      const isValid = isSessionValid();
      if (!isValid) {
        onSessionChange();
      }
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
};

// Clean up old/stale tab sessions (call on app load)
export const cleanupStaleSessions = () => {
  const tabSessions = JSON.parse(localStorage.getItem('tabSessions') || '{}');
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  let hasChanges = false;
  Object.keys(tabSessions).forEach(tabId => {
    const session = tabSessions[tabId];
    if (now - session.timestamp > maxAge) {
      delete tabSessions[tabId];
      hasChanges = true;
    }
  });
  
  if (hasChanges) {
    localStorage.setItem('tabSessions', JSON.stringify(tabSessions));
  }
};

// Get all active tab sessions
export const getAllTabSessions = () => {
  return JSON.parse(localStorage.getItem('tabSessions') || '{}');
};
