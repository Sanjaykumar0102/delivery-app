// Fix vehicle types to match enum and convert duplicate to Auto
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const fixVehicleTypes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // Get vehicles collection directly (bypass model validation)
    const db = mongoose.connection.db;
    const vehiclesCollection = db.collection('vehicles');

    // Find all vehicles
    const allVehicles = await vehiclesCollection.find({}).toArray();
    
    console.log("\n📊 Current vehicles in database:");
    allVehicles.forEach(v => {
      console.log(`  - Type: "${v.type}" | Plate: ${v.plateNumber} | Capacity: ${v.capacity}kg`);
    });

    // Valid types according to model
    const validTypes = ["Bike", "Auto", "Mini Truck", "Large Truck"];
    
    console.log("\n🔧 Fixing vehicle types...");

    let autoCount = 0;
    let truckCount = 0;
    let updates = [];

    for (const vehicle of allVehicles) {
      const currentType = vehicle.type;
      let newType = currentType;
      let needsUpdate = false;

      // Map old types to new types
      if (currentType === "2 wheeler" || currentType === "Bike") {
        newType = "Bike";
        needsUpdate = currentType !== "Bike";
      } else if (currentType === "Truck") {
        // First "Truck" becomes "Auto", rest become "Large Truck"
        if (autoCount === 0) {
          newType = "Auto";
          needsUpdate = true;
          autoCount++;
          console.log(`  ✓ Converting "${currentType}" (${vehicle.plateNumber}) → Auto`);
        } else {
          newType = "Large Truck";
          needsUpdate = true;
          truckCount++;
          console.log(`  ✓ Converting "${currentType}" (${vehicle.plateNumber}) → Large Truck`);
        }
      } else if (currentType === "Lorry") {
        newType = "Large Truck";
        needsUpdate = true;
        console.log(`  ✓ Converting "${currentType}" (${vehicle.plateNumber}) → Large Truck`);
      } else if (!validTypes.includes(currentType)) {
        // Unknown type, convert to Large Truck
        newType = "Large Truck";
        needsUpdate = true;
        console.log(`  ✓ Converting unknown type "${currentType}" (${vehicle.plateNumber}) → Large Truck`);
      }

      if (needsUpdate) {
        updates.push({
          _id: vehicle._id,
          oldType: currentType,
          newType: newType
        });

        // Update capacity based on type
        let newCapacity = vehicle.capacity;
        if (newType === "Bike") newCapacity = 50;
        if (newType === "Auto") newCapacity = 300;
        if (newType === "Mini Truck") newCapacity = 500;
        if (newType === "Large Truck") newCapacity = 1000;

        await vehiclesCollection.updateOne(
          { _id: vehicle._id },
          { 
            $set: { 
              type: newType,
              capacity: newCapacity
            } 
          }
        );
      }
    }

    if (updates.length > 0) {
      console.log(`\n✅ Updated ${updates.length} vehicles`);
    } else {
      console.log(`\n✅ All vehicles already have correct types`);
    }

    // Show final state
    const finalVehicles = await vehiclesCollection.find({}).toArray();
    console.log("\n📊 Final vehicle types:");
    
    const typeCounts = {};
    finalVehicles.forEach(v => {
      typeCounts[v.type] = (typeCounts[v.type] || 0) + 1;
    });

    Object.keys(typeCounts).forEach(type => {
      const icon = {
        "Bike": "🏍️",
        "Auto": "🛺",
        "Mini Truck": "🚐",
        "Large Truck": "🚛"
      }[type] || "🚗";
      console.log(`   ${icon} ${type}: ${typeCounts[type]}`);
    });

    console.log("\n📋 All vehicles:");
    finalVehicles.forEach(v => {
      const icon = {
        "Bike": "🏍️",
        "Auto": "🛺",
        "Mini Truck": "🚐",
        "Large Truck": "🚛"
      }[v.type] || "🚗";
      console.log(`   ${icon} ${v.type} | ${v.plateNumber} | ${v.capacity}kg`);
    });

    mongoose.connection.close();
    console.log("\n✅ Done! Please refresh the admin dashboard.");
  } catch (error) {
    console.error("❌ Error:", error);
    console.error(error.stack);
    process.exit(1);
  }
};

fixVehicleTypes();
