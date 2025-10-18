const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema(
  {
    delivery: { type: mongoose.Schema.Types.ObjectId, ref: "Delivery" },
    assignedAt: { type: Date, required: true },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Route", routeSchema);
