import { Response, NextFunction } from "express";
import {
  createValidatedRole,
  deleteRoleById,
  findRoleById,
  findRoleByName,
  getAllRoles,
  updateValidatedRole,
} from "./roleRepository";
import {
  successResponse,
  errorResponse,
} from "../../core/utils/responseFormatter";
import { HTTP_STATUS, MESSAGES } from "../../core/utils/constants";
import { error, info, warn } from "../../core/utils/logger";
import { CustomError } from "../../interface/Error";
import { AuthRequest } from "../../core/middleware/authMiddleware";
import { ZodError } from "zod";
import { findUserByEmail } from "../auth/authRepository";

export interface AuthUserPayload {
  userEmail?: string;
  role?: string;
}

/**
 * Creates a new role in the system.
 *
 * Validates the authenticated user, checks for duplicate roles,
 * and creates a new role if it does not already exist.
 * Logs each step of the process for auditing and debugging.
 *
 * @param req - Express request object containing role data (`name`, `description`) in the body
 *              and the authenticated user in `req.user`.
 * @param res - Express response object used to send HTTP responses.
 * @param next - Express next middleware function used to handle errors.
 * @returns A promise that resolves with no value (`void`).
 */
export const createRole = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userPayload = req.user as AuthUserPayload | undefined;

  if (!userPayload?.userEmail) {
    res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json(errorResponse("Unauthorized request"));
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
    const { name, description } = req.body;

    await info(
      "Role creation attempt started",
      { roleName: name, hasDescription: !!description },
      { userId: user.id!, source: "role.createRole", req }
    );

    // ✅ Check if role already exists in PostgreSQL
    const existingRoleId = await findRoleByName(name);
    if (existingRoleId) {
      res.status(HTTP_STATUS.CONFLICT).json(errorResponse(MESSAGES.ROLE_EXIST));
      return;
    }

    // ✅ Create new role (validated using Zod internally)
    const newRole = await createValidatedRole({ name, description });

    await info(
      "Role creation successful",
      {
        roleId: newRole.id,
        roleName: newRole.name,
        hasDescription: !!newRole.description,
      },
      { userId: user.id!, source: "role.createRole", req }
    );

    res
      .status(HTTP_STATUS.CREATED)
      .json(successResponse(newRole, MESSAGES.ROLE_CREATED));
  } catch (err: unknown) {
    // Handle Zod validation errors
    if (err instanceof ZodError) {
      const formattedErrors = err.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));

      await warn(
        "Role creation failed - validation errors",
        { errors: formattedErrors },
        { userId: user?.id!, source: "role.createRole", req }
      );

      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Validation failed",
        errors: formattedErrors,
      });
      return;
    }

    const errorObj: CustomError =
      err instanceof Error
        ? (err as CustomError)
        : {
            name: "UnknownError",
            message:
              typeof err === "string" ? err : "An unknown error occurred",
          };

    await error(
      "Role creation failed with unexpected error",
      { error: errorObj.message, stack: errorObj.stack, userId: user?.id! },
      { userId: user?.id!, source: "role.createRole", req }
    );
    next(errorObj);
  }
};

/**
 * Retrieves all roles.
 * @param req - Express request object containing role data (`name`, `description`) in the body
 *              and the authenticated user in `req.user`.
 * @param res - Express response object used to send HTTP responses.
 * @param next - Express next middleware function used to handle errors.
 */
export const getRoles = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // ✅ 1. Verify authentication
  const userPayload = req.user as AuthUserPayload | undefined;
  if (!userPayload?.userEmail) {
    res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json(errorResponse("Unauthorized request"));
    return;
  }

  // ✅ 2. Fetch user by email
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
    await info(
      "Get all roles request started",
      {},
      { userId: user.id!, source: "role.getRoles", req }
    );

    // ✅ 3. Connect to DB and fetch roles
    const roles = await getAllRoles();

    await info(
      "Get all roles successful",
      { roleCount: roles.length, roleNames: roles.map((r) => r.name) },
      { userId: user.id!, source: "role.getRoles", req }
    );

    // ✅ Send response without created_at or updated_at
    res.status(HTTP_STATUS.OK).json(successResponse(roles));
  } catch (err: unknown) {
    const errorObj: CustomError =
      err instanceof Error
        ? (err as CustomError)
        : ({
            name: "UnknownError",
            message:
              typeof err === "string" ? err : "An unknown error occurred",
          } as CustomError);

    await error(
      "Get all roles failed with unexpected error",
      { error: errorObj.message, stack: errorObj.stack },
      { userId: user.id!, source: "role.getRoles", req }
    );
    next(errorObj);
  }
};

