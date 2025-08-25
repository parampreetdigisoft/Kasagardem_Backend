// controllers/plantIdentificationController.ts
import { Response, NextFunction } from "express";
import User, { IUserDocument } from "../../auth/authModel";
import {
  successResponse,
  errorResponse,
} from "../../../core/utils/responseFormatter";
import { HTTP_STATUS, MESSAGES } from "../../../core/utils/constants";
import { error } from "../../../core/utils/logger";
import { CustomError } from "../../../interface/error";
import {
  PlantCreateIdentificationResponse,
  PlantSuggestion,
} from "../../../interface/plantDetection";
import { AuthRequest } from "../../../core/middleware/authMiddleware";
import { savePlantHistory } from "../homeScreen/plantController";
import { saveBase64ToLocal } from "../../../core/services/localUploadService";
import { plantApiService } from "../../../app";
import Plant, { IPlantDocument } from "../plantModel";
import mongoose from "mongoose";
import { IPreparedResponse } from "../../../interface/plantDetection";
import { SimilarImage } from "../../../interface/index";

/**
 * Validate and get user
 * @param userEmail - The email of the user to validate
 * @returns {Promise<IUserDocument>} - The validated user document
 * @throws {Error} - If no email is provided or user is not found
 */
const validateUser = async (userEmail?: string): Promise<IUserDocument> => {
  if (!userEmail) {
    throw Object.assign(new Error("Unauthorized request"), {
      status: HTTP_STATUS.UNAUTHORIZED,
    });
  }

  const user = (await User.findOne({
    email: userEmail,
  })) as IUserDocument | null;
  if (!user) {
    throw Object.assign(new Error(MESSAGES.PROFILE_USER_NOTFOUND), {
      status: HTTP_STATUS.NOT_FOUND,
    });
  }
  return user;
};

/**
 * Call external plant API
 * @param images - Array of image URLs for plant identification
 * @param location - Optional location data
 * @param location.latitude - Latitude coordinate
 * @param location.longitude - Longitude coordinate
 * @returns {Promise<PlantCreateIdentificationResponse>} - Plant identification API response
 * @throws {Error} - If the API request fails after retries
 */
const callPlantApi = async (
  images: string[],
  location?: { latitude?: number; longitude?: number }
): Promise<PlantCreateIdentificationResponse> => {
  const apiResponse = await plantApiService.withRetry(
    () =>
      plantApiService.post<PlantCreateIdentificationResponse>(
        "identification",
        {
          images,
          latitude: location?.latitude,
          longitude: location?.longitude,
          similar_images: true,
        }
      ),
    3,
    1000
  );
  return apiResponse.data;
};

/**
 * Extract and process suggestions
 * @param result - Plant identification API response
 * @returns {{ suggestions: PlantSuggestion[]; topSuggestion: PlantSuggestion | null }}
 *          suggestions → all plant suggestions from API
 *          topSuggestion → the most probable suggestion (closest probability to 1) or null if none
 */
const processSuggestions = (
  result: PlantCreateIdentificationResponse
): {
  suggestions: PlantSuggestion[];
  topSuggestion: PlantSuggestion | null;
} => {
  const suggestions: PlantSuggestion[] =
    result?.result?.classification?.suggestions || [];

  const topSuggestion = suggestions.reduce<PlantSuggestion | null>(
    (prev, curr) =>
      !prev || Math.abs(curr.probability - 1) < Math.abs(prev.probability - 1)
        ? curr
        : prev,
    null
  );

  return { suggestions, topSuggestion };
};

/**
 * Save uploaded images locally
 * @param images - List of base64 encoded image strings
 * @param topSuggestion - The top plant suggestion used to generate image names
 * @param userId - The ID of the user uploading the images
 * @returns {Promise<string[]>} Array of file paths where the images were saved
 */
const saveImages = async (
  images: string[],
  topSuggestion: PlantSuggestion | null,
  userId: string
): Promise<string[]> => {
  if (!images?.length) return [];
  const imagePromises = images.map((img, index) => {
    const imageName =
      topSuggestion?.name || `plant_identification_${Date.now()}_${index}`;
    return saveBase64ToLocal(img, imageName, userId, "identifications");
  });
  return Promise.all(imagePromises);
};

/**
 * Create or update plant entry
 * @param userId - ID of the user
 * @param result - Plant identification API response
 * @param topSuggestion - The top suggestion
 * @param suggestions - List of plant suggestions
 * @param savedImageUrls - URLs of saved images
 * @returns {Promise<PlantDocument | null>} The created/updated plant or null
 */
