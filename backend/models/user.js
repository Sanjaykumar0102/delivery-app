// backend/models/userModel.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true 
    },
    email: { 
      type: String, 
      required: true, 
      unique: true 
    },
    password: { 
      type: String, 
      required: true 
    },
    phone: {
      type: String,
    },
    role: {
      type: String,
      enum: ["Admin", "Driver", "Customer"],
      default: "Customer", // default role
    },
    // Driver-specific fields
    isApproved: {
      type: Boolean,
      default: true, // Auto-approve for Customer/Admin, false for Driver
    },
    approvalStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Approved", // Default for Customer/Admin
    },
    rejectionReason: {
      type: String,
    },
    isOnDuty: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true, // Admin can deactivate drivers or block customers
    },
    deactivatedAt: {
      type: Date,
    },
    deactivationReason: {
      type: String,
    },
    currentLocation: {
      lat: { type: Number },
      lng: { type: Number },
      lastUpdated: { type: Date },
    },
    vehicleAssigned: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
    },
    earnings: {
      today: { type: Number, default: 0 },
      thisWeek: { type: Number, default: 0 },
      thisMonth: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    stats: {
      // Driver stats
      totalDeliveries: { type: Number, default: 0 },
      completedDeliveries: { type: Number, default: 0 },
      cancelledDeliveries: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 },
      totalRatings: { type: Number, default: 0 },
      // Customer stats
      totalOrders: { type: Number, default: 0 },
      completedOrders: { type: Number, default: 0 },
      cancelledOrders: { type: Number, default: 0 },
      totalSpent: { type: Number, default: 0 },
    },
    // Driver Documents & Vehicle Details
    driverDetails: {
      licenseNumber: { type: String },
      licenseExpiry: { type: Date },
      panNumber: { type: String },
      aadharNumber: { type: String },
      vehicleType: { type: String }, // Bike, Auto, Mini Truck, Large Truck
      vehicleNumber: { type: String },
      vehicleModel: { type: String },
      vehicleYear: { type: Number },
      insuranceExpiry: { type: Date },
      rcDocument: { type: String }, // URL or file path
      licenseDocument: { type: String },
      panDocument: { type: String },
      aadharDocument: { type: String },
      vehiclePhoto: { type: String },
      profilePhoto: { type: String },
    },
    documents: {
      license: { type: String },
      aadhar: { type: String },
      photo: { type: String },
      verified: { type: Boolean, default: false },
    },
    meta: {
        type:Object,
        default:{}
    }   
  },
  { timestamps: true }
);

// 🔒 Encrypt password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🔑 Match entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
