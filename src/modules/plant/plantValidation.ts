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

export const plantValidation: ObjectSchema = Joi.object({
  scientific_name: Joi.string().min(1).required().messages({
    "string.base": "Scientific name must be a string",
    "string.empty": "Scientific name is required",
    "string.min": "Scientific name cannot be empty",
    "any.required": "Scientific name is required",
  }),

  common_name: Joi.string().min(1).required().messages({
    "string.base": "Common name must be a string",
    "string.empty": "Common name is required",
    "string.min": "Common name cannot be empty",
    "any.required": "Common name is required",
  }),

  image_search_url: Joi.string().uri().optional().messages({
    "string.base": "Image search URL must be a string",
    "string.uri": "Image search URL must be a valid URL",
  }),

  space_types: Joi.array()
    .items(
      Joi.string().min(1).messages({
        "string.base": "Space type must be a string",
        "string.empty": "Space type cannot be empty",
        "string.min": "Space type cannot be empty",
      })
    )
    .optional()
    .messages({
      "array.base": "Space types must be an array",
    }),

  area_sizes: Joi.array()
    .items(
      Joi.string().min(1).messages({
        "string.base": "Area size must be a string",
        "string.empty": "Area size cannot be empty",
        "string.min": "Area size cannot be empty",
      })
    )
    .optional()
    .messages({
      "array.base": "Area sizes must be an array",
    }),

  challenges: Joi.array()
    .items(
      Joi.string().min(1).messages({
        "string.base": "Challenge must be a string",
        "string.empty": "Challenge cannot be empty",
        "string.min": "Challenge cannot be empty",
      })
    )
    .optional()
    .messages({
      "array.base": "Challenges must be an array",
    }),

  tech_preferences: Joi.array()
    .items(
      Joi.string().min(1).messages({
        "string.base": "Tech preference must be a string",
        "string.empty": "Tech preference cannot be empty",
        "string.min": "Tech preference cannot be empty",
      })
    )
    .optional()
    .messages({
      "array.base": "Tech preferences must be an array",
    }),

  locations: Joi.array()
    .items(
      Joi.object({
        type: Joi.string().min(1).required().messages({
          "string.base": "Location type must be a string",
          "string.empty": "Location type is required",
          "string.min": "Location type cannot be empty",
          "any.required": "Location type is required",
        }),
        value: Joi.string().min(1).required().messages({
          "string.base": "Location value must be a string",
          "string.empty": "Location value is required",
          "string.min": "Location value cannot be empty",
          "any.required": "Location value is required",
        }),
      })
        .strict() // No additional properties in location items (matches MongoDB additionalProperties: false)
        .messages({
          "object.unknown":
            "Additional properties are not allowed in location items",
        })
    )
    .optional()
    .messages({
      "array.base": "Locations must be an array",
    }),

  description: Joi.string().min(1).optional().messages({
    "string.base": "Description must be a string",
    "string.empty": "Description cannot be empty",
    "string.min": "Description cannot be empty",
  }),

  care_notes: Joi.array()
    .items(
      Joi.string().min(1).messages({
        "string.base": "Care note must be a string",
        "string.empty": "Care note cannot be empty",
        "string.min": "Care note cannot be empty",
      })
    )
    .optional()
    .messages({
      "array.base": "Care notes must be an array",
    }),

  native: Joi.boolean().optional().messages({
    "boolean.base": "Native must be true or false",
  }),

  light: Joi.string().min(1).optional().messages({
    "string.base": "Light requirement must be a string",
    "string.empty": "Light requirement cannot be empty",
    "string.min": "Light requirement cannot be empty",
  }),

  water_needs: Joi.string().min(1).optional().messages({
    "string.base": "Water needs must be a string",
    "string.empty": "Water needs cannot be empty",
    "string.min": "Water needs cannot be empty",
  }),

  maintenance_level: Joi.string().min(1).optional().messages({
    "string.base": "Maintenance level must be a string",
    "string.empty": "Maintenance level cannot be empty",
    "string.min": "Maintenance level cannot be empty",
  }),

  growth_form: Joi.string().min(1).optional().messages({
    "string.base": "Growth form must be a string",
    "string.empty": "Growth form cannot be empty",
    "string.min": "Growth form cannot be empty",
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

// Update validation - all fields optional except _id
export const updatePlantValidation: ObjectSchema = Joi.object({
  _id: Joi.alternatives()
    .try(
      Joi.string().custom(objectIdValidator).messages({
        "any.invalid": "Plant ID must be a valid ObjectId",
      }),
      Joi.object().instance(Types.ObjectId)
    )
    .required()
    .messages({
      "any.required": "Plant ID is required",
    }),

  scientific_name: Joi.string().min(1).optional().messages({
    "string.base": "Scientific name must be a string",
    "string.empty": "Scientific name cannot be empty",
    "string.min": "Scientific name cannot be empty",
  }),

  common_name: Joi.string().min(1).optional().messages({
    "string.base": "Common name must be a string",
    "string.empty": "Common name cannot be empty",
    "string.min": "Common name cannot be empty",
  }),

  image_search_url: Joi.string().uri().optional().messages({
    "string.base": "Image search URL must be a string",
    "string.uri": "Image search URL must be a valid URL",
  }),

  space_types: Joi.array()
    .items(
      Joi.string().min(1).messages({
        "string.base": "Space type must be a string",
        "string.empty": "Space type cannot be empty",
        "string.min": "Space type cannot be empty",
      })
    )
    .optional()
    .messages({
      "array.base": "Space types must be an array",
    }),

  area_sizes: Joi.array()
    .items(
      Joi.string().min(1).messages({
        "string.base": "Area size must be a string",
        "string.empty": "Area size cannot be empty",
        "string.min": "Area size cannot be empty",
      })
    )
    .optional()
    .messages({
      "array.base": "Area sizes must be an array",
    }),

  challenges: Joi.array()
    .items(
      Joi.string().min(1).messages({
        "string.base": "Challenge must be a string",
        "string.empty": "Challenge cannot be empty",
        "string.min": "Challenge cannot be empty",
      })
    )
    .optional()
    .messages({
      "array.base": "Challenges must be an array",
    }),

  tech_preferences: Joi.array()
    .items(
      Joi.string().min(1).messages({
        "string.base": "Tech preference must be a string",
        "string.empty": "Tech preference cannot be empty",
        "string.min": "Tech preference cannot be empty",
      })
    )
    .optional()
    .messages({
      "array.base": "Tech preferences must be an array",
    }),

  locations: Joi.array()
    .items(
      Joi.object({
        type: Joi.string().min(1).required().messages({
          "string.base": "Location type must be a string",
          "string.empty": "Location type is required",
          "string.min": "Location type cannot be empty",
          "any.required": "Location type is required",
        }),
        value: Joi.string().min(1).required().messages({
          "string.base": "Location value must be a string",
          "string.empty": "Location value is required",
          "string.min": "Location value cannot be empty",
          "any.required": "Location value is required",
        }),
      })
        .strict()
        .messages({
          "object.unknown":
            "Additional properties are not allowed in location items",
        })
    )
    .optional()
    .messages({
      "array.base": "Locations must be an array",
    }),

  description: Joi.string().min(1).optional().messages({
    "string.base": "Description must be a string",
    "string.empty": "Description cannot be empty",
    "string.min": "Description cannot be empty",
  }),

  care_notes: Joi.array()
    .items(
      Joi.string().min(1).messages({
        "string.base": "Care note must be a string",
        "string.empty": "Care note cannot be empty",
        "string.min": "Care note cannot be empty",
      })
    )
    .optional()
    .messages({
      "array.base": "Care notes must be an array",
    }),

  native: Joi.boolean().optional().messages({
    "boolean.base": "Native must be true or false",
  }),

  light: Joi.string().min(1).optional().messages({
    "string.base": "Light requirement must be a string",
    "string.empty": "Light requirement cannot be empty",
    "string.min": "Light requirement cannot be empty",
  }),

  water_needs: Joi.string().min(1).optional().messages({
    "string.base": "Water needs must be a string",
    "string.empty": "Water needs cannot be empty",
    "string.min": "Water needs cannot be empty",
  }),

  maintenance_level: Joi.string().min(1).optional().messages({
    "string.base": "Maintenance level must be a string",
    "string.empty": "Maintenance level cannot be empty",
    "string.min": "Maintenance level cannot be empty",
  }),

  growth_form: Joi.string().min(1).optional().messages({
    "string.base": "Growth form must be a string",
    "string.empty": "Growth form cannot be empty",
    "string.min": "Growth form cannot be empty",
  }),

  isDeleted: Joi.boolean().optional().messages({
    "boolean.base": "isDeleted must be true or false",
  }),

  // Optional fields that might be set by the application/mongoose
  updatedAt: Joi.date().optional(),
  __v: Joi.number().integer().optional(),
})
  .strict()
  .messages({
    "object.unknown": "Additional properties are not allowed",
  });

// Query validation for searching plants
export const plantQueryValidation: ObjectSchema = Joi.object({
  scientific_name: Joi.string().optional(),
  common_name: Joi.string().optional(),

  space_types: Joi.alternatives()
    .try(Joi.string(), Joi.array().items(Joi.string()))
    .optional(),

  area_sizes: Joi.alternatives()
    .try(Joi.string(), Joi.array().items(Joi.string()))
    .optional(),

  challenges: Joi.alternatives()
    .try(Joi.string(), Joi.array().items(Joi.string()))
    .optional(),

  tech_preferences: Joi.alternatives()
    .try(Joi.string(), Joi.array().items(Joi.string()))
    .optional(),

  native: Joi.boolean().optional(),
  light: Joi.string().optional(),
  water_needs: Joi.string().optional(),
  maintenance_level: Joi.string().optional(),
  growth_form: Joi.string().optional(),

  isDeleted: Joi.boolean().optional().default(false),

  // Pagination
  page: Joi.number().integer().positive().optional().default(1).messages({
    "number.base": "Page must be a number",
    "number.integer": "Page must be an integer",
    "number.positive": "Page must be positive",
  }),

  limit: Joi.number()
    .integer()
    .positive()
    .max(100)
    .optional()
    .default(10)
    .messages({
      "number.base": "Limit must be a number",
      "number.integer": "Limit must be an integer",
      "number.positive": "Limit must be positive",
      "number.max": "Limit cannot exceed 100",
    }),

  // Sorting
  sort: Joi.string().optional().default("createdAt"),
  order: Joi.string().valid("asc", "desc").optional().default("desc").messages({
    "any.only": "Order must be either 'asc' or 'desc'",
  }),
})
  .strict()
  .messages({
    "object.unknown": "Additional properties are not allowed in query",
  });
