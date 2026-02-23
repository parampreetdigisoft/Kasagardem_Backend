import Joi, { ObjectSchema } from "joi";

// Create Plan Validation
export const createPlanValidation: ObjectSchema = Joi.object({
  plan_name: Joi.string().min(2).max(100).required().messages({
    "string.base": "Plan name must be a string",
    "string.empty": "Plan name is required",
    "string.min": "Plan name must be at least 2 characters",
    "string.max": "Plan name must not exceed 100 characters",
    "any.required": "Plan name is required",
  }),
  description: Joi.string().min(5).required().messages({
    "string.base": "Description must be a string",
    "string.empty": "Description is required",
    "string.min": "Description must be at least 5 characters",
    "any.required": "Description is required",
  }),
  monthly_price: Joi.number().required().messages({
    "number.base": "Monthly price must be a number",
    "any.required": "Monthly price is required",
  }),
  annual_price: Joi.number().required().messages({
    "number.base": "Annual price must be a number",
    "any.required": "Annual price is required",
  }),
  lead_limit_per_month: Joi.number().integer().required().messages({
    "number.base": "Lead limit must be a number",
    "number.integer": "Lead limit must be an integer",
    "any.required": "Lead limit per month is required",
  }),
  number_of_regions: Joi.number().integer().required().messages({
    "number.base": "Number of regions must be a number",
    "number.integer": "Number of regions must be an integer",
    "any.required": "Number of regions is required",
  }),
  highlight_in_result: Joi.boolean().required().messages({
    "boolean.base": "Highlight in result must be true or false",
    "any.required": "Highlight in result is required",
  }),
  verification_badge: Joi.boolean().required().messages({
    "boolean.base": "Verification badge must be true or false",
    "any.required": "Verification badge is required",
  }),
  status: Joi.string().valid("active", "inactive").required().messages({
    "any.only": "Status must be either 'active' or 'inactive'",
    "any.required": "Status is required",
  }),
});

// Update Plan Validation (same as create)
export const updatePlanValidation: ObjectSchema = Joi.object({
  //  Explicitly forbid plan_name
  plan_name: Joi.forbidden().messages({
    "any.unknown": "Plan name cannot be updated",
  }),
  id: Joi.string().required().messages({
    "string.base": "Plan ID must be a string",
    "any.required": "Plan ID is required",
  }),
  description: Joi.string().min(5).required().messages({
    "string.base": "Description must be a string",
    "string.empty": "Description is required",
    "string.min": "Description must be at least 5 characters",
    "any.required": "Description is required",
  }),

  monthly_price: Joi.number().required().messages({
    "number.base": "Monthly price must be a number",
    "any.required": "Monthly price is required",
  }),

  annual_price: Joi.number().required().messages({
    "number.base": "Annual price must be a number",
    "any.required": "Annual price is required",
  }),

  lead_limit_per_month: Joi.number().integer().required().messages({
    "number.base": "Lead limit must be a number",
    "number.integer": "Lead limit must be an integer",
    "any.required": "Lead limit per month is required",
  }),

  number_of_regions: Joi.number().integer().required().messages({
    "number.base": "Number of regions must be a number",
    "number.integer": "Number of regions must be an integer",
    "any.required": "Number of regions is required",
  }),

  highlight_in_result: Joi.boolean().required().messages({
    "boolean.base": "Highlight in result must be true or false",
    "any.required": "Highlight in result is required",
  }),

  verification_badge: Joi.boolean().required().messages({
    "boolean.base": "Verification badge must be true or false",
    "any.required": "Verification badge is required",
  }),

  status: Joi.string().valid("active", "inactive").required().messages({
    "any.only": "Status must be either 'active' or 'inactive'",
    "any.required": "Status is required",
  }),
}).required().unknown(false);