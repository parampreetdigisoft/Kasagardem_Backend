const jwt = require("jsonwebtoken");
const { google } = require("googleapis"); // Added this import
const config = require("../config/env");

/**
 * Generates a JWT token with user email and role as payload.
 * @param {string} userEmail - The email of the user.
 * @param {string} role - The role of the user.
 * @returns {string} The signed JWT token.
 */
const generateToken = (userEmail, role) => {
  return jwt.sign({ userEmail, role }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRE,
    algorithm: "HS512",
  });
};

// Configure OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  config.GOOGLE_CLIENT_ID,
  config.GOOGLE_CLIENT_SECRET
);

module.exports = { generateToken, oauth2Client };
