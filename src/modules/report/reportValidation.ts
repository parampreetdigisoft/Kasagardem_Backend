import Joi, { ObjectSchema } from "joi";

export const reportValidation: ObjectSchema = Joi.object({
  userId: Joi.string().required().messages({
    "string.empty": "User ID is required",
    "any.required": "User ID is required",
  }),
  answers: Joi.array()
    .items(
      Joi.object({
        questionId: Joi.string().required().messages({
          "string.empty": "Question ID is required in answers",
          "any.required": "Question ID is required in answers",
        }),
        selectedOption: Joi.string().required().messages({
          "string.empty": "Selected option is required",
          "any.required": "Selected option is required",
        }),
      })
    )
    .min(1)
    .required()
    .messages({
      "array.min": "At least 1 answer is required",
      "any.required": "Answers are required",
    }),
  generatedRecommendations: Joi.array().items(Joi.string()).optional(),
});
