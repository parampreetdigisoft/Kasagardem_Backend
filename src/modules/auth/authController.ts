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
import { CustomError } from "../../interface/Error";
import config from "../../core/config/env";
import { ZodError, ZodIssue } from "zod";
import { sendPasswordResetEmail } from "../../core/services/emailService";
import crypto from "crypto";

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

    // Create new user using validated DTO method
    const newUser: IUserDocument = await User.createValidated({
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
    // Handle validation errors from Zod
    if (err instanceof ZodError) {
      const formattedErrors = err.issues.map((e: ZodIssue) => ({
        field: e.path.join("."),
        message: e.message,
      }));

      await warn(
        "Registration failed - validation errors",
        { errors: formattedErrors },
        { source: "auth.register" }
      );

      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Validation failed",
        errors: formattedErrors,
      });
      return;
    }

    // Handle MongoDB duplicate key error
    const errorObj: CustomError & { keyPattern?: Record<string, unknown> } =
      err instanceof Error
        ? { ...err }
        : {
            name: "UnknownError",
            message:
              typeof err === "string" ? err : "An unknown error occurred",
          };

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
        audience: config.GOOGLE_CLIENT_ID as string,
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

/**
 * Sends a password reset token to user's email.
 *
 * @param {Request} req - Express request object containing user email.
 * @param {Response} res - Express response object used to send the response.
 * @param {NextFunction} next - Express next middleware function for error handling.
 * @returns {Promise<void>} Returns a promise that resolves when reset email is sent.
 */
export const sendPasswordResetToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    await info(
      "Password reset token request started",
      { email },
      { source: "auth.sendPasswordResetToken" }
    );

    const user = (await User.findOne({ email })) as IUserDocument | null;

    if (!user) {
      await warn(
        "Password reset token request failed - user not found",
        { email },
        { source: "auth.sendPasswordResetToken" }
      );
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse("User not found with this email address"));
      return;
    }

    // Generate 6-digit reset token
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the token before storing (for security)
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set token expiry (5 minutes)
    const resetTokenExpiry = new Date(Date.now() + 5 * 60 * 1000);

    // Save reset token to user
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = resetTokenExpiry;
    await user.save({ validateBeforeSave: false });

    // Send email with 6-digit token
    try {
      await sendPasswordResetEmail(user.email!, resetToken, user.name);

      await info(
        "Password reset token sent successfully",
        { email, userId: user._id },
        { userId: user._id.toString(), source: "auth.sendPasswordResetToken" }
      );

      res.status(HTTP_STATUS.OK).json(
        successResponse(
          {
            message: "Password reset token sent to your email",
            expiresIn: "15 minutes",
          },
          MESSAGES.PASSWORD_RESET_TOKEN_SENT
        )
      );
    } catch (emailError) {
      // Reset the token fields if email fails
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      await error(
        "Failed to send password reset token email",
        { email, userId: user._id, error: emailError },
        { userId: user._id.toString(), source: "auth.sendPasswordResetToken" }
      );

      res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json(errorResponse("Failed to send password reset email"));
      return;
    }
  } catch (err: unknown) {
    const errorObj: CustomError =
      err instanceof Error
        ? { ...err }
        : {
            name: "UnknownError",
            message:
              typeof err === "string" ? err : "An unknown error occurred",
          };

    await error(
      "Send password reset token failed with unexpected error",
      { error: errorObj.message, stack: errorObj.stack },
      { source: "auth.sendPasswordResetToken" }
    );

    next(errorObj);
  }
};
/**
 * Resends password reset token if the previous one expired or user needs a new one.
 *
 * @param {Request} req - Express request object containing user email.
 * @param {Response} res - Express response object used to send the response.
 * @param {NextFunction} next - Express next middleware function for error handling.
 * @returns {Promise<void>} Returns a promise that resolves when reset email is resent.
 */
