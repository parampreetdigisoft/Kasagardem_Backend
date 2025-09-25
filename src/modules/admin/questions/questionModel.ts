import mongoose, { Document, Schema, Model } from "mongoose";
import { ZodError } from "zod";
import { createQuestionDto } from "../../../dto/questionDto";

export interface IQuestion {
  questionText: string;
  options: string[];
  order: number;
  isDeleted: boolean;
}

export interface IQuestionDocument extends IQuestion, Document {
  _id: mongoose.Types.ObjectId;
}

export interface IQuestionModel extends Model<IQuestionDocument> {
  createValidated(data: unknown): Promise<IQuestionDocument>;
  updateValidated(
    questionId: string,
    data: unknown
  ): Promise<IQuestionDocument | null>;
}

const questionSchema = new Schema<IQuestionDocument>(
  {
    questionText: { type: String, required: true },
    options: { type: [String], required: true },
    order: { type: Number, required: true },
    isDeleted: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

/**
 * Creates and validates a new question document using the provided data.
 * Validates the input against the Zod schema before saving.
 *
 * @param data - The raw data to create a new question from
 * @returns A promise that resolves with the created question document
 * @throws {ZodError} If the provided data fails schema validation
 */
questionSchema.statics.createValidated = async function (
  data: unknown
): Promise<IQuestionDocument> {
  try {
    const parsedData = createQuestionDto.parse(data);
    const question = new this(parsedData) as IQuestionDocument;
    await question.save();
    return question;
  } catch (err) {
    if (err instanceof ZodError) throw err;
    throw err;
  }
};

/**
 * Updates and validates an existing question document by ID.
 * Validates the input against the Zod schema before applying updates.
 *
 * @param questionId - The ID of the question to update
 * @param data - The new data to update the question with
 * @returns A promise that resolves with the updated question document,
 *          or null if no question was found
 * @throws {ZodError} If the provided data fails schema validation
 */
questionSchema.statics.updateValidated = async function (
  questionId: string,
  data: unknown
): Promise<IQuestionDocument | null> {
  try {
    const parsedData = createQuestionDto.parse(data);
    return await this.findByIdAndUpdate(questionId, parsedData, {
      new: true,
      runValidators: true,
    });
  } catch (err) {
    if (err instanceof ZodError) throw err;
    throw err;
  }
};

const Question: IQuestionModel = mongoose.model<
  IQuestionDocument,
  IQuestionModel
>("Question", questionSchema);

export default Question;
