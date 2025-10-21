// Quick fix to ensure driver123 has phone and vehicle data
const mongoose = require("mongoose");
const User = require("./models/user");
const Vehicle = require("./models/vehicle");
require("dotenv").config();

const fixDriver123 = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Find driver123 by the ID from your screenshot
    const driverId = "68ef1f1465165008763a2478";
    const driver = await User.findById(driverId);
    
    if (!driver) {
      console.log("❌ Driver not found with ID:", driverId);
      
      // Try finding by name
      const driverByName = await User.findOne({ name: "driver123", role: "Driver" });
      if (driverByName) {
        console.log("✅ Found driver by name:", driverByName._id);
        await fixDriverData(driverByName);
      }
    } else {
      await fixDriverData(driver);
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

async function fixDriverData(driver) {
  console.log("\n📋 Current driver data:");
  console.log("   ID:", driver._id);
  console.log("   Name:", driver.name);
  console.log("   Email:", driver.email);
  console.log("   Phone:", driver.phone);
  console.log("   Vehicle Assigned:", driver.vehicleAssigned);
  console.log("   Driver Details:", driver.driverDetails);

  let updated = false;

  // Fix phone if missing
  if (!driver.phone) {
    driver.phone = "6301079941"; // From your database screenshot
    console.log("\n✅ Added phone:", driver.phone);
    updated = true;
  }

  // Fix vehicle if missing
  if (!driver.vehicleAssigned) {
    // Try to find the vehicle by ID from screenshot
    const vehicleId = "68d0a9fb0942b9a8ee21B455";
    let vehicle = await Vehicle.findById(vehicleId);
    
    if (!vehicle) {
      console.log("\n⚠️ Vehicle not found, searching for any Bike vehicle...");
      vehicle = await Vehicle.findOne({ type: "Bike" });
    }
    
    if (!vehicle) {
      console.log("\n⚠️ No vehicle found, creating one...");
      vehicle = await Vehicle.create({
        type: driver.driverDetails?.vehicleType || "Bike",
        plateNumber: driver.driverDetails?.vehicleNumber || "MH12AB1234",
        model: driver.driverDetails?.vehicleModel || "Honda Activa",
        year: driver.driverDetails?.vehicleYear || 2022,
        color: "Black",
        capacity: "20kg",
        isActive: true
      });
      console.log("✅ Created vehicle:", vehicle._id);
    }
    
    driver.vehicleAssigned = vehicle._id;
    console.log("✅ Assigned vehicle:", vehicle._id);
    updated = true;
  }

  if (updated) {
    await driver.save();
    console.log("\n✅ Driver updated successfully!");
  } else {
    console.log("\n✅ Driver already has all required data!");
  }

  // Verify the update
  const updatedDriver = await User.findById(driver._id).populate("vehicleAssigned");
  console.log("\n📋 Updated driver data:");
  console.log("   Phone:", updatedDriver.phone);
  console.log("   Vehicle:", updatedDriver.vehicleAssigned);
}

fixDriver123();