const createOrUpdatePlant = async (
  userId: mongoose.Types.ObjectId,
  result: PlantCreateIdentificationResponse,
  topSuggestion: PlantSuggestion | null,
  suggestions: PlantSuggestion[],
  savedImageUrls: string[]
): Promise<IPlantDocument | null> => {
  if (!topSuggestion) return null;

  const formattedSimilarImages =
    topSuggestion.similar_images?.map((img: SimilarImage) => ({
      id: img.id,
      url: img.url,
      url_small: img.url_small,
      similarity: img.similarity,
      license_name: img.license_name,
      license_url: img.license_url,
      citation: img.citation,
    })) || [];

  const formattedSuggestions = suggestions.map((s: PlantSuggestion) => ({
    scientificName: s.name,
    probability: typeof s.probability === "number" ? s.probability : undefined,
    similarImages:
      s.similar_images?.map((img: SimilarImage) => ({
        id: img.id,
        url: img.url,
        url_small: img.url_small,
        similarity: img.similarity,
        license_name: img.license_name,
        license_url: img.license_url,
        citation: img.citation,
      })) || [],
  }));

  // Build payload step by step, skipping nulls
  const payload: Record<string, unknown> = {
    name: topSuggestion?.name || "Unknown Plant",
    scientificName: topSuggestion?.name || "", // ✅ no null
    commonNames: [extractCommonName(topSuggestion?.name || "Unknown Plant")],
    probability:
      typeof topSuggestion?.probability === "number"
        ? topSuggestion.probability
        : 0, // ✅ default number
    similarImages: formattedSimilarImages,
    language: topSuggestion?.details?.language || "en",
    isPlant: !!result?.result?.is_plant, // ✅ always boolean
    status: "healthy",
    identificationMeta: {
      modelVersion: result?.model_version || "",
      created: new Date(),
      completed: new Date(),
      status: result?.status || "",
      customId: result?.custom_id || "",
    },
    images: savedImageUrls || [],
    suggestions: formattedSuggestions,
  };

  // Add optional values only if present
  if (topSuggestion?.details?.entity_id) {
    payload.entityId = topSuggestion.details.entity_id;
  }

  const { plant } = await Plant.findOrCreateFromIdentification(userId, payload);
  return plant;
};

/**
 * Build response
 * @param result - Plant identification API response
 * @param suggestions - List of plant suggestions
 * @param topSuggestion - The top suggestion
 * @param savedImageUrls - URLs of saved images
 * @returns {IPreparedResponse} The formatted response object
 */
const prepareResponse = (
  result: PlantCreateIdentificationResponse,
  suggestions: PlantSuggestion[],
  topSuggestion: PlantSuggestion | null,
  savedImageUrls: string[]
): IPreparedResponse => ({
  confidence: topSuggestion?.probability || 0,
  suggestions: suggestions.map((s) => ({
    scientificName: s.name,
    confidence: s.probability,
    similarImages:
      s.similar_images?.map((img: SimilarImage) => ({
        url: img.url,
        urlSmall: img.url_small,
        similarity: img.similarity,
        license: img.license_name,
      })) || [],
  })),
  isPlant: result?.result?.is_plant?.probability || null,
  status: result?.status,
  savedImages: savedImageUrls,
});

/**
 * Controller: Identify a plant from uploaded images.
 *
 * This handler:
 *  - Validates the authenticated user
 *  - Calls the plant identification API
 *  - Processes API suggestions (top + list)
 *  - Saves plant images
 *  - Creates or updates the plant entry in the database
 *  - Logs plant history
 *  - Returns the identification response
 *
 * @param req - Express request (with AuthRequest including user info)
 * @param res - Express response
 * @param _next - Express next middleware
 * @returns {Promise<void>} Sends JSON response with identification result
 */
export const identifyPlant = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  const userEmail = (req.user as { userEmail?: string } | undefined)?.userEmail; // Extract email from JWT
  const { images, location } = req.body;

  try {
    const user = await validateUser(userEmail);

    const result = await callPlantApi(images, location);

    const { suggestions, topSuggestion } = processSuggestions(result);

    const savedImageUrls = await saveImages(
      images,
      topSuggestion,
      user._id.toString()
    );

    await createOrUpdatePlant(
      user._id,
      result,
      topSuggestion,
      suggestions,
      savedImageUrls
    );

    const response = prepareResponse(
      result,
      suggestions,
      topSuggestion,
      savedImageUrls
    );

    await savePlantHistory(user._id.toString(), null, "identified", {
      imageCount: images.length,
      topSuggestion: topSuggestion?.name,
      confidence: topSuggestion?.probability,
      savedImages: savedImageUrls,
    });

    res.status(HTTP_STATUS.OK).json(successResponse(response));
  } catch (err: unknown) {
    const errorObj: CustomError =
      err instanceof Error
        ? (err as CustomError)
        : ({
            name: "UnknownError",
            message:
              typeof err === "string" ? err : "An unknown error occurred",
          } as CustomError);

    await error("Plant identification error", {
      email: userEmail,
      error: errorObj.message,
      stack: errorObj.stack,
      action: "identifyPlant",
    });

    const statusCode =
      typeof err === "object" &&
      err !== null &&
      "status" in err &&
      typeof (err as { status?: number }).status === "number"
        ? (err as { status?: number }).status!
        : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(errorResponse(errorObj.message));
  }
};

/**
 * Helper: extract common name from scientific name
 * @param scientificName - The scientific name of the plant
 * @returns {string} The extracted common name (genus) or "Unknown Plant"
 */
const extractCommonName = (scientificName: string): string => {
  if (!scientificName?.trim()) return "Unknown Plant";

  const parts = scientificName.trim().split(" ");
  const genus = parts[0] ?? "";

  if (!genus) return "Unknown Plant";

  return genus.charAt(0).toUpperCase() + genus.slice(1).toLowerCase();
};
