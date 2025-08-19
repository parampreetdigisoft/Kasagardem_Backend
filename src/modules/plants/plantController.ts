import { Request, Response, NextFunction } from "express";
import Plant, { IPlant } from "./plantModel";
import PlantHistory from "./plantHistoryModel";
import User, { IUserDocument } from "../auth/authModel";
import {
  successResponse,
  errorResponse,
} from "../../core/utils/responseFormatter";
import { HTTP_STATUS, MESSAGES } from "../../core/utils/constants";
import { info, warn, error } from "../../core/utils/logger";
// import { uploadBase64ToS3 } from "../../core/services/s3UploadService";
import { saveBase64ToLocal } from "../../core/services/localUploadService";
import config from "../../core/config/env";
import { Types } from "mongoose";
import axios from "axios";
import { CustomError } from "../../interface/Error";
import {
  PersonalizedTip,
  PlantHistoryQuery,
  PlantSuggestion,
  SimilarImage,
} from "../../interface/Types";

/**
 * Helper function to save plant history.
 *
 * @param {string} userId - The ID of the user performing the action.
 * @param {string | null} plantId - The ID of the plant (nullable if not applicable).
 * @param {string} action - The action performed on the plant (e.g., "watered", "added").
 * @param {Record<string, unknown>} [metadata={}] - Additional metadata related to the action.
 * @returns {Promise<void>} Resolves when the history entry is saved or logs an error on failure.
 */
export const savePlantHistory = async (
  userId: string,
  plantId: string | null,
  action: string,
  metadata: Record<string, unknown> = {}
): Promise<void> => {
  try {
    await PlantHistory.create({
      userId,
      plantId,
      action,
      metadata,
    });
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

    await error("Failed to save plant history", {
      userId,
      plantId,
      action,
      error: errorObj.message,
      stack: errorObj.stack,
    });
  }
};

/**
 * Create a new plant
 * @param req
 * @param res
 * @param next
 */
export const createPlant = async (
  req: Request & { user?: { userId?: string; userEmail?: string } },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userEmail) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("Unauthorized"));
      return;
    }

    const email = req.user.userEmail;

    await info("Plant creation attempt", {
      email,
      action: "createPlant",
    });

    const user: IUserDocument | null = await User.findOne({ email });
    if (!user) {
      await error("Plant creation failed - User not found", {
        email,
        action: "createPlant",
      });
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse(MESSAGES.PROFILE_USER_NOTFOUND));
      return;
    }

    // Handle images
    let imageUrls: string[] = [];
    if (req.body.images && Array.isArray(req.body.images)) {
      imageUrls = await Promise.all(
        req.body.images.map(async (img: string) => {
          const localPath = await saveBase64ToLocal(img, "plants");
          return localPath;
        })
      );
    }

    const plantData = {
      ...req.body,
      userId: user._id,
      images: imageUrls,
    };

    // 👇 Ensure _id is properly typed
    const plant = (await Plant.create(plantData)) as IPlant & {
      _id: Types.ObjectId;
    };

    // Save to history
    await savePlantHistory(user._id.toString(), plant._id.toString(), "added", {
      plantName: plant.name,
      category: plant.category,
    });

    await info(
      MESSAGES.PLANT_CREATED,
      {
        email,
        userId: user._id,
        plantId: plant._id,
        plantName: plant.name,
        action: "createPlant",
      },
      { userId: user._id }
    );

    res
      .status(HTTP_STATUS.CREATED)
      .json(successResponse(null, MESSAGES.PLANT_CREATED));
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

    await error("Plant creation error", {
      email: req.user?.userEmail,
      error: errorObj.message,
      stack: errorObj.stack,
      action: "createPlant",
    });
    next(errorObj);
  }
};

/**
 * Get all user plants with pagination and filters.
 *
 * @param {Request & { user?: { userEmail?: string } }} req - The HTTP request object containing user and query info.
 * @param {Response} res - The HTTP response object.
 * @param {NextFunction} next - Express next middleware function for error handling.
 * @returns {Promise<void>} Responds with a paginated list of user plants or an error response.
 */
