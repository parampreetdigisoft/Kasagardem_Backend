const mongoose = require("mongoose");
const config = require("./env");

/**
 * Establishes a connection to the MongoDB database using Mongoose.
 * Uses configuration values from `config.MONGODB_URI` and applies
 * recommended connection options for performance and stability.
 * If the connection fails, the process exits with code 1.
 * @returns {Promise<void>} Resolves when the database connection is established.
 */
const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: false, // Disable auto-index creation
      autoCreate: false, // Disable auto-collection creation
    });
  } catch {
    process.exit(1);
  }
};

module.exports = connectDB;
