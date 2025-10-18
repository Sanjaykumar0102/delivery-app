const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    plateNumber: { type: String, required: true, unique: true },
    type: { 
      type: String, 
      required: true,
      enum: ["Bike", "Auto", "Mini Truck", "Large Truck"]
    },
    capacity: { type: Number, required: true },
    model: { type: String },
    year: { type: Number },
    color: { type: String },
    insuranceExpiry: { type: Date },
    rcDocument: { type: String },
    insuranceDocument: { type: String },
    vehiclePhoto: { type: String },
    isApproved: {
      type: Boolean,
      default: false,
    },
    approvalStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    owner: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    } // 👈 who added it
  },
  { timestamps: true }
);

const Vehicle = mongoose.model("Vehicle", vehicleSchema);
module.exports = Vehicle;
