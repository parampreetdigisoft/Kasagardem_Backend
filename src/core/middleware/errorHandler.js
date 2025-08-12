const { errorResponse } = require("../utils/responseFormatter");
const { HTTP_STATUS } = require("../utils/constants");

/**
 * Global error handler for Express applications.
 * Handles common Mongoose and JWT errors, returning an appropriate
 * HTTP status code and JSON error response.
 * @param {Error} err - The error object containing details about the failure.
 * @param {import("express").Response} res - Express response object.
 * @returns {void}
 */
const errorHandler = (err, res) => {
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message || "Internal Server Error";

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = Object.values(err.errors)
      .map((error) => error.message)
      .join(", ");
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = HTTP_STATUS.CONFLICT;
    message = "Resource already exists";
  }

  // JWT error
  if (err.name === "JsonWebTokenError") {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = "Invalid token";
  }

  res.status(statusCode).json(errorResponse(message));
};

module.exports = errorHandler;
