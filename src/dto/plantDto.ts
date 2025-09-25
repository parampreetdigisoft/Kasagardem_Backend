import { z } from "zod";
import { Types } from "mongoose"; // for ObjectId

// Custom ObjectId validation
const objectIdSchema = z.union([
  z.string().refine((val) => Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId format",
  }),
  z.instanceof(Types.ObjectId),
]);

// Sub-schema for location items
const locationItemSchema = z
  .object({
    type: z.string().min(1, "Location type is required"),
    value: z.string().min(1, "Location value is required"),
  })
  .strict(); // No additional properties allowed to match MongoDB additionalProperties: false

// DTO - matches MongoDB schema structure exactly
export const createPlantDto = z
  .object({
    scientific_name: z.string().min(1, "Scientific name is required").trim(), // Required field

    common_name: z.string().min(1, "Common name is required").trim(), // Required field

    image_search_url: z.string().url("Invalid URL format").optional(), // Optional field

    space_types: z
      .array(z.string().min(1, "Space type cannot be empty"))
      .optional(), // Array of strings

    area_sizes: z
      .array(z.string().min(1, "Area size cannot be empty"))
      .optional(), // Array of strings

    challenges: z
      .array(z.string().min(1, "Challenge cannot be empty"))
      .optional(), // Array of strings

    tech_preferences: z
      .array(z.string().min(1, "Tech preference cannot be empty"))
      .optional(), // Array of strings

    locations: z.array(locationItemSchema).optional(), // Array of location objects

    description: z.string().min(1, "Description cannot be empty").optional(), // Optional string

    care_notes: z
      .array(z.string().min(1, "Care note cannot be empty"))
      .optional(), // Array of strings

    native: z.boolean().optional(), // Boolean - true/false for yes/no

    light: z.string().min(1, "Light requirement cannot be empty").optional(), // Single string

    water_needs: z.string().min(1, "Water needs cannot be empty").optional(), // Single string

    maintenance_level: z
      .string()
      .min(1, "Maintenance level cannot be empty")
      .optional(), // Single string

    growth_form: z.string().min(1, "Growth form cannot be empty").optional(), // Single string


    isDeleted: z.boolean().optional().default(false), // Optional with default

    // Optional fields that might be set by the application/mongoose
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    __v: z.number().int().optional(), // Mongoose version key
  })
  .strict(); // No additional properties allowed to match MongoDB additionalProperties: false

// Update DTO - all fields optional except _id
export const updatePlantDto = z
  .object({
    _id: objectIdSchema, // Required for updates

    scientific_name: z
      .string()
      .min(1, "Scientific name cannot be empty")
      .trim()
      .optional(),

    common_name: z
      .string()
      .min(1, "Common name cannot be empty")
      .trim()
      .optional(),

    image_search_url: z.string().url("Invalid URL format").optional(),

    space_types: z
      .array(z.string().min(1, "Space type cannot be empty"))
      .optional(),

    area_sizes: z
      .array(z.string().min(1, "Area size cannot be empty"))
      .optional(),

    challenges: z
      .array(z.string().min(1, "Challenge cannot be empty"))
      .optional(),

    tech_preferences: z
      .array(z.string().min(1, "Tech preference cannot be empty"))
      .optional(),

    locations: z.array(locationItemSchema).optional(),

    description: z.string().min(1, "Description cannot be empty").optional(),

    care_notes: z
      .array(z.string().min(1, "Care note cannot be empty"))
      .optional(),

    native: z.boolean().optional(),

    light: z.string().min(1, "Light requirement cannot be empty").optional(),

    water_needs: z.string().min(1, "Water needs cannot be empty").optional(),

    maintenance_level: z
      .string()
      .min(1, "Maintenance level cannot be empty")
      .optional(),

    growth_form: z.string().min(1, "Growth form cannot be empty").optional(),


    isDeleted: z.boolean().optional(),

    // Optional fields that might be set by the application/mongoose
    updatedAt: z.date().optional(),
    __v: z.number().int().optional(),
  })
  .strict();

// Query/Filter DTO for searching plants
export const plantQueryDto = z
  .object({
    scientific_name: z.string().optional(),
    common_name: z.string().optional(),
    space_types: z.union([z.string(), z.array(z.string())]).optional(),
    area_sizes: z.union([z.string(), z.array(z.string())]).optional(),
    challenges: z.union([z.string(), z.array(z.string())]).optional(),
    tech_preferences: z.union([z.string(), z.array(z.string())]).optional(),
    native: z.boolean().optional(),
    light: z.string().optional(),
    water_needs: z.string().optional(),
    maintenance_level: z.string().optional(),
    growth_form: z.string().optional(),
    isDeleted: z.boolean().optional().default(false),
    // Pagination
    page: z.number().int().positive().optional().default(1),
    limit: z.number().int().positive().max(100).optional().default(10),
    // Sorting
    sort: z.string().optional().default("createdAt"),
    order: z.enum(["asc", "desc"]).optional().default("desc"),
  })
  .strict();

// Type exports
export type CreatePlantDto = z.infer<typeof createPlantDto>;
export type UpdatePlantDto = z.infer<typeof updatePlantDto>;
export type PlantQueryDto = z.infer<typeof plantQueryDto>;