export const resendPasswordResetToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    await info(
      "Resend password reset token request started",
      { email },
      { source: "auth.resendPasswordResetToken" }
    );

    const user = (await User.findOne({ email })) as IUserDocument | null;

    if (!user) {
      await warn(
        "Resend password reset failed - user not found",
        { email },
        { source: "auth.resendPasswordResetToken" }
      );
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse("User not found with this email address"));
      return;
    }

    // Check rate limiting: prevent spam (optional - only if existing token is still valid)
    if (user.passwordResetExpires && user.passwordResetExpires > new Date()) {
      const timeLeft = Math.ceil(
        (user.passwordResetExpires.getTime() - Date.now()) / (60 * 1000)
      );
      res
        .status(HTTP_STATUS.TOO_MANY_REQUESTS)
        .json(
          errorResponse(
            `Please wait ${timeLeft} minutes before requesting a new token`
          )
        );
      return;
    }

    // Generate new 6-digit reset token
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the token before storing
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const resetTokenExpiry = new Date(Date.now() + 5 * 60 * 1000);

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = resetTokenExpiry;
    await user.save({ validateBeforeSave: false });

    await sendPasswordResetEmail(user.email!, resetToken, user.name);

    await info(
      "Password reset token resent successfully",
      { email, userId: user._id },
      { userId: user._id.toString(), source: "auth.resendPasswordResetToken" }
    );

    res.status(HTTP_STATUS.OK).json(
      successResponse(
        {
          message: "New password reset token sent to your email",
          expiresIn: "15 minutes",
        },
        MESSAGES.PASSWORD_RESET_TOKEN_SENT
      )
    );
  } catch (err: unknown) {
    const errorObj: CustomError =
      err instanceof Error
        ? { ...err }
        : {
            name: "UnknownError",
            message:
              typeof err === "string" ? err : "An unknown error occurred",
          };

    await error(
      "Resend password reset token failed with unexpected error",
      { error: errorObj.message, stack: errorObj.stack },
      { source: "auth.resendPasswordResetToken" }
    );

    next(errorObj);
  }
};

/**
 * Verifies the password reset token sent to user's email.
 *
 * @param {Request} req - Express request object containing email and reset token.
 * @param {Response} res - Express response object used to send the response.
 * @param {NextFunction} next - Express next middleware function for error handling.
 * @returns {Promise<void>} Returns a promise that resolves when token verification is complete.
 */
export const verifyPasswordResetToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, token } = req.body;

    await info(
      "Password reset token verification attempt started",
      { email, token },
      { source: "auth.verifyPasswordResetToken" }
    );

    // Hash the provided token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = (await User.findOne({
      email,
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    })) as IUserDocument | null;

    if (!user) {
      await warn(
        "Password reset token verification failed - invalid or expired token",
        { email, token },
        { source: "auth.verifyPasswordResetToken" }
      );
      res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(errorResponse("Invalid or expired password reset token"));
      return;
    }

    await info(
      "Password reset token verification successful",
      { email, userId: user._id },
      { userId: user._id.toString(), source: "auth.verifyPasswordResetToken" }
    );

    res.status(HTTP_STATUS.OK).json(
      successResponse(
        {
          message: "Password reset token verified successfully",
          email: user.email,
          userId: user._id,
        },
        MESSAGES.PASSWORD_RESET_TOKEN_VERIFIED
      )
    );
  } catch (err: unknown) {
    const errorObj: CustomError =
      err instanceof Error
        ? { ...err }
        : {
            name: "UnknownError",
            message:
              typeof err === "string" ? err : "An unknown error occurred",
          };

    await error(
      "Password reset token verification failed with unexpected error",
      { error: errorObj.message, stack: errorObj.stack },
      { source: "auth.verifyPasswordResetToken" }
    );

    next(errorObj);
  }
};

/**
 * Resets user password after token verification.
 *
 * @param {Request} req - Express request object containing email, token, and new password.
 * @param {Response} res - Express response object used to send the response.
 * @param {NextFunction} next - Express next middleware function for error handling.
 * @returns {Promise<void>} Returns a promise that resolves when password reset is complete.
 */
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, token } = req.body;

    await info(
      "Password reset attempt started",
      { email },
      { source: "auth.resetPassword" }
    );

    // Hash the provided token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = (await User.findOne({
      email,
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    })) as IUserDocument | null;

    if (!user) {
      await warn(
        "Password reset failed - invalid or expired token",
        { email },
        { source: "auth.resetPassword" }
      );
      res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(errorResponse("Invalid or expired password reset token"));
      return;
    }

    // Update password and clear reset token fields
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save(); // This will trigger password hashing in pre-save hook

    await info(
      "Password reset successful",
      { email, userId: user._id },
      { userId: user._id.toString(), source: "auth.resetPassword" }
    );

    res.status(HTTP_STATUS.OK).json(
      successResponse(
        {
          message: "Password has been reset successfully",
          email: user.email,
        },
        MESSAGES.PASSWORD_RESET_SUCCESS
      )
    );
  } catch (err: unknown) {
    const errorObj: CustomError =
      err instanceof Error
        ? { ...err }
        : {
            name: "UnknownError",
            message:
              typeof err === "string" ? err : "An unknown error occurred",
          };

    await error(
      "Password reset failed with unexpected error",
      { error: errorObj.message, stack: errorObj.stack },
      { source: "auth.resetPassword" }
    );

    next(errorObj);
  }
};
