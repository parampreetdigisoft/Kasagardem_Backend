import Joi, { ObjectSchema } from "joi";

export const leadValidation: ObjectSchema = Joi.object({
  partnerProfileIds: Joi.array()
    .items(
      Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
          "string.pattern.base":
            "Each partner profile ID must be a valid ObjectId",
        })
    )
    .min(1)
    .required()
    .messages({
      "array.base": "Partner profile IDs must be an array",
      "array.min": "At least one partner profile ID is required",
      "any.required": "Partner profile IDs are required",
    }),
  isDeleted: Joi.boolean().default(false).messages({
    "boolean.base": "isDeleted must be a boolean",
  }),
});
