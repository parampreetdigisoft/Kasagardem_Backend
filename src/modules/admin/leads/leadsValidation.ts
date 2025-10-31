import Joi, { ObjectSchema } from "joi";

export const leadValidation: ObjectSchema = Joi.object({
  partnerProfileIds: Joi.array()
    .items(
      Joi.string().uuid({ version: "uuidv4" }).messages({
        "string.guid": "Each partner profile ID must be a valid UUID",
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
