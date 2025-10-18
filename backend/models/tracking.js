const mongoose = require("mongoose");

const trackingSchema = new mongoose.Schema(
  {
    delivery: { type: mongoose.Schema.Types.ObjectId, ref: "Delivery" },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tracking", trackingSchema);
