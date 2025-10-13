import { Response, NextFunction } from "express";
import UserProfile, { IUserProfile } from "./userProfileModel";
import User, { IUserDocument } from "../auth/authModel";
import {
  successResponse,
  errorResponse,
} from "../../core/utils/responseFormatter";
import { HTTP_STATUS, MESSAGES } from "../../core/utils/constants";
import { info, error, warn } from "../../core/utils/logger";
import { CustomError } from "../../interface/error";
import { AuthRequest } from "../../core/middleware/authMiddleware";
import { IFullUserProfile } from "../../interface/userProfile";

/**
 * Handles the creation of a new user profile.
 *
 * Validates the authenticated user's email, checks if the user exists,
 * and prevents duplicate profile creation. If valid, creates a new user
 * profile and responds with success, otherwise responds with appropriate
 * error messages.
 *
 * @param req - Express request object extended with authenticated user data.
 * @param res - Express response object for sending HTTP responses.
 * @param next - Express next function for passing errors to middleware.
 * @returns A promise that resolves to void.
 */
export const createUserProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Extract user info from JWT populated by auth middleware
  const userPayload = req.user as { userEmail?: string } | undefined;
  if (!userPayload?.userEmail) {
    res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json(errorResponse("Unauthorized request"));
    return;
  }
  try {
    await info("User profile creation attempt", {
      email: userPayload?.userEmail,
      action: "createUserProfile",
    });

    const userExists: IUserDocument | null = await User.findOne({
      email: userPayload?.userEmail,
    });
    if (!userExists) {
      await error("Profile creation failed - User not found", {
        email: userPayload?.userEmail,
        action: "createUserProfile",
      });
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse(MESSAGES.PROFILE_USER_NOTFOUND));
      return;
    }

    const existingProfile: IUserProfile | null = await UserProfile.findOne({
      userId: userExists._id,
    });

    if (existingProfile) {
      await warn("Profile creation failed - Profile already exists", {
        email: userPayload?.userEmail,
        userId: userExists._id,
        action: "createUserProfile",
      });
      res
        .status(HTTP_STATUS.CONFLICT)
        .json(errorResponse("User profile already exists"));
      return;
    }

    const profileData = { ...req.body, userId: userExists._id };
    await UserProfile.create(profileData);

    await info("User profile created successfully", {
      email: userPayload?.userEmail,
      userId: userExists._id,
      action: "createUserProfile",
      profileFields: Object.keys(req.body),
    });

    res
      .status(HTTP_STATUS.CREATED)
      .json(successResponse(null, MESSAGES.PROFILE_CREATED));
  } catch (err: unknown) {
    // ← Use 'unknown' as required by TypeScript
    // Type guard to safely work with the error
    const errorObj: CustomError =
      err instanceof Error
        ? (err as CustomError)
        : ({
            name: "UnknownError",
            message: "An unknown error occurred",
          } as CustomError);

    await error("Profile creation error", {
      email: userPayload?.userEmail,
      error: errorObj.message,
      stack: errorObj.stack,
      action: "createUserProfile",
    });
    next(errorObj);
  }
};

/**
 * Retrieves the currently authenticated user's profile.
 *
 * Validates the user's email from the request, ensures the user exists,
 * and fetches their profile from the database. If no profile is found,
 * responds with appropriate error messages. Otherwise, returns the
 * profile data in the response.
 *
 * @param req - Express request object extended with authenticated user data.
 * @param res - Express response object used to send HTTP responses.
 * @param next - Express next function for passing errors to error-handling middleware.
 * @returns A promise that resolves to void.
 */
export const getCurrentUserProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Extract user info from JWT populated by auth middleware
  const userPayload = req.user as { userEmail?: string } | undefined;
  if (!userPayload?.userEmail) {
    res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json(errorResponse("Unauthorized request"));
    return;
  }
  try {
    await info("User profile retrieval attempt", {
      email: userPayload?.userEmail,
      action: "getCurrentUserProfile",
    });

    const user: IUserDocument | null = await User.findOne({
      email: userPayload?.userEmail,
    });
    if (!user) {
      await error("Profile retrieval failed - User not found", {
        email: userPayload?.userEmail,
        action: "getCurrentUserProfile",
      });
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse(MESSAGES.PROFILE_USER_NOTFOUND));
      return;
    }

    // 2️⃣ Get user profile (if exists)
    const userProfile: IUserProfile | null = await UserProfile.findOne({
      userId: user._id,
    }).select("-_id -__v -createdAt -updatedAt");

    // 3️⃣ Build full merged response (ensuring all fields exist)
    const fullProfile: IFullUserProfile = {
      name: user.name || null,
      email: user.email || null,
      contactNumber: user.phoneNumber || null,
      profileImage: userProfile?.profileImage || null,
      dateOfBirth: userProfile?.dateOfBirth || null,
      gender: userProfile?.gender || null,
      bio: userProfile?.bio || null,
      address: {
        street: userProfile?.address?.street || null,
        city: userProfile?.address?.city || null,
        state: userProfile?.address?.state || null,
        country: userProfile?.address?.country || null,
        zipCode: userProfile?.address?.zipCode || null,
      },
      socialLinks: {
        facebook: userProfile?.socialLinks?.facebook || null,
        twitter: userProfile?.socialLinks?.twitter || null,
        linkedin: userProfile?.socialLinks?.linkedin || null,
        instagram: userProfile?.socialLinks?.instagram || null,
      },
      occupation: userProfile?.occupation || null,
      company: userProfile?.company || null,
    };

    await info("User profile retrieved successfully", {
      email: userPayload.userEmail,
      userId: user._id,
      action: "getCurrentUserProfile",
    });

    res.status(HTTP_STATUS.OK).json(successResponse(fullProfile));
  } catch (err: unknown) {
    const errorObj: CustomError =
      err instanceof Error
        ? (err as CustomError)
        : ({
            name: "UnknownError",
            message:
              typeof err === "string" ? err : "An unknown error occurred",
          } as CustomError);

    await error("Profile retrieval error", {
      email: userPayload?.userEmail,
      error: errorObj.message,
      stack: errorObj.stack,
      action: "getCurrentUserProfile",
    });
    next(errorObj);
  }
};

