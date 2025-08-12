const UserProfile = require("./userProfileModel");
const User = require("../auth/authModel");
const {
  successResponse,
  errorResponse,
} = require("../../core/utils/responseFormatter");
const { HTTP_STATUS, MESSAGES } = require("../../core/utils/constants");
const logger = require("../../core/utils/logger");

const createUserProfile = async (req, res, next) => {
  try {
    const email = req.user.userEmail; // From auth middleware
    // Log profile creation attempt
    await logger.info("User profile creation attempt", {
      email,
      action: "createUserProfile",
    });
    // Check if user exists
    const userExists = await User.findOne({ email });
    if (!userExists) {
      await logger.error("Profile creation failed - User not found", {
        email,
        action: "createUserProfile",
      });
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse(MESSAGES.PROFILE_USER_NOTFOUND));
    }

    // Check if profile already exists
    const existingProfile = await UserProfile.findOne({
      userId: userExists._id,
    });
    if (existingProfile) {
      await logger.warn("Profile creation failed - Profile already exists", {
        email,
        userId: userExists._id,
        action: "createUserProfile",
      });
      return res
        .status(HTTP_STATUS.CONFLICT)
        .json(errorResponse("User profile already exists"));
    }

    const profileData = { ...req.body, userId: userExists._id };
    await UserProfile.create(profileData);

    // Log successful profile creation
    await logger.info(
      "User profile created successfully",
      {
        email,
        userId: userExists._id,
        action: "createUserProfile",
        profileFields: Object.keys(req.body),
      },
      { userId: userExists._id }
    );

    res
      .status(HTTP_STATUS.CREATED)
      .json(successResponse(null, MESSAGES.PROFILE_CREATED));
  } catch (error) {
    // Log error
    await logger.error("Profile creation error", {
      email: req.user?.userEmail,
      error: error.message,
      stack: error.stack,
      action: "createUserProfile",
    });
    next(error);
  }
};

const getCurrentUserProfile = async (req, res, next) => {
  try {
    // Get email from token and find user to get userId
    const email = req.user.userEmail; // From auth middleware
    // Log profile retrieval attempt
    await logger.info("User profile retrieval attempt", {
      email,
      action: "getCurrentUserProfile",
    });

    const user = await User.findOne({ email });
    if (!user) {
      await logger.error("Profile retrieval failed - User not found", {
        email,
        action: "getCurrentUserProfile",
      });
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse(MESSAGES.PROFILE_USER_NOTFOUND));
    }

    const userId = user._id;

    const userProfile = await UserProfile.findOne({ userId })
      .select("-_id -__v") // Exclude _id and __v fields
      .populate("userId", "name email -_id"); // Also exclude _id from populated userId

    if (!userProfile) {
      await logger.warn("Profile retrieval failed - Profile not found", {
        email,
        userId,
        action: "getCurrentUserProfile",
      });
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse(MESSAGES.PROFILE_USER_NOTFOUND));
    }

    // Log successful profile retrieval
    await logger.info(
      "User profile retrieved successfully",
      {
        email,
        userId,
        action: "getCurrentUserProfile",
      },
      { userId }
    );

    res.status(HTTP_STATUS.OK).json(successResponse(userProfile));
  } catch (error) {
    // Log error
    await logger.error("Profile retrieval error", {
      email: req.user?.userEmail,
      error: error.message,
      stack: error.stack,
      action: "getCurrentUserProfile",
    });
    next(error);
  }
};

const updateUserProfile = async (req, res, next) => {
  try {
    // Get email from token and find user to get userId
    const email = req.user.userEmail; // From auth middleware

    // Log profile update attempt
    await logger.info("User profile update attempt", {
      email,
      action: "updateUserProfile",
      updateFields: Object.keys(req.body),
    });

    const user = await User.findOne({ email });
    if (!user) {
      await logger.error("Profile update failed - User not found", {
        email,
        action: "updateUserProfile",
      });
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse(MESSAGES.PROFILE_USER_NOTFOUND));
    }

    const userId = user._id;

    const updatedProfile = await UserProfile.findOneAndUpdate(
      { userId },
      req.body,
      { new: true, runValidators: true }
    ).populate("userId", "name email");

    if (!updatedProfile) {
      await logger.warn("Profile update failed - Profile not found", {
        email,
        userId,
        action: "updateUserProfile",
      });
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse(MESSAGES.PROFILE_USER_NOTFOUND));
    }
    // Log successful profile update
    await logger.info(
      "User profile updated successfully",
      {
        email,
        userId,
        action: "updateUserProfile",
        updatedFields: Object.keys(req.body),
      },
      { userId }
    );

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse(null, MESSAGES.PROFILE_UPDATED));
  } catch (error) {
    // Log error
    await logger.error("Profile update error", {
      email: req.user?.userEmail,
      error: error.message,
      stack: error.stack,
      action: "updateUserProfile",
      updateFields: Object.keys(req.body || {}),
    });
    next(error);
  }
};

const deleteUserProfile = async (req, res, next) => {
  try {
    // Get email from token and find user to get userId
    const email = req.user.userEmail; // From auth middleware

    // Log profile deletion attempt
    await logger.info("User profile deletion attempt", {
      email,
      action: "deleteUserProfile",
    });

    const user = await User.findOne({ email });
    if (!user) {
      await logger.error("Profile deletion failed - User not found", {
        email,
        action: "deleteUserProfile",
      });
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse(MESSAGES.PROFILE_USER_NOTFOUND));
    }

    const userId = user._id;

    const deletedProfile = await UserProfile.findOneAndDelete({ userId });
    if (!deletedProfile) {
      await logger.warn("Profile deletion failed - Profile not found", {
        email,
        userId,
        action: "deleteUserProfile",
      });
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse(MESSAGES.PROFILE_USER_NOTFOUND));
    }

    // Log successful profile deletion
    await logger.info(
      "User profile deleted successfully",
      {
        email,
        userId,
        action: "deleteUserProfile",
      },
      { userId }
    );

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse(null, MESSAGES.PROFILE_DELETED));
  } catch (error) {
    // Log error
    await logger.error("Profile deletion error", {
      email: req.user?.userEmail,
      error: error.message,
      stack: error.stack,
      action: "deleteUserProfile",
    });
    next(error);
  }
};

module.exports = {
  createUserProfile,
  getCurrentUserProfile,
  updateUserProfile,
  deleteUserProfile,
};
