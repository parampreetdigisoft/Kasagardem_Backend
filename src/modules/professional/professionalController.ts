import { AuthRequest, csvUser } from "../../interface/auth";
import { NextFunction, Response } from "express";
import { AuthUserPayload } from "../../interface/user";
import { HTTP_STATUS } from "../../core/utils/constants";
import { errorResponse, successResponse } from "../../core/utils/responseFormatter";
import { findUserByEmail } from "../auth/authRepository";
import { getAllProfessionalProfilesDb, registerProfessionalsService } from "./professionalRepositry";


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
    const result = await registerProfessionalsService(professionals);

    const allFailed = result.successful === 0;
    const partialSuccess = result.successful > 0 && result.failed > 0;

    res.status(allFailed ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.CREATED).json({
      success: !allFailed,
      message: allFailed
        ? "All registrations failed"
        : partialSuccess
          ? `Partially completed: ${result.successful} succeeded, ${result.failed} failed`
          : "Professionals registered successfully",
      summary: {
        total: result.total,
        successful: result.successful,
        failed: result.failed,
      },
      successfulRegistrations: result.results.filter(r => r.success),
      failedRegistrations: result.results.filter(r => !r.success),
    });
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
