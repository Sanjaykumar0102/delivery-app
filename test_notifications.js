const io = require('socket.io-client');

console.log('🧪 Testing notification system...');

// Test 1: Connect as a driver
const driverSocket = io('http://localhost:5000');

driverSocket.on('connect', () => {
  console.log('✅ Driver socket connected:', driverSocket.id);

  // Register as driver
  driverSocket.emit('register', {
    userId: 'test_driver_1',
    role: 'Driver',
    vehicleType: 'Bike',
    isOnDuty: true,
    isApproved: true,
    approvalStatus: 'Approved'
  });

  console.log('📝 Registered as driver with vehicle type: Bike');

  // Listen for notifications
  driverSocket.on('newOrderAvailable', (orderData) => {
    console.log('🔔 NOTIFICATION RECEIVED:', orderData);
    console.log('🚗 Order vehicle type:', orderData.vehicleType);
    console.log('📍 Pickup:', orderData.pickup?.address);
    console.log('🎯 Dropoff:', orderData.dropoff?.address);

    // Test if notification filtering works
    if (orderData.vehicleType !== 'Bike') {
      console.log('❌ ERROR: Received notification for wrong vehicle type!');
    } else {
      console.log('✅ SUCCESS: Received notification for correct vehicle type');
    }
  });

  // Wait a bit then create a test order
  setTimeout(() => {
    console.log('⏰ Creating test order...');
    testOrderCreation();
  }, 2000);
});

async function testOrderCreation() {
  try {
    // Create a test order via HTTP request
    const response = await fetch('http://localhost:5000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pickup: {
          address: 'Test Pickup Location',
          lat: 12.9716,
          lng: 77.5946
        },
        dropoff: {
          address: 'Test Dropoff Location',
          lat: 12.9716,
          lng: 77.5946
        },
        items: [{ name: 'Test Item', quantity: 1, weight: 1 }],
        vehicleType: 'Bike',
        paymentMethod: 'Cash'
      })
    });

    if (response.ok) {
      const order = await response.json();
      console.log('✅ Test order created:', order._id);
      console.log('🚗 Order vehicle type:', order.vehicleType);

      // Wait for notification
      setTimeout(() => {
        console.log('⏰ Test completed');
        process.exit(0);
      }, 5000);
    } else {
      console.error('❌ Failed to create test order:', response.statusText);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error creating test order:', error.message);
    process.exit(1);
  }
}

driverSocket.on('disconnect', () => {
  console.log('❌ Driver socket disconnected');
});
