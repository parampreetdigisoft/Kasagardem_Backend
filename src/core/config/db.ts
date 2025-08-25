import mongoose from "mongoose";
import config from "./env";

/**
 * Establishes a connection to the MongoDB database using Mongoose.
 * Uses configuration values from `config.MONGODB_URI` and applies
 * recommended connection options for performance and stability.
 * If the connection fails, the process exits with code 1.
 */
const connectDB = async (): Promise<void> => {
  if (!config.MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }
  try {
    await mongoose.connect(config.MONGODB_URI, {
      //useNewUrlParser: true,
      //useUnifiedTopology: true,
      autoIndex: false, // Disable auto-index creation
      autoCreate: false, // Disable auto-collection creation
    });
    console.error("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed", error);
    process.exit(1);
  }
};

export default connectDB;
