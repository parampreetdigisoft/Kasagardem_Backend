import mongoose, { Document, Schema, Model } from "mongoose";
import bcrypt from "bcryptjs";
import { IUser } from "../../interface/Types";

export interface IUserDocument extends IUser, Document {
  _id: mongoose.Types.ObjectId;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      /**
       * Determines whether a field is required based on whether the user signed up with Google.
       *
       * @this IUserDocument - The current user document context.
       * @returns {boolean} - Returns true if `googleId` is not present, meaning the field is required.
       */
      required: function (this: IUserDocument): boolean {
        return !this.googleId;
      },
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      /**
       * Determines whether a value is required based on the user's authentication method.
       *
       * If the user has not signed in with Google (`googleId` is not set), this field is required.
       *
       * @this IUserDocument
       * @returns {boolean} True if the field is required, false otherwise.
       */
      required: function (this: IUserDocument): boolean {
        return !this.googleId;
      },
      minlength: 6,
      select: false,
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
      match: [
        /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/,
        "Please enter a valid phone number",
      ],
    },
    googleId: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

userSchema.pre<IUserDocument>("save", async function (next) {
  if (!this.isModified("password")) return next();
  if (this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

/**
 * Compares the given candidate password with the user's stored password.
 *
 * @param {string} candidatePassword - The plain text password provided by the user.
 * @returns {Promise<boolean>} A promise that resolves to true if the password matches, false otherwise.
 */
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password!);
};

const User: Model<IUserDocument> = mongoose.model<IUserDocument>(
  "User",
  userSchema
);
export default User;
