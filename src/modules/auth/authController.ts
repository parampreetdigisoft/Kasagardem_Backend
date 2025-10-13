import { Request, Response, NextFunction } from "express";
import User, { IUserDocument } from "./authModel";
import Role, { IRoleDocument } from "../roles/roleModel";
import {
  successResponse,
  errorResponse,
} from "../../core/utils/responseFormatter";
import { HTTP_STATUS, MESSAGES } from "../../core/utils/constants";
import { generateToken } from "../../core/utils/usableMethods";
import { info, error, warn } from "../../core/utils/logger";
// import { TokenPayload, LoginTicket } from "google-auth-library";
import { CustomError } from "../../interface/error";
import { ZodError, ZodIssue } from "zod";
import { sendPasswordResetEmail } from "../../core/services/emailService";
import crypto from "crypto";
import { RoleCodeMap } from "../../interface/role";
import UserProfile from "../userProfile/userProfileModel";
import { AuthRequest } from "../../core/middleware/authMiddleware";

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
    const { name, email, password, roleCode, phoneNumber } = req.body;

    await info(
      "User registration attempt started",
      { email, roleCode, hasPhoneNumber: !!phoneNumber },
      { source: "auth.register" }
    );

    // Validate role code using enum
    const roleName = RoleCodeMap[roleCode];
    if (!roleName) {
      await warn(
        "Registration failed - invalid role code",
        { email, roleCode },
        { source: "auth.register" }
      );
      res.status(HTTP_STATUS.OK).json(errorResponse(MESSAGES.ROLE_INVALID_ID));
      return;
    }

    // Find role by name (mapped from code)
    const role: IRoleDocument | null = await Role.findOne({ name: roleName });
    if (!role) {
      await warn(
        "Registration failed - role not found in DB",
        { email, roleName },
        { source: "auth.register" }
      );
      res.status(HTTP_STATUS.OK).json(errorResponse(MESSAGES.ROLE_INVALID_ID));
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
      res.status(HTTP_STATUS.OK).json(errorResponse(MESSAGES.USER_EXISTS));
      return;
    }

    // Create new user using validated DTO method
    const newUser: IUserDocument = await User.createValidated({
      name,
      email,
      password,
      roleId: role._id.toString(),
      phoneNumber,
    });

    await info(
      "User registration successful",
      { userId: newUser._id, email, roleCode, hasPhoneNumber: !!phoneNumber },
      { userId: newUser._id.toString(), source: "auth.register" }
    );

    // ✅ Create empty user profile linked to userId
    await UserProfile.create({
      userId: newUser._id,
    });

    await info(
      "User profile created successfully",
      { userId: newUser._id },
      { source: "auth.register" }
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
        .status(HTTP_STATUS.OK)
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
        .status(HTTP_STATUS.OK)
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
      res.status(HTTP_STATUS.OK).json(errorResponse("Role not found"));
      return;
    }

    // Generate JWT
    const token = generateToken(
      user.email as string,
      role.name as string,
      user._id.toString()
    );

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
 * Authenticates a user and returns a refresh JWT token.
 *
 * @param {AuthRequest} req - Express Auth Request.
 * @param {Response} res - Express response object used to send the response.
 * @param {NextFunction} next - Express next middleware function for error handling.
 * @returns {Promise<void>} Returns a promise that resolves when authentication is complete.
 */
