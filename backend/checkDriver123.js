// Check driver123@gmail.com status
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const User = require("./models/user");

async function checkDriver() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    const driver = await User.findOne({ email: "driver123@gmail.com" });

    if (!driver) {
      console.log("❌ Driver not found with email: driver123@gmail.com");
      process.exit(0);
    }

    console.log("=".repeat(60));
    console.log("📋 DRIVER DETAILS");
    console.log("=".repeat(60));
    console.log("Name:", driver.name);
    console.log("Email:", driver.email);
    console.log("Role:", driver.role);
    console.log("User ID:", driver._id.toString());
    console.log("\n" + "=".repeat(60));
    console.log("🚗 VEHICLE & APPROVAL STATUS");
    console.log("=".repeat(60));
    console.log("Vehicle Type:", driver.driverDetails?.vehicleType || "❌ NOT SET");
    console.log("Is Approved:", driver.isApproved ? "✅ Yes" : "❌ No");
    console.log("Approval Status:", driver.approvalStatus || "Not set");
    console.log("Is On Duty:", driver.isOnDuty ? "✅ Yes" : "❌ No");
    
    console.log("\n" + "=".repeat(60));
    console.log("🔍 NOTIFICATION ELIGIBILITY CHECK");
    console.log("=".repeat(60));
    
    const checks = {
      "Role is Driver": driver.role === "Driver",
      "Is Approved": driver.isApproved === true,
      "Approval Status is 'Approved'": driver.approvalStatus === "Approved",
      "Is On Duty": driver.isOnDuty === true,
      "Has Vehicle Type": !!driver.driverDetails?.vehicleType,
      "Vehicle Type is valid": ["Bike", "Auto", "Mini Truck", "Large Truck"].includes(driver.driverDetails?.vehicleType)
    };
    
    let allPassed = true;
    for (const [check, passed] of Object.entries(checks)) {
      console.log(`${passed ? "✅" : "❌"} ${check}`);
      if (!passed) allPassed = false;
    }
    
    console.log("\n" + "=".repeat(60));
    if (allPassed) {
      console.log("✅ DRIVER IS ELIGIBLE FOR NOTIFICATIONS");
      console.log("=".repeat(60));
      console.log("\n📝 NEXT STEPS:");
      console.log("1. Login as driver123@gmail.com");
      console.log("2. Ensure ON DUTY toggle is enabled");
      console.log("3. Check browser console for socket connection");
      console.log("4. Create an order with vehicle type: " + driver.driverDetails.vehicleType);
      console.log("5. Check backend console for notification logs");
    } else {
      console.log("❌ DRIVER IS NOT ELIGIBLE FOR NOTIFICATIONS");
      console.log("=".repeat(60));
      console.log("\n🔧 FIXES NEEDED:");
      
      if (!checks["Is Approved"] || !checks["Approval Status is 'Approved'"]) {
        console.log("- Admin needs to approve this driver");
      }
      if (!checks["Has Vehicle Type"] || !checks["Vehicle Type is valid"]) {
        console.log("- Vehicle type needs to be set to: Bike, Auto, Mini Truck, or Large Truck");
      }
      if (!checks["Is On Duty"]) {
        console.log("- Driver needs to turn ON DUTY in the dashboard");
      }
    }
    
    console.log("\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

checkDriver();