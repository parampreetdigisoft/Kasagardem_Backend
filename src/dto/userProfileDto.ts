// src/dto/userProfileDto.ts
import { z } from "zod";

// Custom ObjectId validator (MongoDB 24-character hex)
export const objectIdValidator = z
  .string()
  .refine((val) => /^[a-fA-F0-9]{24}$/.test(val), {
    message: "Invalid ObjectId",
  });

// Helper: string field that allows null or empty string
const stringOptional = z
  .union([z.string(), z.null()])
  .optional()
  .transform((val) => (val === "" ? null : val)); // convert "" → null for cleanliness

// Address schema
const addressSchema = z
  .object({
    street: stringOptional,
    city: stringOptional,
    state: stringOptional,
    country: stringOptional,
    zipCode: stringOptional,
  })
  .strict()
  .nullable()
  .optional();

// Main UserProfile schema
export const createUserProfileDto = z
  .object({
    userId: objectIdValidator, // required
    profileImage: stringOptional,
    dateOfBirth: z
      .union([z.string(), z.date(), z.null()])
      .optional()
      .transform((val) => (val === "" ? null : val)),
    gender: z.enum(["male", "female", "other", ""]).optional().nullable(),
    bio: stringOptional.refine(
      (val) => !val || val.length <= 500,
      "Bio cannot exceed 500 characters"
    ),
    address: addressSchema,
    occupation: stringOptional,
    company: stringOptional,
  })
  .strict(); // no extra fields allowed

// For TypeScript typing
export type UserProfile = z.infer<typeof createUserProfileDto>;
