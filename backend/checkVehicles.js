// Check vehicles in database
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Vehicle = require("./models/vehicle");

dotenv.config();

const checkVehicles = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    const vehicles = await Vehicle.find({});
    
    console.log("\n📊 Total vehicles:", vehicles.length);
    console.log("\n🚗 Vehicles by type:");
    
    const vehiclesByType = {};
    vehicles.forEach(v => {
      if (!vehiclesByType[v.type]) {
        vehiclesByType[v.type] = [];
      }
      vehiclesByType[v.type].push({
        _id: v._id,
        plateNumber: v.plateNumber,
        capacity: v.capacity
      });
    });
    
    Object.keys(vehiclesByType).forEach(type => {
      console.log(`\n${type}: ${vehiclesByType[type].length} vehicles`);
      vehiclesByType[type].forEach(v => {
        console.log(`  - ${v.plateNumber} (${v.capacity}kg) [ID: ${v._id}]`);
      });
    });
    
    // Check for duplicate Large Trucks
    const largeTrucks = vehicles.filter(v => v.type === "Large Truck");
    if (largeTrucks.length > 1) {
      console.log("\n⚠️  Found", largeTrucks.length, "Large Trucks - you may want to convert one to Auto");
    }
    
    // Check if Auto exists
    const autos = vehicles.filter(v => v.type === "Auto");
    if (autos.length === 0) {
      console.log("\n⚠️  No Auto vehicles found - you may want to add one or convert a Large Truck");
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

checkVehicles();
