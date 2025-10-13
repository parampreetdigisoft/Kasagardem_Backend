import { z } from "zod";
import { Types } from "mongoose"; // for ObjectId

// Custom ObjectId validation
const objectIdSchema = z.union([
  z.string().refine((val) => Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId format",
  }),
  z.instanceof(Types.ObjectId),
]);

// Sub-schema for address (matches MongoDB schema exactly)
const selectedAddressSchema = z
  .object({
    state: z.string().min(1, "State is required"),
    city: z.string().min(1, "City is required"),
  })
  .strict(); // No additional properties allowed to match MongoDB additionalProperties: false

// Sub-schema for a single answer item
const answerItemSchema = z
  .object({
    questionId: objectIdSchema, // Must be ObjectId to match MongoDB schema
    type: z
      .number()
      .int()
      .refine((val) => val === 1 || val === 2, {
        message: "Type must be 1 (option) or 2 (address)",
      }), // Changed to match MongoDB bsonType: "int" with enum: [1, 2]
    selectedOption: z.string().min(1).optional(),
    selectedAddress: selectedAddressSchema.optional(),
  })
  .refine(
    (data) => {
      // Conditional validation based on type
      if (data.type === 1) {
        // When type is 1, selectedOption is required and selectedAddress must not exist
        return (
          data.selectedOption !== undefined &&
          data.selectedAddress === undefined
        );
      } else if (data.type === 2) {
        // When type is 2, selectedAddress is required and selectedOption must not exist
        return (
          data.selectedAddress !== undefined &&
          data.selectedOption === undefined
        );
      }
      return false;
    },
    {
      message:
        "When type=1: selectedOption is required and selectedAddress must not be provided. When type=2: selectedAddress is required and selectedOption must not be provided",
      path: ["selectedOption", "selectedAddress"],
    }
  )
  .strict(); // No additional properties allowed to match MongoDB additionalProperties: false

// DTO - matches MongoDB schema structure exactly
export const createAnswerDto = z
  .object({
    userId: objectIdSchema.optional().nullable(),
    // Must be ObjectId to match MongoDB schema (not required field)
    answers: z
      .array(answerItemSchema)
      .min(1, "At least one answer is required"), // Required field
    isDeleted: z.boolean().optional().default(false), // Optional with default
    // Optional fields that might be set by the application/mongoose
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    __v: z.number().int().optional(), // Mongoose version key
  })
  .strict(); // No additional properties allowed to match MongoDB additionalProperties: false

export type CreateAnswerDto = z.infer<typeof createAnswerDto>;