export const refreshTokenLogin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Extract user info from JWT populated by auth middleware
  const userPayload = req.user as { userId?: string; exp?: number } | undefined;
  if (!userPayload?.userId) {
    res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json(errorResponse("Unauthorized request"));
    return;
  }

  // Check if token is expired
  const currentTimestamp = Math.floor(Date.now() / 1000);
  if (!userPayload.exp || userPayload.exp > currentTimestamp) {
    res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json(errorResponse("Token is still valid. Refresh not needed."));
    return;
  }
  try {
    await info(
      "Refresh User login attempt started",
      { userId: userPayload?.userId },
      { source: "auth.login" }
    );

    const user = (await User.findById(
      userPayload?.userId
    )) as IUserDocument | null;

    if (!user) {
      await warn(
        "Refresh Login failed - user not found",
        { userId: userPayload?.userId },
        { source: "auth.login" }
      );
      res
        .status(HTTP_STATUS.OK)
        .json(errorResponse(MESSAGES.INVALID_CREDENTIALS));
      return;
    }

    // Fetch role name
    const role = (await Role.findById(user.roleId).select(
      "name"
    )) as IRoleDocument | null;
    if (!role) {
      await error(
        "Refresh Login failed - role not found",
        { userId: user._id, roleId: user.roleId },
        { userId: user._id.toString(), source: "auth.login" }
      );
      res.status(HTTP_STATUS.OK).json(errorResponse("Role not found"));
      return;
    }

    // Generate JWT
    const token = generateToken(
      user.email as string,
      role.name as string,
      user._id.toString()
    );

    await info(
      "User refresh login successful",
      { userId: user._id, roleName: role.name },
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
      "Refresh Login failed with unexpected error",
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
// export const googleAuth = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const { idToken, roleId } = req.body;

//     await info(
//       "Google authentication attempt started",
//       { roleId, hasIdToken: !!idToken },
//       { source: "auth.googleAuth" }
//     );

//     if (!idToken) {
//       res
//         .status(HTTP_STATUS.OK)
//         .json(errorResponse("Google ID token is required"));
//       return;
//     }

//     if (!roleId) {
//       res.status(HTTP_STATUS.OK).json(errorResponse("Role ID is required"));
//       return;
//     }

//     const roleExists = (await Role.findById(roleId)) as IRoleDocument | null;
//     if (!roleExists) {
//       res.status(HTTP_STATUS.OK).json(errorResponse(MESSAGES.ROLE_INVALID_ID));
//       return;
//     }

//     // Verify Google token
//     let ticket: LoginTicket;
//     try {
//       ticket = await oauth2Client.verifyIdToken({
//         idToken,
//         audience: config.GOOGLE_CLIENT_ID as string,
//       });
//     } catch {
//       res.status(HTTP_STATUS.OK).json(errorResponse("Invalid Google token"));
//       return;
//     }

//     const payload: TokenPayload | undefined = ticket.getPayload();
//     if (!payload) {
//       res
//         .status(HTTP_STATUS.OK)
//         .json(errorResponse("Invalid Google token payload"));
//       return;
//     }

//     const { sub: googleId, email, name, email_verified } = payload;

//     if (!email_verified) {
//       res
//         .status(HTTP_STATUS.OK)
//         .json(errorResponse("Google email not verified"));
//       return;
//     }

//     // Check if user exists by googleId
//     let user = (await User.findOne({ googleId })) as IUserDocument | null;

//     if (user) {
//       const role = (await Role.findById(user.roleId).select(
//         "name"
//       )) as IRoleDocument;
//       const token = generateToken(
//         user.email as string,
//         role.name as string,
//         user._id.toString()
//       );

//       res
//         .status(HTTP_STATUS.OK)
//         .json(successResponse({ token }, MESSAGES.LOGIN_SUCCESS));
//       return;
//     }

//     // If not found by googleId, check by email
//     user = (await User.findOne({ email })) as IUserDocument | null;

//     if (user && !user.googleId) {
//       res
//         .status(HTTP_STATUS.OK)
//         .json(
//           errorResponse(
//             "Email already registered. Please login with email/password or contact support to link accounts."
//           )
//         );
//       return;
//     }

//     // Create new user
//     user = await User.create({
//       name,
//       email,
//       roleId,
//       googleId,
//     });

//     const role = (await Role.findById(roleId).select("name")) as IRoleDocument;
//     const token = generateToken(
//       user.email as string,
//       role.name as string,
//       user._id.toString()
//     );

//     res
//       .status(HTTP_STATUS.CREATED)
//       .json(successResponse({ token }, MESSAGES.USER_CREATED));
//   } catch (err: unknown) {
//     // Narrow unknown to CustomError safely
//     const errorObj: CustomError =
//       err instanceof Error
//         ? { ...err }
//         : { name: "UnknownError", message: "An unknown error occurred" };

//     await error(
//       "Google auth failed with unexpected error",
//       { error: errorObj.message, stack: errorObj.stack },
//       { source: "auth.googleAuth" }
//     );

//     next(errorObj);
//   }
// };

/**
 * Sends a password reset token to user's email.
 *
 * @param {Request} req - Express request object containing user email.
 * @param {Response} res - Express response object used to send the response.
 * @param {NextFunction} next - Express next middleware function for error handling.
 * @returns {Promise<void>} Returns a promise that resolves when reset email is sent.
 */
export const handlePasswordResetToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, isResend = false } = req.body;

    await info(
      `${isResend ? "Resend" : "Send"} password reset token request started`,
      { email },
      { source: "auth.handlePasswordResetToken" }
    );

    const user = (await User.findOne({ email })) as IUserDocument | null;

    if (!user) {
      await warn(
        `${isResend ? "Resend" : "Send"} password reset failed - user not found`,
        { email },
        { source: "auth.handlePasswordResetToken" }
      );
      res
        .status(HTTP_STATUS.OK)
        .json(errorResponse("User not found with this email address"));
      return;
    }

    // If it's a resend request and token still valid -> block
    if (
      isResend &&
      user.passwordResetExpires &&
      user.passwordResetExpires > new Date()
    ) {
      const timeLeft = Math.ceil(
        (user.passwordResetExpires.getTime() - Date.now()) / (60 * 1000)
      );
      res
        .status(HTTP_STATUS.OK)
        .json(
          errorResponse(
            `Please wait ${timeLeft} minute(s) before requesting a new token`
          )
        );
      return;
    }

    // Generate 6-digit reset token
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the token before storing
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Expiry time (5 min default, you can adjust if resend should be longer)
    const resetTokenExpiry = new Date(Date.now() + 5 * 60 * 1000);

    // Save reset token to user
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = resetTokenExpiry;
    await user.save({ validateBeforeSave: false });

    try {
      await sendPasswordResetEmail(user.email!, resetToken, user.name);

      await info(
        `${isResend ? "Resend" : "Send"} password reset token success`,
        { email, userId: user._id },
        { userId: user._id.toString(), source: "auth.handlePasswordResetToken" }
      );

      res.status(HTTP_STATUS.OK).json(
        successResponse(
          {
            message: `Password reset token ${
              isResend ? "resent" : "sent"
            } to your email`,
            expiresIn: "5 minutes",
          },
          MESSAGES.PASSWORD_RESET_TOKEN_SENT
        )
      );
    } catch (emailError) {
      // Reset fields if email fails
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      await error(
        "Failed to send password reset token email",
        { email, userId: user._id, error: emailError },
        { userId: user._id.toString(), source: "auth.handlePasswordResetToken" }
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
      "Password reset token request failed with unexpected error",
      { error: errorObj.message, stack: errorObj.stack },
      { source: "auth.handlePasswordResetToken" }
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
        .status(HTTP_STATUS.OK)
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
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, token } = req.body;
    let user: IUserDocument | null = null;
    const source = "auth.resetPassword";

    await info("Password reset attempt started", { email }, { source });

    // ✅ CASE 1: OTP-based reset
    if (token) {
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      user = await User.findOne({
        email,
        passwordResetToken: hashedToken,
      });

      if (!user) {
        await warn(
          "Invalid or expired password reset token",
          { email },
          { source }
        );
        res
          .status(HTTP_STATUS.OK)
          .json(errorResponse("Invalid or expired password reset token"));
        return;
      }
    }
    // ✅ CASE 2: JWT-based reset (auth middleware already decoded)
    else if (
      req.user &&
      typeof req.user === "object" &&
      "userEmail" in req.user
    ) {
      const userEmail = (req.user as { userEmail: string }).userEmail;
      user = await User.findOne({ email: userEmail });

      if (!user) {
        await warn(
          "User not found during JWT-based password reset",
          { userEmail },
          { source }
        );
        res.status(HTTP_STATUS.NOT_FOUND).json(errorResponse("User not found"));
        return;
      }
    } else {
      // No token or JWT → unauthorized
      await warn(
        "Password reset failed - missing OTP or JWT",
        { email },
        { source }
      );
      res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(errorResponse(MESSAGES.UNAUTHORIZED));
      return;
    }

    // ✅ Update password and clear reset fields
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    await info(
      "Password reset successful",
      { email: user.email, userId: user._id },
      { userId: user._id.toString(), source }
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
    const errorObj =
      err instanceof Error
        ? { name: err.name, message: err.message, stack: err.stack }
        : { name: "UnknownError", message: "An unknown error occurred" };

    await error("Password reset failed with unexpected error", errorObj, {
      source: "auth.resetPassword",
    });

    next(errorObj);
  }
};
