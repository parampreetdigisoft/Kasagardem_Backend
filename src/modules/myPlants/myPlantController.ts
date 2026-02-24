import { NextFunction, Response } from "express";
import { AuthRequest } from "../../interface/auth";
import { AuthUserPayload } from "../../interface/user";
import { errorResponse, successResponse } from "../../core/utils/responseFormatter";
import { HTTP_STATUS } from "../../core/utils/constants";
import { findUserByEmail } from "../auth/authRepository";
import { addPlantToUserService, getAllPlantsService, getUserPlantByIdService, getUserPlantsService } from "./myPlantServices";
import { ZodError } from "zod";
import { getPlantDetailsByIdService } from "./myPlantServices";

/**
 * Retrieves a paginated list of all plants.
 *
 * Requires authenticated user with role "User".
 *
 * Query Parameters:
 * - page (optional): Page number (default: 1)
 * - limit (optional): Items per page (default: 10)
 *
 * @param {AuthRequest} req - Express request object containing auth payload and query params.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} Sends paginated plant list response.
 */
export const getAllPlants = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const userPayload = req.user as AuthUserPayload | undefined;
    if (!userPayload?.userEmail) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("Unauthorized"));
        return;
    }

    const user = await findUserByEmail(userPayload.userEmail);
    if (!user) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("User not found"));
        return;
    }
    if (userPayload.role !== "User") {
        res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("Unauthorized Role"));
        return;
    }

    try {

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = (req.query.search as string)?.trim() || undefined;
        
        const data = await getAllPlantsService(page, limit,search);

        res.status(HTTP_STATUS.OK).json(successResponse(
            { data },
            "Plants retrieved successfully"
        ));

    }
    catch (err) {
        if (err instanceof ZodError) {
            res
                .status(HTTP_STATUS.BAD_REQUEST)
                .json(errorResponse("Validation failed", { issues: err.issues }));
            return;
        }

        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
            errorResponse("Something went wrong", {
                details: (err as Error).message,
            })
        );
        next(err);

    }
} 

/**
 * Retrieves detailed information about a plant by its ID.
 *
 * Requires authenticated user with role "User".
 *
 * Route Parameters:
 * - id: Plant UUID
 *
 * @param {AuthRequest} req - Express request object containing plant ID.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} Sends plant details if found.
 */
export const getPlantById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const userPayload = req.user as AuthUserPayload | undefined;
    if (!userPayload?.userEmail) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("Unauthorized"));
        return;
    }
    const user = await findUserByEmail(userPayload.userEmail);
    if (!user) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("User not found"));
        return;
    }
    if (userPayload.role !== "User") {
        res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("Unauthorized Role"));
        return;
    }
    try {
        const plantId = req.params.id;

        if (!plantId) {
            res.status(HTTP_STATUS.BAD_REQUEST).json(errorResponse("Plant ID is required"));
            return;
        }

        const data = await getPlantDetailsByIdService(plantId);

        res.status(HTTP_STATUS.OK).json(
            successResponse(data, "Plant details retrieved successfully")
        );
    }
    catch (err) {
         if (err instanceof ZodError) {
            res.status(HTTP_STATUS.BAD_REQUEST).json(
                errorResponse("Validation failed", { issues: err.issues })
            );
            return;
        }

        if (err instanceof Error) {
            res.status(HTTP_STATUS.NOT_FOUND).json(
                errorResponse(err.message)
            );
            return;
        }
        
        next(err);
    }
}

/**
 * Adds a plant to the authenticated user's plant list.
 *
 * Requires authenticated user with role "User".
 *
 * Route Parameters:
 * - id: Plant UUID to be added
 *
 * @param {AuthRequest} req - Express request object containing plant ID.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} Sends confirmation response after successful addition.
 */
