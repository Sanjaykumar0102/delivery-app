// Check if driver123 actually has phone in database
const mongoose = require("mongoose");
const User = require("./models/user");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log("✅ Connected");
  
  const driver = await User.findOne({ name: "driver123", role: "Driver" });
  
  if (driver) {
    console.log("\n📱 Driver123 Phone Field:");
    console.log("   phone:", driver.phone);
    console.log("   phone type:", typeof driver.phone);
    console.log("   phone exists:", !!driver.phone);
    console.log("\n🚗 Vehicle Assigned:", driver.vehicleAssigned);
    console.log("\n📄 Full driver object:");
    console.log(JSON.stringify(driver, null, 2));
  } else {
    console.log("❌ driver123 not found");
  }
  
  process.exit(0);
}).catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
