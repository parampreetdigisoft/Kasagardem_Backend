// validations/plantValidations.ts
import Joi, { ObjectSchema } from "joi";

const createPlantValidation: ObjectSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required().messages({
    "string.empty": "Plant name is required",
    "string.max": "Plant name cannot exceed 100 characters",
    "any.required": "Plant name is required",
  }),
  scientificName: Joi.string().trim().max(150).messages({
    "string.max": "Scientific name cannot exceed 150 characters",
  }),
  commonNames: Joi.array().items(Joi.string().trim()).messages({
    "array.base": "Common names must be an array of strings",
  }),
  category: Joi.string()
    .valid(
      "indoor",
      "outdoor",
      "herb",
      "flower",
      "tree",
      "succulent",
      "vegetable",
      "fruit"
    )
    .messages({
      "any.only":
        "Category must be one of: indoor, outdoor, herb, flower, tree, succulent, vegetable, fruit",
    }),
  images: Joi.array().items(Joi.string().uri()).messages({
    "array.base": "Images must be an array of valid URLs",
    "string.uri": "Each image must be a valid URL",
  }),
  description: Joi.string().trim().max(1000).messages({
    "string.max": "Description cannot exceed 1000 characters",
  }),
  careInstructions: Joi.object({
    watering: Joi.object({
      frequency: Joi.string().trim(),
      amount: Joi.string().trim(),
      notes: Joi.string().trim(),
    }),
    sunlight: Joi.string()
      .valid("full-sun", "partial-sun", "shade", "indirect-light")
      .messages({
        "any.only":
          "Sunlight must be one of: full-sun, partial-sun, shade, indirect-light",
      }),
    temperature: Joi.object({
      min: Joi.number(),
      max: Joi.number().greater(Joi.ref("min")).messages({
        "number.greater":
          "Maximum temperature must be greater than minimum temperature",
      }),
      unit: Joi.string().valid("celsius", "fahrenheit").default("celsius"),
    }),
    humidity: Joi.object({
      level: Joi.string().valid("low", "medium", "high"),
      percentage: Joi.number().min(0).max(100).messages({
        "number.min": "Humidity percentage cannot be less than 0",
        "number.max": "Humidity percentage cannot exceed 100",
      }),
    }),
    fertilizing: Joi.object({
      frequency: Joi.string().trim(),
      type: Joi.string().trim(),
      notes: Joi.string().trim(),
    }),
  }),
  status: Joi.string()
    .valid("healthy", "needs-attention", "sick", "dead")
    .default("healthy")
    .messages({
      "any.only": "Status must be one of: healthy, needs-attention, sick, dead",
    }),
  location: Joi.object({
    name: Joi.string().trim(),
    coordinates: Joi.object({
      latitude: Joi.number().min(-90).max(90).messages({
        "number.min": "Latitude must be between -90 and 90",
        "number.max": "Latitude must be between -90 and 90",
      }),
      longitude: Joi.number().min(-180).max(180).messages({
        "number.min": "Longitude must be between -180 and 180",
        "number.max": "Longitude must be between -180 and 180",
      }),
    }),
  }),
  plantedDate: Joi.date().max("now").messages({
    "date.max": "Planted date cannot be in the future",
  }),
  lastWatered: Joi.date().max("now").messages({
    "date.max": "Last watered date cannot be in the future",
  }),
  tags: Joi.array().items(Joi.string().trim()).messages({
    "array.base": "Tags must be an array of strings",
  }),
  isPublic: Joi.boolean().default(false),
  notes: Joi.string().trim().max(500).messages({
    "string.max": "Notes cannot exceed 500 characters",
  }),
});