export const getUserPlants = async (
  req: Request & { user?: { userEmail?: string } },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const email = req.user?.userEmail;

    if (!email) {
      res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(errorResponse("Unauthorized - User email missing"));
      return;
    }

    // Safely parse query params
    const {
      page = "1",
      limit = "10",
      category,
      status,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query as Record<string, string>;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    await info("Plants retrieval attempt", {
      email,
      action: "getUserPlants",
      filters: { category, status, search },
    });

    // Find user
    const user: IUserDocument | null = await User.findOne({ email });
    if (!user) {
      await error("Plants retrieval failed - User not found", {
        email,
        action: "getUserPlants",
      });
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse(MESSAGES.PROFILE_USER_NOTFOUND));
      return;
    }

    // Build query
    const query: Record<string, unknown> = { userId: user._id };
    if (category) query.category = category;
    if (status) query.status = status;
    if (search) query.$text = { $search: search };

    // Sorting
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === "asc" ? 1 : -1,
    };

    // Pagination
    const skip = (pageNum - 1) * limitNum;
    const totalPlants = await Plant.countDocuments(query);

    const plants = await Plant.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .select("-__v");

    const totalPages = Math.ceil(totalPlants / limitNum);

    await info(
      "Plants retrieved successfully",
      {
        email,
        userId: user._id,
        count: plants.length,
        totalPlants,
        action: "getUserPlants",
      },
      { userId: user._id.toString() }
    );

    const response = {
      plants,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalPlants,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    };

    res.status(HTTP_STATUS.OK).json(successResponse(response));
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

    await error("Plants retrieval error", {
      email: req.user?.userEmail,
      error: errorObj.message,
      stack: errorObj.stack,
      action: "getUserPlants",
    });
    next(errorObj);
  }
};

/**
 * Retrieves a plant by its ID for the authenticated user.
 *
 * @param {Request & { user?: { userEmail?: string } }} req - The HTTP request object containing user info and plant ID.
 * @param {Response} res - The HTTP response object.
 * @param {NextFunction} next - Express middleware function for error handling.
 * @returns {Promise<void>} Responds with the plant details if found, otherwise an error response.
 */
export const getPlantById = async (
  req: Request & { user?: { userEmail?: string } },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const email = req.user?.userEmail;
    const { id } = req.params;

    if (!email) {
      res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(errorResponse("Unauthorized - User email missing"));
      return;
    }

    await info("Plant retrieval attempt", {
      email,
      plantId: id,
      action: "getPlantById",
    });

    const user: IUserDocument | null = await User.findOne({ email });
    if (!user) {
      await error("Plant retrieval failed - User not found", {
        email,
        action: "getPlantById",
      });
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse(MESSAGES.PROFILE_USER_NOTFOUND));
      return;
    }

    const plant = await Plant.findOne({ _id: id, userId: user._id })
      .select("-__v")
      .populate("userId", "name email -_id");

    if (!plant) {
      await warn(`Plant retrieval failed - ${MESSAGES.PLANT_NOT_FOUND}`, {
        email,
        userId: user._id,
        plantId: id,
        action: "getPlantById",
      });
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse(MESSAGES.PLANT_NOT_FOUND));
      return;
    }

    await savePlantHistory(
      user._id.toString(),
      (plant._id as unknown as string).toString(),
      "viewed",
      { plantName: plant.name }
    );

    await info(
      "Plant retrieved successfully",
      {
        email,
        userId: user._id,
        plantId: id,
        plantName: plant.name,
        action: "getPlantById",
      },
      { userId: user._id.toString() }
    );

    res.status(HTTP_STATUS.OK).json(successResponse(plant));
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

    await error("Plant retrieval error", {
      email: req.user?.userEmail,
      plantId: req.params?.id,
      error: errorObj.message,
      stack: errorObj.stack,
      action: "getPlantById",
    });
    next(errorObj);
  }
};

/**
 * Updates an existing plant by ID for the authenticated user.
 *
 * @param {Request & { user?: { userEmail?: string } }} req - Express request object containing the authenticated user and update data.
 * @param {Response} res - Express response object used to send the result.
 * @param {NextFunction} next - Express middleware function for error handling.
 * @returns {Promise<Response | void>} Returns the updated plant if successful, or an error response.
 */
