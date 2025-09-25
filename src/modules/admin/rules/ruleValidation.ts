import Joi, { ObjectSchema } from "joi";

// Validate a MongoDB ObjectId as a 24-character hex string
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const conditionSchema = Joi.object({
  questionId: Joi.string().pattern(objectIdPattern).required().messages({
    "string.pattern.base": "questionId must be a valid 24-character ObjectId",
    "string.empty": "questionId is required",
    "any.required": "questionId is required",
  }),
  operator: Joi.string()
    .valid("equals", "in", "and", "or")
    .required()
    .messages({
      "any.only": "Operator must be one of: equals, in, and, or",
      "any.required": "Operator is required",
    }),
  values: Joi.array().items(Joi.string().min(1)).min(1).required().messages({
    "array.base": "Values must be an array",
    "array.min": "At least one value must be provided",
    "any.required": "Values are required",
  }),
});

export const ruleValidation: ObjectSchema = Joi.object({
  name: Joi.string().min(3).required().messages({
    "string.empty": "Rule name is required",
    "string.min": "Rule name must be at least 3 characters",
    "any.required": "Rule name is required",
  }),
  conditions: Joi.array().items(conditionSchema).min(1).required().messages({
    "array.base": "Conditions must be an array",
    "array.min": "At least one condition is required",
    "any.required": "Conditions are required",
  }),
  affiliateFor: Joi.string().allow(null).optional().messages({
    "string.base": "affiliateFor must be a string or null",
  }), // ✅ new field
});
