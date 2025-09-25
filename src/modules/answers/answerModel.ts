import mongoose, { Document, Schema, Model } from "mongoose";
import { ZodError } from "zod";
import { createAnswerDto } from "../../dto/answerDto";

export interface ISelectedAddress {
  state: string;
  city: string;
}

export interface IAnswerItem {
  questionId: mongoose.Types.ObjectId;
  type: 1 | 2; // Changed from string to number to match MongoDB schema
  selectedOption?: string;
  selectedAddress?: ISelectedAddress;
}

export interface IAnswer {
  userId: mongoose.Types.ObjectId;
  answers: IAnswerItem[];
  isDeleted: boolean;
}

export interface IAnswerDocument extends IAnswer, Document {
  _id: mongoose.Types.ObjectId;
}

export interface IAnswerModel extends Model<IAnswerDocument> {
  createValidated(data: unknown): Promise<IAnswerDocument>;
  updateValidated(
    answerId: string,
    data: unknown
  ): Promise<IAnswerDocument | null>;
}

// Sub-schema for selectedAddress
const selectedAddressSchema = new Schema<ISelectedAddress>(
  {
    state: { type: String, required: true },
    city: { type: String, required: true },
  },
  { _id: false } // Match MongoDB strict validation
);

// Sub-schema for each answer item
const answerItemSchema = new Schema<IAnswerItem>(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    type: {
      type: Number, // Changed from String to Number to match MongoDB schema
      enum: [1, 2],
      required: true,
    },
    selectedOption: {
      type: String,
      // Add conditional validation
      validate: {
        /**
         * Validates the `selectedOption` field based on the `type` value.
         *
         * - If `type = 1`, then `selectedOption` must be a non-empty string.
         * - If `type = 2`, then `selectedOption` must be null.
         *
         * @param value - The value of `selectedOption` to validate.
         * @returns True if the value passes validation, otherwise false.
         */
        validator: function (this: IAnswerItem, value: string): boolean {
          // selectedOption is required when type = 1
          if (this.type === 1) {
            return value !== null && value.length > 0;
          }
          // selectedOption should not exist when type = 2
          return value === null;
        },
        message:
          "selectedOption is required when type=1 and forbidden when type=2",
      },
    },
    selectedAddress: {
      type: selectedAddressSchema,
      // Add conditional validation
      validate: {
        /**
         * Validates the `selectedOption` field based on the `type` value.
         *
         * - If `type = 1`, then `selectedOption` must be a non-empty string.
         * - If `type = 2`, then `selectedOption` must be null.
         *
         * @param value - The value of `selectedOption` to validate.
         * @returns True if the value passes validation, otherwise false.
         */
        validator: function (
          this: IAnswerItem,
          value: ISelectedAddress
        ): boolean {
          // selectedAddress is required when type = 2
          if (this.type === 2) {
            return value !== null && !!value.state && !!value.city;
          }
          // selectedAddress should not exist when type = 1
          return value === null;
        },

        message:
          "selectedAddress is required when type=2 and forbidden when type=1",
      },
    },
  },
  { _id: false } // Match MongoDB strict validation
);

const answerSchema = new Schema<IAnswerDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    answers: { type: [answerItemSchema], required: true },
    isDeleted: { type: Boolean, required: true, default: false },
  },
  {
    timestamps: true,
    strict: true, // Ensure strict mode
  }
);

/**
 * Creates and validates a new answer document using the provided data.
 *
 * This method uses Zod to parse and validate the incoming data,
 * creates a new Mongoose Answer document, and saves it to the database.
 *
 * @param data - The raw input data to validate and save.
 * @returns A promise that resolves with the created Answer document.
 * @throws {ZodError} If validation fails.
 */
answerSchema.statics.createValidated = async function (
  data: unknown
): Promise<IAnswerDocument> {
  try {
    const parsedData = createAnswerDto.parse(data);
    const answer = new this(parsedData) as IAnswerDocument;
    await answer.save();
    return answer;
  } catch (err) {
    if (err instanceof ZodError) throw err;
    throw err;
  }
};

/**
 * Updates and validates an existing answer document by ID.
 *
 * This method uses Zod to parse and validate the incoming data,
 * then updates the Answer document in MongoDB with validation enabled.
 *
 * @param answerId - The ID of the answer to update.
 * @param data - The raw input data to validate and update with.
 * @returns A promise that resolves with the updated Answer document, or null if not found.
 * @throws {ZodError} If validation fails.
 */
answerSchema.statics.updateValidated = async function (
  answerId: string,
  data: unknown
): Promise<IAnswerDocument | null> {
  try {
    const parsedData = createAnswerDto.parse(data);
    return await this.findByIdAndUpdate(answerId, parsedData, {
      new: true,
      runValidators: true,
    });
  } catch (err) {
    if (err instanceof ZodError) throw err;
    throw err;
  }
};

const Answer: IAnswerModel = mongoose.model<IAnswerDocument, IAnswerModel>(
  "Answer",
  answerSchema
);

export default Answer;
