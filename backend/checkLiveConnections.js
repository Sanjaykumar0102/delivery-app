// Real-time socket connection checker
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const User = require("./models/user");

async function checkConnections() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Get all eligible drivers
    const eligibleDrivers = await User.find({
      role: "Driver",
      isOnDuty: true,
      isApproved: true,
      approvalStatus: "Approved",
      "driverDetails.vehicleType": { $exists: true }
    }).select("name email driverDetails.vehicleType isOnDuty");

    console.log("=".repeat(70));
    console.log("📊 ELIGIBLE DRIVERS FOR NOTIFICATIONS");
    console.log("=".repeat(70));
    
    if (eligibleDrivers.length === 0) {
      console.log("❌ No eligible drivers found");
      console.log("\nDrivers must be:");
      console.log("  ✅ Approved");
      console.log("  ✅ On Duty");
      console.log("  ✅ Have a valid vehicle type");
    } else {
      eligibleDrivers.forEach((driver, index) => {
        console.log(`\n${index + 1}. ${driver.name} (${driver.email})`);
        console.log(`   User ID: ${driver._id.toString()}`);
        console.log(`   Vehicle Type: ${driver.driverDetails.vehicleType}`);
        console.log(`   On Duty: ${driver.isOnDuty ? "✅ Yes" : "❌ No"}`);
      });
      
      console.log("\n" + "=".repeat(70));
      console.log("📝 TESTING INSTRUCTIONS");
      console.log("=".repeat(70));
      console.log("\n1. Make sure the backend server is running (npm start)");
      console.log("2. Login as one of the drivers above");
      console.log("3. Open browser console (F12) and look for:");
      console.log("   ✅ Socket connected: <socket-id>");
      console.log("   📋 Driver details: { userId: '...', vehicleType: '...' }");
      console.log("\n4. Create an order with matching vehicle type:");
      
      const vehicleTypes = [...new Set(eligibleDrivers.map(d => d.driverDetails.vehicleType))];
      vehicleTypes.forEach(vt => {
        const driversWithType = eligibleDrivers.filter(d => d.driverDetails.vehicleType === vt);
        console.log(`   🚗 ${vt}: ${driversWithType.map(d => d.name).join(", ")}`);
      });
      
      console.log("\n5. Check backend console for:");
      console.log("   📢 Found X drivers with <vehicle-type> vehicle type");
      console.log("   ✅ Notified driver <name> (<vehicle-type>) via socket <socket-id>");
      
      console.log("\n6. Check driver's browser console for:");
      console.log("   🔔 RAW order notification received: { ... }");
      console.log("   ✅ SHOWING NOTIFICATION for order: ...");
      
      console.log("\n" + "=".repeat(70));
      console.log("🔍 TROUBLESHOOTING");
      console.log("=".repeat(70));
      console.log("\nIf driver doesn't receive notification:");
      console.log("  1. Check if socket is connected (browser console)");
      console.log("  2. Check if backend shows driver in connectedDrivers map");
      console.log("  3. Verify vehicle type matches exactly (case-sensitive)");
      console.log("  4. Ensure driver is on the HOME tab (not My Orders tab)");
      console.log("  5. Check if notification appears in HOME tab");
    }
    
    console.log("\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

checkConnections();