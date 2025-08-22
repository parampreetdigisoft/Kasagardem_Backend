import { z } from "zod";

// SimilarImage Schema
export const SimilarImageSchema = z
  .object({
    id: z.string().nullable().optional(),
    url: z.string().nullable().optional(),
    url_small: z.string().nullable().optional(),
    similarity: z.number().min(0).max(1).nullable().optional(),
    license_name: z.string().nullable().optional(),
    license_url: z.string().nullable().optional(),
    citation: z.string().nullable().optional(),
  })
  .strict();

// Suggestion Schema
export const SuggestionSchema = z
  .object({
    scientificName: z.string(),
    probability: z.number().min(0).max(1),
    similarImages: z.array(SimilarImageSchema).nullable().optional(),
  })
  .strict();

// Care Instructions Schema
export const CareInstructionsSchema = z
  .object({
    watering: z
      .object({
        frequency: z.string().nullable().optional(),
        amount: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
      })
      .nullable()
      .optional(),
    sunlight: z
      .enum(["full-sun", "partial-sun", "shade", "indirect-light"])
      .nullable()
      .optional(),
    temperature: z
      .object({
        min: z.number().nullable().optional(),
        max: z.number().nullable().optional(),
        unit: z.enum(["celsius", "fahrenheit"]).nullable().optional(),
      })
      .nullable()
      .optional(),
    humidity: z
      .object({
        level: z.enum(["low", "medium", "high"]).nullable().optional(),
        percentage: z.number().min(0).max(100).nullable().optional(),
      })
      .nullable()
      .optional(),
    fertilizing: z
      .object({
        frequency: z.string().nullable().optional(),
        type: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
      })
      .nullable()
      .optional(),
  })
  .strict();

// Location Schema
export const LocationSchema = z
  .object({
    name: z.string().nullable().optional(),
    coordinates: z
      .object({
        latitude: z.number().nullable().optional(),
        longitude: z.number().nullable().optional(),
      })
      .nullable()
      .optional(),
  })
  .nullable()
  .optional();

// Main Plant DTO
export const PlantDto = z
  .object({
    userId: z.string(), // Validate as ObjectId string
    name: z.string().min(1).max(100),
    scientificName: z.string().max(150).nullable().optional(),
    commonNames: z.array(z.string()).nullable().optional(),
    category: z
      .enum([
        "indoor",
        "outdoor",
        "herb",
        "flower",
        "tree",
        "succulent",
        "vegetable",
        "fruit",
      ])
      .nullable()
      .optional(),
    images: z.array(z.string()).nullable().optional(),
    description: z.string().max(1000).nullable().optional(),

    probability: z.number().min(0).max(1).nullable().optional(),
    similarImages: z.array(SimilarImageSchema).nullable().optional(),
    entityId: z.string().nullable().optional(),
    language: z.string().nullable().optional(),

    isPlant: z
      .object({
        probability: z.number().min(0).max(1).nullable().optional(),
        binary: z.boolean().nullable().optional(),
        threshold: z.number().min(0).max(1).nullable().optional(),
      })
      .nullable()
      .optional(),

    identificationMeta: z
      .object({
        accessToken: z.string().nullable().optional(),
        modelVersion: z.string().nullable().optional(),
        customId: z.string().nullable().optional(),
        created: z.date().nullable().optional(),
        completed: z.date().nullable().optional(),
        status: z.string().nullable().optional(),
      })
      .nullable()
      .optional(),

    suggestions: z.array(SuggestionSchema).nullable().optional(),
    careInstructions: CareInstructionsSchema.nullable().optional(),
    status: z
      .enum(["healthy", "needs-attention", "sick", "dead"])
      .nullable()
      .optional(),
    location: LocationSchema,
    plantedDate: z.date().nullable().optional(),
    lastWatered: z.date().nullable().optional(),
    nextWateringDue: z.date().nullable().optional(),
    tags: z.array(z.string()).nullable().optional(),
    isPublic: z.boolean().nullable().optional(),
    notes: z.string().max(500).nullable().optional(),

    createdAt: z.date().nullable().optional(),
    updatedAt: z.date().nullable().optional(),
  })
  .strict(); // STRICT -> disallow extra fields

// Export type
export type PlantDtoType = z.infer<typeof PlantDto>;
