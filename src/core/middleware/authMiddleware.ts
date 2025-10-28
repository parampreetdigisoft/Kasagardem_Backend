import { Request, Response, NextFunction } from "express";
import jwt, {
  JwtPayload,
  JsonWebTokenError,
  NotBeforeError,
  TokenExpiredError,
} from "jsonwebtoken";

import config from "../config/env";
import { errorResponse } from "../utils/responseFormatter";
import { HTTP_STATUS, MESSAGES } from "../utils/constants";
import { info, warn, error, debug } from "../utils/logger";

// Extend Express Request to include user
export interface AuthRequest extends Request {
  user?: JwtPayload | string | unknown;
}

interface AuthTokenPayload extends JwtPayload {
  userId: string;
  userEmail: string;
  role: string;
}

/**
 * Middleware to authenticate requests using a JWT token.
 * Extracts the token from the Authorization header, verifies it, and attaches
 * the decoded user payload to `req.user`. If the token is missing or invalid,
 * responds with an Unauthorized error.
 *
 * @param {AuthRequest} req - Express request object extended with `user` for decoded JWT payload.
 * @param {Response} res - Express response object used to return Unauthorized errors.
 * @param {NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} Resolves when authentication passes or response is sent on failure.
 * @throws {Error} If the JWT token is expired, invalid, or not active.
 */
const auth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const requestInfo = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get("User-Agent"),
  };

  try {
    await debug(
      "Authentication middleware started",
      {
        ...requestInfo,
        hasAuthHeader: !!req.header("Authorization"),
      },
      { source: "middleware.auth" }
    );

    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      await warn(
        "Authentication failed - missing token",
        { ...requestInfo },
        { source: "middleware.auth" }
      );
      res.status(HTTP_STATUS.UNAUTHORIZED).json(
        errorResponse(MESSAGES.TOKEN_MISSING, {
          code: "TOKEN_MISSING",
          statusCode: HTTP_STATUS.UNAUTHORIZED,
        })
      );
      return;
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as AuthTokenPayload;

    // Decode base64 values
    const decodedUser = {
      userEmail: Buffer.from(decoded.userEmail, "base64").toString("utf-8"),
      role: Buffer.from(decoded.role, "base64").toString("utf-8"),
      userId: Buffer.from(decoded.userId, "base64").toString("utf-8"),
      ...(decoded.exp && { exp: decoded.exp }), // Preserve exp if it exists
      ...(decoded.iat && { iat: decoded.iat }), // Preserve iat if it exists
    };

    // Add decoded user info to request
    req.user = decodedUser;

    await info(
      "Authentication successful",
      {
        ...requestInfo,
        email: decoded.userEmail,
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
  } catch (err: unknown) {
    if (err instanceof TokenExpiredError) {
      await warn(
        "Authentication failed - token expired",
        {
          ...requestInfo,
          expiredAt: err.expiredAt ? err.expiredAt.toISOString() : null,
        },
        { source: "middleware.auth" }
      );
      res.status(HTTP_STATUS.UNAUTHORIZED).json(
        errorResponse(MESSAGES.TOKEN_EXPIRED, {
          code: "TOKEN_EXPIRED",
          statusCode: HTTP_STATUS.UNAUTHORIZED,
        })
      );
      return;
    }

    if (err instanceof JsonWebTokenError) {
      await warn(
        "Authentication failed - invalid token",
        { ...requestInfo, errorName: err.name, errorMessage: err.message },
        { source: "middleware.auth" }
      );
      res.status(HTTP_STATUS.UNAUTHORIZED).json(
        errorResponse(MESSAGES.TOKEN_INVALID, {
          code: "TOKEN_INVALID",
          statusCode: HTTP_STATUS.UNAUTHORIZED,
        })
      );
      return;
    }

    if (err instanceof NotBeforeError) {
      await warn(
        "Authentication failed - token not active yet",
        { ...requestInfo, notBefore: err.date ? err.date.toISOString() : null },
        { source: "middleware.auth" }
      );
      res.status(HTTP_STATUS.UNAUTHORIZED).json(
        errorResponse(MESSAGES.TOKEN_NOT_ACTIVE, {
          code: "TOKEN_NOT_ACTIVE",
          statusCode: HTTP_STATUS.UNAUTHORIZED,
        })
      );
      return;
    }

    // Unexpected error
    const errorInfo = {
      ...requestInfo,
      errorName: err instanceof Error ? err.name : "UnknownError",
      errorMessage: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    };

    await error("Authentication failed - unexpected JWT error", errorInfo, {
      source: "middleware.auth",
    });

    res.status(HTTP_STATUS.UNAUTHORIZED).json(
      errorResponse(MESSAGES.JWT_UNKNOWN_ERROR, {
        code: "JWT_UNKNOWN_ERROR",
        statusCode: HTTP_STATUS.UNAUTHORIZED,
      })
    );
  }
};

export default auth;
