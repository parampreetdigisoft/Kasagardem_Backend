import Joi, { ObjectSchema } from "joi";

const plantIdentifyValidation: ObjectSchema = Joi.object({
  images: Joi.array()
    .items(
      Joi.string()
        // allow base64 strings with data:image/... prefix
        .pattern(/^data:image\/(png|jpe?g|jpg|gif);base64,.+/)
        .required()
    )
    .min(1)
    .required()
    .messages({
      "array.base": "Images must be an array of Base64 strings",
      "array.min": "At least one image is required for identification",
      "string.pattern.base": "Each image must be a valid Base64 image string",
      "any.required": "Images are required for plant identification",
    }),
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180),
  }),
  // hints: Joi.object({
  //   size: Joi.string().valid("small", "medium", "large"),
  //   habitat: Joi.string().valid("indoor", "outdoor", "wild", "garden"),
  //   season: Joi.string().valid("spring", "summer", "fall", "winter"),
  // }),
});

export { plantIdentifyValidation };
