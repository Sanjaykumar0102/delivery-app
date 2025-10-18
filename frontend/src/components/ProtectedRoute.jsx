import { Navigate } from "react-router-dom";
import Cookies from "js-cookie";

const ProtectedRoute = ({ children, allowedRoles }) => {
  // Check if user is authenticated
  const token = Cookies.get("token");
  const userCookie = Cookies.get("user");

  if (!token || !userCookie) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userCookie);

    // Check if user has the required role
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect to appropriate dashboard based on role
      if (user.role === "Admin") {
        return <Navigate to="/dashboard/admin" replace />;
      } else if (user.role === "Driver") {
        return <Navigate to="/dashboard/driver" replace />;
      } else if (user.role === "Customer") {
        return <Navigate to="/dashboard/customer" replace />;
      }
      return <Navigate to="/login" replace />;
    }

    // User is authenticated and has correct role
    return children;
  } catch (error) {
    console.error("Error validating session:", error);
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;
