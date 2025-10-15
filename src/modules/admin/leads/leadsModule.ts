import mongoose, { Document, Schema, Model } from "mongoose";
import { ZodError } from "zod";
import { createLeadDto } from "../../../dto/leadDto";

export interface ILead {
  partnerProfileIds: mongoose.Types.ObjectId[];
  userId: mongoose.Types.ObjectId;
  leadsStatus: "new" | "converted" | "closed";
  isDeleted: boolean;
}

export interface ILeadDocument extends ILead, Document {
  _id: mongoose.Types.ObjectId;
}

export interface ILeadModel extends Model<ILeadDocument> {
  createValidated(data: unknown): Promise<ILeadDocument>;
}

const leadSchema = new Schema<ILeadDocument>(
  {
    partnerProfileIds: [
      {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "PartnerProfile",
      },
    ],
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    leadsStatus: {
      type: String,
      enum: ["new", "converted", "closed"],
      required: true,
      default: "new",
    },
    isDeleted: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

/**
 * Creates and validates a new lead document using the provided data.
 * Validates the input against the Zod schema before saving.
 *
 * @param data - The raw data to create a new lead from
 * @returns A promise that resolves with the created lead document
 * @throws {ZodError} If the provided data fails schema validation
 */
leadSchema.statics.createValidated = async function (
  data: unknown
): Promise<ILeadDocument> {
  try {
    const parsedData = createLeadDto.parse(data);
    // Convert strings to ObjectId for Mongoose
    const leadData = {
      ...parsedData,
      partnerProfileIds: parsedData.partnerProfileIds.map(
        (id) => new mongoose.Types.ObjectId(id)
      ),
      userId: new mongoose.Types.ObjectId(parsedData.userId),
    };

    const lead = new this(leadData) as ILeadDocument;
    await lead.save();
    return lead;
  } catch (err) {
    if (err instanceof ZodError) throw err;
    throw err;
  }
};

const Lead: ILeadModel = mongoose.model<ILeadDocument, ILeadModel>(
  "Lead",
  leadSchema
);

export default Lead;