export const AddPlantToUser = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {

    // ── 1. Auth Checks ────────────────────────────────────────────────────────
    const userPayload = req.user as AuthUserPayload | undefined;

    if (!userPayload?.userEmail) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("Unauthorized"));
        return;
    }

    if (userPayload.role !== "User") {
        res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("Unauthorized Role"));
        return;
    }

    const user = await findUserByEmail(userPayload.userEmail);
    if (!user) {
        res.status(HTTP_STATUS.NOT_FOUND).json(errorResponse("User not found"));
        return;
    }

    // ── 2. Validate Request Body ──────────────────────────────────────────────
    const { plant_species_id } = req.body;

    if (!plant_species_id) {
        res.status(HTTP_STATUS.BAD_REQUEST).json(errorResponse("plant_species_id is required"));
        return;
    }

    // ── 3. Call Service ───────────────────────────────────────────────────────
    try {
        const data = await addPlantToUserService(user.id!, req.body);

        res.status(HTTP_STATUS.CREATED).json(
            successResponse(data, "Plant added successfully")
        );

    } catch (err) {
        if (err instanceof Error) {
            // Known business logic errors from service
            const knownErrors: Record<string, number> = {
                "Plant species not found"       : HTTP_STATUS.NOT_FOUND,
                "Plant already added to user"   : HTTP_STATUS.CONFLICT,
            };

            const statusCode = knownErrors[err.message] ?? HTTP_STATUS.BAD_REQUEST;

            res.status(statusCode).json(errorResponse(err.message));
            return;
        }

        next(err);
    }
};

/**
 * Retrieves all plants associated with the authenticated user.
 *
 * Requires authenticated user with role "User".
 *
 * @param {AuthRequest} req - Express request object containing auth payload.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} Sends user's plant list.
 */
export const getAllUserPlants = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {

    // ── 1. Auth Checks ────────────────────────────────────────────────────────
    const userPayload = req.user as AuthUserPayload | undefined;

    if (!userPayload?.userEmail) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("Unauthorized"));
        return;
    }

    if (userPayload.role !== "User") {
        res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("Unauthorized Role"));
        return;
    }

    const user = await findUserByEmail(userPayload.userEmail);
    if (!user) {
        res.status(HTTP_STATUS.NOT_FOUND).json(errorResponse("User not found"));
        return;
    }

    // ── 2. Call Service ───────────────────────────────────────────────────────
    try {
        const data = await getUserPlantsService(user.id!);

        res.status(HTTP_STATUS.OK).json(
            successResponse(data, "User plants retrieved successfully")
        );

    } catch (err) {
        if (err instanceof Error) {
            res.status(HTTP_STATUS.BAD_REQUEST).json(
                errorResponse(err.message)
            );
            return;
        }
        next(err);
    }
}; 


/**
 * Controller to retrieve a specific plant belonging to an authenticated user.
 *
 * @async
 * @function getUserPlantById
 *
 * @param {AuthRequest} req  Express request object extended with authenticated user payload.
 * @param {Response} res  Express response object used to send back HTTP responses.
 * @param {NextFunction} next  Express next middleware function for error handling.
 *
 * @returns {Promise<void>} Returns a JSON response with plant data if found.
 *
 * @throws {401} If user is not authenticated or does not have the "User" role.
 * @throws {404} If the user or plant is not found.
 * @throws {400} If plant ID is missing or if a service error occurs.
 *
 * @description
 * This endpoint:
 * 1. Validates authenticated user from JWT payload.
 * 2. Ensures the role is strictly "User".
 * * 3. Fetches the user record using email.
 * 4. Validates the plant ID from route parameters.
 * 5. Calls the service layer to fetch the plant belonging to the user.
 * 6. Returns standardized success or error responses.
 */
export const getUserPlantById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {

    // ── 1. Auth Checks ────────────────────────────────────────────────────────
    const userPayload = req.user as AuthUserPayload | undefined;

    if (!userPayload?.userEmail) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("Unauthorized"));
        return;
    }

    if (userPayload.role !== "User") {
        res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("Unauthorized Role"));
        return;
    }

    const user = await findUserByEmail(userPayload.userEmail);
    if (!user) {
        res.status(HTTP_STATUS.NOT_FOUND).json(errorResponse("User not found"));
        return;
    }

    // ── 2. Validate Param ─────────────────────────────────────────────────────
    const plantId = req.params.id;
    if (!plantId) {
        res.status(HTTP_STATUS.BAD_REQUEST).json(errorResponse("Plant ID is required"));
        return;
    }

    // ── 3. Call Service ───────────────────────────────────────────────────────
    try {
        const data = await getUserPlantByIdService(user.id!, plantId);

        if (!data) {
            res.status(HTTP_STATUS.NOT_FOUND).json(errorResponse("Plant not found"));
            return;
        }

        res.status(HTTP_STATUS.OK).json(
            successResponse(data, "User plant retrieved successfully")
        );

    } catch (err) {
        if (err instanceof Error) {
            res.status(HTTP_STATUS.BAD_REQUEST).json(errorResponse(err.message));
            return;
        }
        next(err);
    }
};




