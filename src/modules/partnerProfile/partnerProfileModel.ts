import mongoose, { Document, Schema } from "mongoose";
import { IAddress } from "../../interface/index"; // Assuming you already have IAddress defined
import { createPartnerProfileDto } from "../../dto/partnerProfileDto";
import { ZodError } from "zod";

export interface IPartnerProfile extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  mobileNumber: string;
  companyName?: string;
  speciality?: string[];
  address?: IAddress;
  website?: string;
  contactPerson?: string;
  projectImageUrl?: string;
  status?: "active" | "inactive" | "pending" | "suspended";
  createdAt?: Date;
  updatedAt?: Date;
  rating?: number;
}

// Schema definition
const partnerProfileSchema = new Schema<IPartnerProfile>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "Invalid email format"],
    },
    mobileNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^\+?[1-9]\d{7,14}$/, "Invalid mobile number format"],
    },
    companyName: {
      type: String,
      trim: true,
      maxlength: [150, "Company name cannot exceed 150 characters"],
    },
    speciality: {
      type: [String],
      default: [],
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true },
      zipCode: { type: String, trim: true },
    },
    website: {
      type: String,
      trim: true,
    },
    contactPerson: {
      type: String,
      trim: true,
      maxlength: [100, "Contact person name cannot exceed 100 characters"],
    },
    projectImageUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "pending", "suspended"],
      default: "pending",
      lowercase: true,
    },
    rating: {
      type: Number,
      min: [0, "Rating cannot be less than 0"],
      max: [5, "Rating cannot be more than 5"],
    },
  },
  {
    timestamps: true,
  }
);

// --------------------
// Static Methods
// --------------------

/**
 * Create a PartnerProfile after validating with Zod DTO.
 * @param data - Unvalidated profile data
 * @returns Created PartnerProfile document
 * @throws ZodError if validation fails
 */
partnerProfileSchema.statics.createValidated = async function (
  data: unknown
): Promise<IPartnerProfile> {
  try {
    const parsedData = createPartnerProfileDto.parse(data);

    const profile = new this(parsedData) as IPartnerProfile;
    await profile.save();
    return profile;
  } catch (err) {
    if (err instanceof ZodError) {
      throw err;
    }
    throw err;
  }
};

/**
 * Update a PartnerProfile with strict validation.
 * @param profileId - The profile's _id
 * @param data - Unvalidated update data
 * @returns Updated PartnerProfile document or null if not found
 * @throws ZodError if validation fails
 */
partnerProfileSchema.statics.updateValidated = async function (
  profileId: string,
  data: unknown
): Promise<IPartnerProfile | null> {
  try {
    const parsedData = createPartnerProfileDto.parse(data);

    const updatedProfile = await this.findByIdAndUpdate(profileId, parsedData, {
      new: true,
      runValidators: true,
    });

    return updatedProfile;
  } catch (err) {
    if (err instanceof ZodError) {
      throw err;
    }
    throw err;
  }
};

/**
 * Update only the rating of a PartnerProfile.
 * @param profileId - The profile's _id
 * @param rating - New rating value (0 to 5)
 * @returns Updated PartnerProfile document or null if not found
 * @throws Error if validation fails or profile not found
 */
partnerProfileSchema.statics.updateRating = async function (
  profileId: string,
  rating: number
): Promise<IPartnerProfile | null> {
  try {
    // Basic validation
    if (typeof rating !== "number" || rating < 0 || rating > 5) {
      throw new Error("Rating must be a number between 0 and 5");
    }

    const updatedProfile = await this.findByIdAndUpdate(
      profileId,
      { rating },
      { new: true, runValidators: true }
    );

    return updatedProfile;
  } catch (err) {
    throw err;
  }
};

// Model type with static methods
interface IPartnerProfileModel extends mongoose.Model<IPartnerProfile> {
  createValidated(data: unknown): Promise<IPartnerProfile>;
  updateValidated(
    profileId: string,
    data: unknown
  ): Promise<IPartnerProfile | null>;
  updateRating(
    profileId: string,
    rating: number
  ): Promise<IPartnerProfile | null>;
}

const PartnerProfile = mongoose.model<IPartnerProfile, IPartnerProfileModel>(
  "PartnerProfile",
  partnerProfileSchema
);

export default PartnerProfile;
