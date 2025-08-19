import jwt, { SignOptions, Secret } from "jsonwebtoken";
import { google } from "googleapis";
import config from "../config/env";

if (!config.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

const jwtSecret: Secret = config.JWT_SECRET;

/**
 * Converts a string or undefined into a valid JWT `expiresIn` value.
 *
 * @param {string | undefined} value - The expiration value. Can be a number (seconds) or a duration string like "15m", "1h", "7d".
 * @returns {NonNullable<SignOptions["expiresIn"]>} The converted expiration suitable for JWT signing.
 * @throws {Error} Throws an error if the value is invalid.
 */
function toExpiresIn(
  value: string | undefined
): NonNullable<SignOptions["expiresIn"]> {
  if (!value) return "1h";
  const n = Number(value);
  if (!Number.isNaN(n)) return n;
  if (/^[0-9]+(ms|s|m|h|d|w|y)$/.test(value)) {
    return value as unknown as NonNullable<SignOptions["expiresIn"]>;
  }
  throw new Error(
    `Invalid JWT_EXPIRE: ${value}. Use seconds or duration like 15m, 1h, 7d.`
  );
}

/**
 * Generates a JWT token for a user.
 *
 * @param {string} userEmail - The email of the user for whom the token is generated.
 * @param {string} role - The role of the user (e.g., "admin", "user").
 * @returns {string} The signed JWT token.
 */
export const generateToken = (userEmail: string, role: string): string => {
  const options: SignOptions = {
    expiresIn: toExpiresIn(config.JWT_EXPIRE),
    algorithm: "HS512",
  };
  return jwt.sign({ userEmail, role }, jwtSecret, options);
};

// Configure OAuth2 client
export const oauth2Client = new google.auth.OAuth2(
  config.GOOGLE_CLIENT_ID,
  config.GOOGLE_CLIENT_SECRET
);
