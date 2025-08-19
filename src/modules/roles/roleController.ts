import { Request, Response, NextFunction } from "express";
import Role, { IRoleDocument } from "./roleModel";
import {
  successResponse,
  errorResponse,
} from "../../core/utils/responseFormatter";
import { HTTP_STATUS, MESSAGES } from "../../core/utils/constants";
import { error, info, warn } from "../../core/utils/logger";
import { CustomError } from "../../interface/Error";
import User from "../auth/authModel";

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
  req: Request & { user?: { userEmail?: string } },
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user?.userEmail) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("Unauthorized"));
    return;
  }

  // Fetch user by email
  const user = await User.findOne({ email: req.user.userEmail });
  if (!user) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("User not found"));
    return;
  }

  try {
    const { name, description } = req.body;

    await info(
      "Role creation attempt started",
      { roleName: name, hasDescription: !!description },
      { userId: user._id, source: "role.createRole" } // use fetched user's _id
    );

    const existing = await Role.findOne({ name });
    if (existing) {
      await warn(
        "Role creation failed - role already exists",
        { roleName: name, existingRoleId: existing._id },
        { userId: user._id, source: "role.createRole" }
      );

      res.status(HTTP_STATUS.CONFLICT).json(errorResponse(MESSAGES.ROLE_EXIST));
      return;
    }

    const newRole: IRoleDocument = await Role.create({ name, description });

    await info(
      "Role creation successful",
      {
        roleId: newRole._id,
        roleName: newRole.name,
        hasDescription: !!newRole.description,
      },
      { userId: user._id, source: "role.createRole" }
    );

    res
      .status(HTTP_STATUS.CREATED)
      .json(successResponse(null, MESSAGES.ROLE_CREATED));
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
      "Role creation failed with unexpected error",
      { error: errorObj.message, stack: errorObj.stack },
      { userId: user._id, source: "role.createRole" }
    );
    next(errorObj);
  }
};

/**
 * Get all roles.
 * @param req
 * @param res
 * @param next
 */
export const getRoles = async (
  req: Request & { user?: { userEmail?: string } },
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user?.userEmail) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("Unauthorized"));
    return;
  }

  // Fetch user by email
  const user = await User.findOne({ email: req.user.userEmail });
  if (!user) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("User not found"));
    return;
  }
  try {
    await info(
      "Get all roles request started",
      {},
      { userId: user._id, source: "role.getRoles" }
    );

    const roles: IRoleDocument[] = await Role.find().select(
      "-createdAt -updatedAt -__v"
    );

    await info(
      "Get all roles successful",
      { roleCount: roles.length, roleNames: roles.map((role) => role.name) },
      { userId: user._id, source: "role.getRoles" }
    );

    res.status(HTTP_STATUS.OK).json(successResponse(roles));
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

    await error(
      "Get all roles failed with unexpected error",
      { error: errorObj.message, stack: errorObj.stack },
      { userId: user._id, source: "role.getRoles" }
    );
    next(errorObj);
  }
};

/**
 * Update an existing role by ID.
 * @param req
 * @param res
 * @param next
 */
export const updateRole = async (
  req: Request & { user?: { userEmail?: string } },
  res: Response,
  next: NextFunction
): Promise<void> => {
  const roleId = req.params.id;
  const updateData = req.body;

  if (!req.user?.userEmail) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("Unauthorized"));
    return;
  }

  // Fetch user by email
  const user = await User.findOne({ email: req.user.userEmail });
  if (!user) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("User not found"));
    return;
  }

  try {
    await info(
      "Role update attempt started",
      {
        roleId,
        updateFields: Object.keys(updateData),
        updateData,
      },
      { userId: user._id, source: "role.updateRole" }
    );

    const updatedRole = await Role.findByIdAndUpdate(roleId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedRole) {
      await warn(
        "Role update failed - role not found",
        { roleId },
        { userId: user._id, source: "role.updateRole" }
      );
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse(MESSAGES.ROLE_NOT_EXIST));
      return;
    }

    await info(
      "Role update successful",
      {
        roleId: updatedRole._id,
        roleName: updatedRole.name,
        updatedFields: Object.keys(updateData),
        newData: {
          name: updatedRole.name,
          description: updatedRole.description,
        },
      },
      { userId: user._id, source: "role.updateRole" }
    );

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse(null, MESSAGES.ROLE_UPDATED));
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

    await error(
      "Role update failed with unexpected error",
      { roleId, updateData, error: errorObj.message, stack: errorObj.stack },
      { userId: user._id, source: "role.updateRole" }
    );
    next(errorObj);
  }
};

/**
 * Delete a role by ID.
 * @param req
 * @param res
 * @param next
 */
export const deleteRole = async (
  req: Request & { user?: { userEmail?: string } },
  res: Response,
  next: NextFunction
): Promise<void> => {
  const roleId = req.params.id;

  if (!req.user?.userEmail) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("Unauthorized"));
    return;
  }

  // Fetch user by email
  const user = await User.findOne({ email: req.user.userEmail });
  if (!user) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("User not found"));
    return;
  }

  try {
    await info(
      "Role deletion attempt started",
      { roleId },
      { userId: user._id, source: "role.deleteRole" }
    );

    const deletedRole = await Role.findByIdAndDelete(roleId);

    if (!deletedRole) {
      await warn(
        "Role deletion failed - role not found",
        { roleId },
        { userId: user._id, source: "role.deleteRole" }
      );
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse(MESSAGES.ROLE_NOT_EXIST));
      return;
    }

    await info(
      "Role deletion successful",
      {
        roleId: deletedRole._id,
        deletedRoleName: deletedRole.name,
        deletedRoleDescription: deletedRole.description,
      },
      { userId: user._id, source: "role.deleteRole" }
    );

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse(null, MESSAGES.ROLE_DELETED));
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

    await error(
      "Role deletion failed with unexpected error",
      { roleId, error: errorObj.message, stack: errorObj.stack },
      { userId: user._id, source: "role.deleteRole" }
    );
    next(errorObj);
  }
};
