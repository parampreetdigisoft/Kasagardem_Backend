import { z } from "zod";

// Condition DTO
const conditionDto = z.object({
  questionId: z
    .string()
    .min(24, "Valid questionId is required") // MongoDB ObjectId as a 24-character hex string
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format"),
  operator: z.enum(["equals", "in", "and", "or"]), // operator type
  values: z
    .array(z.string().min(1))
    .nonempty("At least one value must be provided"),
});

export const createRuleDto = z
  .object({
    name: z.string().min(3, "Rule name must be at least 3 characters"),
    conditions: z
      .array(conditionDto)
      .nonempty("At least one condition is required"),
    affiliateFor: z.string().nullable().optional(), // ✅ new field
    isDeleted: z.boolean().default(false),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
  })
  .strict();

export type CreateRuleDto = z.infer<typeof createRuleDto>;
