const jwt = require("jsonwebtoken");
const config = require("../config/env");
const { errorResponse } = require("../utils/responseFormatter");
const { HTTP_STATUS, MESSAGES } = require("../utils/constants");
const logger = require("../utils/logger"); // Add logger import

/**
 * Middleware to authenticate requests using a JWT token.
 * Extracts the token from the Authorization header, verifies it, and attaches
 * the decoded user payload to `req.user`. If the token is missing or invalid,
 * responds with an Unauthorized error.
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} res - Express response object.
 * @param {import("express").NextFunction} next - Express next middleware function.
 * @returns {void}
 */
const auth = async (req, res, next) => {
  const requestInfo = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get("User-Agent"),
  };

  try {
    await logger.debug(
      "Authentication middleware started",
      {
        ...requestInfo,
        hasAuthHeader: !!req.header("Authorization"),
      },
      { source: "middleware.auth" }
    );

    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      await logger.warn(
        "Authentication failed - missing token",
        { ...requestInfo },
        { source: "middleware.auth" }
      );
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(errorResponse(MESSAGES.UNAUTHORIZED));
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);

    // Add user info to request
    req.user = decoded;

    await logger.info(
      "Authentication successful",
      {
        ...requestInfo,
        userId: decoded.userId || decoded.id,
        email: decoded.email,
        role: decoded.role,
        tokenExp: decoded.exp
          ? new Date(decoded.exp * 1000).toISOString()
          : null,
      },
      {
        userId: decoded.userId || decoded.id,
        source: "middleware.auth",
      }
    );

    next();
  } catch (err) {
    const errorInfo = {
      ...requestInfo,
      errorName: err.name,
      errorMessage: err.message,
    };

    if (err.name === "TokenExpiredError") {
      await logger.warn(
        "Authentication failed - token expired",
        {
          ...errorInfo,
          expiredAt: err.expiredAt ? err.expiredAt.toISOString() : null,
        },
        { source: "middleware.auth" }
      );
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(errorResponse(MESSAGES.TOKEN_EXPIRED));
    }

    if (err.name === "JsonWebTokenError") {
      await logger.warn(
        "Authentication failed - invalid token",
        { ...errorInfo },
        { source: "middleware.auth" }
      );
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(errorResponse(MESSAGES.TOKEN_INVALID));
    }

    if (err.name === "NotBeforeError") {
      await logger.warn(
        "Authentication failed - token not active yet",
        {
          ...errorInfo,
          notBefore: err.date ? err.date.toISOString() : null,
        },
        { source: "middleware.auth" }
      );
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(errorResponse(MESSAGES.TOKEN_INVALID));
    }

    // Unexpected JWT error
    await logger.error(
      "Authentication failed - unexpected JWT error",
      {
        ...errorInfo,
        stack: err.stack,
      },
      { source: "middleware.auth" }
    );

    return res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json(errorResponse(MESSAGES.TOKEN_INVALID));
  }
};

module.exports = auth;
