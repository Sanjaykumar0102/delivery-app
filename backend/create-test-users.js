// Script to create test users for development
// Run with: node create-test-users.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/delivrax';

async function createTestUsers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = mongoose.model('User');

    // Test users data
    const testUsers = [
      {
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'admin123',
        role: 'Admin',
        isApproved: true,
        approvalStatus: 'Approved'
      },
      {
        name: 'Driver User',
        email: 'driver@test.com',
        password: 'driver123',
        role: 'Driver',
        isApproved: true,
        approvalStatus: 'Approved',
        isOnDuty: false,
        driverDetails: {
          vehicleType: 'Bike',
          licenseNumber: 'DL123456789',
          licenseExpiry: new Date('2025-12-31'),
          panNumber: 'ABCDE1234F',
          aadharNumber: '123456789012',
          vehicleNumber: 'KA01AB1234',
          vehicleModel: 'Honda Activa',
          vehicleYear: 2022,
          insuranceExpiry: new Date('2025-12-31')
        }
      },
      {
        name: 'Customer User',
        email: 'customer@test.com',
        password: 'customer123',
        role: 'Customer',
        isApproved: true,
        approvalStatus: 'Approved'
      }
    ];

    console.log('👥 Creating test users...\n');

    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });

      if (existingUser) {
        console.log(`⚠️  User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);

      // Create user
      const user = await User.create(userData);

      console.log(`✅ Created user: ${user.name} (${user.email}) - ${user.role}`);
      console.log(`   Password: ${userData.password.replace(/./g, '*')}`);
      console.log('');
    }

    console.log('🎉 Test users created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Admin: admin@test.com / admin123');
    console.log('   Driver: driver@test.com / driver123');
    console.log('   Customer: customer@test.com / customer123');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
createTestUsers();
