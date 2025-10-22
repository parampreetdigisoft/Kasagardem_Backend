import { z } from "zod";

/**
 * DTO for creating a user with email/password authentication
 */
export const createUserDto = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be at most 100 characters")
      .trim(),
    email: z.string().email("Invalid email format").toLowerCase().trim(),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .optional(), // Optional for OAuth users
    firebaseUid: z.string().min(1, "Firebase UID cannot be empty").optional(), // Optional for email/password users
    profilePicture: z.string().url("Invalid profile picture URL").optional(),
    roleId: z.string().min(1, "Role ID is required"),
    phoneNumber: z
      .string()
      .regex(
        /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/,
        "Invalid phone number format"
      )
      .optional(),
    isEmailVerified: z.boolean().optional().default(false),
  })
  .refine(
    (data) => {
      // Ensure either password OR firebaseUid is provided
      return data.password || data.firebaseUid;
    },
    {
      message: "Either password or firebaseUid must be provided",
      path: ["password"], // Error will appear on password field
    }
  );

/**
 * DTO for updating user information
 */
export const updateUserDto = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters")
    .trim()
    .optional(),
  email: z
    .string()
    .email("Invalid email format")
    .toLowerCase()
    .trim()
    .optional(),
  phoneNumber: z
    .string()
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, "Invalid phone number format")
    .optional(),
  profilePicture: z.string().url("Invalid profile picture URL").optional(),
});

/**
 * DTO for Google OAuth user creation
 */
export const createGoogleUserDto = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters")
    .trim(),
  email: z.string().email("Invalid email format").toLowerCase().trim(),
  firebaseUid: z.string().min(1, "Firebase UID is required"),
  profilePicture: z.string().url("Invalid profile picture URL").optional(),
  roleId: z.string().min(1, "Role ID is required"),
  isEmailVerified: z.boolean().default(true), // Google users are pre-verified
});

export type CreateUserDto = z.infer<typeof createUserDto>;
export type UpdateUserDto = z.infer<typeof updateUserDto>;
export type CreateGoogleUserDto = z.infer<typeof createGoogleUserDto>;
