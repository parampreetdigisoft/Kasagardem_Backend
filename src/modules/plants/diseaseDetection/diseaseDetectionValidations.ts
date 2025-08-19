import Joi, { ObjectSchema } from "joi";

const plantDiseaseValidation: ObjectSchema = Joi.object({
  images: Joi.array()
    .items(
      Joi.string()
        .pattern(/^data:image\/(jpeg|jpg|png|gif|webp);base64,/)
        .required()
    )
    .min(1)
    .max(5)
    .required()
    .messages({
      "array.base": "Images must be an array of base64 encoded images",
      "array.min": "At least one image is required for disease detection",
      "array.max": "Maximum 5 images allowed for disease detection",
      "string.pattern.base":
        "Each image must be a valid base64 encoded image (jpeg, jpg, png, gif, or webp)",
      "any.required": "Images are required for plant disease detection",
    }),
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90).messages({
      "number.base": "Latitude must be a number",
      "number.min": "Latitude must be between -90 and 90 degrees",
      "number.max": "Latitude must be between -90 and 90 degrees",
    }),
    longitude: Joi.number().min(-180).max(180).messages({
      "number.base": "Longitude must be a number",
      "number.min": "Longitude must be between -180 and 180 degrees",
      "number.max": "Longitude must be between -180 and 180 degrees",
    }),
  })
    .and("latitude", "longitude")
    .messages({
      "object.and": "Both latitude and longitude must be provided together",
    }),
});

export { plantDiseaseValidation };
