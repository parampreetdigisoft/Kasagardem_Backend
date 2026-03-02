import { AuthRequest, csvUser, ProfessionalProfileResponse } from "../../interface/auth";
import { NextFunction, Response } from "express";
import { AuthUserPayload } from "../../interface/user";
import { HTTP_STATUS } from "../../core/utils/constants";
import { errorResponse, successResponse } from "../../core/utils/responseFormatter";
import { findUserByEmail } from "../auth/authRepository";
import {  createProfessionalsService, fetchSortedProfessionals, getAllProfessionalProfilesDb, getProfessionalDataById, registerProfessionalService} from "./professionalRepositry";


/**
 * Bulk create professional accounts (Admin only).
 *
 * - Validates authenticated user
 * - Ensures user has Admin role
 * - Reads professionals data from request (parsed CSV)
 * - Calls service to register professionals
 * - Returns summary of successful and failed registrations
 *
 * @route POST /professionals/bulk
 * @access Private (Admin only)
 *
 * @param req - Authenticated request containing:
 *   - user (JWT payload)
 *   - professional (array of parsed CSV users)
 * @param res - Express response object
 * @param next - Express next middleware function
 *
 * @returns 201 - Professionals registered successfully
 * 
 */
export const createProfessionlals = async (
  req: AuthRequest,
  res: Response,
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

  if (userPayload.role !== "Admin") {
    res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json(errorResponse("Unauthorized Role"));
    return;
  }

  try {
    const professionals = req.professional as csvUser[] | undefined;

    if (!professionals || professionals.length === 0) {
      res.status(HTTP_STATUS.BAD_REQUEST).json(
        errorResponse("No professionals data found")
      );
      return;
    }

    // Register all professionals
    const result = await createProfessionalsService(professionals);

    res.status(HTTP_STATUS.CREATED).json(successResponse(result, "Professionals registered successfully"));
    return;

  }
  catch (error) {
    console.error("Error in createProfessionlals:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      errorResponse(
        "Failed to create professionals",
        {
          message: error instanceof Error ? error.message : String(error),
        }
      )
    );


  }

}

/**
 * Get paginated list of all professional profiles (Admin only).
 *
 * - Validates authenticated user
 * - Ensures Admin role
 * - Supports pagination via query params:
 *   - page (default: 1)
 *   - limit (default: 5)
 * - Returns professional profiles with pagination metadata
 *
 * @route GET /professionals
 * @access Private (Admin only)
 *
 * @query page - Page number (optional)
 * @query limit - Number of records per page (optional)
 *
 * @param req - Authenticated request containing JWT payload + query params
 * @param res - Express response object
 * @param next - Express next middleware function
 *
 * @returns 200 - Paginated professional profiles

 */
export const getAllProfessionalProfiles = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userPayload = req.user as AuthUserPayload | undefined;

  if (!userPayload?.userEmail) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("Unauthorized"));
    return;
  }

  if (userPayload.role !== "Admin") {
    res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json(errorResponse("Unauthorized Role"));
    return;
  }

  const user = await findUserByEmail(userPayload.userEmail);
  if (!user) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("User not found"));
    return;
  }

  try {
    // Pagination params
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;
    const offset = (page - 1) * limit;

    // Fetch paginated professionals + total count
    const { professionals, totalCount } =
      await getAllProfessionalProfilesDb(limit, offset);

    const totalPages = Math.ceil(totalCount / limit);

    res.status(HTTP_STATUS.OK).json(
      successResponse({
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        professionals,
      })
    );
  } catch (err) {
    next(err);
  }
};


/**
 * Registers a professional user account (Admin only).
 *
 * Workflow:
 * 1. Validates JWT authentication.
 * 2. Ensures the requesting user has the "Admin" role.
 * 3. Verifies the requesting user still exists in the database.
 * 4. Validates request body (professionalId, email).
 * 5. Fetches and validates the professional profile record.
 * 6. Delegates account creation to registerProfessionalService.
 *
 * Business Rules:
 * - Only Admin users can register professionals.
 * - Email must match the professional profile record.
 * - Email must be unique in the users table.
 *
 * Possible Responses:
 * - 201 Created → Professional successfully registered.
 * - 400 Bad Request → Validation errors.
 * - 401 Unauthorized → Invalid or missing authentication.
 * - 403 Forbidden → User is not an Admin.
 * - 404 Not Found → Professional profile not found.
 * - 409 Conflict → Email already exists.
 * - 500 Internal Server Error → Unexpected system failure.
 *
 * @async
 * @function registerProfessionals
 *
 * @param {AuthRequest} req - Express request object with authenticated user payload.
 * @param {Response} res - Express response object.
 *
 * @returns {Promise<void>} Sends a JSON response with success or error message.
 */
