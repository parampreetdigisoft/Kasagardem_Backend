const Joi = require("joi");

const roleValidation = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    "string.empty": "Role name is required",
    "string.min": "Role name must be at least 2 characters",
    "string.max": "Role name must not exceed 50 characters",
    "any.required": "Role name is required",
  }),
});

module.exports = { roleValidation };
