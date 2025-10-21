// Fix existing orders to add vehicle reference
const mongoose = require("mongoose");
const Order = require("./models/order");
const User = require("./models/user");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log("✅ Connected to MongoDB");
  
  // Find all orders that have a driver but no vehicle
  const ordersWithoutVehicle = await Order.find({
    driver: { $exists: true, $ne: null },
    vehicle: { $exists: false }
  }).populate("driver");
  
  console.log(`\n📦 Found ${ordersWithoutVehicle.length} orders without vehicle\n`);
  
  for (const order of ordersWithoutVehicle) {
    console.log(`Fixing Order ${order._id}:`);
    console.log(`   Driver: ${order.driver?.name}`);
    console.log(`   Driver's vehicle: ${order.driver?.vehicleAssigned}`);
    
    if (order.driver && order.driver.vehicleAssigned) {
      order.vehicle = order.driver.vehicleAssigned;
      await order.save();
      console.log(`   ✅ Updated with vehicle: ${order.vehicle}`);
    } else {
      console.log(`   ⚠️ Driver has no vehicle assigned`);
    }
    console.log("");
  }
  
  console.log("✅ All orders fixed!");
  process.exit(0);
}).catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
