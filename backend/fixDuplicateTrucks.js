// Fix duplicate trucks - convert one to Auto
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Vehicle = require("./models/vehicle");

dotenv.config();

const fixDuplicateTrucks = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // Find all vehicles
    const allVehicles = await Vehicle.find({});
    console.log("\n📊 Current vehicles:");
    allVehicles.forEach(v => {
      console.log(`  - ${v.type} | ${v.plateNumber} | ${v.capacity}kg | ID: ${v._id}`);
    });

    // Find vehicles with "Truck" in the type name
    const trucks = await Vehicle.find({ 
      $or: [
        { type: "Truck" },
        { type: "Large Truck" },
        { type: "Mini Truck" }
      ]
    });

    console.log(`\n🚛 Found ${trucks.length} truck-type vehicles`);

    // Check if Auto exists
    const autos = await Vehicle.find({ type: "Auto" });
    console.log(`🛺 Found ${autos.length} Auto vehicles`);

    if (autos.length === 0 && trucks.length >= 2) {
      // Convert the first "Truck" (not Mini Truck or Large Truck) to Auto
      const plainTrucks = trucks.filter(t => t.type === "Truck");
      
      if (plainTrucks.length > 0) {
        const truckToConvert = plainTrucks[0];
        console.log(`\n🔄 Converting:`);
        console.log(`   Plate: ${truckToConvert.plateNumber}`);
        console.log(`   From: ${truckToConvert.type}`);
        console.log(`   To: Auto`);
        
        truckToConvert.type = "Auto";
        truckToConvert.capacity = 300; // Auto capacity
        await truckToConvert.save();
        
        console.log(`✅ Successfully converted to Auto!`);
      } else {
        // If no plain "Truck", convert a Large Truck
        const largeTrucks = trucks.filter(t => t.type === "Large Truck");
        if (largeTrucks.length > 1) {
          const truckToConvert = largeTrucks[0];
          console.log(`\n🔄 Converting:`);
          console.log(`   Plate: ${truckToConvert.plateNumber}`);
          console.log(`   From: ${truckToConvert.type}`);
          console.log(`   To: Auto`);
          
          truckToConvert.type = "Auto";
          truckToConvert.capacity = 300;
          await truckToConvert.save();
          
          console.log(`✅ Successfully converted to Auto!`);
        }
      }
    } else if (autos.length > 0) {
      console.log(`\n✅ Auto already exists, no conversion needed`);
    } else {
      console.log(`\n⚠️  Not enough trucks to convert`);
    }

    // Show final state
    console.log("\n📊 Final vehicle counts:");
    const finalCounts = await Vehicle.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } }
    ]);
    finalCounts.forEach(c => {
      console.log(`   ${c._id}: ${c.count}`);
    });

    mongoose.connection.close();
    console.log("\n✅ Done!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

fixDuplicateTrucks();
