const { errorResponse } = require("../utils/responseFormatter");
const { HTTP_STATUS } = require("../utils/constants");

/**
 * Middleware factory to validate incoming request bodies against a given Joi schema.
 * @param {object} schema - Joi schema object used to validate the request body.
 * @returns {Function} Express middleware function that validates the request.
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path[0],
        message: detail.message,
      }));
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(errorResponse("Validation failed", errors));
    }
    next();
  };
};

module.exports = validateRequest;
