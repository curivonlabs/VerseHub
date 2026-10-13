import mongoose from "mongoose";
import env from "./env.js";

const connectDB = async () => {
  try {
    
    if (!env.database.dbURL) {
      throw new Error("Database connection URL is missing in environment configuration.");
    }

    const options = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    const conn = await mongoose.connect(env.database.dbURL, options);

    console.log(`\nServer Connected to Database Successfully: ${conn.connection.host}`);

    mongoose.connection.on("error", (err) => {
      console.error(`\nMongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("\nMongoDB connection stopped or lost. Attempting to reconnect...");
    });

    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("\nMongoDB connection closed gracefully through app termination.");
      process.exit(0);
    });

  } catch (error) {
    console.error("\nError Connecting to Database: ", error.message);
    process.exit(1);
  }
};

export default connectDB;