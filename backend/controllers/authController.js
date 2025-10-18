// controllers/authController.js
import User from "../models/user.js";
import jwt from "jsonwebtoken";

/** Generate JWT */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

/** Register new user */
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, driverDetails } = req.body;
    if (!name || !email || !password) {
      res.status(400);
      throw new Error("Name, email and password are required");
    }

    const exists = await User.findOne({ email });
    if (exists) {
      res.status(400);
      throw new Error("User already exists with that email");
    }

    // Prepare user data
    const userData = { 
      name, 
      email, 
      password, 
      role: role || "Customer",
      phone 
    };

    // If driver registration, set approval status to Pending
    if (role === "Driver") {
      userData.isApproved = false;
      userData.approvalStatus = "Pending";
      userData.driverDetails = driverDetails;
    }

    const user = await User.create(userData);

    const token = generateToken(user._id);

    // ✅ set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // true only for https
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      approvalStatus: user.approvalStatus,
    });
  } catch (err) {
    next(err);
  }
};

/** Login user */
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400);
      throw new Error("Email and password are required");
    }

    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id);

      // ✅ set token cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: false, // change to true in production
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        approvalStatus: user.approvalStatus,
        isActive: user.isActive,
        isOnDuty: user.isOnDuty,
        driverDetails: user.driverDetails,
        earnings: user.earnings,
        stats: user.stats
      });
    } else {
      res.status(401);
      throw new Error("Invalid email or password");
    }
  } catch (err) {
    next(err);
  }
};

/** Get current user (protected) */
export const getMe = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    next(err);
  }
};
