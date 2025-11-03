import { Request, Response, NextFunction } from "express";
import {
  successResponse,
  errorResponse,
} from "../../core/utils/responseFormatter";
import { HTTP_STATUS, MESSAGES } from "../../core/utils/constants";
import { generateToken } from "../../core/utils/usableMethods";
import { info, error, warn } from "../../core/utils/logger";
import { CustomError } from "../../interface/Error";
import { ZodError, ZodIssue } from "zod";
import { sendPasswordResetEmail } from "../../core/services/emailService";
import crypto from "crypto";
import { RoleCodeMap } from "../../interface/role";
import { AuthRequest } from "../../core/middleware/authMiddleware";
import { verifyFirebaseToken } from "../../core/services/firebaseAdmin";
import {
  comparePassword,
  createUserProfile,
  createValidatedUser,
  findRoleByName,
  findUserByEmail,
  findUserById,
  getRoleById,
  getRoleByName,
  resetPasswordResetFields,
  updatePasswordResetToken,
  updateUserPassword,
} from "./authRepository";
import { IUser } from "../../interface/user";
import bcrypt from "bcryptjs";
import { getDB } from "../../core/config/db";
interface AppError extends Error {
  code?: string;
}

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
      { source: "auth.register", req }
    );

    // ✅ Validate role code
    const roleName = RoleCodeMap[roleCode];
    if (!roleName) {
      await warn(
        "Invalid role code",
        { email, roleCode },
        { source: "auth.register", req }
      );
      res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(errorResponse(MESSAGES.ROLE_INVALID_ID));
      return;
    }

    // ✅ Fetch role by name (PostgreSQL)
    const role = await getRoleByName(roleName);

    if (!role) {
      await warn(
        "Role not found in database",
        { email, roleName },
        { source: "auth.register", req }
      );
      res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(errorResponse(MESSAGES.ROLE_INVALID_ID));
      return;
    }

    // ✅ Check if email already exists
    const existingUser = await findUserByEmail(email.toLowerCase());
    if (existingUser) {
      await warn(
        "User already exists",
        { email },
        { source: "auth.register", req }
      );
      res
        .status(HTTP_STATUS.CONFLICT)
        .json(errorResponse(MESSAGES.USER_EXISTS));
      return;
    }

    // ✅ Create user with validation
    const newUser = await createValidatedUser({
      name,
      email: email.toLowerCase(),
      password,
      roleId: role.id,
      phoneNumber,
    });

    await info("User registration successful", {
      userId: newUser.id,
      email,
      roleCode,
      req,
    });

    // ✅ Create empty user profile (if you have a `user_profiles` table)
    await createUserProfile(newUser.id!);

    await info(
      "User profile created successfully",
      { userId: newUser.id },
      { source: "auth.register", req }
    );

    res
      .status(HTTP_STATUS.CREATED)
      .json(successResponse(null, MESSAGES.USER_CREATED));
  } catch (err: unknown) {
    // 🔹 Handle validation errors (Zod)
    if (err instanceof ZodError) {
      const formattedErrors = err.issues.map((e: ZodIssue) => ({
        field: e.path.join("."),
        message: e.message,
      }));

      await warn(
        "Validation failed",
        { errors: formattedErrors },
        { source: "auth.register", req }
      );

      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Validation failed",
        errors: formattedErrors,
      });
      return;
    }

    // ✅ Use type narrowing for `Error`
    let errorMessage = "An unknown error occurred";
    let errorStack: string | undefined;

    if (err instanceof Error) {
      errorMessage = err.message;
      errorStack = err.stack;
    }

    // 🔹 Handle PostgreSQL unique constraint violation (email already taken)
    if (
      errorMessage.includes("duplicate key") &&
      errorMessage.includes("email")
    ) {
      await warn(
        "Duplicate email constraint violation",
        { error: errorMessage },
        { source: "auth.register", req }
      );
      res
        .status(HTTP_STATUS.CONFLICT)
        .json(errorResponse(MESSAGES.USER_EXISTS));
      return;
    }

    // 🔹 Log unexpected error
    await error(
      "Unexpected error during user registration",
      { error: errorMessage, stack: errorStack },
      { source: "auth.register", req }
    );

    next(err);
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

    await info("User login attempt", { email }, { source: "auth.login", req });

    // ✅ 1. Find user by email
    const user = await findUserByEmail(email.toLowerCase());

    if (!user || !user.password) {
      await warn(
        "Login failed - user not found or missing password",
        { email },
        { source: "auth.login", req }
      );
      res.status(HTTP_STATUS.OK).json(errorResponse(MESSAGES.USER_NOTFOUND));
      return;
    }

    // ✅ 2. Validate password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      await warn(
        "Login failed - invalid password",
        { email, userId: user.id },
        { userId: user.id!, source: "auth.login", req }
      );
      res
        .status(HTTP_STATUS.OK)
        .json(errorResponse(MESSAGES.INVALID_CREDENTIALS));
      return;
    }

    // ✅ 3. Fetch role from roles table
    const role = await getRoleById(user.role_id);

    if (!role) {
      await error(
        "Login failed - role not found",
        { email, userId: user.id, roleId: user.role_id },
        { userId: user.id!, source: "auth.login", req }
      );
      res.status(HTTP_STATUS.OK).json(errorResponse("Role not found"));
      return;
    }

    // ✅ 4. Generate JWT
    const token = generateToken(user.email.toLowerCase(), role.name, user.id!);

    await info(
      "User login successful",
      { email, userId: user.id, roleName: role.name },
      { userId: user.id!, source: "auth.login", req }
    );

    // ✅ 5. Send success response
    res
      .status(HTTP_STATUS.OK)
      .json(successResponse({ token }, MESSAGES.LOGIN_SUCCESS));
  } catch (err: unknown) {
    const errorObj =
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
      { source: "auth.login", req }
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
  // Extract user info from JWT (populated by auth middleware)
  const userPayload = req.user as { userId?: string; exp?: number } | undefined;

  if (!userPayload?.userId) {
    res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json(errorResponse("Unauthorized request"));
    return;
  }

  // Validate token expiry
  const currentTimestamp = Math.floor(Date.now() / 1000);
  if (!userPayload.exp || userPayload.exp <= currentTimestamp) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(
      errorResponse("Token has expired or is invalid", {
        code: "TOKEN_EXPIRED_OR_INVALID",
        statusCode: HTTP_STATUS.UNAUTHORIZED,
      })
    );
    return;
  }

  try {
    await info(
      "Refresh User login attempt started",
      { userId: userPayload.userId },
      { source: "auth.refresh", req }
    );

    // ✅ 1. Fetch user by ID
    const user = await findUserById(userPayload.userId);

    if (!user) {
      await warn(
        "Refresh Login failed - user not found",
        { userId: userPayload.userId },
        { source: "auth.refresh", req }
      );
      res
        .status(HTTP_STATUS.OK)
        .json(errorResponse(MESSAGES.INVALID_CREDENTIALS));
      return;
    }

    // ✅ 2. Fetch user role
    const role = await getRoleById(user.role_id);

    if (!role) {
      await error(
        "Refresh Login failed - role not found",
        { userId: user.id, roleId: user.role_id },
        { userId: user.id!, source: "auth.refresh", req }
      );
      res.status(HTTP_STATUS.OK).json(errorResponse("Role not found"));
      return;
    }

    // ✅ 3. Generate new JWT
    const token = generateToken(user.email, role.name, user.id!);

    await info(
      "User refresh login successful",
      { userId: user.id, roleName: role.name },
      { userId: user.id!, source: "auth.refresh", req }
    );

    // ✅ 4. Return refreshed token
    res
      .status(HTTP_STATUS.OK)
      .json(successResponse({ token }, MESSAGES.LOGIN_SUCCESS));
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
      "Refresh Login failed with unexpected error",
      { error: errorObj.message, stack: errorObj.stack },
      { source: "auth.refresh", req }
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
export const handlePasswordResetToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { email, isResend = false } = req.body;

  try {
    await info(
      `${isResend ? "Resend" : "Send"} password reset token request started`,
      { email },
      { source: "auth.handlePasswordResetToken", req }
    );

    // Step 1️⃣: Find user by email
    const user = await findUserByEmail(email);

    if (!user) {
      await warn(
        "Password reset failed - user not found",
        { email },
        { source: "auth.handlePasswordResetToken", req }
      );
      res
        .status(HTTP_STATUS.OK)
        .json(errorResponse("User not found with this email address"));
      return;
    }

    // Step 2️⃣: If resend and token still valid -> block
    if (
      isResend &&
      user.password_reset_expires &&
      new Date(user.password_reset_expires) > new Date()
    ) {
      const timeLeft = Math.ceil(
        (new Date(user.password_reset_expires).getTime() - Date.now()) /
          (60 * 1000)
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

    // Step 3️⃣: Generate secure reset token
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash before saving
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Expiry (5 minutes)
    const resetTokenExpiry = new Date(Date.now() + 5 * 60 * 1000);

    // Step 4️⃣: Update DB
    await updatePasswordResetToken(user.id!, hashedToken, resetTokenExpiry);

    // Step 5️⃣: Send email
    try {
      await sendPasswordResetEmail(user.email!, resetToken, user.name);

      await info(
        `${isResend ? "Resend" : "Send"} password reset token success`,
        { email, userId: user.id },
        { userId: user.id!, source: "auth.handlePasswordResetToken", req }
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
      await resetPasswordResetFields(user.id!);

      await error(
        "Failed to send password reset token email",
        { email, userId: user.id, error: emailError },
        { userId: user.id!, source: "auth.handlePasswordResetToken", req }
      );

      res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json(errorResponse("Failed to send password reset email"));
      return;
    }
  } catch (err: unknown) {
    const errorObj = err as AppError;
    await error(
      "Password reset token request failed with unexpected error",
      {
        email,
        error: errorObj.message,
        stack: errorObj.stack,
        code: errorObj.code,
      },
      { source: "auth.handlePasswordResetToken", req }
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
  const { email, token } = req.body;

  try {
    await info(
      "Password reset token verification attempt started",
      { email },
      { source: "auth.verifyPasswordResetToken", req }
    );

    // Step 1️⃣: Find user by email
    const user = await findUserByEmail(email);

    if (!user) {
      await warn(
        "Token verification failed - user not found",
        { email },
        { source: "auth.verifyPasswordResetToken", req }
      );
      res
        .status(HTTP_STATUS.OK)
        .json(errorResponse("Invalid or expired password reset token"));
      return;
    }

    // Step 2️⃣: Hash the provided token for comparison
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Step 3️⃣: Compare hashed token and expiry
    if (
      user.password_reset_token !== hashedToken ||
      !user.password_reset_expires ||
      new Date(user.password_reset_expires) <= new Date()
    ) {
      await warn(
        "Password reset token verification failed - invalid or expired token",
        { email },
        { source: "auth.verifyPasswordResetToken", req }
      );
      res
        .status(HTTP_STATUS.OK)
        .json(errorResponse("Invalid or expired password reset token"));
      return;
    }

    await info(
      "Password reset token verification successful",
      { email, userId: user.id },
      { userId: user.id!, source: "auth.verifyPasswordResetToken", req }
    );

    res.status(HTTP_STATUS.OK).json(
      successResponse(
        {
          message: "Password reset token verified successfully",
          email: user.email,
          userId: user.id,
        },
        MESSAGES.PASSWORD_RESET_TOKEN_VERIFIED
      )
    );
  } catch (err: unknown) {
    const errorObj = err as AppError;

    await error(
      "Password reset token verification failed with unexpected error",
      {
        email,
        error: errorObj.message,
        stack: errorObj.stack,
        code: errorObj.code,
      },
      { source: "auth.verifyPasswordResetToken", req }
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
  const source = "auth.resetPassword";
  const { email, password, token } = req.body;

  try {
    await info("Password reset attempt started", { email }, { source, req });

    let user = null;

    // ✅ CASE 1: OTP-based reset (via email + token)
    if (token) {
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      user = await findUserByEmail(email);

      if (
        !user ||
        user.password_reset_token !== hashedToken ||
        !user.password_reset_expires ||
        new Date(user.password_reset_expires) <= new Date()
      ) {
        await warn(
          "Invalid or expired password reset token",
          { email },
          { source, req }
        );
        res
          .status(HTTP_STATUS.OK)
          .json(errorResponse("Invalid or expired password reset token"));
        return;
      }
    }
    // ✅ CASE 2: JWT-based reset (req.user decoded by middleware)
    else if (req.user && typeof req.user === "object" && "userId" in req.user) {
      const { userId } = req.user as { userId: string };
      user = await findUserById(userId);

      if (!user) {
        await warn(
          "User not found during JWT-based password reset",
          { userId },
          { source, req }
        );
        res.status(HTTP_STATUS.NOT_FOUND).json(errorResponse("User not found"));
        return;
      }
    } else {
      // ❌ Missing OTP or JWT
      await warn(
        "Password reset failed - missing OTP or JWT",
        { email },
        { source, req }
      );
      res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(errorResponse(MESSAGES.UNAUTHORIZED));
      return;
    }

    // ✅ Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Update password and clear reset fields
    await updateUserPassword(user.id!, hashedPassword);

    await info(
      "Password reset successful",
      { email: user.email, userId: user.id },
      { userId: user.id!, source, req }
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
    const errorObj = err as AppError;

    await error(
      "Password reset failed with unexpected error",
      {
        email,
        error: errorObj.message,
        stack: errorObj.stack,
        code: errorObj.code,
      },
      { source, req }
    );

    next(errorObj);
  }
};

/**
 * Google Sign-In/Sign-Up handler
 * Verifies Firebase token and creates or logs in user
 *
 * @param {Request} req - Express request object containing Firebase idToken
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export const googleAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const source = "auth.googleAuth";

  try {
    const { idToken, roleCode } = req.body;

    if (!idToken) {
      res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(errorResponse("Firebase ID token is required"));
      return;
    }

    await info(
      "Google authentication attempt started",
      { hasRoleCode: !!roleCode },
      { source, req }
    );

    // ✅ Verify Firebase token
    let decodedToken;
    try {
      decodedToken = await verifyFirebaseToken(idToken);
    } catch (err) {
      await warn(
        "Google auth failed - invalid Firebase token",
        { error: err instanceof Error ? err.message : "Unknown error" },
        { source, req }
      );
      res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(errorResponse("Invalid or expired Firebase token"));
      return;
    }

    const { uid, email, name, picture } = decodedToken;

    if (!email) {
      await warn(
        "Google auth failed - no email in token",
        { uid },
        { source, req }
      );
      res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(errorResponse("Email not found in Google account"));
      return;
    }

    const db = await getDB();
    let user = await findUserByEmail(email);
    let isNewUser = false;

    // ✅ Case: New User Registration
    if (!user) {
      isNewUser = true;

      // Determine role
      let roleName = "user";
      if (roleCode) {
        const mappedRole = RoleCodeMap[roleCode];
        if (!mappedRole) {
          await warn(
            "Google auth failed - invalid role code",
            { email, roleCode },
            { source, req }
          );
          res
            .status(HTTP_STATUS.BAD_REQUEST)
            .json(errorResponse(MESSAGES.ROLE_INVALID_ID));
          return;
        }
        roleName = mappedRole;
      }

      const role = await findRoleByName(roleName);
      if (!role) {
        await warn(
          "Google auth failed - role not found",
          { email },
          { source, req }
        );
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(errorResponse("Valid role is required for registration"));
        return;
      }

      // Insert new user
      const insertUserQuery = `
        INSERT INTO users (name, email, firebase_uid, role_id, is_email_verified, created_at, updated_at)
        VALUES ($1, $2, $3, $4, true, NOW(), NOW())
        RETURNING id, name, email, role_id;
      `;
      const result = await db.query(insertUserQuery, [
        name || email.split("@")[0],
        email,
        uid,
        role.id,
      ]);
      user = result.rows[0] as IUser;

      await info(
        "New user created via Google Sign-In",
        { userId: user.id, email, roleCode },
        { userId: user.id!, source, req }
      );

      // Create user profile entry
      await db.query(
        `INSERT INTO user_profiles (user_id, created_at, updated_at) VALUES ($1, NOW(), NOW());`,
        [user.id]
      );

      await info(
        "User profile created for Google user",
        { userId: user.id },
        { userId: user.id!, source, req }
      );
    } else {
      // ✅ Case: Existing user
      const updates: string[] = [];
      const values: unknown[] = [];
      let index = 1;

      if (!user.firebase_uid) {
        updates.push(`firebase_uid = $${index++}`);
        values.push(uid);
      }
      if (picture && user.profile_picture !== picture) {
        updates.push(`profile_picture = $${index++}`);
        values.push(picture);
      }

      if (updates.length > 0) {
        const updateQuery = `
          UPDATE users SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${index}
        `;
        values.push(user.id);
        await db.query(updateQuery, values);
      }

      await info(
        "Existing user logged in via Google",
        { userId: user.id, email },
        { userId: user.id!, source, req }
      );
    }

    // ✅ Fetch role name for JWT
    const roleResult = await db.query(
      `SELECT name FROM roles WHERE id = $1 LIMIT 1;`,
      [user.role_id]
    );
    const roleName = roleResult.rows[0]?.name;

    if (!roleName) {
      await error(
        "Google auth failed - role not found for user",
        { email, userId: user.id, roleId: user.role_id },
        { userId: user.id!, source, req }
      );
      res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json(errorResponse("User role configuration error"));
      return;
    }

    // ✅ Generate JWT token
    const token = generateToken(user.email, roleName, user.id!);

    await info(
      "Google authentication successful",
      { userId: user.id, email, isNewUser, roleName },
      { userId: user.id!, source, req }
    );

    res.status(HTTP_STATUS.OK).json(
      successResponse(
        {
          token,
          isNewUser,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            profilePicture: user.profile_picture,
          },
        },
        isNewUser ? MESSAGES.USER_CREATED : MESSAGES.LOGIN_SUCCESS
      )
    );
  } catch (err: unknown) {
    const errorObj = err as AppError;

    await error(
      "Google authentication failed with unexpected error",
      { error: errorObj.message, stack: errorObj.stack, code: errorObj.code },
      { source, req }
    );

    next(errorObj);
  }
};
