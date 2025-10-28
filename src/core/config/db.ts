import { Client } from "pg";
import config from "../config/env";

let dbClient: Client | null = null;

/**
 * Establishes a connection to the PostgreSQL database using the `pg` library.
 * Reads configuration values from environment variables defined in `config`.
 * If the connection fails, logs the error and terminates the process.
 *
 * @returns {Promise<Client>} A promise that resolves with the connected PostgreSQL client instance.
 */
export const connectDB = async (): Promise<Client> => {
  if (
    !config.POSTGRE_HOST ||
    !config.POSTGRE_PORT ||
    !config.POSTGRE_DATABASE ||
    !config.POSTGRE_USER ||
    !config.POSTGRE_PASSWORD
  ) {
    throw new Error(
      "PostgreSQL environment variables are not properly defined"
    );
  }

  const client = new Client({
    host: config.POSTGRE_HOST,
    port: Number(config.POSTGRE_PORT),
    database: config.POSTGRE_DATABASE,
    user: config.POSTGRE_USER,
    password: config.POSTGRE_PASSWORD,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.error("✅ PostgreSQL connected successfully");
    dbClient = client;
    return client;
  } catch (error) {
    console.error("❌ PostgreSQL connection failed:", error);
    process.exit(1);
  }
};

/**
 * Returns the existing database client instance.
 * Throws an error if the database has not been connected yet.
 *
 * @returns {Client} The connected PostgreSQL client instance.
 */
export const getDB = (): Client => {
  if (!dbClient) {
    throw new Error(
      "Database not connected. Call connectDB() first in your app initialization."
    );
  }
  return dbClient;
};

/**
 * Closes the database connection gracefully.
 */
export const disconnectDB = async (): Promise<void> => {
  if (dbClient) {
    await dbClient.end();
    dbClient = null;
    console.error("✅ PostgreSQL disconnected successfully");
  }
};
