import { Response, NextFunction } from "express";
import User, { IUserDocument } from "../../auth/authModel";
import {
  successResponse,
  errorResponse,
} from "../../../core/utils/responseFormatter";
import { HTTP_STATUS, MESSAGES } from "../../../core/utils/constants";
import { info, error } from "../../../core/utils/logger";
// import { uploadBase64ToS3 } from "../../../core/services/s3UploadService";
import config from "../../../core/config/env";
import axios from "axios";
import { CustomError } from "../../../interface/Error";
import { PlantSuggestion, SimilarImage } from "../../../interface/Types";
import { AuthRequest } from "../../../core/middleware/authMiddleware";
import { savePlantHistory } from "../homeScreen/plantController";
import { saveBase64ToLocal } from "../../../core/services/localUploadService";

/**
 * Identifies a plant based on uploaded images and optional location data.
 * Sends the images to an external plant identification API, processes the response,
 * and returns the top suggestions with confidence scores and similar images.
 *
 * @param {Request & { user?: { userEmail?: string } }} req - Express request object containing user email, plant images, and optional location.
 * @param {Response} res - Express response object used to return identification results.
 * @param {NextFunction} next - Express middleware function for error handling.
 * @returns {Promise<void>} Resolves with identification results or passes an error to the middleware.
 */
export const identifyPlant = async (
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
    const email = userPayload?.userEmail;
    const { images, location } = req.body as {
      images: string[];
      location?: { latitude?: number; longitude?: number };
    };

    await info("Plant identification attempt", {
      email,
      action: "identifyPlant",
      imageCount: images?.length || 0,
    });

    const user = (await User.findOne({ email })) as IUserDocument | null;
    if (!user) {
      await error("Plant identification failed - User not found", {
        email,
        action: "identifyPlant",
      });
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse(MESSAGES.PROFILE_USER_NOTFOUND));
      return;
    }

    const apiResponse = await axios.post(
      `${config.KASAGARDEM_PLANTAPI_URL}/identification`,
      {
        images,
        latitude: location?.latitude,
        longitude: location?.longitude,
        similar_images: true,
      },
      {
        headers: {
          "Api-Key": config.KASAGARDEM_PLANTAPI_KEY || "",
          "Content-Type": "application/json",
        },
      }
    );

    const result = apiResponse.data;
    const suggestions: PlantSuggestion[] =
      result?.result?.classification?.suggestions || [];

    const topSuggestion: PlantSuggestion | null =
      suggestions.reduce<PlantSuggestion | null>((prev, curr) => {
        if (!prev) return curr;
        return Math.abs(curr.probability - 1) < Math.abs(prev.probability - 1)
          ? curr
          : prev;
      }, suggestions[0] || null);

    // Handle images - Save identification images to local storage
    const savedImageUrls: string[] = [];
    if (images && Array.isArray(images) && images.length > 0) {
      const imagePromises = images.map(async (img: string, index: number) => {
        // Use top suggestion name or a generic name for identification images
        const imageName =
          topSuggestion?.name || `plant_identification_${Date.now()}_${index}`;
        const localPath = await saveBase64ToLocal(
          img,
          imageName,
          user._id.toString(),
          "identifications" // Different folder to distinguish from user-created plants
        );
        return localPath;
      });
      savedImageUrls.push(...(await Promise.all(imagePromises)));
    }

    const identification = {
      confidence: topSuggestion?.probability || 0,
      suggestions: suggestions.map((s: PlantSuggestion) => ({
        scientificName: s.name,
        confidence: s.probability,
        similarImages: s.similar_images?.map((img: SimilarImage) => ({
          url: img.url,
          urlSmall: img.url_small,
          similarity: img.similarity,
          license: img.license_name,
        })),
      })),
      isPlant: result?.result?.is_plant?.probability || null,
      status: result?.status,
      savedImages: savedImageUrls, // Include saved image URLs in response
    };

    await savePlantHistory(user._id.toString(), null, "identified", {
      imageCount: images.length,
      topSuggestion: topSuggestion?.name,
      confidence: topSuggestion?.probability,
      savedImages: savedImageUrls, // Include saved images in history
    });

    await info(MESSAGES.IDENTIFICATION_COMPLETED, {
      email,
      userId: user._id,
      action: "identifyPlant",
      confidence: topSuggestion?.probability,
      topSuggestion: topSuggestion?.name,
      savedImagesCount: savedImageUrls.length,
    });

    res.status(HTTP_STATUS.OK).json(successResponse(identification));
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

    await error("Plant identification error", {
      email: userPayload?.userEmail,
      error: errorObj.message,
      stack: errorObj.stack,
      action: "identifyPlant",
    });
    next(errorObj);
  }
};
