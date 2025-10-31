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
  JWT_SECRET: getEnv("JWT_SECRET"),
  JWT_EXPIRE: getEnv("JWT_EXPIRE"),
  APPDEV_URL: getEnv("APPDEV_URL"),
  AWS_ACCESS_KEY_ID: getEnv("AWS_ACCESS_KEY_ID"),
  AWS_SECRET_ACCESS_KEY: getEnv("AWS_SECRET_ACCESS_KEY"),
  AWS_REGION: getEnv("AWS_REGION"),
  AWS_S3_BUCKET: getEnv("AWS_S3_BUCKET"),
  EMAIL_PASS: getEnv("EMAIL_PASS"),
  EMAIL_USER: getEnv("EMAIL_USER"),
  EMAIL_FROM: getEnv("EMAIL_FROM"),
  FIREBASE_PROJECT_ID: getEnv("FIREBASE_PROJECT_ID"),
  FIREBASE_PRIVATE_KEY_ID: getEnv("FIREBASE_PRIVATE_KEY_ID"),
  FIREBASE_PRIVATE_KEY: getEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
  FIREBASE_CLIENT_EMAIL: getEnv("FIREBASE_CLIENT_EMAIL"),
  POSTGRE_HOST: getEnv("POSTGRE_HOST"),
  POSTGRE_PORT: getEnv("POSTGRE_PORT"),
  POSTGRE_DATABASE: getEnv("POSTGRE_DATABASE"),
  POSTGRE_USER: getEnv("POSTGRE_USER"),
  POSTGRE_PASSWORD: getEnv("POSTGRE_PASSWORD"),
  CSC_API_BASE_URL: getEnv("CSC_API_BASE_URL"),
  CSC_API_KEY: getEnv("CSC_API_KEY"),
  ADMIN_EMAIL: getEnv("ADMIN_EMAIL"),
};

export default config;
