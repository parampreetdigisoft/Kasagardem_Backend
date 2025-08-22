import Joi, { ObjectSchema } from "joi";

const plantConversationValidation: ObjectSchema = Joi.object({
  identificationId: Joi.string().required().messages({
    "string.base": "Identification ID must be a string",
    "any.required": "Identification ID is required for plant conversation",
  }),
  question: Joi.string().min(1).max(1000).required().messages({
    "string.base": "Question must be a string",
    "string.empty": "Question cannot be empty",
    "string.min": "Question must contain at least 1 character",
    "string.max": "Question cannot exceed 1000 characters",
    "any.required": "Question is required for plant conversation",
  }),
  prompt: Joi.string().max(500).optional().messages({
    "string.base": "Prompt must be a string",
    "string.max": "Prompt cannot exceed 500 characters",
  }),
  temperature: Joi.number().min(0).max(2).optional().messages({
    "number.base": "Temperature must be a number",
    "number.min": "Temperature must be at least 0",
    "number.max": "Temperature cannot exceed 2",
  }),
  appName: Joi.string().max(100).optional().messages({
    "string.base": "App name must be a string",
    "string.max": "App name cannot exceed 100 characters",
  }),
});

const identificationParamValidation: ObjectSchema = Joi.object({
  identificationId: Joi.string().required().messages({
    "string.base": "Identification ID must be a string",
    "any.required": "Identification ID is required",
  }),
});

export { plantConversationValidation, identificationParamValidation };
