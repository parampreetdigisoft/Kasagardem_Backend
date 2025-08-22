// src/dto/userProfileDto.ts
import { z } from "zod";

// Custom Zod type for ObjectId
export const objectIdValidator = z
  .string()
  .refine((val) => /^[a-fA-F0-9]{24}$/.test(val), {
    message: "Invalid ObjectId",
  });

// Address schema
const addressSchema = z
  .object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    country: z.string(),
    zipCode: z.string(),
  })
  .strict(); // no extra fields allowed

// Main UserProfile schema
export const createUserProfileDto = z
  .object({
    userId: objectIdValidator, // required
    profileImage: z.string().optional(), // optional
    dateOfBirth: z.date().optional(),
    gender: z.enum(["male", "female", "other"]).optional(),
    bio: z.string().max(500).optional(),
    address: addressSchema.optional(),
    occupation: z.string().optional(),
    company: z.string().optional(),
  })
  .strict(); // prevent extra fields

// For TypeScript typing
export type UserProfile = z.infer<typeof createUserProfileDto>;
