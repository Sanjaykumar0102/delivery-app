// Check driver123 real-time status
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
      console.log("❌ Driver not found");
      process.exit(0);
    }

    console.log("=".repeat(70));
    console.log("📊 REAL-TIME STATUS CHECK");
    console.log("=".repeat(70));
    console.log("Name:", driver.name);
    console.log("Email:", driver.email);
    console.log("User ID:", driver._id.toString());
    console.log("\n🔍 CRITICAL FIELDS:");
    console.log("  isOnDuty:", driver.isOnDuty ? "✅ TRUE" : "❌ FALSE");
    console.log("  isApproved:", driver.isApproved ? "✅ TRUE" : "❌ FALSE");
    console.log("  approvalStatus:", driver.approvalStatus);
    console.log("  vehicleType:", driver.driverDetails?.vehicleType || "NOT SET");
    console.log("  role:", driver.role);
    
    console.log("\n" + "=".repeat(70));
    console.log("🔍 DATABASE QUERY TEST");
    console.log("=".repeat(70));
    
    // Test the exact query used in orderController
    const matchingDrivers = await User.find({ 
      role: "Driver", 
      isOnDuty: true,
      isApproved: true,
      approvalStatus: "Approved",
      "driverDetails.vehicleType": "Auto"
    });
    
    console.log(`\nQuery: Find drivers with:`);
    console.log(`  - role: "Driver"`);
    console.log(`  - isOnDuty: true`);
    console.log(`  - isApproved: true`);
    console.log(`  - approvalStatus: "Approved"`);
    console.log(`  - vehicleType: "Auto"`);
    console.log(`\nResult: Found ${matchingDrivers.length} driver(s)`);
    
    if (matchingDrivers.length > 0) {
      console.log("\n✅ Matching drivers:");
      matchingDrivers.forEach(d => {
        console.log(`  - ${d.name} (${d.email})`);
      });
    } else {
      console.log("\n❌ NO MATCHING DRIVERS FOUND");
      console.log("\n🔧 DIAGNOSIS:");
      
      if (!driver.isOnDuty) {
        console.log("  ❌ isOnDuty is FALSE in database");
        console.log("     → The duty toggle might not be saving to database");
        console.log("     → Check the /api/users/duty endpoint");
      }
      
      if (!driver.isApproved) {
        console.log("  ❌ isApproved is FALSE");
      }
      
      if (driver.approvalStatus !== "Approved") {
        console.log("  ❌ approvalStatus is not 'Approved'");
      }
      
      if (!driver.driverDetails?.vehicleType) {
        console.log("  ❌ vehicleType is not set");
      } else if (driver.driverDetails.vehicleType !== "Auto") {
        console.log(`  ❌ vehicleType is '${driver.driverDetails.vehicleType}', not 'Auto'`);
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