// src/core/utils/logger.ts
import { MongoClient, Db, ObjectId } from "mongodb";
import config from "../config/env";
import { MongoValidationError } from "../../interface/error";
import { LogEntry, LogOptions } from "../../interface/logs";

/**
 * Logger class for writing logs to a MongoDB collection.
 * Handles MongoDB connection and provides a reusable client instance.
 */
class Logger {
  private mongoUrl: string;
  private dbName: string;
  private client: MongoClient | null = null;
  private db: Db | null = null;
  public isConnected = false;

  /**
   * Creates a new Logger instance to handle MongoDB logging.
   *
   * @param mongoUrl - The MongoDB connection URL.
   * @param dbName - The name of the MongoDB database for logs.
   */
  constructor(mongoUrl: string, dbName: string) {
    this.mongoUrl = mongoUrl;
    this.dbName = dbName;
  }

  /**
   * Initializes the MongoDB connection for the logger.
   * Establishes a connection to the database if not already connected.
   * Sets the `isConnected` flag to true upon successful connection.
   *
   * @returns A promise that resolves when the initialization is complete.
   */
  async initialize(): Promise<void> {
    try {
      if (!this.isConnected) {
        this.client = new MongoClient(this.mongoUrl);
        await this.client.connect();
        this.db = this.client.db(this.dbName);
        this.isConnected = true;
      }
    } catch (error: unknown) {
      const errObj: Error =
        error instanceof Error
          ? error
          : new Error(typeof error === "string" ? error : "Unknown error");

      console.error("Failed to connect to MongoDB for logging:", errObj);
      this.isConnected = false;
    }
  }

