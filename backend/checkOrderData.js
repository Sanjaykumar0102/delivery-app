// Check the actual order document to see if driver and vehicle are saved
const mongoose = require("mongoose");
const Order = require("./models/order");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log("✅ Connected");
  
  // Find orders for customer
  const orders = await Order.find({ status: { $in: ["Accepted", "Assigned", "Arrived", "Picked-Up", "In-Transit"] } })
    .limit(5)
    .sort({ createdAt: -1 });
  
  console.log(`\n📦 Found ${orders.length} active orders\n`);
  
  orders.forEach((order, idx) => {
    console.log(`Order ${idx + 1}:`);
    console.log(`   _id: ${order._id}`);
    console.log(`   status: ${order.status}`);
    console.log(`   driver (ref): ${order.driver}`);
    console.log(`   vehicle (ref): ${order.vehicle}`);
    console.log(`   customer: ${order.customer}`);
    console.log("");
  });
  
  process.exit(0);
}).catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
