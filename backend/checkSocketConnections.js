// Script to check current socket connections
// This helps debug if drivers are actually connected

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require("./models/user");

async function checkConnections() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Get all drivers who should be receiving notifications
    const eligibleDrivers = await User.find({ 
      role: "Driver", 
      isOnDuty: true,
      isApproved: true,
      approvalStatus: "Approved"
    });

    console.log("📊 DRIVERS ELIGIBLE FOR NOTIFICATIONS:");
    console.log("======================================\n");

    if (eligibleDrivers.length === 0) {
      console.log("❌ NO ELIGIBLE DRIVERS FOUND!");
      console.log("\nTo receive notifications, a driver must:");
      console.log("  1. Be approved (isApproved = true)");
      console.log("  2. Have approval status = 'Approved'");
      console.log("  3. Be on duty (isOnDuty = true)");
      console.log("  4. Have a valid vehicle type");
      console.log("  5. Be connected via socket (logged into dashboard)");
    } else {
      eligibleDrivers.forEach((driver, index) => {
        console.log(`${index + 1}. ${driver.name}`);
        console.log(`   Email: ${driver.email}`);
        console.log(`   ID: ${driver._id}`);
        console.log(`   Vehicle Type: ${driver.driverDetails?.vehicleType || 'NOT SET'}`);
        console.log(`   On Duty: ✅ Yes`);
        console.log(`   Approved: ✅ Yes`);
        console.log(`   Status: Ready to receive notifications`);
        console.log(`   Note: Must be logged into dashboard for socket connection\n`);
      });

      console.log("\n📋 TESTING INSTRUCTIONS:");
      console.log("========================");
      console.log("1. Login as one of the drivers above");
      console.log("2. Ensure the duty toggle is ON (green)");
      console.log("3. Keep the dashboard open");
      console.log("4. Open browser console (F12)");
      console.log("5. Look for: '✅ Socket connected: [socket-id]'");
      console.log("6. Create an order with matching vehicle type");
      console.log("7. Driver should receive notification\n");

      console.log("🔍 BACKEND LOGS TO WATCH:");
      console.log("=========================");
      console.log("When driver logs in:");
      console.log("  → '👤 Driver registered: [driver-id] (Socket ID: [socket-id])'");
      console.log("  → '🚗 Driver added to connectedDrivers map'");
      console.log("\nWhen order is created:");
      console.log("  → '📢 Found X drivers with [vehicle-type] vehicle type'");
      console.log("  → '✅ Notified driver [name] ([vehicle-type]) via socket [socket-id]'\n");

      console.log("🎯 VEHICLE TYPE MATCHING:");
      console.log("=========================");
      const vehicleTypes = ["Bike", "Auto", "Mini Truck", "Large Truck"];
      for (const vType of vehicleTypes) {
        const count = eligibleDrivers.filter(d => d.driverDetails?.vehicleType === vType).length;
        if (count > 0) {
          console.log(`${vType}: ${count} driver(s) on duty`);
          const drivers = eligibleDrivers.filter(d => d.driverDetails?.vehicleType === vType);
          drivers.forEach(d => console.log(`  - ${d.name}`));
        }
      }
    }

    await mongoose.connection.close();
    console.log("\n✅ Check completed");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

checkConnections();