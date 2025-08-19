import mongoose, { Document, Schema } from "mongoose";
import { ICareInstructions, ILocation } from "../../../interface/Types";

export interface IPlant extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  scientificName?: string;
  commonNames?: string[];
  category?:
    | "indoor"
    | "outdoor"
    | "herb"
    | "flower"
    | "tree"
    | "succulent"
    | "vegetable"
    | "fruit";
  images?: string[];
  description?: string;
  careInstructions?: ICareInstructions;
  status?: "healthy" | "needs-attention" | "sick" | "dead";
  location?: ILocation;
  plantedDate?: Date;
  lastWatered?: Date | null;
  nextWateringDue?: Date | null;
  tags?: string[];
  isPublic?: boolean;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;

  // Virtuals
  daysSinceLastWatered?: number | null;
  daysUntilNextWatering?: number | null;

  // Methods
  calculateNextWatering: () => Date | null;
}

// --------------------
// Schema Definition
// --------------------
const plantSchema = new Schema<IPlant>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Plant name is required"],
      trim: true,
      maxlength: [100, "Plant name cannot exceed 100 characters"],
    },
    scientificName: {
      type: String,
      trim: true,
      maxlength: [150, "Scientific name cannot exceed 150 characters"],
    },
    commonNames: [
      {
        type: String,
        trim: true,
      },
    ],
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
      lowercase: true,
    },
    images: [
      {
        type: String,
        trim: true,
      },
    ],
    description: {
      type: String,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      trim: true,
    },
    careInstructions: {
      watering: {
        frequency: { type: String, trim: true },
        amount: { type: String, trim: true },
        notes: { type: String, trim: true },
      },
      sunlight: {
        type: String,
        enum: ["full-sun", "partial-sun", "shade", "indirect-light"],
        lowercase: true,
      },
      temperature: {
        min: { type: Number },
        max: { type: Number },
        unit: {
          type: String,
          enum: ["celsius", "fahrenheit"],
          default: "celsius",
        },
      },
      humidity: {
        level: {
          type: String,
          enum: ["low", "medium", "high"],
          lowercase: true,
        },
        percentage: {
          type: Number,
          min: [0, "Humidity percentage cannot be less than 0"],
          max: [100, "Humidity percentage cannot exceed 100"],
        },
      },
      fertilizing: {
        frequency: { type: String, trim: true },
        type: { type: String, trim: true },
        notes: { type: String, trim: true },
      },
    },
    status: {
      type: String,
      enum: ["healthy", "needs-attention", "sick", "dead"],
      default: "healthy",
      lowercase: true,
    },
    location: {
      name: { type: String, trim: true },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
      },
    },
    plantedDate: {
      type: Date,
      default: Date.now,
    },
    lastWatered: {
      type: Date,
    },
    nextWateringDue: {
      type: Date,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    isPublic: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      maxlength: [500, "Notes cannot exceed 500 characters"],
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// --------------------
// Indexes
// --------------------
plantSchema.index({ "location.coordinates": "2dsphere" });
plantSchema.index({
  name: "text",
  scientificName: "text",
  description: "text",
});

// --------------------
// Virtuals
// --------------------
plantSchema.virtual("daysSinceLastWatered").get(function (this: IPlant) {
  if (!this.lastWatered) return null;
  return Math.floor(
    (Date.now() - this.lastWatered.getTime()) / (1000 * 60 * 60 * 24)
  );
});

plantSchema.virtual("daysUntilNextWatering").get(function (this: IPlant) {
  if (!this.nextWateringDue) return null;
  return Math.ceil(
    (this.nextWateringDue.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
});

/**
 * Calculates the next watering date based on the plant's last watered date
 * and watering frequency defined in care instructions.
 *
 * @this {IPlant} The plant document instance
 * @returns {Date | null} The next watering date, or null if data is missing
 */
plantSchema.methods.calculateNextWatering = function (
  this: IPlant
): Date | null {
  if (!this.lastWatered || !this.careInstructions?.watering?.frequency)
    return null;

  const frequency = this.careInstructions.watering.frequency.toLowerCase();
  const lastWatered = new Date(this.lastWatered);

  let daysToAdd = 7; // default weekly

  if (frequency.includes("daily")) daysToAdd = 1;
  else if (frequency.includes("weekly")) daysToAdd = 7;
  else if (frequency.includes("bi-weekly") || frequency.includes("biweekly"))
    daysToAdd = 14;
  else if (frequency.includes("monthly")) daysToAdd = 30;

  return new Date(lastWatered.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
};

// --------------------
// Middleware
// --------------------
plantSchema.pre<IPlant>("save", function (next) {
  if (
    this.isModified("lastWatered") ||
    this.isModified("careInstructions.watering.frequency")
  ) {
    this.nextWateringDue = this.calculateNextWatering();
  }
  next();
});

// --------------------
// Model
// --------------------
const Plant = mongoose.model<IPlant>("Plant", plantSchema);
export default Plant;
