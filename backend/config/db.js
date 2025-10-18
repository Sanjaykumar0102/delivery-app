const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.error('\n📋 Troubleshooting steps:');
    console.error('1. Check if your IP is whitelisted in MongoDB Atlas');
    console.error('2. Verify MONGO_URI in .env file');
    console.error('3. Ensure MongoDB Atlas cluster is running');
    process.exit(1);
  }
};

module.exports = connectDB;
