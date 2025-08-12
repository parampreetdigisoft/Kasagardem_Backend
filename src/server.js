const app = require("./app");
const connectDB = require("./core/config/db");
const config = require("./core/config/env");

/**
 * Initializes the database connection and starts the Express server.
 * Exits the process if startup fails.
 * @returns {Promise<void>} Resolves when the server is running.
 */
const startServer = async () => {
  try {
    await connectDB();
    // Start server
    app.listen(config.PORT, () => {
      console.log(
        `Server running on port ${config.PORT} in ${config.NODE_ENV} mode`
      );
    });
  } catch {
    process.exit(1);
  }
};

startServer();