export const updatePlant = async (
  req: Request & { user?: { userEmail?: string } },
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    if (!req.user?.userEmail) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(errorResponse("Unauthorized"));
    }

    const email = req.user.userEmail;
    const { id } = req.params;

    await info("Plant update attempt", {
      email,
      plantId: id,
      action: "updatePlant",
      updateFields: Object.keys(req.body),
    });

    const user = (await User.findOne({ email })) as IUserDocument | null;
    if (!user) {
      await error("Plant update failed - User not found", {
        email,
        action: "updatePlant",
      });
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse(MESSAGES.PROFILE_USER_NOTFOUND));
    }

    const updatedPlant = (await Plant.findOneAndUpdate(
      { _id: id, userId: user._id },
      req.body,
      { new: true, runValidators: true }
    ).select("-__v")) as IPlant | null;

    if (!updatedPlant) {
      await warn(`Plant update failed - ${MESSAGES.PLANT_NOT_FOUND}`, {
        email,
        userId: user._id,
        plantId: id,
        action: "updatePlant",
      });
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse(MESSAGES.PLANT_NOT_FOUND));
    }

    await savePlantHistory(
      user._id.toString(),
      (updatedPlant._id as unknown as string).toString(),
      "updated",
      {
        plantName: updatedPlant.name,
        updatedFields: Object.keys(req.body),
      }
    );

    await info(
      MESSAGES.PLANT_UPDATED,
      {
        email,
        userId: user._id,
        plantId: id,
        plantName: updatedPlant.name,
        action: "updatePlant",
        updatedFields: Object.keys(req.body),
      },
      { userId: user._id }
    );

    return res
      .status(HTTP_STATUS.OK)
      .json(successResponse(updatedPlant, MESSAGES.PLANT_UPDATED));
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

    await error("Plant update error", {
      email: req.user?.userEmail,
      plantId: req.params?.id,
      error: errorObj.message,
      stack: errorObj.stack,
      action: "updatePlant",
      updateFields: Object.keys(req.body || {}),
    });
    return next(errorObj);
  }
};

/**
 * Deletes a plant by ID for the authenticated user.
 *
 * @param {Request & { user?: { userEmail?: string } }} req - Express request object containing user information and the plant ID.
 * @param {Response} res - Express response object used to return the deletion result.
 * @param {NextFunction} next - Express middleware function for error handling.
 * @returns {Promise<void>} Resolves with a success response if deletion is successful, or passes an error to the middleware.
 */
export const deletePlant = async (
  req: Request & { user?: { userEmail?: string } },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const email = req.user?.userEmail;
    const { id } = req.params;

    if (!email) {
      res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(errorResponse("Unauthorized - User email missing"));
      return;
    }

    await info("Plant deletion attempt", {
      email,
      plantId: id,
      action: "deletePlant",
    });

    const user: IUserDocument | null = await User.findOne({ email });
    if (!user) {
      await error("Plant deletion failed - User not found", {
        email,
        action: "deletePlant",
      });
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse(MESSAGES.PROFILE_USER_NOTFOUND));
      return;
    }

    const deletedPlant = await Plant.findOneAndDelete({
      _id: id,
      userId: user._id,
    });

    if (!deletedPlant) {
      await warn(`Plant deletion failed - ${MESSAGES.PLANT_NOT_FOUND}`, {
        email,
        userId: user._id,
        plantId: id,
        action: "deletePlant",
      });
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse(MESSAGES.PLANT_NOT_FOUND));
      return;
    }

    await savePlantHistory(
      user._id.toString(),
      (deletedPlant._id as unknown as string).toString(),
      "deleted",
      {
        plantName: deletedPlant.name,
        category: deletedPlant.category,
      }
    );

    await info(
      MESSAGES.PLANT_DELETED,
      {
        email,
        userId: user._id,
        plantId: id,
        plantName: deletedPlant.name,
        action: "deletePlant",
      },
      { userId: user._id.toString() }
    );

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse(null, MESSAGES.PLANT_DELETED));
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

    await error("Plant deletion error", {
      email: req.user?.userEmail,
      plantId: req.params?.id,
      error: errorObj.message,
      stack: errorObj.stack,
      action: "deletePlant",
    });
    next(errorObj);
  }
};

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
  req: Request & { user?: { userEmail?: string } },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userEmail) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("Unauthorized"));
      return;
    }

    const email = req.user.userEmail;
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
          "Api-Key": process.env.PLANT_ID_API_KEY || "",
          "Content-Type": "application/json",
        },
      }
    );

    const result = apiResponse.data;
    const suggestions = result?.result?.classification?.suggestions || [];
    const topSuggestion = suggestions[0] || null;

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
    };

    await savePlantHistory(user._id.toString(), null, "identified", {
      imageCount: images.length,
      topSuggestion: topSuggestion?.name,
      confidence: topSuggestion?.probability,
    });

    await info(MESSAGES.IDENTIFICATION_COMPLETED, {
      email,
      userId: user._id,
      action: "identifyPlant",
      confidence: topSuggestion?.probability,
      topSuggestion: topSuggestion?.name,
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
      email: req.user?.userEmail,
      error: errorObj.message,
      stack: errorObj.stack,
      action: "identifyPlant",
    });
    next(errorObj);
  }
};

