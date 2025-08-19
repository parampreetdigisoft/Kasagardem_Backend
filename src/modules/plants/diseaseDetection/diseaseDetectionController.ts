import { Response, NextFunction } from "express";
import User, { IUserDocument } from "../../auth/authModel";
import {
  successResponse,
  errorResponse,
} from "../../../core/utils/responseFormatter";
import { HTTP_STATUS, MESSAGES } from "../../../core/utils/constants";
import { info, error } from "../../../core/utils/logger";
import config from "../../../core/config/env";
import axios from "axios";
import { CustomError } from "../../../interface/Error";
import { DiseaseSuggestion, SimilarImage } from "../../../interface/Types";
import { AuthRequest } from "../../../core/middleware/authMiddleware";
import { savePlantHistory } from "../homeScreen/plantController";
import { saveBase64ToLocal } from "../../../core/services/localUploadService";

/**
 * Detects plant diseases based on uploaded images and optional location data.
 * Sends the images to an external plant health assessment API, processes the response,
 * and returns disease suggestions with confidence scores and similar images.
 *
 * @param {AuthRequest} req - Express request object containing user email, plant images, and optional location.
 * @param {Response} res - Express response object used to return disease detection results.
 * @param {NextFunction} next - Express middleware function for error handling.
 * @returns {Promise<void>} Resolves with disease detection results or passes an error to the middleware.
 */
export const detectPlantDisease = async (
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

    await info("Plant disease detection attempt", {
      email,
      action: "detectPlantDisease",
      imageCount: images?.length || 0,
    });

    const user = (await User.findOne({ email })) as IUserDocument | null;
    if (!user) {
      await error("Plant disease detection failed - User not found", {
        email,
        action: "detectPlantDisease",
      });
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse(MESSAGES.PROFILE_USER_NOTFOUND));
      return;
    }

    // Call health assessment API instead of identification API
    const apiResponse = await axios.post(
      `${config.KASAGARDEM_PLANTAPI_URL}/health_assessment`,
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
    const isHealthy = result?.result?.is_healthy?.binary || false;
    const healthProbability = result?.result?.is_healthy?.probability || 0;
    const diseaseSuggestions: DiseaseSuggestion[] =
      result?.result?.disease?.suggestions || [];

    const topDisease: DiseaseSuggestion | null =
      diseaseSuggestions.reduce<DiseaseSuggestion | null>((prev, curr) => {
        if (!prev) return curr;
        return curr.probability > prev.probability ? curr : prev;
      }, diseaseSuggestions[0] || null);

    // Handle images - Save disease detection images to local storage
    const savedImageUrls: string[] = [];
    if (images && Array.isArray(images) && images.length > 0) {
      const imagePromises = images.map(async (img: string, index: number) => {
        // Use top disease name or a generic name for disease detection images
        const imageName =
          topDisease?.name || `disease_detection_${Date.now()}_${index}`;
        const localPath = await saveBase64ToLocal(
          img,
          imageName,
          user._id.toString(),
          "disease_detections" // Different folder for disease detection images
        );
        return localPath;
      });
      savedImageUrls.push(...(await Promise.all(imagePromises)));
    }

    const diseaseDetection = {
      isHealthy,
      healthProbability,
      confidence: topDisease?.probability || 0,
      diseases: diseaseSuggestions.map((disease: DiseaseSuggestion) => ({
        id: disease.id,
        name: disease.name,
        confidence: disease.probability,
        similarImages: disease.similar_images?.map((img: SimilarImage) => ({
          url: img.url,
          urlSmall: img.url_small,
          similarity: img.similarity,
          license: img.license_name,
          citation: img.citation,
        })),
        details: disease.details,
      })),
      question: result?.result?.disease?.question || null,
      isPlant: result?.result?.is_plant?.probability || null,
      status: result?.status,
      savedImages: savedImageUrls, // Include saved image URLs in response
    };

    await savePlantHistory(user._id.toString(), null, "disease_detected", {
      imageCount: images.length,
      isHealthy,
      topDisease: topDisease?.name,
      confidence: topDisease?.probability,
      savedImages: savedImageUrls, // Include saved images in history
    });

    await info("Plant disease detection completed", {
      email,
      userId: user._id,
      action: "detectPlantDisease",
      isHealthy,
      confidence: topDisease?.probability,
      topDisease: topDisease?.name,
      savedImagesCount: savedImageUrls.length,
    });

    res.status(HTTP_STATUS.OK).json(successResponse(diseaseDetection));
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

    await error("Plant disease detection error", {
      email: userPayload?.userEmail,
      error: errorObj.message,
      stack: errorObj.stack,
      action: "detectPlantDisease",
    });
    next(errorObj);
  }
};
