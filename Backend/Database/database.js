const mongoose = require("mongoose");
require("dotenv").config();

const uri = process.env.MONGODB_URI;

async function connectDB() {
  try {
    if (!uri) {
      throw new Error("MONGODB_URI environment variable is not defined");
    }

    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log("Connected to MongoDB using Mongoose!");
    console.log(`Database: ${mongoose.connection.name}`);
    return true;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
}

// Connection event handlers
mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose disconnected from MongoDB");
});

// Graceful shutdown
process.on("SIGINT", async () => {
  try {
    await mongoose.connection.close();
    console.log("Mongoose connection closed through app termination");
    process.exit(0);
  } catch (error) {
    console.error("Error during graceful shutdown:", error);
    process.exit(1);
  }
});

process.on("SIGTERM", async () => {
  try {
    await mongoose.connection.close();
    console.log("Mongoose connection closed through SIGTERM");
    process.exit(0);
  } catch (error) {
    console.error("Error during SIGTERM shutdown:", error);
    process.exit(1);
  }
});

module.exports = { connectDB };