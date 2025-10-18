// Convert one Large Truck to Auto
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Vehicle = require("./models/vehicle");

dotenv.config();

const convertTruckToAuto = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // Find all Large Trucks
    const largeTrucks = await Vehicle.find({ type: "Large Truck" });
    
    if (largeTrucks.length === 0) {
      console.log("❌ No Large Trucks found");
      mongoose.connection.close();
      return;
    }
    
    if (largeTrucks.length === 1) {
      console.log("⚠️  Only one Large Truck found - not converting");
      console.log("   If you want to convert it, run this script anyway");
      // Uncomment below to force conversion
      // const truck = largeTrucks[0];
    } else {
      console.log(`✅ Found ${largeTrucks.length} Large Trucks`);
    }
    
    // Convert the first Large Truck to Auto
    const truckToConvert = largeTrucks[0];
    
    console.log("\n🔄 Converting:");
    console.log(`   Plate: ${truckToConvert.plateNumber}`);
    console.log(`   From: Large Truck`);
    console.log(`   To: Auto`);
    console.log(`   Capacity: ${truckToConvert.capacity}kg → 300kg (Auto capacity)`);
    
    // Update the vehicle
    truckToConvert.type = "Auto";
    truckToConvert.capacity = 300; // Typical auto capacity
    await truckToConvert.save();
    
    console.log("\n✅ Successfully converted to Auto!");
    console.log(`   Vehicle ID: ${truckToConvert._id}`);
    console.log(`   New type: ${truckToConvert.type}`);
    console.log(`   New capacity: ${truckToConvert.capacity}kg`);
    
    // Show remaining vehicles
    console.log("\n📊 Updated vehicle counts:");
    const bikes = await Vehicle.countDocuments({ type: "Bike" });
    const autos = await Vehicle.countDocuments({ type: "Auto" });
    const miniTrucks = await Vehicle.countDocuments({ type: "Mini Truck" });
    const largeTrucks2 = await Vehicle.countDocuments({ type: "Large Truck" });
    
    console.log(`   Bikes: ${bikes}`);
    console.log(`   Autos: ${autos}`);
    console.log(`   Mini Trucks: ${miniTrucks}`);
    console.log(`   Large Trucks: ${largeTrucks2}`);
    
    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

convertTruckToAuto();
