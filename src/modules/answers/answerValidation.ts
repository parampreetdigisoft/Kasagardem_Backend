import Joi, { ObjectSchema } from "joi";
import { Types } from "mongoose";

/**
 * Validates that a given value is a valid MongoDB ObjectId string.
 *
 * @param value - The input string to validate.
 * @param helpers - Joi helpers used to report validation errors.
 * @returns The original value if it is a valid ObjectId, otherwise a Joi error report.
 */
const objectIdValidator = (
  value: string,
  helpers: Joi.CustomHelpers
): string | Joi.ErrorReport => {
  if (!Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
};

export const answerValidation: ObjectSchema = Joi.object({
  answers: Joi.array()
    .items(
      Joi.object({
        questionId: Joi.alternatives()
          .try(
            Joi.string().custom(objectIdValidator).messages({
              "any.invalid": "Question ID must be a valid ObjectId",
            }),
            Joi.object().instance(Types.ObjectId)
          )
          .required()
          .messages({
            "any.required": "Question ID is required",
          }),

        // Changed to number to match MongoDB bsonType: "int"
        type: Joi.number().integer().valid(1, 2).required().messages({
          "any.only": "Type must be either 1 (option) or 2 (address)",
          "any.required": "Type is required",
          "number.base": "Type must be a number (1 or 2)",
          "number.integer": "Type must be an integer",
        }),

        selectedOption: Joi.when("type", {
          is: 1,
          then: Joi.string().min(1).required().messages({
            "string.base": "Selected option must be a string",
            "string.empty": "Selected option is required",
            "string.min": "Selected option cannot be empty",
            "any.required": "Selected option is required when type=1",
          }),
          otherwise: Joi.forbidden().messages({
            "any.unknown": "selectedOption is not allowed when type=2",
          }),
        }),

        selectedAddress: Joi.when("type", {
          is: 2,
          then: Joi.object({
            state: Joi.string().min(1).required().messages({
              "string.base": "State must be a string",
              "string.empty": "State is required",
              "string.min": "State cannot be empty",
              "any.required": "State is required",
            }),
            city: Joi.string().min(1).required().messages({
              "string.base": "City must be a string",
              "string.empty": "City is required",
              "string.min": "City cannot be empty",
              "any.required": "City is required",
            }),
          })
            .strict() // No additional properties in address (matches MongoDB additionalProperties: false)
            .required()
            .messages({
              "any.required": "Selected address is required when type=2",
              "object.unknown":
                "Additional properties are not allowed in selectedAddress",
            }),
          otherwise: Joi.forbidden().messages({
            "any.unknown": "selectedAddress is not allowed when type=1",
          }),
        }),
      })
        .strict() // No additional properties in answer items (matches MongoDB additionalProperties: false)
        .required()
        .messages({
          "object.unknown":
            "Additional properties are not allowed in answer items",
        })
    )
    .min(1)
    .required()
    .messages({
      "array.base": "Answers must be an array",
      "array.min": "At least one answer is required",
      "any.required": "Answers are required",
    }),

  isDeleted: Joi.boolean().optional().default(false).messages({
    "boolean.base": "isDeleted must be true or false",
  }),

  // Optional fields that might be set by the application/mongoose
  createdAt: Joi.date().optional(),
  updatedAt: Joi.date().optional(),
  __v: Joi.number().integer().optional(), // Mongoose version key
})
  .strict() // No additional properties at root level (matches MongoDB additionalProperties: false)
  .messages({
    "object.unknown": "Additional properties are not allowed",
  });
