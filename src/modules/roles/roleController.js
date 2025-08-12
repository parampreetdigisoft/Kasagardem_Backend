const Role = require("./roleModel");
const {
  successResponse,
  errorResponse,
} = require("../../core/utils/responseFormatter");
const { HTTP_STATUS, MESSAGES } = require("../../core/utils/constants");
const logger = require("../../core/utils/logger");

/**
 * Create a new role.
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Promise<void>}
 */
const createRole = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    await logger.info(
      "Role creation attempt started",
      { roleName: name, hasDescription: !!description },
      {
        userId: req.user?.userId,
        source: "role.createRole",
      }
    );

    const existing = await Role.findOne({ name });
    if (existing) {
      await logger.warn(
        "Role creation failed - role already exists",
        {
          roleName: name,
          existingRoleId: existing._id,
        },
        {
          userId: req.user?.userId,
          source: "role.createRole",
        }
      );

      return res
        .status(HTTP_STATUS.CONFLICT)
        .json(errorResponse(MESSAGES.ROLE_EXIST));
    }
    const newRole = await Role.create({ name, description });

    await logger.info(
      "Role creation successful",
      {
        roleId: newRole._id,
        roleName: newRole.name,
        hasDescription: !!newRole.description,
      },
      {
        userId: req.user?.userId,
        source: "role.createRole",
      }
    );
    res
      .status(HTTP_STATUS.CREATED)
      .json(successResponse(null, MESSAGES.ROLE_CREATED));
  } catch (error) {
    await logger.error(
      "Role creation failed with unexpected error",
      {
        error: error.message,
        stack: error.stack,
      },
      {
        userId: req.user?.userId,
        source: "role.createRole",
      }
    );
    next(error);
  }
};

/**
 * Get all roles.
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Promise<void>}
 */
const getRoles = async (req, res, next) => {
  try {
    await logger.info(
      "Get all roles request started",
      {},
      {
        userId: req.user?.userId,
        source: "role.getRoles",
      }
    );
    const roles = await Role.find();
    await logger.info(
      "Get all roles successful",
      {
        roleCount: roles.length,
        roleNames: roles.map((role) => role.name),
      },
      {
        userId: req.user?.userId,
        source: "role.getRoles",
      }
    );
    res.status(HTTP_STATUS.OK).json(successResponse(roles));
  } catch (error) {
    await logger.error(
      "Get all roles failed with unexpected error",
      {
        error: error.message,
        stack: error.stack,
      },
      {
        userId: req.user?.userId,
        source: "role.getRoles",
      }
    );
    next(error);
  }
};

/**
 * Update an existing role by ID.
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Promise<void>}
 */
const updateRole = async (req, res, next) => {
  const roleId = req.params.id;
  const updateData = req.body;

  try {
    await logger.info(
      "Role update attempt started",
      {
        roleId,
        updateFields: Object.keys(updateData),
        updateData: updateData,
      },
      {
        userId: req.user?.userId,
        source: "role.updateRole",
      }
    );

    const updatedRole = await Role.findByIdAndUpdate(roleId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedRole) {
      await logger.warn(
        "Role update failed - role not found",
        { roleId },
        {
          userId: req.user?.userId,
          source: "role.updateRole",
        }
      );
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse(MESSAGES.ROLE_NOT_EXIST));
    }

    await logger.info(
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
      {
        userId: req.user?.userId,
        source: "role.updateRole",
      }
    );

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse(null, MESSAGES.ROLE_UPDATED));
  } catch (error) {
    await logger.error(
      "Role update failed with unexpected error",
      {
        roleId,
        updateData,
        error: error.message,
        stack: error.stack,
      },
      {
        userId: req.user?.userId,
        source: "role.updateRole",
      }
    );
    next(error);
  }
};

/**
 * Delete a role by ID.
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Promise<void>}
 */
const deleteRole = async (req, res, next) => {
  const roleId = req.params.id;

  try {
    await logger.info(
      "Role deletion attempt started",
      { roleId },
      {
        userId: req.user?.userId,
        source: "role.deleteRole",
      }
    );

    const deletedRole = await Role.findByIdAndDelete(roleId);

    if (!deletedRole) {
      await logger.warn(
        "Role deletion failed - role not found",
        { roleId },
        {
          userId: req.user?.userId,
          source: "role.deleteRole",
        }
      );
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse(MESSAGES.ROLE_NOT_EXIST));
    }

    await logger.info(
      "Role deletion successful",
      {
        roleId: deletedRole._id,
        deletedRoleName: deletedRole.name,
        deletedRoleDescription: deletedRole.description,
      },
      {
        userId: req.user?.userId,
        source: "role.deleteRole",
      }
    );

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse(null, MESSAGES.ROLE_DELETED));
  } catch (error) {
    await logger.error(
      "Role deletion failed with unexpected error",
      {
        roleId,
        error: error.message,
        stack: error.stack,
      },
      {
        userId: req.user?.userId,
        source: "role.deleteRole",
      }
    );
    next(error);
  }
};

module.exports = {
  createRole,
  getRoles,
  updateRole,
  deleteRole,
};
