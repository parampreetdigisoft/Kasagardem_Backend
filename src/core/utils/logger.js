const config = require("../config/env");
const { MongoClient, ObjectId } = require("mongodb"); // Import ObjectId

class Logger {
  constructor(mongoUrl, dbName) {
    this.mongoUrl = mongoUrl;
    this.dbName = dbName;
    this.db = null;
    this.isConnected = false;
  }

  /**
   * Initialize MongoDB connection
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      if (!this.isConnected) {
        this.client = new MongoClient(this.mongoUrl);
        await this.client.connect();
        this.db = this.client.db(this.dbName);
        this.isConnected = true;
      }
    } catch (error) {
      console.error("Failed to connect to MongoDB for logging:", error);
      this.isConnected = false;
    }
  }

  /**
   * Sanitize meta object to ensure it doesn't contain invalid values
   * @param {object} meta - The meta object to sanitize
   * @returns {object} - Sanitized meta object
   */
  sanitizeMeta(meta) {
    if (!meta || typeof meta !== "object") return {};

    const sanitized = {};
    for (const [key, value] of Object.entries(meta)) {
      // Skip undefined values and functions
      if (value === undefined || typeof value === "function") continue;

      // Convert ObjectId to string to avoid validation issues
      if (
        value &&
        typeof value === "object" &&
        value.constructor.name === "ObjectId"
      ) {
        sanitized[key] = value.toString();
      } else if (value && typeof value === "object") {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitizeMeta(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  /**
   * Logs a message with a given severity level and optional metadata.
   * @param {string} level - The severity level of the log (e.g., 'info', 'error', 'warn', 'debug').
   * @param {string} message - The message to log.
   * @param {object} meta - Optional additional metadata to include in the log entry.
   * @param {object} options - Optional configuration (userId, sessionId, source).
   * @returns {Promise<void>}
   */
  async log(level, message, meta = {}, options = {}) {
    const timestamp = new Date().toISOString();
    const createdAt = new Date();

    try {
      if (!this.isConnected) {
        await this.initialize();
      }

      if (this.isConnected && this.db) {
        const sanitizedMeta = this.sanitizeMeta(meta);

        const logEntry = {
          level: level.toLowerCase(),
          message: message || "",
          timestamp,
          meta: sanitizedMeta,
          createdAt,
          source: options.source || "application",
        };

        // Convert userId to ObjectId to match validation schema
        if (options.userId && ObjectId.isValid(options.userId.toString())) {
          logEntry.userId = new ObjectId(options.userId.toString());
        }

        if (options.sessionId) {
          logEntry.sessionId = options.sessionId.toString();
        }

        await this.db.collection("logs").insertOne(logEntry);
      }
    } catch (error) {
      console.error("Failed to save log to MongoDB:", error.message);

      if (error.code === 121) {
        console.error("MongoDB Validation Error Details:");
        console.error("- Level:", level?.toLowerCase());
        console.error("- Message length:", message?.length || 0);
        console.error("- Meta keys:", Object.keys(meta || {}));
        console.error("- Source:", options.source);
        console.error("- UserId type:", typeof options.userId);
        console.error("- SessionId type:", typeof options.sessionId);

        if (error.errInfo && error.errInfo.details) {
          console.error(
            "- Validation details:",
            JSON.stringify(error.errInfo.details, null, 2)
          );
        }
      }
    }
  }

  /**
   * Close MongoDB connection
   * @returns {Promise<void>}
   */
  async close() {
    if (this.client && this.isConnected) {
      await this.client.close();
      this.isConnected = false;
    }
  }
}

// Create singleton instance
const logger = new Logger(config.MONGODB_URI, config.MONGODB_NAME);

let initPromise = null;
const ensureInitialized = async () => {
  if (!initPromise) {
    initPromise = logger.initialize();
  }
  await initPromise;
};

module.exports = {
  info: async (message, meta = {}, options = {}) => {
    await ensureInitialized();
    return logger.log("info", message, meta, options);
  },

  error: async (message, meta = {}, options = {}) => {
    await ensureInitialized();
    return logger.log("error", message, meta, options);
  },

  warn: async (message, meta = {}, options = {}) => {
    await ensureInitialized();
    return logger.log("warn", message, meta, options);
  },

  debug: async (message, meta = {}, options = {}) => {
    await ensureInitialized();
    return logger.log("debug", message, meta, options);
  },

  close: () => logger.close(),

  getLogs: async (filter = {}, options = {}) => {
    await ensureInitialized();
    if (!logger.isConnected) return [];

    const { limit = 100, skip = 0, sort = { createdAt: -1 } } = options;

    return logger.db
      .collection("logs")
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();
  },
};
