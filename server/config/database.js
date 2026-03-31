const mongoose = require("mongoose");
const dns = require("dns");


// Use Google DNS to resolve MongoDB SRV records (fixes local DNS issues)
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error("❌ MONGODB_URI is missing from your .env file");
    }

    console.log("🔗 Trying to connect to MongoDB Atlas...");

    // Establish connection
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
    });

    console.log(`🍃 MongoDB Connected Successfully`);
    console.log(`📡 Host: ${conn.connection.host}`);
    console.log(`📁 Database: ${conn.connection.name}`);

    // Connection event listeners (helpful for debugging)
    mongoose.connection.on("connected", () => {
      console.log("✅ Mongoose connected to MongoDB Atlas");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ Mongoose connection error:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ Mongoose disconnected");
    });
  } catch (err) {
    console.error("❌ MongoDB Connection Failed!");
    console.error("Reason:", err.message);
    console.error("🛠️ Check your .env MONGODB_URI or Network Access in Atlas.");
    process.exit(1); // Stop server if DB connection fails
  }
};

module.exports = connectDB;



