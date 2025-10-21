// Script to update driver123 with phone number and ensure vehicle is properly linked
const mongoose = require("mongoose");
const User = require("./models/user");
const Vehicle = require("./models/vehicle");
require("dotenv").config();

const updateDriver123 = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Find driver123
    const driver = await User.findOne({ name: "driver123", role: "Driver" });
    
    if (!driver) {
      console.log("❌ driver123 not found");
      process.exit(1);
    }

    console.log("\n📋 Current driver123 data:");
    console.log("   Name:", driver.name);
    console.log("   Email:", driver.email);
    console.log("   Phone:", driver.phone);
    console.log("   Vehicle Assigned:", driver.vehicleAssigned);
    console.log("   Driver Details:", driver.driverDetails);

    // Update phone if not set
    if (!driver.phone) {
      driver.phone = "+919876543210"; // Sample phone number
      console.log("\n📱 Adding phone number:", driver.phone);
    }

    // Check if vehicle is assigned
    if (driver.vehicleAssigned) {
      const vehicle = await Vehicle.findById(driver.vehicleAssigned);
      console.log("\n🚗 Assigned Vehicle:");
      console.log("   Type:", vehicle?.type);
      console.log("   Plate:", vehicle?.plateNumber);
      console.log("   Model:", vehicle?.model);
      console.log("   Year:", vehicle?.year);
      console.log("   Color:", vehicle?.color);
    } else {
      console.log("\n⚠️ No vehicle assigned to driver123");
      
      // Try to find or create a vehicle
      let vehicle = await Vehicle.findOne({ 
        $or: [
          { plateNumber: driver.driverDetails?.vehicleNumber },
          { type: driver.driverDetails?.vehicleType }
        ]
      });

      if (!vehicle && driver.driverDetails?.vehicleType) {
        // Create a new vehicle from driverDetails
        vehicle = await Vehicle.create({
          type: driver.driverDetails.vehicleType,
          plateNumber: driver.driverDetails.vehicleNumber || "MH01AB1234",
          model: driver.driverDetails.vehicleModel || "Honda Activa",
          year: driver.driverDetails.vehicleYear || 2022,
          color: "Black",
          capacity: driver.driverDetails.vehicleType === "Bike" ? "20kg" : "50kg",
          isActive: true
        });
        console.log("\n✅ Created new vehicle:", vehicle._id);
      }

      if (vehicle) {
        driver.vehicleAssigned = vehicle._id;
        console.log("\n✅ Assigned vehicle to driver:", vehicle._id);
      }
    }

    // Save the driver
    await driver.save();
    console.log("\n✅ driver123 updated successfully!");

    // Verify the update
    const updatedDriver = await User.findById(driver._id).populate("vehicleAssigned");
    console.log("\n📋 Updated driver123 data:");
    console.log("   Phone:", updatedDriver.phone);
    console.log("   Vehicle:", updatedDriver.vehicleAssigned);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

updateDriver123();
