import mongoose, { Document, Schema, Model } from "mongoose";
import { ZodError } from "zod";
import { createPlantDto, updatePlantDto } from "../../dto/plantDto";

export interface ILocation {
  type: string;
  value: string;
}

export interface IPlant {
  scientific_name: string;
  common_name: string;
  image_search_url?: string;
  space_types?: string[];
  area_sizes?: string[];
  challenges?: string[];
  tech_preferences?: string[];
  locations?: ILocation[];
  description?: string;
  care_notes?: string[];
  native?: boolean;
  light?: string;
  water_needs?: string;
  maintenance_level?: string;
  growth_form?: string;
  isDeleted: boolean;
}

export interface IPlantDocument extends IPlant, Document {
  _id: mongoose.Types.ObjectId;
}

export interface IPlantModel extends Model<IPlantDocument> {
  createValidated(data: unknown): Promise<IPlantDocument>;
  updateValidated(
    plantId: string,
    data: unknown
  ): Promise<IPlantDocument | null>;
}

// Sub-schema for location items
const locationSchema = new Schema<ILocation>(
  {
    type: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false } // Match MongoDB strict validation
);

const plantSchema = new Schema<IPlantDocument>(
  {
    scientific_name: {
      type: String,
      required: true,
      unique: true, // Ensure unique scientific names
      trim: true,
    },
    common_name: {
      type: String,
      required: true,
      trim: true,
    },
    image_search_url: {
      type: String,
      validate: {
        /**
         * Validates that the image_search_url is a valid URL format.
         *
         * @param value - The URL string to validate.
         * @returns True if the URL is valid, otherwise false.
         */
        validator: function (value: string): boolean {
          if (!value) return true; // Allow empty/undefined values
          try {
            new URL(value);
            return true;
          } catch {
            return false;
          }
        },
        message: "image_search_url must be a valid URL",
      },
    },
    space_types: {
      type: [String],
      validate: {
        /**
         * Validates that all space types are non-empty strings.
         *
         * @param value - The array of space types to validate.
         * @returns True if all items are valid, otherwise false.
         */
        validator: function (value: string[]): boolean {
          if (!Array.isArray(value)) return true; // Allow undefined
          return value.every(
            (item) => typeof item === "string" && item.trim().length > 0
          );
        },
        message: "All space types must be non-empty strings",
      },
    },
    area_sizes: {
      type: [String],
      validate: {
        /**
         * Validates that all area sizes are non-empty strings.
         *
         * @param value - The array of area sizes to validate.
         * @returns True if all items are valid, otherwise false.
         */
        validator: function (value: string[]): boolean {
          if (!Array.isArray(value)) return true; // Allow undefined
          return value.every(
            (item) => typeof item === "string" && item.trim().length > 0
          );
        },
        message: "All area sizes must be non-empty strings",
      },
    },
    challenges: {
      type: [String],
      validate: {
        /**
         * Validates that all challenges are non-empty strings.
         *
         * @param value - The array of challenges to validate.
         * @returns True if all items are valid, otherwise false.
         */
        validator: function (value: string[]): boolean {
          if (!Array.isArray(value)) return true; // Allow undefined
          return value.every(
            (item) => typeof item === "string" && item.trim().length > 0
          );
        },
        message: "All challenges must be non-empty strings",
      },
    },
    tech_preferences: {
      type: [String],
      validate: {
        /**
         * Validates that all tech preferences are non-empty strings.
         *
         * @param value - The array of tech preferences to validate.
         * @returns True if all items are valid, otherwise false.
         */
        validator: function (value: string[]): boolean {
          if (!Array.isArray(value)) return true; // Allow undefined
          return value.every(
            (item) => typeof item === "string" && item.trim().length > 0
          );
        },
        message: "All tech preferences must be non-empty strings",
      },
    },
    locations: {
      type: [locationSchema],
      validate: {
        /**
         * Validates that all location objects have required fields.
         *
         * @param value - The array of locations to validate.
         * @returns True if all locations are valid, otherwise false.
         */
        validator: function (value: ILocation[]): boolean {
          if (!Array.isArray(value)) return true; // Allow undefined
          return value.every(
            (location) =>
              location &&
              typeof location.type === "string" &&
              location.type.trim().length > 0 &&
              typeof location.value === "string" &&
              location.value.trim().length > 0
          );
        },
        message: "All locations must have valid type and value fields",
      },
    },
    description: {
      type: String,
      validate: {
        /**
         * Validates that description is a non-empty string if provided.
         *
         * @param value - The description string to validate.
         * @returns True if valid or undefined, otherwise false.
         */
        validator: function (value: string): boolean {
          if (!value) return true; // Allow undefined
          return typeof value === "string" && value.trim().length > 0;
        },
        message: "Description must be a non-empty string",
      },
    },
    care_notes: {
      type: [String],
      validate: {
        /**
         * Validates that all care notes are non-empty strings.
         *
         * @param value - The array of care notes to validate.
         * @returns True if all items are valid, otherwise false.
         */
        validator: function (value: string[]): boolean {
          if (!Array.isArray(value)) return true; // Allow undefined
          return value.every(
            (item) => typeof item === "string" && item.trim().length > 0
          );
        },
        message: "All care notes must be non-empty strings",
      },
    },
    native: {
      type: Boolean,
      // No validation needed - mongoose handles boolean conversion
    },
    light: {
      type: String,
      validate: {
        /**
         * Validates that light requirement is a non-empty string if provided.
         *
         * @param value - The light requirement string to validate.
         * @returns True if valid or undefined, otherwise false.
         */
        validator: function (value: string): boolean {
          if (!value) return true; // Allow undefined
          return typeof value === "string" && value.trim().length > 0;
        },
        message: "Light requirement must be a non-empty string",
      },
    },
    water_needs: {
      type: String,
      validate: {
        /**
         * Validates that water needs is a non-empty string if provided.
         *
         * @param value - The water needs string to validate.
         * @returns True if valid or undefined, otherwise false.
         */
        validator: function (value: string): boolean {
          if (!value) return true; // Allow undefined
          return typeof value === "string" && value.trim().length > 0;
        },
        message: "Water needs must be a non-empty string",
      },
    },
    maintenance_level: {
      type: String,
      validate: {
        /**
         * Validates that maintenance level is a non-empty string if provided.
         *
         * @param value - The maintenance level string to validate.
         * @returns True if valid or undefined, otherwise false.
         */
        validator: function (value: string): boolean {
          if (!value) return true; // Allow undefined
          return typeof value === "string" && value.trim().length > 0;
        },
        message: "Maintenance level must be a non-empty string",
      },
    },
    growth_form: {
      type: String,
      validate: {
        /**
         * Validates that growth form is a non-empty string if provided.
         *
         * @param value - The growth form string to validate.
         * @returns True if valid or undefined, otherwise false.
         */
        validator: function (value: string): boolean {
          if (!value) return true; // Allow undefined
          return typeof value === "string" && value.trim().length > 0;
        },
        message: "Growth form must be a non-empty string",
      },
    },

    isDeleted: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    strict: true, // Ensure strict mode to match MongoDB validation
  }
);