/**
 * Generates personalized plant care tips for the authenticated user.
 * Tips include watering reminders, seasonal advice, and category-specific guidance
 * based on the user's plants and their care schedules.
 *
 * @param {Request & { user?: { userEmail?: string } }} req - Express request object containing user information.
 * @param {Response} res - Express response object used to return personalized tips.
 * @param {NextFunction} next - Express middleware function for error handling.
 * @returns {Promise<Response | void>} A JSON response with personalized tips,
 * or calls `next` with an error if something goes wrong.
 */
export const getPersonalizedTips = async (
  req: Request & { user?: { userEmail?: string } },
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    if (!req.user?.userEmail) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(errorResponse("Unauthorized"));
    }

    const email = req.user.userEmail;

    await info("Personalized tips request", {
      email,
      action: "getPersonalizedTips",
    });

    const user = (await User.findOne({ email })) as IUserDocument | null;
    if (!user) {
      await error("Tips retrieval failed - User not found", {
        email,
        action: "getPersonalizedTips",
      });
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse(MESSAGES.PROFILE_USER_NOTFOUND));
    }

    const userPlants = await Plant.find({ userId: user._id }).select(
      "category careInstructions status lastWatered nextWateringDue"
    );

    const tips: PersonalizedTip[] = [];

    // Watering reminders
    const plantsNeedingWater = userPlants.filter(
      (plant) => plant.nextWateringDue && plant.nextWateringDue <= new Date()
    );
    if (plantsNeedingWater.length > 0) {
      tips.push({
        type: "watering_reminder",
        priority: "high",
        title: "Plants Need Watering",
        description: `You have ${plantsNeedingWater.length} plant(s) that need watering today.`,
        actionUrl: "/plants/watering-schedule",
      });
    }

    // Seasonal tips
    const currentMonth = new Date().getMonth();
    const seasonalTips: Record<string, string> = {
      spring: "Spring is perfect for repotting and fertilizing your plants.",
      summer: "Increase watering frequency during hot summer months.",
      fall: "Prepare your plants for winter by reducing watering.",
      winter: "Most plants need less water and fertilizer during winter.",
    };

    let season: keyof typeof seasonalTips = "winter";
    if (currentMonth >= 2 && currentMonth <= 4) season = "spring";
    else if (currentMonth >= 5 && currentMonth <= 7) season = "summer";
    else if (currentMonth >= 8 && currentMonth <= 10) season = "fall";

    tips.push({
      type: "seasonal",
      priority: "medium",
      title: `${season.charAt(0).toUpperCase() + season.slice(1)} Care Tips`,
      description: seasonalTips[season],
      actionUrl: `/tips/seasonal/${season}`,
    });

    // Category-specific tips
    const categories = [
      ...new Set(userPlants.map((p) => p.category).filter(Boolean)),
    ] as string[]; // Type narrowing

    const categoryTips: Record<string, string> = {
      indoor: "Indoor plants benefit from regular dusting of their leaves.",
      outdoor:
        "Check outdoor plants for pests regularly, especially during growing season.",
      herb: "Harvest herbs regularly to encourage new growth.",
      succulent:
        "Succulents prefer well-draining soil and infrequent watering.",
    };

    categories.forEach((category) => {
      // guard clause to ensure category exists in tips
      if (category && categoryTips[category]) {
        tips.push({
          type: "category_specific",
          priority: "low",
          title: `${category.charAt(0).toUpperCase() + category.slice(1)} Plant Tip`,
          description: categoryTips[category],
          actionUrl: `/tips/category/${category}`,
        });
      }
    });

    await info(
      "Personalized tips generated",
      {
        email,
        userId: user._id,
        tipCount: tips.length,
        action: "getPersonalizedTips",
      },
      { userId: user._id }
    );

    // Ensure we always return a value
    return res.status(HTTP_STATUS.OK).json(successResponse({ tips }));
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

    await error("Personalized tips error", {
      email: req.user?.userEmail,
      error: errorObj.message,
      stack: errorObj.stack,
      action: "getPersonalizedTips",
    });
    return next(errorObj);
  }
};

/**
 * Saves a new entry in the plant history for the authenticated user.
 * The entry can represent actions such as watering, pruning, or general notes.
 *
 * @param {Request & { user?: { userEmail?: string }, body: { plantId?: string, action: string, metadata?: Record<string, unknown> } }} req
 *  - Express request object containing the user and plant history data.
 * @param {Response} res
 *  - Express response object used to return the result of the save operation.
 * @param {NextFunction} next
 *  - Express middleware function for error handling.
 * @returns {Promise<Response | void>}
 *  Returns a `201 Created` response when history is saved successfully,
 *  or calls `next` with an error if saving fails.
 */