/**
 * Update an existing role by ID.
 * @param req - Express request object containing role data (`name`, `description`) in the body
 *              and the authenticated user in `req.user`.
 * @param res - Express response object used to send HTTP responses.
 * @param next - Express next middleware function used to handle errors.
 */
export const updateRole = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const roleId = req.params.id;
  const updateData = req.body;

  // ✅ 1. Authenticate user
  const userPayload = req.user as AuthUserPayload | undefined;
  if (!userPayload?.userEmail) {
    res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json(errorResponse("Unauthorized request"));
    return;
  }

  // ✅ 2. Validate user existence
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
    await info(
      "Role update attempt started",
      { roleId, updateFields: Object.keys(updateData), updateData },
      { userId: user.id!, source: "role.updateRole", req }
    );

    // ✅ 3. Check if role exists in PostgreSQL
    const existingRole = await findRoleById(roleId!);

    if (!existingRole) {
      await warn(
        "Role update failed - role not found",
        { roleId },
        { userId: user.id!, source: "role.updateRole", req }
      );

      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse(MESSAGES.ROLE_NOT_EXIST));
      return;
    }

    // ✅ 4. Use validated update logic
    const updatedRole = await updateValidatedRole(roleId!, updateData);

    if (!updatedRole) {
      await warn(
        "Role update failed - could not update record",
        { roleId },
        { userId: user.id!, source: "role.updateRole", req }
      );

      res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(errorResponse("Failed to update role"));
      return;
    }

    await info(
      "Role update successful",
      {
        roleId: updatedRole.id,
        updatedFields: Object.keys(updateData),
        newData: {
          name: updatedRole.name,
          description: updatedRole.description,
        },
      },
      { userId: user.id!, source: "role.updateRole", req }
    );

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse(updatedRole, MESSAGES.ROLE_UPDATED));
  } catch (err: unknown) {
    // ✅ Handle Zod validation errors
    if (err instanceof ZodError) {
      const formattedErrors = err.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));

      await warn(
        "Role update failed - validation errors",
        { errors: formattedErrors, roleId },
        { userId: user.id!, source: "role.updateRole", req }
      );

      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Validation failed",
        errors: formattedErrors,
      });
      return;
    }

    // ✅ Catch-all error handling
    const errorObj: CustomError =
      err instanceof Error
        ? (err as CustomError)
        : {
            name: "UnknownError",
            message:
              typeof err === "string" ? err : "An unknown error occurred",
          };

    await error(
      "Role update failed with unexpected error",
      {
        roleId,
        updateData,
        error: errorObj.message,
        stack: errorObj.stack,
        userId: user.id!,
      },
      { userId: user.id!, source: "role.updateRole", req }
    );
    next(errorObj);
  }
};

/**
 * Delete a role by ID.
 * @param req - Express request object containing role data (`name`, `description`) in the body
 *              and the authenticated user in `req.user`.
 * @param res - Express response object used to send HTTP responses.
 * @param next - Express next middleware function used to handle errors.
 */
export const deleteRole = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const roleId = req.params.id;

  // ✅ 1. Validate authentication
  const userPayload = req.user as AuthUserPayload | undefined;
  if (!userPayload?.userEmail) {
    res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json(errorResponse("Unauthorized request"));
    return;
  }

  // ✅ 2. Verify user existence
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
    await info(
      "Role deletion attempt started",
      { roleId },
      { userId: user.id!, source: "role.deleteRole", req }
    );

    // ✅ 3. Check if role exists
    const roleToDelete = await findRoleById(roleId!);

    if (!roleToDelete) {
      await warn(
        "Role deletion failed - role not found",
        { roleId },
        { userId: user.id!, source: "role.deleteRole", req }
      );

      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse(MESSAGES.ROLE_NOT_EXIST));
      return;
    }

    // ✅ 4. Delete the role
    await deleteRoleById(roleId!);

    await info(
      "Role deletion successful",
      {
        roleId: roleToDelete.id,
        deletedRoleName: roleToDelete.name,
        deletedRoleDescription: roleToDelete.description,
      },
      { userId: user.id!, source: "role.deleteRole", req }
    );

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse(null, MESSAGES.ROLE_DELETED));
  } catch (err: unknown) {
    const errorObj: CustomError =
      err instanceof Error
        ? (err as CustomError)
        : {
            name: "UnknownError",
            message:
              typeof err === "string" ? err : "An unknown error occurred",
          };

    await error(
      "Role deletion failed with unexpected error",
      { roleId, error: errorObj.message, stack: errorObj.stack },
      { userId: user.id!, source: "role.deleteRole", req }
    );

    next(errorObj);
  }
};
