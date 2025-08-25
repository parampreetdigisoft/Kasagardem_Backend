import mongoose from "mongoose";

export interface IUser {
  name: string;
  email?: string;
  password?: string;
  roleId: mongoose.Types.ObjectId;
  phoneNumber?: string;
  googleId?: string;
  // PASSWORD RESET FIELDS
  passwordResetToken?: string | undefined;
  passwordResetExpires?: Date | undefined;
}

export interface IRole {
  name: string;
  description?: string;
}