  /**
   * Sanitizes the metadata object by:
   *  - Removing undefined values and functions
   *  - Converting MongoDB ObjectIds to strings
   *  - Recursively sanitizing nested objects
   *
   * @param meta - The metadata object to sanitize
   * @returns A new object with sanitized metadata
   */
  private sanitizeMeta(meta: Record<string, unknown>): Record<string, unknown> {
    if (!meta || typeof meta !== "object") return {};

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(meta)) {
      if (value === undefined || typeof value === "function") continue;

      if (value instanceof ObjectId) {
        sanitized[key] = value.toString();
      } else if (value && typeof value === "object" && !Array.isArray(value)) {
        // Narrow type for recursive call
        sanitized[key] = this.sanitizeMeta(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Logs a message to the MongoDB collection with optional metadata and options.
   * Sanitizes metadata, converts ObjectIds to strings, and validates user/session IDs.
   *
   * @param level - The log level (e.g., "info", "warn", "error").
   * @param message - The log message to store.
   * @param meta - Optional metadata object with additional information.
   * @param options - Optional logging options, such as source, userId, and sessionId.
   * @returns A promise that resolves when the log has been saved to MongoDB.
   */
  async log(
    level: string,
    message: string,
    meta: Record<string, unknown> = {},
    options: LogOptions = {}
  ): Promise<void> {
    const timestamp = new Date();
    const createdAt = new Date();

    try {
      if (!this.isConnected) await this.initialize();

      if (this.isConnected && this.db) {
        const sanitizedMeta = this.sanitizeMeta(meta);

        const logEntry: LogEntry = {
          level: level.toLowerCase(),
          message: message || "",
          timestamp,
          meta: sanitizedMeta,
          createdAt,
          source: options.source || "application",
        };

        if (options.userId && ObjectId.isValid(options.userId.toString())) {
          logEntry.userId = new ObjectId(options.userId.toString());
        }

        if (options.sessionId) {
          logEntry.sessionId = options.sessionId.toString();
        }

        await this.db.collection<LogEntry>("logs").insertOne(logEntry);
      }
    } catch (error: unknown) {
      // Narrow unknown to MongoValidationError safely
      const errObj: MongoValidationError =
        error instanceof Error
          ? { ...error }
          : { name: "UnknownError", message: "An unknown error occurred" };

      console.error("Failed to save log to MongoDB:", errObj.message);

      if (errObj.code === 121) {
        console.error("MongoDB Validation Error Details:");
        console.error("- Level:", level?.toLowerCase());
        console.error("- Message length:", message?.length || 0);
        console.error("- Meta keys:", Object.keys(meta || {}));
        console.error("- Source:", options.source);
        console.error("- UserId type:", typeof options.userId);
        console.error("- SessionId type:", typeof options.sessionId);

        if (errObj.errInfo?.details) {
          console.error(
            "- Validation details:",
            JSON.stringify(errObj.errInfo.details, null, 2)
          );
        }
      }
    }
  }

  /**
   * Closes the MongoDB client connection if it is currently connected.
   * Sets `isConnected` to false after closing.
   *
   * @returns A promise that resolves when the MongoDB connection is closed.
   */
  async close(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.close();
      this.isConnected = false;
    }
  }
  /**
   * Retrieves log entries from the MongoDB collection based on a filter and options.
   *
   * @param filter - MongoDB filter object to query logs.
   * @param options - Optional query parameters.
   * @param options.limit - Maximum number of log entries to return (default: 100).
   * @param options.skip - Number of log entries to skip (default: 0).
   * @param options.sort - Sorting order for the results (default: { createdAt: -1 }).
   * @returns A promise that resolves to an array of `LogEntry` objects matching the query.
   */
  async getLogs(
    filter: Record<string, unknown> = {},
    options: {
      limit?: number;
      skip?: number;
      sort?: Record<string, 1 | -1>; // <-- Type-safe for MongoDB sort
    } = {}
  ): Promise<LogEntry[]> {
    if (!this.isConnected) await this.initialize();
    if (!this.db) return [];

    const { limit = 100, skip = 0, sort = { createdAt: -1 } } = options;

    return this.db
      .collection<LogEntry>("logs")
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();
  }
}

// Singleton instance
const logger = new Logger(config.MONGODB_URI, config.MONGODB_NAME);

let initPromise: Promise<void> | null = null;

/**
 * Ensures that the logger is initialized before use.
 * If the initialization hasn't started yet, it triggers it and waits for completion.
 *
 * @returns A promise that resolves once the logger is initialized.
 */
const ensureInitialized = async (): Promise<void> => {
  if (!initPromise) {
    initPromise = logger.initialize();
  }
  await initPromise;
};

/**
 * Logs an informational message to the MongoDB logger.
 *
 * @param message - The message to log.
 * @param meta - Additional metadata to store with the log.
 * @param options - Optional logging options like source, userId, or sessionId.
 * @returns A promise that resolves once the log has been saved.
 */
export const info = async (
  message: string,
  meta: Record<string, unknown> = {},
  options: LogOptions = {}
): Promise<void> => {
  await ensureInitialized();
  return logger.log("info", message, meta, options);
};

/**
 * Logs an error message to the MongoDB logger.
 *
 * @param message - The error message to log.
 * @param meta - Additional metadata to store with the log.
 * @param options - Optional logging options like source, userId, or sessionId.
 * @returns A promise that resolves once the log has been saved.
 */
export const error = async (
  message: string,
  meta: Record<string, unknown> = {},
  options: LogOptions = {}
): Promise<void> => {
  await ensureInitialized();
  return logger.log("error", message, meta, options);
};

/**
 * Logs a warning message to the MongoDB logger.
 *
 * @param message - The warning message to log.
 * @param meta - Additional metadata to store with the log.
 * @param options - Optional logging options like source, userId, or sessionId.
 * @returns A promise that resolves once the log has been saved.
 */
export const warn = async (
  message: string,
  meta: Record<string, unknown> = {},
  options: LogOptions = {}
): Promise<void> => {
  await ensureInitialized();
  return logger.log("warn", message, meta, options);
};

/**
 * Logs a debug message to the MongoDB logger.
 *
 * @param message - The debug message to log.
 * @param meta - Additional metadata to store with the log.
 * @param options - Optional logging options like source, userId, or sessionId.
 * @returns A promise that resolves once the log has been saved.
 */
export const debug = async (
  message: string,
  meta: Record<string, unknown> = {},
  options: LogOptions = {}
): Promise<void> => {
  await ensureInitialized();
  return logger.log("debug", message, meta, options);
};

/**
 * Closes the MongoDB logger connection.
 *
 * @returns A promise that resolves once the connection has been closed.
 */
export const close = (): Promise<void> => logger.close();

export default logger;
