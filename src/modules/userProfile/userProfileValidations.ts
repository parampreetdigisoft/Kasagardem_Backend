import Joi, { ObjectSchema } from "joi";

export const createUserProfileValidation: ObjectSchema = Joi.object({
  profileImage: Joi.string().allow("", null).optional().messages({
    "string.base": "Profile image must be a string",
  }),

  dateOfBirth: Joi.date().max("now").allow("", null).optional().messages({
    "date.max": "Date of birth cannot be in the future",
  }),

  gender: Joi.string()
    .valid("male", "female", "other")
    .allow("", null)
    .optional()
    .messages({
      "any.only": "Gender must be male, female, or other",
    }),

  bio: Joi.string().max(500).trim().allow("", null).optional().messages({
    "string.max": "Bio cannot exceed 500 characters",
  }),

  address: Joi.object({
    street: Joi.string().trim().allow("", null).optional(),
    city: Joi.string().trim().allow("", null).optional(),
    state: Joi.string().trim().allow("", null).optional(),
    country: Joi.string().trim().allow("", null).optional(),
    zipCode: Joi.string().trim().allow("", null).optional(),
  })
    .allow("", null)
    .optional(),

  occupation: Joi.string().max(100).trim().allow("", null).optional().messages({
    "string.max": "Occupation cannot exceed 100 characters",
  }),

  company: Joi.string().max(100).trim().allow("", null).optional().messages({
    "string.max": "Company name cannot exceed 100 characters",
  }),
});

export const updateUserProfileValidation = createUserProfileValidation;
