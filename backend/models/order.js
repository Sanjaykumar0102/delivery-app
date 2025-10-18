const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
    },
    vehicleType: {
      type: String,
      enum: ["Bike", "Auto", "Mini Truck", "Large Truck"],
      required: true,
    },
    pickup: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String, required: true },
    },
    dropoff: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String, required: true },
    },
    items: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        weight: { type: Number }, // in kg
      },
    ],
    packageDetails: {
      totalWeight: { type: Number }, // in kg
      dimensions: {
        length: { type: Number }, // in cm
        width: { type: Number },
        height: { type: Number },
      },
      fragile: { type: Boolean, default: false },
    },
    scheduledPickup: {
      type: Date,
    },
    distance: { type: Number },
    estimatedDuration: { type: Number }, // in minutes
    fare: { type: Number },
    status: {
      type: String,
      enum: ["Pending", "Assigned", "Accepted", "Arrived", "Picked-Up", "In-Transit", "Delivered", "Cancelled"],
      default: "Pending",
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Online", "Wallet"],
      default: "Cash",
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    pickupTime: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    acceptedAt: {
      type: Date,
    },
    tracking: {
      lat: { type: Number },
      lng: { type: Number },
      lastUpdated: { type: Date, default: Date.now },
    },
    driverEarnings: {
      type: Number,
    },
    platformFee: {
      type: Number,
    },
    customerRating: {
      rating: { type: Number, min: 1, max: 5 },
      review: { type: String },
    },
    driverRating: {
      rating: { type: Number, min: 1, max: 5 },
      review: { type: String },
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