export const savePlantHistoryEndpoint = async (
  req: Request & {
    user?: { userEmail?: string };
    body: {
      plantId?: string;
      action: string;
      metadata?: Record<string, unknown>;
    };
  },
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    // Guard clause for missing user email
    if (!req.user?.userEmail) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(errorResponse("Unauthorized"));
    }

    const email = req.user.userEmail;
    const { plantId, action, metadata } = req.body;

    await info("Plant history save attempt", {
      email,
      plantId,
      action,
      actionType: "savePlantHistory",
    });

    const user = (await User.findOne({ email })) as IUserDocument | null;
    if (!user) {
      await error("Plant history save failed - User not found", {
        email,
        actionType: "savePlantHistory",
      });
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse(MESSAGES.PROFILE_USER_NOTFOUND));
    }

    if (plantId) {
      const plant = await Plant.findOne({ _id: plantId, userId: user._id });
      if (!plant) {
        await warn(`Plant history save failed - ${MESSAGES.PLANT_NOT_FOUND}`, {
          email,
          userId: user._id,
          plantId,
          actionType: "savePlantHistory",
        });
        return res
          .status(HTTP_STATUS.NOT_FOUND)
          .json(errorResponse(MESSAGES.PLANT_NOT_FOUND));
      }
    }

    await savePlantHistory(
      user._id.toString(),
      plantId ?? undefined,
      action,
      metadata
    );

    await info(
      MESSAGES.PLANT_HISTORY_SAVED,
      {
        email,
        userId: user._id,
        plantId,
        action,
        actionType: "savePlantHistory",
      },
      { userId: user._id }
    );

    return res
      .status(HTTP_STATUS.CREATED)
      .json(successResponse(null, MESSAGES.PLANT_HISTORY_SAVED));
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

    await error("Plant history save error", {
      email: req.user?.userEmail,
      error: errorObj.message,
      stack: errorObj.stack,
      actionType: "savePlantHistory",
    });
    return next(errorObj);
  }
};

/**
 * Retrieves the plant history for the authenticated user.
 * Supports pagination and optional filtering by action type or plant ID.
 *
 * @param {Request & { user?: { userEmail?: string }, query: { page?: string, limit?: string, action?: string, plantId?: string } }} req
 *  - Express request object containing the authenticated user and query parameters for pagination/filtering.
 * @param {Response} res
 *  - Express response object used to return the plant history data.
 * @param {NextFunction} next
 *  - Express middleware function for error handling.
 * @returns {Promise<Response | void>}
 *  Returns a `200 OK` response with the plant history and pagination info,
 *  or calls `next` with an error if retrieval fails.
 */
export const getUserPlantHistory = async (
  req: Request & {
    user?: { userEmail?: string };
    query: { page?: string; limit?: string; action?: string; plantId?: string };
  },
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    // Guard clause for missing user email
    if (!req.user?.userEmail) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(errorResponse("Unauthorized"));
    }

    const email = req.user.userEmail;
    const { page = "1", limit = "20", action, plantId } = req.query;

    await info("Plant history retrieval attempt", {
      email,
      action: "getUserPlantHistory",
      filters: { action, plantId },
    });

    const user = (await User.findOne({ email })) as IUserDocument | null;
    if (!user) {
      await error("Plant history retrieval failed - User not found", {
        email,
        action: "getUserPlantHistory",
      });
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse(MESSAGES.PROFILE_USER_NOTFOUND));
    }

    // Build query with proper typing
    const query: PlantHistoryQuery = { userId: user._id.toString() };
    if (action) query.action = action;
    if (plantId) query.plantId = plantId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalHistory = await PlantHistory.countDocuments(query);

    const history = await PlantHistory.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("plantId", "name images category")
      .select("-__v");

    const totalPages = Math.ceil(totalHistory / parseInt(limit));

    await info(
      "Plant history retrieved successfully",
      {
        email,
        userId: user._id,
        count: history.length,
        totalHistory,
        action: "getUserPlantHistory",
      },
      { userId: user._id }
    );

    const response = {
      history,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalHistory,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      },
    };

    return res.status(HTTP_STATUS.OK).json(successResponse(response));
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

    await error("Plant history retrieval error", {
      email: req.user?.userEmail,
      error: errorObj.message,
      stack: errorObj.stack,
      action: "getUserPlantHistory",
    });
    return next(errorObj);
  }
};
