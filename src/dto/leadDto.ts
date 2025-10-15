import { z } from "zod";

// DTO - strict validation
export const createLeadDto = z
  .object({
    partnerProfileIds: z
      .array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format"))
      .min(1, "At least one partner profile ID is required"),
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format"),
    leadsStatus: z
      .enum(["new", "converted", "closed"])
      .optional()
      .default("new"),
    isDeleted: z.boolean().optional().default(false),
  })
  .strict();

export type CreateLeadDto = z.infer<typeof createLeadDto>;
