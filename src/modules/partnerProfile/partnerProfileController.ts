import { Response, NextFunction } from "express";
import {
  successResponse,
  errorResponse,
} from "../../core/utils/responseFormatter";
import { HTTP_STATUS, MESSAGES } from "../../core/utils/constants";
import { info, error } from "../../core/utils/logger";
import { CustomError } from "../../interface/Error";
import { AuthRequest } from "../../core/middleware/authMiddleware";
import PartnerProfile from "./partnerProfileModel";
import { uploadBase64ToBunny } from "../../core/services/bunnyUploadService";
import { findUserByEmail } from "../auth/authRepository";

/**
 * Create a new Partner Profile.
 * @param req
 * @param res
 * @param next
 */
export const createPartnerProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const partnerPayload = req.user as { userEmail?: string } | undefined;
  if (!partnerPayload?.userEmail) {
    res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json(errorResponse("Unauthorized request"));
    return;
  }

  try {
    await info("Partner profile creation attempt", {
      email: partnerPayload.userEmail,
    });

    const user = await findUserByEmail(partnerPayload.userEmail);
    if (!user) {
      await error("Partner profile creation failed - User not found", {
        email: partnerPayload.userEmail,
        action: "createPartnerProfile",
      });
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse(MESSAGES.PROFILE_USER_NOTFOUND));
      return;
    }

    const existingProfile = await PartnerProfile.findOne({
      email: partnerPayload.userEmail,
    });
    if (existingProfile) {
      res
        .status(HTTP_STATUS.CONFLICT)
        .json(errorResponse("Partner profile already exists"));
      return;
    }

    let projectImageUrl: string | undefined;
    if (
      req.body.projectImageUrl &&
      req.body.projectImageUrl.startsWith("data:image")
    ) {
      try {
        const fileName = `partner_${Date.now()}.png`; // Could determine extension dynamically
        projectImageUrl = await uploadBase64ToBunny(
          req.body.projectImageUrl,
          fileName
        );
      } catch (err) {
        console.error("Bunny upload failed:", err);
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(errorResponse("Image upload failed"));
        return;
      }
    }

    const profileData = {
      ...req.body,
      projectImageUrl: projectImageUrl,
      email: req.body.email ?? user.email,
    };

    await PartnerProfile.createValidated(profileData);

    await info("Partner profile created successfully", {
      userId: user.id!,
    });

    res
      .status(HTTP_STATUS.CREATED)
      .json(successResponse(null, MESSAGES.PROFILE_CREATED));
  } catch (err) {
    const errorObj: CustomError =
      err instanceof Error
        ? err
        : { name: "UnknownError", message: "An unknown error occurred" };
    await error("Partner profile creation error", {
      email: partnerPayload?.userEmail,
      error: errorObj.message,
      stack: errorObj.stack,
    });
    next(errorObj);
  }
};

/**
 * Get all partner profiles.
 * @param req
 * @param res
 * @param next
 */
export const getAllPartnerProfiles = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Fetch all partner profiles, exclude metadata fields
    const profiles = await PartnerProfile.find()
      .select("-__v -createdAt -updatedAt")
      .lean();

    if (!profiles || profiles.length === 0) {
      res
        .status(HTTP_STATUS.OK)
        .json(successResponse([], "No partner profiles found"));
      return;
    }

    // No Base64 conversion, just return stored URLs
    res.status(HTTP_STATUS.OK).json(successResponse(profiles));
  } catch (err) {
    const errorObj: CustomError =
      err instanceof Error
        ? err
        : { name: "UnknownError", message: "An unknown error occurred" };
    await error("Error fetching all partner profiles", {
      error: errorObj.message,
      stack: errorObj.stack,
    });
    next(errorObj);
  }
};

/**
 * Update partner profile.
 * @param req
 * @param res
 * @param next
 */
export const updatePartnerProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;

  try {
    const existingProfile = await PartnerProfile.findById(id);
    if (!existingProfile) {
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse("Partner profile not found"));
      return;
    }

    let projectImageUrl: string | undefined;

    // Handle new image upload if provided
    if (
      req.body.projectImageUrl &&
      req.body.projectImageUrl.startsWith("data:image")
    ) {
      try {
        const fileName = `partner_${Date.now()}.png`; // Could detect extension dynamically
        projectImageUrl = await uploadBase64ToBunny(
          req.body.projectImageUrl,
          fileName
        );
      } catch (err) {
        console.error("Bunny upload failed:", err);
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(errorResponse("Image upload failed"));
        return;
      }
    }

    const updateData = {
      ...req.body,
      projectImageUrl: projectImageUrl ?? existingProfile.projectImageUrl, // keep old URL if no new image
    };

    const updatedProfile = await PartnerProfile.updateValidated(
      id!,
      updateData
    );

    if (!updatedProfile) {
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse("Partner profile not found"));
      return;
    }

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse(updatedProfile, MESSAGES.PROFILE_UPDATED));
  } catch (err) {
    const errorObj: CustomError =
      err instanceof Error
        ? err
        : { name: "UnknownError", message: "An unknown error occurred" };
    await error("Partner profile update error", {
      id,
      error: errorObj.message,
      stack: errorObj.stack,
    });
    next(errorObj);
  }
};

/**
 * Updates the rating of a specific partner profile by their partnerId.
 * Accepts partnerId and rating in the request body.
 *
 * @param req Express request object
 * @param res Express response object
 * @param next Express next middleware function
 */
export const updatePartnerRating = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { partnerId, rating } = req.body;

  try {
    const updatedProfile = await PartnerProfile.updateRating(
      partnerId,
      rating
    );

    if (!updatedProfile) {
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse("Partner profile not found"));
      return;
    }

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse(null, "Rating updated successfully"));
  } catch (err) {
    next(err);
  }
};

/**
 * Delete partner profile by ID.
 * @param req
 * @param res
 * @param next
 */
export const deletePartnerProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;

  try {
    const deletedProfile = await PartnerProfile.findByIdAndDelete(id);

    if (!deletedProfile) {
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse("Partner profile not found"));
      return;
    }

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse(null, MESSAGES.PROFILE_DELETED));
  } catch (err) {
    const errorObj: CustomError =
      err instanceof Error
        ? err
        : { name: "UnknownError", message: "An unknown error occurred" };
    await error("Partner profile deletion error", {
      id,
      error: errorObj.message,
      stack: errorObj.stack,
    });
    next(errorObj);
  }
};
