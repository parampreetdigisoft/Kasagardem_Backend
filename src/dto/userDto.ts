import { z } from "zod";
import { ObjectId } from "mongodb";

// Custom validator for MongoDB ObjectId
const objectIdSchema = z.string().refine((val) => ObjectId.isValid(val), {
  message: "Invalid ObjectId",
});

export const createUserDto = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be at most 50 characters"),
    email: z.string().email("Must be a valid email address"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .optional(),
    roleId: objectIdSchema,
    phoneNumber: z
      .string()
      .regex(
        /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/,
        "Must be a valid phone number"
      )
      .optional(),
    googleId: z.string().optional(),

    // PASSWORD RESET FIELDS:
    passwordResetToken: z.string().optional(),
    passwordResetExpires: z.date().optional(),

    // TIMESTAMPS:
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
  })
  .strict() // ❌ Reject extra fields
  .refine(
    (data) => data.password || data.googleId,
    "Either password or googleId must be provided"
  );