const updatePlantValidation: ObjectSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).messages({
    "string.empty": "Plant name cannot be empty",
    "string.max": "Plant name cannot exceed 100 characters",
  }),
  scientificName: Joi.string().trim().max(150).messages({
    "string.max": "Scientific name cannot exceed 150 characters",
  }),
  commonNames: Joi.array().items(Joi.string().trim()).messages({
    "array.base": "Common names must be an array of strings",
  }),
  category: Joi.string()
    .valid(
      "indoor",
      "outdoor",
      "herb",
      "flower",
      "tree",
      "succulent",
      "vegetable",
      "fruit"
    )
    .messages({
      "any.only":
        "Category must be one of: indoor, outdoor, herb, flower, tree, succulent, vegetable, fruit",
    }),
  images: Joi.array()
    .items(
      Joi.string()
        .pattern(
          /^data:image\/(png|jpg|jpeg|gif|webp|bmp|svg\+xml);base64,[A-Za-z0-9+/=]+$/
        )
        .messages({
          "string.pattern.base":
            "Each image must be a valid base64 encoded string with MIME type (e.g., data:image/png;base64,...)",
        })
    )
    .messages({
      "array.base": "Images must be an array of base64 encoded strings",
    }),
  description: Joi.string().trim().max(1000).messages({
    "string.max": "Description cannot exceed 1000 characters",
  }),
  careInstructions: Joi.object({
    watering: Joi.object({
      frequency: Joi.string().trim(),
      amount: Joi.string().trim(),
      notes: Joi.string().trim(),
    }),
    sunlight: Joi.string()
      .valid("full-sun", "partial-sun", "shade", "indirect-light")
      .messages({
        "any.only":
          "Sunlight must be one of: full-sun, partial-sun, shade, indirect-light",
      }),
    temperature: Joi.object({
      min: Joi.number(),
      max: Joi.number().greater(Joi.ref("min")).messages({
        "number.greater":
          "Maximum temperature must be greater than minimum temperature",
      }),
      unit: Joi.string().valid("celsius", "fahrenheit"),
    }),
    humidity: Joi.object({
      level: Joi.string().valid("low", "medium", "high"),
      percentage: Joi.number().min(0).max(100).messages({
        "number.min": "Humidity percentage cannot be less than 0",
        "number.max": "Humidity percentage cannot exceed 100",
      }),
    }),
    fertilizing: Joi.object({
      frequency: Joi.string().trim(),
      type: Joi.string().trim(),
      notes: Joi.string().trim(),
    }),
  }),
  status: Joi.string()
    .valid("healthy", "needs-attention", "sick", "dead")
    .messages({
      "any.only": "Status must be one of: healthy, needs-attention, sick, dead",
    }),
  location: Joi.object({
    name: Joi.string().trim(),
    coordinates: Joi.object({
      latitude: Joi.number().min(-90).max(90).messages({
        "number.min": "Latitude must be between -90 and 90",
        "number.max": "Latitude must be between -90 and 90",
      }),
      longitude: Joi.number().min(-180).max(180).messages({
        "number.min": "Longitude must be between -180 and 180",
        "number.max": "Longitude must be between -180 and 180",
      }),
    }),
  }),
  plantedDate: Joi.date().max("now").messages({
    "date.max": "Planted date cannot be in the future",
  }),
  lastWatered: Joi.date().max("now").messages({
    "date.max": "Last watered date cannot be in the future",
  }),
  tags: Joi.array().items(Joi.string().trim()).messages({
    "array.base": "Tags must be an array of strings",
  }),
  isPublic: Joi.boolean(),
  notes: Joi.string().trim().max(500).messages({
    "string.max": "Notes cannot exceed 500 characters",
  }),
});

const plantQueryValidation: ObjectSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    "number.base": "Page must be a number",
    "number.integer": "Page must be an integer",
    "number.min": "Page must be at least 1",
  }),
  limit: Joi.number().integer().min(1).max(50).default(10).messages({
    "number.base": "Limit must be a number",
    "number.integer": "Limit must be an integer",
    "number.min": "Limit must be at least 1",
    "number.max": "Limit cannot exceed 50",
  }),
  category: Joi.string().valid(
    "indoor",
    "outdoor",
    "herb",
    "flower",
    "tree",
    "succulent",
    "vegetable",
    "fruit"
  ),
  status: Joi.string().valid("healthy", "needs-attention", "sick", "dead"),
  search: Joi.string().trim().min(1).max(100),
  sortBy: Joi.string()
    .valid("name", "createdAt", "updatedAt", "plantedDate", "nextWateringDue")
    .default("createdAt"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
});

const plantIdentifyValidation: ObjectSchema = Joi.object({
  images: Joi.array().items(Joi.string().uri()).min(1).required().messages({
    "array.base": "Images must be an array of valid URLs",
    "array.min": "At least one image is required for identification",
    "string.uri": "Each image must be a valid URL",
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

const plantHistoryValidation: ObjectSchema = Joi.object({
  plantId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.pattern.base": "Plant ID must be a valid MongoDB ObjectId",
    }),
  action: Joi.string()
    .valid(
      "viewed",
      "added",
      "identified",
      "watered",
      "fertilized",
      "updated",
      "deleted"
    )
    .required()
    .messages({
      "any.only":
        "Action must be one of: viewed, added, identified, watered, fertilized, updated, deleted",
      "any.required": "Action is required",
    }),
  metadata: Joi.object().default({}),
});

export {
  createPlantValidation,
  updatePlantValidation,
  plantQueryValidation,
  plantIdentifyValidation,
  plantHistoryValidation,
};
