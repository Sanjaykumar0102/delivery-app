// backend/middleware/roleMiddleware.js
const roleCheck = (...allowedRoles) => {
  return (req, res, next) => {
    console.log("👉 roleCheck called with roles:", allowedRoles);
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    }

    next();
  };
};

// console.log("✅ roleMiddleware loaded, exporting roleCheck function");

module.exports = roleCheck;
