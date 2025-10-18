import express from "express";
import Booking from "../models/booking.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const booking = new Booking(req.body);
    await booking.save();
    res.json({ message: "Booking successful", booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
