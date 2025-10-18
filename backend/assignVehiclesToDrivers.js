// Script to assign vehicles to drivers
const mongoose = require('mongoose');
const User = require('./models/user');
const Vehicle = require('./models/vehicle');
require('dotenv').config();

const assignVehicles = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get all approved drivers
    const drivers = await User.find({ 
      role: 'Driver', 
      isApproved: true 
    }).select('_id name email vehicleAssigned driverDetails');

    // Get all vehicles
    const vehicles = await Vehicle.find({});

    console.log(`\n📊 Found ${drivers.length} approved drivers`);
    console.log(`📊 Found ${vehicles.length} vehicles\n`);

    if (vehicles.length === 0) {
      console.log('❌ No vehicles found. Please create vehicles first.');
      process.exit(0);
    }

    // Assign vehicles to drivers who don't have one
    let assignedCount = 0;
    for (let i = 0; i < drivers.length; i++) {
      const driver = drivers[i];
      
      if (!driver.vehicleAssigned) {
        // Assign vehicle based on driver's vehicle type preference
        const preferredType = driver.driverDetails?.vehicleType;
        let vehicle = null;

        if (preferredType) {
          // Try to find a matching vehicle type
          vehicle = vehicles.find(v => 
            v.type === preferredType && 
            !drivers.some(d => d.vehicleAssigned?.toString() === v._id.toString())
          );
        }

        // If no matching type or no preference, assign any available vehicle
        if (!vehicle) {
          vehicle = vehicles.find(v => 
            !drivers.some(d => d.vehicleAssigned?.toString() === v._id.toString())
          );
        }

        if (vehicle) {
          driver.vehicleAssigned = vehicle._id;
          await driver.save();
          assignedCount++;
          console.log(`✅ Assigned ${vehicle.type} (${vehicle.plateNumber}) to ${driver.name}`);
        } else {
          console.log(`⚠️  No available vehicle for ${driver.name}`);
        }
      } else {
        const vehicle = vehicles.find(v => v._id.toString() === driver.vehicleAssigned.toString());
        console.log(`ℹ️  ${driver.name} already has ${vehicle?.type || 'unknown'} (${vehicle?.plateNumber || 'unknown'})`);
      }
    }

    console.log(`\n✅ Assigned ${assignedCount} vehicles to drivers`);
    console.log('✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

assignVehicles();
