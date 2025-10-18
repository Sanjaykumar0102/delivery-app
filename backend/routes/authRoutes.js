// routes/authRoutes.js
import express from "express";
import { registerUser, loginUser, getMe } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser); // public (you may restrict later)
router.post("/login", loginUser);       // public
router.get("/me", protect, getMe);      // protected

export default router;
