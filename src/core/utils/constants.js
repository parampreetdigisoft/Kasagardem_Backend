module.exports = {
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
  },
  MESSAGES: {
    //#region Authentication Messages
    USER_CREATED: "User registered successfully",
    LOGIN_SUCCESS: "Login successful",
    INVALID_CREDENTIALS: "Invalid email or password",
    USER_EXISTS: "User with this email already exists",
    TOKEN_INVALID: "Invalid token",
    TOKEN_EXPIRED: "Expired token",
    UNAUTHORIZED: "Access denied. No token provided.",
    //#endregion

    //#region User Profile Messages
    PROFILE_SUCCESS: "Profile retrieved successfully",
    PROFILE_USER_NOTFOUND: "User not found",
    PROFILE_CREATED: "Profile created successfully",
    PROFILE_UPDATED: "Profile updated successfully",
    PROFILE_DELETED: "Profile deleted successfully",
    //#endregion

    //#region Role Messages
    ROLE_INVALID_ID: "Invalid role ID",
    ROLE_CREATED: "New role is added successfully",
    ROLE_UPDATED: "Role updated successfully",
    ROLE_NOT_EXIST: "Role not found",
    ROLE_EXIST: "Role already exists",
    ROLE_DELETED: "Role deleted successfully",
    //#endregion
  },
};
