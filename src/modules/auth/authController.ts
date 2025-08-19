import { Request, Response, NextFunction } from "express";
import User, { IUserDocument } from "./authModel";
import Role, { IRoleDocument } from "../roles/roleModel";
import {
  successResponse,
  errorResponse,
} from "../../core/utils/responseFormatter";
import { HTTP_STATUS, MESSAGES } from "../../core/utils/constants";
import { generateToken, oauth2Client } from "../../core/utils/usableMethods";
import { info, error, warn } from "../../core/utils/logger";
import { TokenPayload, LoginTicket } from "google-auth-library";
import { AuthRequest } from "../../core/middleware/authMiddleware";
import { CustomError } from "../../interface/Error";

/**
 * Registers a new user in the system.
 *
 * @param {Request} req - Express request object containing user registration data.
 * @param {Response} res - Express response object used to send responses.
 * @param {NextFunction} next - Express next middleware function for error handling.
 * @returns {Promise<void>} Returns a promise that resolves when the operation is complete.
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, roleId, phoneNumber } = req.body;

    await info(
      "User registration attempt started",
      { email, roleId, hasPhoneNumber: !!phoneNumber },
      { source: "auth.register" }
    );

    // Check if roleId exists
    const roleExists: IRoleDocument | null = await Role.findById(roleId);
    if (!roleExists) {
      await warn(
        "Registration failed - invalid role ID",
        { email, roleId },
        { source: "auth.register" }
      );
      res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(errorResponse(MESSAGES.ROLE_INVALID_ID));
      return;
    }

    // Check if user email already exists
    const existingUser: IUserDocument | null = await User.findOne({ email });
    if (existingUser) {
      await warn(
        "Registration failed - user already exists",
        { email },
        { source: "auth.register" }
      );
      res
        .status(HTTP_STATUS.CONFLICT)
        .json(errorResponse(MESSAGES.USER_EXISTS));
      return;
    }

    // Create new user
    const newUser: IUserDocument = await User.create({
      name,
      email,
      password,
      roleId,
      phoneNumber,
    });

    await info(
      "User registration successful",
      { userId: newUser._id, email, roleId, hasPhoneNumber: !!phoneNumber },
      { userId: newUser._id.toString(), source: "auth.register" }
    );

    res
      .status(HTTP_STATUS.CREATED)
      .json(successResponse(null, MESSAGES.USER_CREATED));
  } catch (err: unknown) {
    // Convert unknown error to a typed CustomError
    const errorObj: CustomError & { keyPattern?: Record<string, unknown> } =
      err instanceof Error
        ? { ...err }
        : {
            name: "UnknownError",
            message:
              typeof err === "string" ? err : "An unknown error occurred",
          };

    // Handle MongoDB duplicate key error
    if (errorObj.code === 11000 && errorObj.keyPattern?.email) {
      await warn(
        "Registration failed - duplicate email constraint",
        { error: errorObj.message },
        { source: "auth.register" }
      );
      res
        .status(HTTP_STATUS.CONFLICT)
        .json(errorResponse(MESSAGES.USER_EXISTS));
      return;
    }

    await error(
      "User registration failed with unexpected error",
      { error: errorObj.message, stack: errorObj.stack },
      { source: "auth.register" }
    );

    next(errorObj);
  }
};

/**
 * Authenticates a user and returns a JWT token.
 *
 * @param {Request} req - Express request object containing login credentials (email, password).
 * @param {Response} res - Express response object used to send the response.
 * @param {NextFunction} next - Express next middleware function for error handling.
 * @returns {Promise<void>} Returns a promise that resolves when authentication is complete.
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    await info(
      "User login attempt started",
      { email },
      { source: "auth.login" }
    );

    const user = (await User.findOne({ email }).select(
      "+password"
    )) as IUserDocument | null;

    if (!user) {
      await warn(
        "Login failed - user not found",
        { email },
        { source: "auth.login" }
      );
      res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(errorResponse(MESSAGES.INVALID_CREDENTIALS));
      return;
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await warn(
        "Login failed - invalid password",
        { email, userId: user._id },
        { userId: user._id.toString(), source: "auth.login" }
      );
      res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(errorResponse(MESSAGES.INVALID_CREDENTIALS));
      return;
    }

    // Fetch role name
    const role = (await Role.findById(user.roleId).select(
      "name"
    )) as IRoleDocument | null;
    if (!role) {
      await error(
        "Login failed - role not found",
        { email, userId: user._id, roleId: user.roleId },
        { userId: user._id.toString(), source: "auth.login" }
      );
      res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(errorResponse("Role not found"));
      return;
    }

    // Generate JWT
    const token = generateToken(user.email as string, role.name as string);

    await info(
      "User login successful",
      { email, userId: user._id, roleName: role.name },
      { userId: user._id.toString(), source: "auth.login" }
    );

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse({ token }, MESSAGES.LOGIN_SUCCESS));
  } catch (err: unknown) {
    // Narrow unknown to CustomError safely
    const errorObj: CustomError =
      err instanceof Error
        ? { ...err }
        : {
            name: "UnknownError",
            message:
              typeof err === "string" ? err : "An unknown error occurred",
          };

    await error(
      "Login failed with unexpected error",
      { error: errorObj.message, stack: errorObj.stack },
      { source: "auth.login" }
    );

    next(errorObj);
  }
};

/**
 * Retrieves the profile of the authenticated user.
 *
 * This endpoint requires authentication. The user's email is extracted
 * from the JWT token populated by the auth middleware.
 *
 * @param {AuthRequest} req - Express request object with authenticated user info in `req.user`.
 * @param {Response} res - Express response object used to send the response.
 * @param {NextFunction} next - Express next middleware function for error handling.
 * @returns {Promise<void>} Returns a promise that resolves when the profile retrieval completes.
 */
