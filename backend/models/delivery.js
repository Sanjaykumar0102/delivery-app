const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema(
  {
    pickupLocation: { type: String, required: true },
    dropLocation: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "On Route", "Delivered"],
      default: "Pending",
    },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Delivery", deliverySchema);
