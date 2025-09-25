import mongoose, { Document, Schema, Model, Types } from "mongoose";
import { ZodError } from "zod";
import { createRuleDto } from "../../../dto/ruleDto";

// ---------- Interfaces ----------
export interface ICondition {
  questionId: Types.ObjectId; // reference to question document
  operator: "equals" | "in" | "and" | "or";
  values: string[];
}

export interface IRule {
  name: string;
  conditions: ICondition[];
  affiliateFor?: string | null; // ✅ new field
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRuleDocument extends IRule, Document {
  _id: Types.ObjectId;
}

export interface IRuleModel extends Model<IRuleDocument> {
  createValidated(data: unknown): Promise<IRuleDocument>;
  updateValidated(ruleId: string, data: unknown): Promise<IRuleDocument | null>;
}

// ---------- Schema ----------
const conditionSchema = new Schema<ICondition>(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    operator: {
      type: String,
      enum: ["equals", "in", "and", "or"],
      required: true,
    },
    values: [{ type: String, required: true }],
  },
  { _id: false }
);

const ruleSchema = new Schema<IRuleDocument>(
  {
    name: { type: String, required: true },
    conditions: { type: [conditionSchema], required: true },
    affiliateFor: {
      type: String,
      default: null, // ✅ consistent with migration & DTO
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

type ConditionInput = {
  questionId: string;
  operator: "equals" | "in" | "and" | "or";
  values: string[];
};

// ---------- Static Methods ----------
/**
 * Validate the input data using Zod and create a new Rule document.
 * Converts questionId strings to MongoDB ObjectIds before saving.
 *
 * @param data - The input payload for creating a rule.
 * @returns The newly created Rule document.
 * @throws ZodError if validation fails.
 */
ruleSchema.statics.createValidated = async function (
  data: unknown
): Promise<IRuleDocument> {
  try {
    const parsedData = createRuleDto.parse(data);

    // Convert string questionIds to ObjectId
    const conditions: ICondition[] = parsedData.conditions.map(
      (c: ConditionInput) => ({
        ...c,
        questionId: new Types.ObjectId(c.questionId),
      })
    );

    const rule = new this({
      ...parsedData,
      conditions, // ✅ use the correctly typed array
    }) as IRuleDocument;

    await rule.save();
    return rule;
  } catch (err) {
    if (err instanceof ZodError) throw err;
    throw err;
  }
};

/**
 * Validate the input data using Zod and update an existing Rule document by ID.
 * Converts questionId strings to MongoDB ObjectIds before updating.
 *
 * @param ruleId - The ID of the rule to update.
 * @param data - The input payload for updating the rule.
 * @returns The updated Rule document, or null if no document was found.
 * @throws ZodError if validation fails.
 */
ruleSchema.statics.updateValidated = async function (
  ruleId: string,
  data: unknown
): Promise<IRuleDocument | null> {
  try {
    const parsedData = createRuleDto.parse(data);

    const conditions: ICondition[] = parsedData.conditions.map(
      (c: ConditionInput) => ({
        ...c,
        questionId: new Types.ObjectId(c.questionId),
      })
    );

    return await this.findByIdAndUpdate(
      ruleId,
      { ...parsedData, conditions }, // ✅ pass correctly typed conditions
      {
        new: true,
        runValidators: true,
      }
    );
  } catch (err) {
    if (err instanceof ZodError) throw err;
    throw err;
  }
};

// ---------- Model ----------
const Rule: IRuleModel = mongoose.model<IRuleDocument, IRuleModel>(
  "Rule",
  ruleSchema
);

export default Rule;