/**
 * Updates the authenticated user's profile.
 *
 * Validates the user from the request, checks if the profile exists,
 * and updates the profile with the provided data. If the profile or
 * user is not found, responds with an error. Otherwise, updates the
 * profile and returns a success response.
 *
 * @param req - Express request object extended with authenticated user data and update fields.
 * @param res - Express response object used to send HTTP responses.
 * @param next - Express next function for forwarding errors to middleware.
 * @returns A promise that resolves to void.
 */
export const updateUserProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userPayload = req.user as { userEmail?: string } | undefined;

  if (!userPayload?.userEmail) {
    res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json(errorResponse("Unauthorized request"));
    return;
  }

  try {
    await info("User profile update attempt", {
      email: userPayload.userEmail,
      action: "updateUserProfile",
      updateFields: Object.keys(req.body),
    });

    // 1️⃣ Find user
    const user: IUserDocument | null = await User.findOne({
      email: userPayload.userEmail,
    });
    if (!user) {
      await error("Profile update failed - User not found", {
        email: userPayload.userEmail,
        action: "updateUserProfile",
      });
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse(MESSAGES.PROFILE_USER_NOTFOUND));
      return;
    }

    // 2️⃣ Find profile for that user
    const profile = await UserProfile.findOne({ userId: user._id });
    if (!profile) {
      await warn("Profile update failed - Profile not found", {
        email: userPayload.userEmail,
        userId: user._id,
        action: "updateUserProfile",
      });
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse("User profile not found"));
      return;
    }

    // 2️⃣ Validate + Update profile using static method
    const updatedProfile = await UserProfile.updateValidated(
      profile._id.toString(),
      {
        ...req.body,
        userId: user._id.toString(),
        dateOfBirth: req.body.dateOfBirth
          ? new Date(req.body.dateOfBirth)
          : undefined,
      }
    );

    if (!updatedProfile) {
      await warn("Profile update failed - Profile not found", {
        email: userPayload.userEmail,
        userId: user._id,
        action: "updateUserProfile",
      });
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse("User profile not found"));
      return;
    }

    await info("User profile updated successfully", {
      email: userPayload.userEmail,
      userId: user._id,
      action: "updateUserProfile",
      updatedFields: Object.keys(req.body),
    });

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse(null, MESSAGES.PROFILE_UPDATED));
  } catch (err: unknown) {
    // ← Use 'unknown' as required by TypeScript
    // Type guard to safely work with the error
    const errorObj: CustomError =
      err instanceof Error
        ? (err as CustomError)
        : ({
            name: "UnknownError",
            message: "An unknown error occurred",
          } as CustomError);

    await error("Profile updation error", {
      email: userPayload?.userEmail,
      error: errorObj.message,
      stack: errorObj.stack,
      action: "updateUserProfile",
    });
    next(errorObj);
  }
};

/**
 * Deletes the authenticated user's profile.
 *
 * Validates the authenticated user from the request, checks if the user and
 * their profile exist, and deletes the profile if found. If the user or profile
 * does not exist, responds with the appropriate error. Logs all actions and
 * errors for auditing.
 *
 * @param req - Express request object extended with authenticated user data.
 * @param res - Express response object used to send HTTP responses.
 * @param next - Express next function for forwarding errors to middleware.
 * @returns A promise that resolves to void.
 */
export const deleteUserProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Extract user info from JWT populated by auth middleware
  const userPayload = req.user as { userEmail?: string } | undefined;
  if (!userPayload?.userEmail) {
    res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json(errorResponse("Unauthorized request"));
    return;
  }
  try {
    await info("User profile deletion attempt", {
      email: userPayload?.userEmail,
      action: "deleteUserProfile",
    });

    const user: IUserDocument | null = await User.findOne({
      email: userPayload?.userEmail,
    });
    if (!user) {
      await error("Profile deletion failed - User not found", {
        email: userPayload?.userEmail,
        action: "deleteUserProfile",
      });
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse(MESSAGES.PROFILE_USER_NOTFOUND));
      return;
    }

    const deletedProfile = await UserProfile.findOneAndDelete({
      userId: user._id,
    });

    if (!deletedProfile) {
      await warn("Profile deletion failed - Profile not found", {
        email: userPayload?.userEmail,
        userId: user._id,
        action: "deleteUserProfile",
      });
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse(MESSAGES.PROFILE_USER_NOTFOUND));
      return;
    }

    await info("User profile deleted successfully", {
      email: userPayload?.userEmail,
      userId: user._id,
      action: "deleteUserProfile",
    });

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse(null, MESSAGES.PROFILE_DELETED));
  } catch (err: unknown) {
    // Type guard to safely convert unknown to CustomError
    const errorObj: CustomError =
      err instanceof Error
        ? (err as CustomError)
        : ({
            name: "UnknownError",
            message:
              typeof err === "string" ? err : "An unknown error occurred",
          } as CustomError);

    await error("Profile deletion error", {
      email: userPayload?.userEmail,
      error: errorObj.message,
      stack: errorObj.stack,
      action: "deleteUserProfile",
    });
    next(errorObj);
  }
};
