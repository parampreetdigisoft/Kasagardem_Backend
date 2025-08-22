import { z } from "zod";

// Role DTO - strict validation, no extra fields allowed
export const createRoleDto = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(30, "Name cannot exceed 30 characters"),
    description: z.string().optional(),
  })
  .strict(); // 🔒 disallow unknown fields

// Optional: TypeScript type
export type CreateRoleDto = z.infer<typeof createRoleDto>;
