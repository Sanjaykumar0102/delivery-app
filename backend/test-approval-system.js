// Test script to verify approval system
// Run with: node test-approval-system.js

const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/delivrax';

async function testApprovalSystem() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = mongoose.model('User');

    // 1. Check for pending drivers
    console.log('📋 Checking for pending driver approvals...');
    const pendingDrivers = await User.find({ 
      role: 'Driver', 
      approvalStatus: 'Pending' 
    }).select('name email approvalStatus isApproved createdAt');

    console.log(`Found ${pendingDrivers.length} pending drivers:`);
    pendingDrivers.forEach((driver, index) => {
      console.log(`  ${index + 1}. ${driver.name} (${driver.email})`);
      console.log(`     Status: ${driver.approvalStatus}, Approved: ${driver.isApproved}`);
      console.log(`     Registered: ${driver.createdAt}`);
    });
    console.log('');

    // 2. Check for approved drivers
    console.log('✅ Checking for approved drivers...');
    const approvedDrivers = await User.find({ 
      role: 'Driver', 
      approvalStatus: 'Approved' 
    }).select('name email approvalStatus isApproved isOnDuty');

    console.log(`Found ${approvedDrivers.length} approved drivers:`);
    approvedDrivers.forEach((driver, index) => {
      console.log(`  ${index + 1}. ${driver.name} (${driver.email})`);
      console.log(`     On Duty: ${driver.isOnDuty ? '🟢 Yes' : '🔴 No'}`);
    });
    console.log('');

    // 3. Check for rejected drivers
    console.log('❌ Checking for rejected drivers...');
    const rejectedDrivers = await User.find({ 
      role: 'Driver', 
      approvalStatus: 'Rejected' 
    }).select('name email approvalStatus rejectionReason');

    console.log(`Found ${rejectedDrivers.length} rejected drivers:`);
    rejectedDrivers.forEach((driver, index) => {
      console.log(`  ${index + 1}. ${driver.name} (${driver.email})`);
      console.log(`     Reason: ${driver.rejectionReason || 'Not specified'}`);
    });
    console.log('');

    // 4. Summary
    console.log('📊 SUMMARY:');
    console.log(`   Total Drivers: ${pendingDrivers.length + approvedDrivers.length + rejectedDrivers.length}`);
    console.log(`   ⏳ Pending: ${pendingDrivers.length}`);
    console.log(`   ✅ Approved: ${approvedDrivers.length}`);
    console.log(`   ❌ Rejected: ${rejectedDrivers.length}`);
    console.log(`   🟢 On Duty: ${approvedDrivers.filter(d => d.isOnDuty).length}`);
    console.log('');

    // 5. Recommendations
    if (pendingDrivers.length > 0) {
      console.log('💡 RECOMMENDATION:');
      console.log('   You have pending driver approvals!');
      console.log('   Login to Admin Dashboard → Approvals tab to review them.');
      console.log('');
    }

    if (approvedDrivers.length === 0 && pendingDrivers.length === 0) {
      console.log('💡 RECOMMENDATION:');
      console.log('   No drivers in the system. Register a driver account to test.');
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the test
testApprovalSystem();
