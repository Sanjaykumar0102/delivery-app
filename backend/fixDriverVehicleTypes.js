// Script to fix driver vehicle types
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const readline = require("readline");

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require("./models/user");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function fixDriverVehicleTypes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Get all drivers without vehicle type or with incorrect vehicle type
    const drivers = await User.find({ role: "Driver" });
    
    console.log("📋 DRIVERS FOUND:");
    console.log("==================\n");
    
    const validVehicleTypes = ["Bike", "Auto", "Mini Truck", "Large Truck"];
    
    for (let i = 0; i < drivers.length; i++) {
      const driver = drivers[i];
      const currentVehicleType = driver.driverDetails?.vehicleType;
      
      console.log(`${i + 1}. ${driver.name} (${driver.email})`);
      console.log(`   Current Vehicle Type: ${currentVehicleType || 'NOT SET'}`);
      console.log(`   Is Approved: ${driver.isApproved}`);
      console.log(`   Is On Duty: ${driver.isOnDuty}`);
      
      if (!currentVehicleType || !validVehicleTypes.includes(currentVehicleType)) {
        console.log(`   ⚠️  NEEDS UPDATE!\n`);
        console.log(`   Valid vehicle types:`);
        validVehicleTypes.forEach((type, index) => {
          console.log(`   ${index + 1}. ${type}`);
        });
        
        const choice = await question(`   Enter number (1-4) to set vehicle type for ${driver.name}, or 's' to skip: `);
        
        if (choice.toLowerCase() === 's') {
          console.log(`   ⏭️  Skipped\n`);
          continue;
        }
        
        const choiceNum = parseInt(choice);
        if (choiceNum >= 1 && choiceNum <= 4) {
          const newVehicleType = validVehicleTypes[choiceNum - 1];
          
          // Update driver
          if (!driver.driverDetails) {
            driver.driverDetails = {};
          }
          driver.driverDetails.vehicleType = newVehicleType;
          await driver.save();
          
          console.log(`   ✅ Updated ${driver.name} to ${newVehicleType}\n`);
        } else {
          console.log(`   ❌ Invalid choice, skipping\n`);
        }
      } else {
        console.log(`   ✅ Vehicle type is valid\n`);
      }
    }
    
    console.log("\n✅ All drivers processed!");
    
    // Show summary
    const updatedDrivers = await User.find({ role: "Driver" });
    console.log("\n📊 FINAL SUMMARY:");
    console.log("==================");
    updatedDrivers.forEach(driver => {
      console.log(`${driver.name}: ${driver.driverDetails?.vehicleType || 'NOT SET'} (On Duty: ${driver.isOnDuty}, Approved: ${driver.isApproved})`);
    });
    
    rl.close();
    await mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error:", error.message);
    rl.close();
    process.exit(1);
  }
}

fixDriverVehicleTypes();