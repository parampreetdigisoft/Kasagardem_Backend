import mongoose, { Document, Schema } from "mongoose";

export interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

export interface ISocialLinks {
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
}

export interface IUserProfile extends Document {
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
      enum: ["male", "female", "other"],
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

const UserProfile = mongoose.model<IUserProfile>(
  "UserProfile",
  userProfileSchema
);

export default UserProfile;
