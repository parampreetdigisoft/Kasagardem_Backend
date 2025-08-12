const Joi = require("joi");

const registerValidation = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    "string.min": "Name must be at least 2 characters",
    "string.max": "Name cannot exceed 50 characters",
    "any.required": "Name is required",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters",
    "any.required": "Password is required",
  }),
  roleId: Joi.string().length(24).hex().required().messages({
    "string.length": "Role ID must be a valid 24-character hex string",
    "string.hex": "Role ID must be a valid hex string",
    "any.required": "Role is required",
  }),
  phoneNumber: Joi.string()
    .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/)
    .messages({
      "string.pattern.base": "Please provide a valid phone number",
    })
    .optional(),
});

const loginValidation = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email",
    "any.required": "Email is required",
  }),

  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

const googleAuthValidation = Joi.object({
  googleId: Joi.string().required().messages({
    "any.required": "Google ID is required",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email",
    "any.required": "Email is required",
  }),
  name: Joi.string().min(2).max(50).required().messages({
    "string.min": "Name must be at least 2 characters",
    "string.max": "Name cannot exceed 50 characters",
    "any.required": "Name is required",
  }),
  phoneNumber: Joi.string()
    .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/)
    .messages({
      "string.pattern.base": "Please provide a valid phone number",
    })
    .optional(),
  roleId: Joi.string().length(24).hex().required().messages({
    "string.length": "Role ID must be a valid 24-character hex string",
    "string.hex": "Role ID must be a valid hex string",
    "any.required": "Role is required",
  }),
});

module.exports = {
  registerValidation,
  loginValidation,
  googleAuthValidation,
};
