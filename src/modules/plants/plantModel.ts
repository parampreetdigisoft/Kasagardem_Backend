import mongoose, { Document, Schema, Model } from "mongoose";
import { PlantDtoType } from "../../dto/plantDto";

// Extend mongoose Document with DTO type
export interface IPlantDocument extends Omit<PlantDtoType, "userId">, Document {
  _id: mongoose.Types.ObjectId; // MongoDB _id
  userId: mongoose.Types.ObjectId; // MongoDB userId ref
}

interface IPlantModel extends Model<IPlantDocument> {
  findOrCreateFromIdentification(
    userId: mongoose.Types.ObjectId,
    data: Partial<PlantDtoType>
  ): Promise<{ plant: IPlantDocument; created: boolean }>;
}

const SimilarImageSchema = new Schema(
  {
    id: { type: String },
    url: { type: String },
    url_small: { type: String },
    similarity: { type: Number, min: 0, max: 1 },
    license_name: { type: String },
    license_url: { type: String },
    citation: { type: String },
  },
  { _id: false, strict: true }
);

const SuggestionSchema = new Schema(
  {
    scientificName: { type: String, required: true },
    probability: { type: Number, min: 0, max: 1, required: true },
    similarImages: { type: [SimilarImageSchema], default: [] },
  },
  { _id: false, strict: true }
);

const CareInstructionsSchema = new Schema(
  {
    watering: {
      frequency: { type: String },
      amount: { type: String },
      notes: { type: String },
    },
    sunlight: {
      type: String,
      enum: ["full-sun", "partial-sun", "shade", "indirect-light"],
    },
    temperature: {
      min: Number,
      max: Number,
      unit: { type: String, enum: ["celsius", "fahrenheit"] },
    },
    humidity: {
      level: { type: String, enum: ["low", "medium", "high"] },
      percentage: { type: Number, min: 0, max: 100 },
    },
    fertilizing: {
      frequency: { type: String },
      type: { type: String },
      notes: { type: String },
    },
  },
  { _id: false, strict: true }
);

const LocationSchema = new Schema(
  {
    name: { type: String },
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
  },
  { _id: false, strict: true }
);

const PlantSchema = new Schema<IPlantDocument>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true, maxlength: 100 },
    scientificName: { type: String, maxlength: 150 },
    commonNames: [{ type: String }],
    category: {
      type: String,
      enum: [
        "indoor",
        "outdoor",
        "herb",
        "flower",
        "tree",
        "succulent",
        "vegetable",
        "fruit",
      ],
    },
    images: [{ type: String }],
    description: { type: String, maxlength: 1000 },

    probability: { type: Number, min: 0, max: 1 },
    similarImages: { type: [SimilarImageSchema], default: [] },
    entityId: { type: String },
    language: { type: String },

    isPlant: {
      probability: { type: Number, min: 0, max: 1 },
      binary: { type: Boolean },
      threshold: { type: Number, min: 0, max: 1 },
    },

    identificationMeta: {
      accessToken: { type: String },
      modelVersion: { type: String },
      customId: { type: String },
      created: { type: Date },
      completed: { type: Date },
      status: { type: String },
    },

    suggestions: { type: [SuggestionSchema], default: [] },
    careInstructions: CareInstructionsSchema,
    status: {
      type: String,
      enum: ["healthy", "needs-attention", "sick", "dead"],
    },
    location: LocationSchema,
    plantedDate: Date,
    lastWatered: Date,
    nextWateringDue: Date,
    tags: [{ type: String }],
    isPublic: Boolean,
    notes: { type: String, maxlength: 500 },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    strict: true, // ❌ Reject extra fields
    timestamps: true, // auto-manage createdAt, updatedAt
  }
);

// ✅ Add static method
/**
 * Finds an existing plant for a given user and scientific name,
 * or creates a new plant if none exists.
 *
 * @param userId - The ID of the user who owns the plant
 * @param data - Partial plant data from identification process
 * @returns A promise resolving to an object containing the plant
 *          and a flag indicating whether it was newly created
 */
PlantSchema.statics.findOrCreateFromIdentification = async function (
  userId: mongoose.Types.ObjectId,
  data: Partial<PlantDtoType>
): Promise<{ plant: IPlantDocument; created: boolean }> {
  const existing = await this.findOne({
    userId,
    scientificName: data.scientificName,
  });

  if (existing) {
    Object.assign(existing, data);
    await existing.save();
    return { plant: existing, created: false };
  }

  const plant = await this.create({ userId, ...data });
  return { plant, created: true };
};

const Plant = mongoose.model<IPlantDocument, IPlantModel>("Plant", PlantSchema);

export default Plant;
