import dotenv from "dotenv";
import { Config } from "../../interface/config";

dotenv.config();

/**
 * Retrieves an environment variable by key.
 *
 * @param {string} key - The name of the environment variable.
 * @returns {string} The value of the environment variable.
 * @throws {Error} If the environment variable is not defined.
 */
function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

const config: Config = {
  NODE_ENV: getEnv("NODE_ENV"),
  PORT: parseInt(getEnv("PORT"), 10),
  MONGODB_URI: getEnv("MONGODB_URI"),
  MONGODB_NAME: getEnv("MONGODB_NAME"),
  JWT_SECRET: getEnv("JWT_SECRET"),
  JWT_EXPIRE: getEnv("JWT_EXPIRE"),
  APPDEV_URL: getEnv("APPDEV_URL"),
  GOOGLE_CLIENT_ID: getEnv("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: getEnv("GOOGLE_CLIENT_SECRET"),
  KASAGARDEM_PLANTAPI_KEY: getEnv("KASAGARDEM_PLANTAPI_KEY"),
  KASAGARDEM_PLANTAPI_URL: getEnv("KASAGARDEM_PLANTAPI_URL"),
  KASAGARDEM_PLANTAPI_KEY_NAME: getEnv("KASAGARDEM_PLANTAPI_KEY_NAME"),
  AWS_ACCESS_KEY_ID: getEnv("AWS_ACCESS_KEY_ID"),
  AWS_SECRET_ACCESS_KEY: getEnv("AWS_SECRET_ACCESS_KEY"),
  AWS_REGION: getEnv("AWS_REGION"),
  AWS_S3_BUCKET: getEnv("AWS_S3_BUCKET"),
  EMAIL_PASS: getEnv("EMAIL_PASS"),
  EMAIL_USER: getEnv("EMAIL_USER"),
  EMAIL_FROM: getEnv("EMAIL_FROM"),
};

export default config;
