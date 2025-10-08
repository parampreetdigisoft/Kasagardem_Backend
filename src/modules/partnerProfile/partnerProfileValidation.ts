import Joi, { ObjectSchema } from "joi";

export const createPartnerProfileValidation: ObjectSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Email must be a valid email address",
    "any.required": "Email is required",
  }),

  mobileNumber: Joi.string()
    .pattern(/^\+?[1-9]\d{7,14}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Mobile number must be in valid E.164 format (+1234567890)",
      "any.required": "Mobile number is required",
    }),

  companyName: Joi.string().max(150).trim().messages({
    "string.max": "Company name cannot exceed 150 characters",
  }),

  speciality: Joi.array().items(Joi.string().trim()).messages({
    "array.base": "Speciality must be an array of strings",
  }),

  address: Joi.object({
    street: Joi.string().trim(),
    city: Joi.string().trim(),
    state: Joi.string().trim(),
    country: Joi.string().trim(),
    zipCode: Joi.string().trim(),
  }),

  website: Joi.string().uri().messages({
    "string.uri": "Website must be a valid URL",
  }),

  contactPerson: Joi.string().max(100).trim().messages({
    "string.max": "Contact person name cannot exceed 100 characters",
  }),

  projectImageUrl: Joi.string().messages({
    "string.base": "project Image Url must be a string",
  }),

  status: Joi.string()
    .valid("active", "inactive", "pending", "suspended")
    .messages({
      "any.only": "Status must be active, inactive, pending, or suspended",
    }),
});

export const updatePartnerProfileValidation = createPartnerProfileValidation;

export const updatePartnerRatingValidation: ObjectSchema = Joi.object({
  partnerId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Invalid partnerId format. Must be a valid ObjectId.",
      "any.required": "partnerId is required",
    }),

  rating: Joi.number().min(0).max(5).required().messages({
    "number.base": "Rating must be a number",
    "number.min": "Rating cannot be less than 0",
    "number.max": "Rating cannot be greater than 5",
    "any.required": "Rating is required",
  }),
});
