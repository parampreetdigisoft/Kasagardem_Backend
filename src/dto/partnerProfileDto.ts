// src/dto/partnerProfileDto.ts
import { z } from "zod";

// Address schema (same as in userProfileDto)
const addressSchema = z
  .object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    country: z.string(),
    zipCode: z.string(),
  })
  .strict(); // no extra fields allowed

// Main PartnerProfile schema
export const createPartnerProfileDto = z
  .object({
    email: z.string().email({ message: "Invalid email format" }), // required
    mobileNumber: z
      .string()
      .regex(/^\+?[1-9]\d{7,14}$/, "Invalid mobile number"), // required

    companyName: z.string().optional(),
    speciality: z.array(z.string()).optional(), // list of expertise
    address: addressSchema.optional(),
    website: z.string().url().optional(),
    contactPerson: z.string().optional(),
    projectImageUrl: z.string().optional(),
    status: z.enum(["active", "inactive", "pending", "suspended"]).optional(),
    rating: z.number().min(0).max(5).optional(), // rating between 0 and 5
  })
  .strict(); // prevent extra fields

// For TypeScript typing
export type PartnerProfile = z.infer<typeof createPartnerProfileDto>;
