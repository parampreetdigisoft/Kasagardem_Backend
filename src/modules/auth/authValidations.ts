import Joi, { CustomHelpers } from "joi";
import { RoleCodeMap } from "../../interface/role";

/**
 * Validates password complexity against specific rules.
 * Ensures the password contains at least:
 *  - one lowercase letter
 *  - one uppercase letter
 *  - one number
 *  - one special character
 *
 * @param {string} value - The password string to validate.
 * @param {import("joi").CustomHelpers} helpers - Joi custom helpers for returning errors.
 * @returns {string | import("joi").ErrorReport} The validated password string if valid,
 * or a Joi.ErrorReport if validation fails.
 */
const passwordComplexity = (
  value: string,
  helpers: CustomHelpers
): string | Joi.ErrorReport => {
  const errors: string[] = [];

  if (!/[a-z]/.test(value))
    errors.push("Password must include at least one lowercase letter");
  if (!/[A-Z]/.test(value))
    errors.push("Password must include at least one uppercase letter");
  if (!/[0-9]/.test(value))
    errors.push("Password must include at least one number");
  if (!/[\W_]/.test(value))
    errors.push("Password must include at least one special character");

  if (errors.length) {
    // helpers.message returns a Joi.ErrorReport, not a string
    return helpers.message({ custom: errors.join(", ") });
  }

  return value;
};

export const registerValidation = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(6)
    .required()
    .custom(passwordComplexity, "Password complexity validation"),
  roleCode: Joi.string()
    .length(1)
    .valid(...Object.keys(RoleCodeMap))
    .required(),
  phoneNumber: Joi.string()
    .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/)
    .optional(),
});

export const loginValidation = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Unified Validation for Send/Resend Password Reset Token
export const handlePasswordResetTokenValidation = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
      "any.required": "Email is required",
    }),
  isResend: Joi.boolean().default(false).messages({
    "boolean.base": "isResend must be a boolean value",
  }),
});

// Reset Password Validation (final step)
export const resetPasswordValidation = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
      "any.required": "Email is required",
    }),
  password: Joi.string()
    .min(6)
    .required()
    .custom(passwordComplexity, "Password complexity validation"),
  token: Joi.string()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      "string.length": "Password reset token must be exactly 6 digits",
      "string.pattern.base": "Password reset token must contain only numbers",
      "string.empty": "Password reset token is required",
      "any.required": "Password reset token is required",
    }),
});

// Resend Password Reset Token Validation (same as send)
export const resendPasswordResetTokenValidation = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
      "any.required": "Email is required",
    }),
});

// Verify Password Reset Token Validation
export const verifyPasswordResetTokenValidation = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
      "any.required": "Email is required",
    }),
  token: Joi.string()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      "string.length": "Password reset token must be exactly 6 digits",
      "string.pattern.base": "Password reset token must contain only numbers",
      "string.empty": "Password reset token is required",
      "any.required": "Password reset token is required",
    }),
});

// Password Change Validation (JWT-based)
export const passwordChangeValidation = Joi.object({
  password: Joi.string()
    .min(6)
    .required()
    .custom(passwordComplexity, "Password complexity validation")
    .messages({
      "string.min": "Password must be at least 6 characters long",
      "string.empty": "Password is required",
      "any.required": "Password is required",
    }),
});

/**
 * Validation schema for Google OAuth authentication
 */
export const googleAuthValidation = Joi.object({
  googleAccessToken: Joi.string().min(1).required().messages({
    "string.empty": "Google access token is required",
    "any.required": "Google access token is required",
    "string.min": "Google access token cannot be empty",
  }),

  roleCode: Joi.string().optional().messages({
    "string.base": "Role code must be a string",
  }),
}).messages({
  "object.unknown": "Unknown field provided in request body",
});

/**
 * Validation schema for Facebook OAuth authentication
 */
export const facebookAuthValidation = Joi.object({
  facebookAccessToken: Joi.string().min(1).required().messages({
    "string.empty": "Facebook access token is required",
    "any.required": "Facebook access token is required",
    "string.min": "Facebook access token cannot be empty",
  }),
  roleCode: Joi.string().optional(),
});
