const Joi = require("joi");

const createUserProfileValidation = Joi.object({
  profileImageUrl: Joi.string().uri().messages({
    "string.uri": "Profile image URL must be valid",
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

const updateUserProfileValidation = createUserProfileValidation;

module.exports = {
  createUserProfileValidation,
  updateUserProfileValidation,
};
