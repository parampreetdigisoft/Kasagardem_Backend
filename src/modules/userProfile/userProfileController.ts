import { Response, NextFunction } from "express";
import {
  successResponse,
  errorResponse,
} from "../../core/utils/responseFormatter";
import { HTTP_STATUS, MESSAGES } from "../../core/utils/constants";
import { info, error, warn } from "../../core/utils/logger";
import { CustomError } from "../../interface/Error";
import { AuthRequest } from "../../core/middleware/authMiddleware";
import { findUserByEmail } from "../auth/authRepository";
import { getDB } from "../../core/config/db";
import { IFullUserProfile, IUserProfile } from "../../interface/userProfile";
import { uploadBase64ToBunny } from "../../core/services/bunnyUploadService";
import {
  getUserProfileById,
  updateValidatedUserProfile,
} from "./userProfileModel";
import {
  deleteFileFromS3,
  getSignedFileUrl,
  uploadBase64ToS3,
} from "../../core/services/s3UploadService";

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
  const userPayload = req.user as { userEmail?: string } | undefined;

  if (!userPayload?.userEmail) {
    res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json(errorResponse("Unauthorized request"));
    return;
  }

  const client = await getDB();

  try {
    await info("User profile creation attempt", {
      email: userPayload.userEmail,
      action: "createUserProfile",
      req,
    });

    // 1️⃣ Check if user exists
    const userExists = await findUserByEmail(userPayload.userEmail);
    if (!userExists) {
      await error("Profile creation failed - User not found", {
        email: userPayload.userEmail,
        action: "createUserProfile",
        req,
      });
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse(MESSAGES.PROFILE_USER_NOTFOUND));
      return;
    }

    // 2️⃣ Check if profile already exists
    const existingProfile = await client.query<IUserProfile>(
      "SELECT * FROM userprofiles WHERE user_id = $1",
      [userExists.id]
    );

    if (existingProfile.rows.length > 0) {
      await warn("Profile creation failed - Profile already exists", {
        email: userPayload.userEmail,
        userId: userExists.id,
        action: "createUserProfile",
        req,
      });
      res
        .status(HTTP_STATUS.CONFLICT)
        .json(errorResponse("User profile already exists"));
      return;
    }

    // 3️⃣ Handle base64 image upload (if provided)
    let uploadedImageUrl: string | null = null;

    if (
      req.body.profileImage &&
      req.body.profileImage.startsWith("data:image")
    ) {
      try {
        const fileName = `profile_${userExists.id}_${Date.now()}.jpg`;
        uploadedImageUrl = await uploadBase64ToBunny(
          req.body.profileImage,
          fileName
        );

        await info("Profile image uploaded to BunnyCDN", {
          email: userPayload.userEmail,
          userId: userExists.id,
          imageUrl: uploadedImageUrl,
          action: "createUserProfile",
          req,
        });
      } catch (uploadErr: unknown) {
        const uploadError =
          uploadErr instanceof Error
            ? uploadErr
            : new Error("Unknown error occurred during BunnyCDN upload");

        await error("Failed to upload profile image to BunnyCDN", {
          email: userPayload.userEmail,
          userId: userExists.id,
          error: uploadError.message,
          req,
        });

        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(errorResponse("Failed to upload profile image"));
        return;
      }
    }

    // 4️⃣ Build profile data for insert
    const profileData = {
      ...req.body,
      userId: userExists.id,
      profileImage: uploadedImageUrl || req.body.profileImage || null,
    };

    const insertQuery = `
      INSERT INTO userprofiles (
        user_id, profile_image, date_of_birth, gender, bio,
        street, city, state, country, zip_code, occupation, company
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, $11, $12
      )
      RETURNING *;
    `;

    const values = [
      profileData.userId,
      profileData.profileImage,
      profileData.dateOfBirth || null,
      profileData.gender || null,
      profileData.bio || null,
      profileData.street || null,
      profileData.city || null,
      profileData.state || null,
      profileData.country || null,
      profileData.zipCode || null,
      profileData.occupation || null,
      profileData.company || null,
    ];

    const result = await client.query<IUserProfile>(insertQuery, values);
    const createdProfile = result.rows[0];

    await info("User profile created successfully", {
      email: userPayload.userEmail,
      userId: userExists.id,
      profileId: createdProfile?.id,
      action: "createUserProfile",
      profileFields: Object.keys(req.body),
      req,
    });

    res
      .status(HTTP_STATUS.CREATED)
      .json(successResponse(null, MESSAGES.PROFILE_CREATED));
  } catch (err: unknown) {
    const errorObj: CustomError =
      err instanceof Error
        ? (err as CustomError)
        : ({
            name: "UnknownError",
            message: "An unknown error occurred",
          } as CustomError);

    await error("Profile creation error", {
      email: userPayload.userEmail,
      error: errorObj.message,
      stack: errorObj.stack,
      action: "createUserProfile",
      req,
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
  const userPayload = req.user as { userEmail?: string } | undefined;

  if (!userPayload?.userEmail) {
    res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json(errorResponse("Unauthorized request"));
    return;
  }

  try {
    // 1️⃣ Get user basic details
    const user = await findUserByEmail(userPayload.userEmail);
    if (!user) {
      await error("Profile retrieval failed - User not found", {
        email: userPayload.userEmail,
        action: "getCurrentUserProfile",
        req,
      });
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse(MESSAGES.PROFILE_USER_NOTFOUND));
      return;
    }

    const client = getDB();

    // 2️⃣ Fetch user profile from PostgreSQL
    const { rows: profileRows } = await client.query(
      `
      SELECT 
        profile_image,
        date_of_birth,
        gender,
        bio,
        street,
        city,
        state,
        country,
        zip_code,
        occupation,
        company
      FROM userprofiles
      WHERE user_id = $1
      `,
      [user.id]
    );

    const userProfile = profileRows[0] || null;

    // 3️⃣ Build full response (typed)
    const fullProfile: IFullUserProfile = {
      name: user.name || null,
      email: user.email || null,
      contactNumber: user.phone_number || null,
      profileImage:
        (await getSignedFileUrl(userProfile?.profile_image)) || null,
      dateOfBirth: userProfile?.date_of_birth
        ? new Date(userProfile.date_of_birth).toISOString().split("T")[0]
        : null,
      gender:
        (userProfile?.gender as "male" | "female" | "other" | null) || null,
      bio: userProfile?.bio || null,
      address: {
        street: userProfile?.street || null,
        city: userProfile?.city || null,
        state: userProfile?.state || null,
        country: userProfile?.country || null,
        zipCode: userProfile?.zip_code || null, // ✅ fixed to match DB column
      },
      occupation: userProfile?.occupation || null,
      company: userProfile?.company || null,
    };

    await info("User profile retrieved successfully", {
      email: userPayload.userEmail,
      userId: user.id,
      action: "getCurrentUserProfile",
      req,
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
      req,
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
      req,
    });

    // 1️⃣ Find user
    const user = await findUserByEmail(userPayload.userEmail);
    if (!user) {
      await error("Profile update failed - User not found", {
        email: userPayload.userEmail,
        action: "updateUserProfile",
        req,
      });
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse(MESSAGES.PROFILE_USER_NOTFOUND));
      return;
    }

    const client = getDB();

    // 2️⃣ Find existing profile
    const { rows: existingProfileRows } = await client.query(
      `SELECT id FROM userprofiles WHERE user_id = $1`,
      [user.id]
    );

    if (existingProfileRows.length === 0) {
      await warn("Profile update failed - Profile not found", {
        email: userPayload.userEmail,
        userId: user.id,
        action: "updateUserProfile",
        req,
      });
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse("User profile not found"));
      return;
    }

    const profileId = existingProfileRows[0].id;

    // 3️⃣ Handle base64 image upload
    if (req.body.profileImage && typeof req.body.profileImage === "string") {
      const isBase64 = /^data:image\/[a-zA-Z]+;base64,/.test(
        req.body.profileImage
      );
      if (isBase64) {
        try {
          const plantName = `${Date.now()}.jpg`; // or `${user.id}_${Date.now()}.jpg`
          const userId = user.id!.toString(); // ensure string type
          const folder = "Users/ProfileImages"; // or any folder name you prefer
          // Fetch old profile image from DB
          const oldProfile = await getUserProfileById(profileId);
          const oldFileKey = oldProfile?.profile_image || null;

          // Upload new image
          const uploadedFileKey = await uploadBase64ToS3(
            req.body.profileImage,
            plantName,
            userId,
            folder
          );

          // Delete old image (if exists)
          if (oldFileKey) {
            await deleteFileFromS3(oldFileKey);
            await info("Deleted old profile image from S3", {
              userId: user.id,
              oldFileKey,
            });
          }

          // Assign new file key to request body
          req.body.profileImage = uploadedFileKey;
          await info("Profile image uploaded to Bunny CDN", {
            email: userPayload.userEmail,
            userId: user.id,
            uploadedFileKey,
            req,
          });
        } catch (uploadErr: unknown) {
          await error("Image upload to Bunny failed", {
            email: userPayload.userEmail,
            userId: user.id,
            error: (uploadErr as Error).message,
            req,
          });
          res
            .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
            .json(errorResponse("Failed to upload profile image"));
          return;
        }
      }
    }

    // 4️⃣ Validate and update using your service method
    const updatedProfile = await updateValidatedUserProfile(
      profileId,
      req.body
    );

    if (!updatedProfile) {
      await warn("Profile update failed - No record updated", {
        email: userPayload.userEmail,
        userId: user.id,
        req,
      });
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse("User profile not found"));
      return;
    }

    await info("User profile updated successfully", {
      email: userPayload.userEmail,
      userId: user.id,
      updatedFields: Object.keys(req.body),
      req,
    });

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse(null, MESSAGES.PROFILE_UPDATED));
  } catch (err: unknown) {
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
      req,
    });

    next(errorObj);
  }
};
