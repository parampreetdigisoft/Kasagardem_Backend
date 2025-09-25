import Joi, { ObjectSchema } from "joi";

export const questionValidation: ObjectSchema = Joi.object({
  text: Joi.string().min(5).max(255).required().messages({
    "string.empty": "Question text is required",
    "string.min": "Question text must be at least 5 characters",
    "string.max": "Question text must not exceed 255 characters",
    "any.required": "Question text is required",
  }),
  options: Joi.array()
    .items(
      Joi.string().allow(null, "").messages({
        "string.base": "Option must be a string or null",
      })
    )
    .optional()
    .messages({
      "array.base": "Options must be an array",
    }),
  order: Joi.number().integer().min(1).required().messages({
    "number.base": "Order must be a number",
    "number.min": "Order must be at least 1",
    "any.required": "Order is required",
  }),
});
