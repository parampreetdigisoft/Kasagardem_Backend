import { Response, NextFunction } from "express";
import User, { IUserDocument } from "../../auth/authModel";
import {
  successResponse,
  errorResponse,
} from "../../../core/utils/responseFormatter";
import { HTTP_STATUS, MESSAGES } from "../../../core/utils/constants";
import { info, error } from "../../../core/utils/logger";
import { CustomError } from "../../../interface/error";
import {
  DiseaseSuggestion,
  PlantHealthAssesmentResponse,
  SimilarImage,
} from "../../../interface";
import { AuthRequest } from "../../../core/middleware/authMiddleware";
import { savePlantHistory } from "../homeScreen/plantController";
import { saveBase64ToLocal } from "../../../core/services/localUploadService";
import { plantApiService } from "../../../app";

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
  //#region Authentication & Validation
  const userEmail = (req.user as { userEmail?: string } | undefined)?.userEmail; // Extract email from JWT
  if (!userEmail) {
    // Check authentication
    res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json(errorResponse("Unauthorized request"));
    return;
  }

  const { images, location } = req.body as {
    // Destructure request body
    images: string[];
    location?: { latitude?: number; longitude?: number };
  };
  //#endregion

  try {
    //#region Logging & User Verification
    await info("Plant disease detection attempt", {
      // Log detection attempt
      email: userEmail,
      action: "detectPlantDisease",
      imageCount: images?.length || 0,
    });

    const user = (await User.findOne({
      email: userEmail,
    })) as IUserDocument | null; // Find user in DB
    if (!user) {
      // Validate user exists
      await error("Plant disease detection failed - User not found", {
        // Log error
        email: userEmail,
        action: "detectPlantDisease",
      });
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse(MESSAGES.PROFILE_USER_NOTFOUND));
      return;
    }
    //#endregion

    //#region External API Call using ApiService
    const apiResponse = await plantApiService.withRetry(
      () =>
        plantApiService.post<PlantHealthAssesmentResponse>(
          "health_assessment",
          {
            images, // Base64 encoded images
            latitude: location?.latitude, // GPS coordinates
            longitude: location?.longitude,
            similar_images: true, // Request similar disease images
          }
        ),
      3, // Max retries for better reliability
      1000 // Initial delay in ms
    );

    const result = apiResponse.data as PlantHealthAssesmentResponse; // Extract data from ApiService response with proper typing
    //#endregion

    //#region Disease Analysis
    const isHealthy = result?.result?.is_healthy?.binary || false; // Plant health status
    const diseaseSuggestions: DiseaseSuggestion[] =
      result?.result?.disease?.suggestions || []; // Disease predictions

    const topDisease = diseaseSuggestions.reduce<DiseaseSuggestion | null>(
      (
        prev,
        curr // Find highest confidence disease
      ) => (!prev || curr.probability > prev.probability ? curr : prev),
      null
    );
    //#endregion

    //#region Image Storage
    const savedImageUrls: string[] = []; // Store local image paths
    if (images?.length) {
      // Process uploaded images
      const imagePromises = images.map(async (img: string, index: number) => {
        const imageName =
          topDisease?.name || `disease_detection_${Date.now()}_${index}`; // Generate filename
        return saveBase64ToLocal(
          img,
          imageName,
          user._id.toString(),
          "disease_detections"
        ); // Save to local storage
      });
      savedImageUrls.push(...(await Promise.all(imagePromises))); // Wait for all saves
    }
    //#endregion

    //#region Response Preparation
    const diseaseDetection = {
      isHealthy, // Boolean health status
      healthProbability: result?.result?.is_healthy?.probability || 0, // Health confidence
      confidence: topDisease?.probability || 0, // Top disease confidence
      diseases: diseaseSuggestions.map((disease: DiseaseSuggestion) => ({
        // Map disease suggestions
        id: disease.id,
        name: disease.name,
        confidence: disease.probability,
        similarImages: disease.similar_images?.map((img: SimilarImage) => ({
          // Map similar images
          url: img.url,
          urlSmall: img.url_small,
          similarity: img.similarity,
          license: img.license_name,
          citation: img.citation,
        })),
        details: disease.details,
      })),
      question: result?.result?.disease?.question || null, // Follow-up question
      isPlant: result?.result?.is_plant?.probability || null, // Plant detection confidence
      status: result?.status, // API response status
      savedImages: savedImageUrls, // Local image URLs
    };
    //#endregion

    //#region History & Logging
    await savePlantHistory(user._id.toString(), null, "disease_detected", {
      // Save to user history
      imageCount: images.length,
      isHealthy,
      topDisease: topDisease?.name,
      confidence: topDisease?.probability,
      savedImages: savedImageUrls,
    });

    await info("Plant disease detection completed", {
      // Log success
      email: userEmail,
      userId: user._id,
      action: "detectPlantDisease",
      isHealthy,
      confidence: topDisease?.probability,
      topDisease: topDisease?.name,
      savedImagesCount: savedImageUrls.length,
    });

    res.status(HTTP_STATUS.OK).json(successResponse(diseaseDetection)); // Send success response
    //#endregion
  } catch (err: unknown) {
    //#region Error Handling
    const errorObj: CustomError =
      err instanceof Error // Type-safe error conversion
        ? (err as CustomError)
        : ({
            name: "UnknownError",
            message:
              typeof err === "string" ? err : "An unknown error occurred",
          } as CustomError);

    await error("Plant disease detection error", {
      // Log error details
      email: userEmail,
      error: errorObj.message,
      stack: errorObj.stack,
      action: "detectPlantDisease",
    });

    next(errorObj); // Pass to error middleware
    //#endregion
  }
};
