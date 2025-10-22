import mongoose from "mongoose";

export interface IUser {
  name: string;
  email: string;
  password?: string; // Optional for OAuth users
  firebaseUid?: string; // Firebase UID for OAuth users
  profilePicture?: string; // Profile picture URL
  roleId: mongoose.Types.ObjectId | string;
  phoneNumber?: string;
  isEmailVerified?: boolean; // Email verification status
  passwordResetToken?: string | undefined;
  passwordResetExpires?: Date | undefined;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRole {
  name: string;
  description?: string;
}
