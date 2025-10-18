// Test script to check notification system
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require("./models/user");

async function testNotificationSystem() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Get all drivers
    const allDrivers = await User.find({ role: "Driver" });
    console.log("\n📊 ALL DRIVERS:");
    console.log("================");
    allDrivers.forEach((driver, index) => {
      console.log(`\n${index + 1}. ${driver.name} (${driver._id})`);
      console.log(`   Email: ${driver.email}`);
      console.log(`   Vehicle Type: ${driver.driverDetails?.vehicleType || 'NOT SET'}`);
      console.log(`   Is Approved: ${driver.isApproved}`);
      console.log(`   Approval Status: ${driver.approvalStatus}`);
      console.log(`   Is On Duty: ${driver.isOnDuty}`);
      console.log(`   Created: ${driver.createdAt}`);
    });

    // Get drivers that SHOULD receive notifications
    const eligibleDrivers = await User.find({ 
      role: "Driver", 
      isOnDuty: true,
      isApproved: true,
      approvalStatus: "Approved"
    });

    console.log("\n\n📢 ELIGIBLE DRIVERS (On Duty + Approved):");
    console.log("==========================================");
    if (eligibleDrivers.length === 0) {
      console.log("❌ NO ELIGIBLE DRIVERS FOUND!");
      console.log("\nReasons why drivers might not be eligible:");
      console.log("1. Not approved (isApproved = false)");
      console.log("2. Approval status not 'Approved'");
      console.log("3. Not on duty (isOnDuty = false)");
    } else {
      eligibleDrivers.forEach((driver, index) => {
        console.log(`\n${index + 1}. ${driver.name} (${driver._id})`);
        console.log(`   Vehicle Type: ${driver.driverDetails?.vehicleType || 'NOT SET'}`);
        console.log(`   ✅ Ready to receive notifications`);
      });
    }

    // Check for specific vehicle types
    console.log("\n\n🚗 DRIVERS BY VEHICLE TYPE:");
    console.log("============================");
    const vehicleTypes = ['Bike', 'Car', 'Van', 'Truck'];
    for (const vType of vehicleTypes) {
      const drivers = await User.find({
        role: "Driver",
        "driverDetails.vehicleType": vType
      });
      console.log(`${vType}: ${drivers.length} driver(s)`);
      drivers.forEach(d => {
        console.log(`  - ${d.name} (Approved: ${d.isApproved}, On Duty: ${d.isOnDuty})`);
      });
    }

    await mongoose.connection.close();
    console.log("\n✅ Test completed");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

testNotificationSystem();