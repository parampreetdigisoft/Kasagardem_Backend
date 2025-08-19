import Joi, { ObjectSchema } from "joi";

export const createUserProfileValidation: ObjectSchema = Joi.object({
  profileImage: Joi.string().messages({
    "string.base": "Profile image must be a string",
  }),
  dateOfBirth: Joi.date().max("now").messages({
    "date.max": "Date of birth cannot be in the future",
  }),
  gender: Joi.string().valid("male", "female", "other").messages({
    "any.only": "Gender must be male, female, or other",
  }),
  bio: Joi.string().max(500).trim().messages({
    "string.max": "Bio cannot exceed 500 characters",
  }),
  address: Joi.object({
    street: Joi.string().trim(),
    city: Joi.string().trim(),
    state: Joi.string().trim(),
    country: Joi.string().trim(),
    zipCode: Joi.string().trim(),
  }),
  occupation: Joi.string().max(100).trim().messages({
    "string.max": "Occupation cannot exceed 100 characters",
  }),
  company: Joi.string().max(100).trim().messages({
    "string.max": "Company name cannot exceed 100 characters",
  }),
});

export const updateUserProfileValidation = createUserProfileValidation;
