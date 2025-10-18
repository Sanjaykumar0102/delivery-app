// Auto-fix script to set vehicle types for drivers
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require("./models/user");

async function autoFixDrivers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Get all drivers
    const drivers = await User.find({ role: "Driver" });
    
    console.log("📋 FIXING DRIVERS:");
    console.log("==================\n");
    
    const validVehicleTypes = ["Bike", "Auto", "Mini Truck", "Large Truck"];
    let fixedCount = 0;
    
    for (const driver of drivers) {
      const currentVehicleType = driver.driverDetails?.vehicleType;
      
      // If no vehicle type or invalid, set to "Bike" as default
      if (!currentVehicleType || !validVehicleTypes.includes(currentVehicleType)) {
        console.log(`Fixing ${driver.name} (${driver.email})`);
        console.log(`  Current: ${currentVehicleType || 'NOT SET'}`);
        
        // Initialize driverDetails if not exists
        if (!driver.driverDetails) {
          driver.driverDetails = {};
        }
        
        // Set to Bike as default (you can change this)
        driver.driverDetails.vehicleType = "Bike";
        await driver.save();
        
        console.log(`  ✅ Set to: Bike\n`);
        fixedCount++;
      } else {
        console.log(`✓ ${driver.name}: ${currentVehicleType} (OK)\n`);
      }
    }
    
    console.log(`\n✅ Fixed ${fixedCount} driver(s)`);
    
    // Show final summary
    console.log("\n📊 FINAL DRIVER STATUS:");
    console.log("========================");
    const updatedDrivers = await User.find({ role: "Driver" });
    
    for (const vType of validVehicleTypes) {
      const count = updatedDrivers.filter(d => d.driverDetails?.vehicleType === vType).length;
      console.log(`${vType}: ${count} driver(s)`);
      
      const driversOfType = updatedDrivers.filter(d => d.driverDetails?.vehicleType === vType);
      driversOfType.forEach(d => {
        console.log(`  - ${d.name} (On Duty: ${d.isOnDuty}, Approved: ${d.isApproved})`);
      });
    }
    
    const noVehicleType = updatedDrivers.filter(d => !d.driverDetails?.vehicleType).length;
    if (noVehicleType > 0) {
      console.log(`\n⚠️  ${noVehicleType} driver(s) still have no vehicle type!`);
    }
    
    await mongoose.connection.close();
    console.log("\n✅ Done!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

autoFixDrivers();