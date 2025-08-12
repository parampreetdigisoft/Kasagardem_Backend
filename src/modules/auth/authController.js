const User = require("./authModel");
const Role = require("../roles/roleModel");
const {
  successResponse,
  errorResponse,
} = require("../../core/utils/responseFormatter");
const { HTTP_STATUS, MESSAGES } = require("../../core/utils/constants");
const {
  generateToken,
  oauth2Client,
} = require("../../core/utils/usableMethods");
const logger = require("../../core/utils/logger");

/**
 * Registers a new user in the system.
 * @param {import('express').Request} req - The HTTP request object.
 * @param {import('express').Response} res - The HTTP response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, roleId, phoneNumber } = req.body;

    await logger.info(
      "User registration attempt started",
      { email, roleId, hasPhoneNumber: !!phoneNumber },
      { source: "auth.register" }
    );

    // Check if roleId exists in Roles collection
    const roleExists = await Role.findById(roleId);
    if (!roleExists) {
      await logger.warn(
        "Registration failed - invalid role ID",
        { email, roleId },
        { source: "auth.register" }
      );
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(errorResponse(MESSAGES.ROLE_INVALID_ID));
    }

    // Check if user email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      await logger.warn(
        "Registration failed - user already exists",
        { email },
        { source: "auth.register" }
      );
      return res
        .status(HTTP_STATUS.CONFLICT)
        .json(errorResponse(MESSAGES.USER_EXISTS));
    }

    // Create the user
    const newUser = await User.create({
      name,
      email,
      password,
      roleId,
      phoneNumber,
    });
    await logger.info(
      "User registration successful",
      {
        userId: newUser._id,
        email,
        roleId,
        hasPhoneNumber: !!phoneNumber,
      },
      {
        userId: newUser._id.toString(),
        source: "auth.register",
      }
    );
    res
      .status(HTTP_STATUS.CREATED)
      .json(successResponse(null, MESSAGES.USER_CREATED));
  } catch (error) {
    // Handle MongoDB unique email duplicate error
    if (error.code === 11000 && error.keyPattern?.email) {
      await logger.warn(
        "Registration failed - duplicate email constraint",
        { error: error.message },
        { source: "auth.register" }
      );
      return res
        .status(HTTP_STATUS.CONFLICT)
        .json(errorResponse(MESSAGES.USER_EXISTS));
    }
    await logger.error(
      "User registration failed with unexpected error",
      {
        error: error.message,
        stack: error.stack,
      },
      { source: "auth.register" }
    );
    next(error);
  }
};

/**
 * Authenticates a user and returns a JWT token.
 * @param {import('express').Request} req - The HTTP request object.
 * @param {import('express').Response} res - The HTTP response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    await logger.info(
      "User login attempt started",
      { email },
      { source: "auth.login" }
    );

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      await logger.warn(
        "Login failed - user not found",
        { email },
        { source: "auth.login" }
      );
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(errorResponse(MESSAGES.INVALID_CREDENTIALS));
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await logger.warn(
        "Login failed - invalid password",
        { email, userId: user._id },
        {
          userId: user._id.toString(),
          source: "auth.login",
        }
      );
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(errorResponse(MESSAGES.INVALID_CREDENTIALS));
    }
    // Find role name from Roles table using roleId
    const role = await Role.findById(user.roleId).select("name");
    if (!role) {
      await logger.error(
        "Login failed - role not found",
        {
          email,
          userId: user._id,
          roleId: user.roleId,
        },
        {
          userId: user._id.toString(),
          source: "auth.login",
        }
      );

      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(errorResponse("Role not found"));
    }

    // Generate token
    const token = generateToken(user.email, role.name);

    await logger.info(
      "User login successful",
      {
        email,
        userId: user._id,
        roleName: role.name,
      },
      {
        userId: user._id.toString(),
        source: "auth.login",
      }
    );

    res.status(HTTP_STATUS.OK).json(
      successResponse(
        {
          token,
        },
        MESSAGES.LOGIN_SUCCESS
      )
    );
  } catch (error) {
    await logger.error(
      "Login failed with unexpected error",
      {
        error: error.message,
        stack: error.stack,
      },
      { source: "auth.login" }
    );
    next(error);
  }
};

/**
 * Retrieves the profile of the authenticated user.
 * @param {import('express').Request} req - The HTTP request object.
 * @param {import('express').Response} res - The HTTP response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
const getProfile = async (req, res, next) => {
  try {
    await logger.info(
      "Get profile request started",
      { requestedUserId: req.user.userId },
      {
        userId: req.user.userId,
        source: "auth.getProfile",
      }
    );
    const user = await User.findById(req.user.userId);

    if (!user) {
      await logger.warn(
        "Get profile failed - user not found",
        { requestedUserId: req.user.userId },
        {
          userId: req.user.userId,
          source: "auth.getProfile",
        }
      );
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse("User not found"));
    }
    await logger.info(
      "Get profile successful",
      {
        userId: user._id,
        email: user.email,
      },
      {
        userId: user._id.toString(),
        source: "auth.getProfile",
      }
    );
    res
      .status(HTTP_STATUS.OK)
      .json(successResponse(user, MESSAGES.PROFILE_SUCCESS));
  } catch (error) {
    await logger.error(
      "Get profile failed with unexpected error",
      {
        requestedUserId: req.user.userId,
        error: error.message,
        stack: error.stack,
      },
      {
        userId: req.user.userId,
        source: "auth.getProfile",
      }
    );
    next(error);
  }
};

const googleAuth = async (req, res, next) => {
  try {
    const { idToken, roleId } = req.body;

    await logger.info(
      "Google authentication attempt started",
      { roleId, hasIdToken: !!idToken },
      { source: "auth.googleAuth" }
    );

    // Validate required fields
    if (!idToken) {
      await logger.warn(
        "Google auth failed - missing ID token",
        {},
        { source: "auth.googleAuth" }
      );

      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(errorResponse("Google ID token is required"));
    }

    if (!roleId) {
      await logger.warn(
        "Google auth failed - missing role ID",
        {},
        { source: "auth.googleAuth" }
      );

      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(errorResponse("Role ID is required"));
    }

    // Check if roleId exists
    const roleExists = await Role.findById(roleId);
    if (!roleExists) {
      await logger.warn(
        "Google auth failed - invalid role ID",
        { roleId },
        { source: "auth.googleAuth" }
      );
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(errorResponse(MESSAGES.ROLE_INVALID_ID));
    }

    // Verify Google ID token using googleapis
    let ticket;
    try {
      ticket = await oauth2Client.verifyIdToken({
        idToken: idToken,
        audience: process.env.GOOGLE_CLIENT_ID, // Your Google Client ID
      });

      await logger.info(
        "Google token verification successful",
        {},
        { source: "auth.googleAuth" }
      );
    } catch (tokenError) {
      await logger.error(
        "Google token verification failed",
        {
          error: tokenError.message,
          stack: tokenError.stack,
        },
        { source: "auth.googleAuth" }
      );
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(errorResponse("Invalid Google token"));
    }

    // Extract user information from verified token
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, email_verified } = payload;

    await logger.info(
      "Google user info extracted",
      {
        email,
        name,
        googleId,
        emailVerified: email_verified,
      },
      { source: "auth.googleAuth" }
    );

    // Check if email is verified
    if (!email_verified) {
      await logger.warn(
        "Google auth failed - email not verified",
        { email },
        { source: "auth.googleAuth" }
      );

      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(errorResponse("Google email not verified"));
    }

    // Try to find user by googleId
    let user = await User.findOne({ googleId });

    if (user) {
      // User exists with this Google ID, login
      await logger.info(
        "Existing Google user found - logging in",
        {
          userId: user._id,
          email: user.email,
        },
        {
          userId: user._id.toString(),
          source: "auth.googleAuth",
        }
      );

      // User exists with this Google ID, login
      const role = await Role.findById(user.roleId).select("name");
      const token = generateToken(user.email, role.name);

      await logger.info(
        "Google login successful for existing user",
        {
          userId: user._id,
          email: user.email,
          roleName: role.name,
        },
        {
          userId: user._id.toString(),
          source: "auth.googleAuth",
        }
      );

      return res
        .status(HTTP_STATUS.OK)
        .json(successResponse({ token }, MESSAGES.LOGIN_SUCCESS));
    }

    // If not found by googleId, check if email exists without googleId
    user = await User.findOne({ email });

    if (user && !user.googleId) {
      // Email exists but no googleId linked - optionally link accounts
      await logger.warn(
        "Google auth failed - email exists without Google ID",
        {
          email,
          existingUserId: user._id,
        },
        {
          userId: user._id.toString(),
          source: "auth.googleAuth",
        }
      );

      return res
        .status(HTTP_STATUS.CONFLICT)
        .json(
          errorResponse(
            "Email already registered. Please login with email and password or contact support to link accounts."
          )
        );
    }

    // Create new user with Google info, no password needed
    user = await User.create({
      name,
      email,
      roleId,
      googleId,
    });

    await logger.info(
      "New Google user created",
      {
        userId: user._id,
        email: user.email,
        roleId,
        googleId,
      },
      {
        userId: user._id.toString(),
        source: "auth.googleAuth",
      }
    );

    const role = await Role.findById(roleId).select("name");
    const token = generateToken(user.email, role.name);

    await logger.info(
      "Google registration and login successful",
      {
        userId: user._id,
        email: user.email,
        roleName: role.name,
      },
      {
        userId: user._id.toString(),
        source: "auth.googleAuth",
      }
    );

    res
      .status(HTTP_STATUS.CREATED)
      .json(successResponse({ token }, MESSAGES.USER_CREATED));
  } catch (error) {
    await logger.error(
      "Google auth failed with unexpected error",
      {
        error: error.message,
        stack: error.stack,
      },
      { source: "auth.googleAuth" }
    );
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  googleAuth,
};
