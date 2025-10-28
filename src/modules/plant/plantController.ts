import { Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AuthRequest } from "../../core/middleware/authMiddleware";
import { HTTP_STATUS } from "../../core/utils/constants";
import {
  errorResponse,
  successResponse,
} from "../../core/utils/responseFormatter";
import Plant from "./plantModel";
import { info } from "console";
import { uploadBase64ToBunny } from "../../core/services/bunnyUploadService";
import { findUserByEmail } from "../auth/authRepository";

/**
 * Handles creation of a new plant.
 * Validates authenticated user and saves the plant to the database.
 *
 * @param req - Express request object containing plant data in body
 * @param res - Express response object
 * @param next - Express next middleware function for error handling
 * @returns Promise<void>
 */
export const createPlant = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userPayload = req.user as { userEmail?: string } | undefined;
  if (!userPayload?.userEmail) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("Unauthorized"));
    return;
  }

  const user = await findUserByEmail(userPayload.userEmail);
  if (!user) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("User not found"));
    return;
  }

  try {
    const plantData = req.body;

    await info(
      "Plant creation attempt started",
      { plantData },
      { userId: user.id! }
    );

    let imageUrl = plantData.image_search_url;

    // If base64 image is provided, upload to Bunny
    if (plantData.image_search_url) {
      const uniqueFileName = `${plantData.scientific_name}.jpg`;
      imageUrl = await uploadBase64ToBunny(
        plantData.image_search_url,
        uniqueFileName
      );
    }

    // Save plant
    const newPlant = await Plant.createValidated({
      ...plantData,
      image_search_url: imageUrl, // final URL (either provided or Bunny)
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await info(
      "Plant created successfully",
      { plantId: newPlant._id },
      { userId: user.id! }
    );

    res
      .status(HTTP_STATUS.CREATED)
      .json(successResponse(newPlant, "Plant created successfully"));
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ errors: err.issues });
      return;
    }
    next(err);
  }
};
