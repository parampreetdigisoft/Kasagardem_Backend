import { z } from "zod";

// DTO - strict validation
export const createQuestionDto = z
  .object({
    questionText: z.string().min(5, "Question must be at least 5 chars"),
    options: z.array(z.string().min(1)).optional().default([]), // now optional & defaults to []
    order: z.number().int().min(0),
    isDeleted: z.boolean().optional().default(false), // new field
  })
  .strict();

export type CreateQuestionDto = z.infer<typeof createQuestionDto>;
