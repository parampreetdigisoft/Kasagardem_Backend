// models/plantHistoryModel.ts
import mongoose, { Document, Schema, Types } from "mongoose";

export interface IPlantHistory extends Document {
  userId: Types.ObjectId;
  plantId?: Types.ObjectId;
  action:
    | "viewed"
    | "added"
    | "identified"
    | "watered"
    | "fertilized"
    | "updated"
    | "deleted";
  timestamp: Date;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

const plantHistorySchema = new Schema<IPlantHistory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    plantId: {
      type: Schema.Types.ObjectId,
      ref: "Plant",
    },
    action: {
      type: String,
      required: [true, "Action is required"],
      enum: [
        "viewed",
        "added",
        "identified",
        "watered",
        "fertilized",
        "updated",
        "deleted",
      ],
      lowercase: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
plantHistorySchema.index({ userId: 1, timestamp: -1 });
plantHistorySchema.index({ plantId: 1, timestamp: -1 });
plantHistorySchema.index({ action: 1, timestamp: -1 });

const PlantHistory = mongoose.model<IPlantHistory>(
  "PlantHistory",
  plantHistorySchema
);

export default PlantHistory;
