import Joi, { CustomHelpers } from "joi";

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
  roleId: Joi.string().length(24).hex().required(),
  phoneNumber: Joi.string()
    .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/)
    .optional(),
});

export const loginValidation = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const googleAuthValidation = Joi.object({
  googleId: Joi.string().required(),
  email: Joi.string().email().required(),
  name: Joi.string().min(2).max(50).required(),
  phoneNumber: Joi.string()
    .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/)
    .optional(),
  roleId: Joi.string().length(24).hex().required(),
});
