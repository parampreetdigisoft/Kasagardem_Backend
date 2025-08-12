/**
 * Formats a standardized success response object.
 * @param {*} data - The data payload to return in the response.
 * @param {string} message - A descriptive success message. Default is "Success".
 * @returns {object} The formatted success response object.
 */
const successResponse = (data, message = "Success") => {
  return {
    success: true,
    message,
    data,
  };
};

/**
 * Formats a standardized error response object.
 * @param {string} message - A descriptive error message. Default is "Error occurred".
 * @param {object|null} errors - Optional detailed error information. Default is null.
 * @returns {object} The formatted error response object.
 */
const errorResponse = (message = "Error occurred", errors = null) => {
  const response = {
    success: false,
    message,
  };
  if (errors) {
    response.errors = errors;
  }
  return response;
};

module.exports = {
  successResponse,
  errorResponse,
};