// Add indexes for better query performance
plantSchema.index({ scientific_name: 1 }); // Unique index already created by unique: true
plantSchema.index({
  common_name: "text",
  scientific_name: "text",
  description: "text",
}); // Text search
plantSchema.index({ maintenance_level: 1 });
plantSchema.index({ light: 1 });
plantSchema.index({ water_needs: 1 });
plantSchema.index({ growth_form: 1 });
plantSchema.index({ isDeleted: 1 });
plantSchema.index({ createdAt: -1 });
plantSchema.index({ space_types: 1 });
plantSchema.index({ area_sizes: 1 });
plantSchema.index({ challenges: 1 });
plantSchema.index({ tech_preferences: 1 });
plantSchema.index({ native: 1 });

/**
 * Creates and validates a new plant document using the provided data.
 *
 * This method uses Zod to parse and validate the incoming data,
 * creates a new Mongoose Plant document, and saves it to the database.
 *
 * @param data - The raw input data to validate and save.
 * @returns A promise that resolves with the created Plant document.
 * @throws {ZodError} If validation fails.
 */
plantSchema.statics.createValidated = async function (
  data: unknown
): Promise<IPlantDocument> {
  try {
    const parsedData = createPlantDto.parse(data);
    const plant = new this(parsedData) as IPlantDocument;
    await plant.save();
    return plant;
  } catch (err) {
    if (err instanceof ZodError) throw err;
    throw err;
  }
};

/**
 * Updates and validates an existing plant document by ID.
 *
 * This method uses Zod to parse and validate the incoming data,
 * then updates the Plant document in MongoDB with validation enabled.
 *
 * @param plantId - The ID of the plant to update.
 * @param data - The raw input data to validate and update with.
 * @returns A promise that resolves with the updated Plant document, or null if not found.
 * @throws {ZodError} If validation fails.
 */
plantSchema.statics.updateValidated = async function (
  plantId: string,
  data: unknown
): Promise<IPlantDocument | null> {
  try {
    const parsedData = updatePlantDto.parse(data);
    return await this.findByIdAndUpdate(plantId, parsedData, {
      new: true,
      runValidators: true,
    });
  } catch (err) {
    if (err instanceof ZodError) throw err;
    throw err;
  }
};

const Plant: IPlantModel = mongoose.model<IPlantDocument, IPlantModel>(
  "Plant",
  plantSchema
);

export default Plant;