export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await info("Get profile request started", { source: "auth.getProfile" });

    // Extract user info from JWT populated by auth middleware
    const userPayload = req.user as { userEmail?: string } | undefined; // JwtPayload or your custom type

    if (!userPayload?.userEmail) {
      await warn("Get profile failed - missing user info in token", {
        source: "auth.getProfile",
      });
      res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(errorResponse(MESSAGES.UNAUTHORIZED));
      return;
    }

    // Fetch user from DB
    const user: IUserDocument | null = await User.findOne({
      email: userPayload.userEmail,
    });

    if (!user) {
      await warn(
        "Get profile failed - user not found",
        { requestedEmail: userPayload.userEmail },
        { source: "auth.getProfile" }
      );
      res.status(HTTP_STATUS.NOT_FOUND).json(errorResponse("User not found"));
      return;
    }

    await info(
      "Get profile successful",
      { userId: user._id, email: user.email },
      { source: "auth.getProfile" }
    );

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse(user, MESSAGES.PROFILE_SUCCESS));
  } catch (err: unknown) {
    const errorObj: CustomError =
      err instanceof Error
        ? { ...err }
        : { name: "UnknownError", message: "An unknown error occurred" };

    await error(
      "Get profile failed with unexpected error",
      {
        error: errorObj.message,
        stack: errorObj.stack,
      },
      { source: "auth.getProfile" }
    );

    next(errorObj);
  }
};

/**
 * Handles Google Authentication.
 *
 * This endpoint verifies the Google ID token, checks role validity,
 * and either logs in an existing user or creates a new user.
 *
 * @param {Request} req - Express request object containing `idToken` and `roleId` in `req.body`.
 * @param {Response} res - Express response object used to send the response.
 * @param {NextFunction} next - Express next middleware function for error handling.
 * @returns {Promise<void>} Returns a promise that resolves when authentication completes.
 */
export const googleAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { idToken, roleId } = req.body;

    await info(
      "Google authentication attempt started",
      { roleId, hasIdToken: !!idToken },
      { source: "auth.googleAuth" }
    );

    if (!idToken) {
      res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(errorResponse("Google ID token is required"));
      return;
    }

    if (!roleId) {
      res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(errorResponse("Role ID is required"));
      return;
    }

    const roleExists = (await Role.findById(roleId)) as IRoleDocument | null;
    if (!roleExists) {
      res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(errorResponse(MESSAGES.ROLE_INVALID_ID));
      return;
    }

    // Verify Google token
    let ticket: LoginTicket;
    try {
      ticket = await oauth2Client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID as string, // ✅ cast to string
      });
    } catch {
      res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(errorResponse("Invalid Google token"));
      return;
    }

    const payload: TokenPayload | undefined = ticket.getPayload();
    if (!payload) {
      res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(errorResponse("Invalid Google token payload"));
      return;
    }

    const { sub: googleId, email, name, email_verified } = payload;

    if (!email_verified) {
      res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(errorResponse("Google email not verified"));
      return;
    }

    // Check if user exists by googleId
    let user = (await User.findOne({ googleId })) as IUserDocument | null;

    if (user) {
      const role = (await Role.findById(user.roleId).select(
        "name"
      )) as IRoleDocument;
      const token = generateToken(user.email as string, role.name);

      res
        .status(HTTP_STATUS.OK)
        .json(successResponse({ token }, MESSAGES.LOGIN_SUCCESS));
      return;
    }

    // If not found by googleId, check by email
    user = (await User.findOne({ email })) as IUserDocument | null;

    if (user && !user.googleId) {
      res
        .status(HTTP_STATUS.CONFLICT)
        .json(
          errorResponse(
            "Email already registered. Please login with email/password or contact support to link accounts."
          )
        );
      return;
    }

    // Create new user
    user = await User.create({
      name,
      email,
      roleId,
      googleId,
    });

    const role = (await Role.findById(roleId).select("name")) as IRoleDocument;
    const token = generateToken(user.email as string, role.name);

    res
      .status(HTTP_STATUS.CREATED)
      .json(successResponse({ token }, MESSAGES.USER_CREATED));
  } catch (err: unknown) {
    // Narrow unknown to CustomError safely
    const errorObj: CustomError =
      err instanceof Error
        ? { ...err }
        : { name: "UnknownError", message: "An unknown error occurred" };

    await error(
      "Google auth failed with unexpected error",
      { error: errorObj.message, stack: errorObj.stack },
      { source: "auth.googleAuth" }
    );

    next(errorObj);
  }
};
