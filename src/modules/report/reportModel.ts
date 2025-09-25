import mongoose, { Document, Schema, Model } from "mongoose";
import { ZodError } from "zod";
import { createReportDto } from "../../dto/reportDto";

export interface IReport {
  userId?: mongoose.Types.ObjectId | null;
  answers: {
    questionId: mongoose.Types.ObjectId;
    answerId: mongoose.Types.ObjectId;
    answerText: string;
  }[];
  report: {
    problemAnalysis: string;
    products?: { name: string; affiliateLink?: string }[];
    professionals?: { name: string; contact: string }[];
  };
  createdAt: Date;
}

export interface IReportDocument extends IReport, Document {
  _id: mongoose.Types.ObjectId;
}

export interface IReportModel extends Model<IReportDocument> {
  createValidated(data: unknown): Promise<IReportDocument>;
  updateValidated(
    reportId: string,
    data: unknown
  ): Promise<IReportDocument | null>;
}

const reportSchema = new Schema<IReportDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },

    answers: [
      {
        questionId: {
          type: Schema.Types.ObjectId,
          ref: "Question",
          required: true,
        },
        answerId: {
          type: Schema.Types.ObjectId,
          ref: "Answer",
          required: true,
        },
        answerText: { type: String, required: true },
      },
    ],

    report: {
      problemAnalysis: { type: String, required: true },
      products: [
        {
          name: { type: String, required: true },
          affiliateLink: { type: String },
        },
      ],
      professionals: [
        {
          name: { type: String, required: true },
          contact: { type: String, required: true },
        },
      ],
    },

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Static methods for validation

/**
 * Creates a new report after validating the input data.
 *
 * @param data - The raw data to create the report with.
 * @returns The newly created and saved report document.
 * @throws ZodError if the input data fails validation.
 */
reportSchema.statics.createValidated = async function (
  data: unknown
): Promise<IReportDocument> {
  try {
    const parsedData = createReportDto.parse(data);
    const report = new this(parsedData) as IReportDocument;
    await report.save();
    return report;
  } catch (err) {
    if (err instanceof ZodError) throw err;
    throw err;
  }
};

/**
 * Updates an existing report by ID after validating the input data.
 *
 * @param reportId - The ID of the report to update.
 * @param data - The raw data to update the report with.
 * @returns The updated report document, or null if not found.
 * @throws ZodError if the input data fails validation.
 */
reportSchema.statics.updateValidated = async function (
  reportId: string,
  data: unknown
): Promise<IReportDocument | null> {
  try {
    const parsedData = createReportDto.parse(data);
    return await this.findByIdAndUpdate(reportId, parsedData, {
      new: true,
      runValidators: true,
    });
  } catch (err) {
    if (err instanceof ZodError) throw err;
    throw err;
  }
};

const Report: IReportModel = mongoose.model<IReportDocument, IReportModel>(
  "Report",
  reportSchema
);

export default Report;
