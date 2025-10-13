import mongoose, { Document, Schema } from "mongoose";
import { IAddress, ISocialLinks } from "../../interface/index";
import { createUserProfileDto } from "../../dto/userProfileDto";
import { ZodError } from "zod";

export interface IUserProfile extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  profileImage?: string;
  dateOfBirth?: Date;
  gender?: "male" | "female" | "other";
  bio?: string;
  address?: IAddress;
  socialLinks?: ISocialLinks;
  occupation?: string;
  company?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Schema definition
const userProfileSchema = new Schema<IUserProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    profileImage: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other",""],
      lowercase: true,
    },
    bio: {
      type: String,
      maxlength: [500, "Bio cannot exceed 500 characters"],
      trim: true,
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true },
      zipCode: { type: String, trim: true },
    },
    socialLinks: {
      facebook: { type: String, trim: true },
      twitter: { type: String, trim: true },
      linkedin: { type: String, trim: true },
      instagram: { type: String, trim: true },
    },
    occupation: {
      type: String,
      trim: true,
      maxlength: [100, "Occupation cannot exceed 100 characters"],
    },
    company: {
      type: String,
      trim: true,
      maxlength: [100, "Company name cannot exceed 100 characters"],
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
 * Create a UserProfile after validating with Zod DTO.
 * @param data - Unvalidated profile data
 * @returns Created UserProfile document
 * @throws ZodError if validation fails
 */
userProfileSchema.statics.createValidated = async function (
  data: unknown
): Promise<IUserProfile> {
  try {
    const parsedData = createUserProfileDto.parse(data);

    const profile = new this(parsedData) as IUserProfile;
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
 * Update a UserProfile with strict validation.
 * @param profileId - The profile's _id
 * @param data - Unvalidated update data
 * @returns Updated UserProfile document or null if not found
 * @throws ZodError if validation fails
 */
userProfileSchema.statics.updateValidated = async function (
  profileId: string,
  data: unknown
): Promise<IUserProfile | null> {
  try {
    const parsedData = createUserProfileDto.parse(data);

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

// Model type with static methods
interface IUserProfileModel extends mongoose.Model<IUserProfile> {
  createValidated(data: unknown): Promise<IUserProfile>;
  updateValidated(
    profileId: string,
    data: unknown
  ): Promise<IUserProfile | null>;
}

const UserProfile = mongoose.model<IUserProfile, IUserProfileModel>(
  "UserProfile",
  userProfileSchema
);

export default UserProfile;