export const registerProfessionals = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  
  // ─── 1. Auth guard ─────────────────────────────────────────────────────────
  const userPayload = req.user as AuthUserPayload | undefined;

  if (!userPayload?.userEmail) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("Unauthorized"));
    return;
  }

  // ─── 2. Role guard ─────────────────────────────────────────────────────────
  if (userPayload.role !== "Admin") {
    res.status(HTTP_STATUS.FORBIDDEN).json(errorResponse("Access denied: Admins only"));
    return;
  }

  // ─── 3. Verify requesting user still exists ────────────────────────────────
  try {
    const user = await findUserByEmail(userPayload.userEmail);
    if (!user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("Requesting user no longer exists"));
      return;
    }
  } catch (error) {
    console.error("Error verifying requesting user:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      errorResponse("Failed to verify user identity. Please try again.")
    );
    return;
  }

  // ─── 4. Validate request body ──────────────────────────────────────────────
  const { professionalId, email } = req.body;

  if (!professionalId) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(errorResponse("Professional ID is required"));
    return;
  }

  if (!email) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(errorResponse("Email is required"));
    return;
  }

  // ─── 5. Fetch & validate professional record ───────────────────────────────
  let professionalData: ProfessionalProfileResponse | null = null;

  try {
    professionalData = await getProfessionalDataById(professionalId);
  } catch (error) {
    console.error("Error fetching professional data:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      errorResponse("Failed to fetch professional record. Please try again.")
    );
    return;
  }

  if (!professionalData) {
    res.status(HTTP_STATUS.NOT_FOUND).json(errorResponse("Professional not found"));
    return;
  }

  if (professionalData.email !== email) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(
      errorResponse("Email does not match professional record")
    );
    return;
  }

  // ─── 6. Register professional ──────────────────────────────────────────────
  try {
    const result = await registerProfessionalService(professionalId, professionalData);

    if (!result.success) {
      const isConflict = result.message === "Email already exists";
      res
        .status(isConflict ? HTTP_STATUS.CONFLICT : HTTP_STATUS.BAD_REQUEST)
        .json(errorResponse(result.message));
      return;
    }

    res
      .status(HTTP_STATUS.CREATED)
      .json(successResponse(result, "Professional registered successfully"));

  } catch (error) {
    // console.error("Unexpected error in registerProfessionals:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      errorResponse("An unexpected error occurred while registering the professional.",error instanceof Error ? { message: error.message } : undefined) 
    );
  }
};





/**
 * Retrieves a list of professionals sorted by:
 *  1. Distance from the user's location (ascending)
 *  2. Subscription priority (higher plans first)
 *  3. Rating/assessment (higher first)
 *
 * Supports optional category filtering and pagination.
 *
 * @async
 * @function getSortedProfessionals
 *
 * @param {AuthRequest} req - Express request object containing:
 *   @param {string} req.query.lat - User latitude (required)
 *   @param {string} req.query.lng - User longitude (required)
 *   @param {string} [req.query.category] - Optional category filter
 *   @param {string} [req.query.limit=50] - Number of results to return (max 100)
 *   @param {string} [req.query.offset=0] - Pagination offset
 *
 * @param {Response} res - Express response object
 *
 * @returns {Promise<void>} Sends a JSON response containing:
 *   - Sorted professionals list
 *   - Or error response (400 / 500)
 *
 * @throws {Error} Returns 500 if an unexpected server error occurs.
 */
export async function getSortedProfessionals(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { lat, lng, category, limit = "50", offset = "0" } = req.query;

    // --- Validate required params ---
    if (!lat || !lng) {
      res.status(400).json({ error: "User location (lat, lng) is required." });
      return;
    }

    const userLat = parseFloat(lat as string);
    const userLng = parseFloat(lng as string);

    if (isNaN(userLat) || isNaN(userLng)) {
      res.status(400).json({ error: "Invalid lat/lng values." });
      return;
    }

    const pageLimit = Math.min(parseInt(limit as string) || 50, 100);
    const pageOffset = parseInt(offset as string) || 0;

    // --- Delegate to service ---
    const result = await fetchSortedProfessionals({
      userLat,
      userLng,
      category: category as string | undefined,
      limit: pageLimit,
      offset: pageOffset,
    });

    res.status(200).json(result);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("getSortedProfessionals error:", error.message);
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Unknown server error." });
    }
  }
}