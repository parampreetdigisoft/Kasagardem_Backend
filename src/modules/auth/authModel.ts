import mongoose, { Document, Schema, Model } from "mongoose";
import bcrypt from "bcryptjs";
import { IUser } from "../../interface/user";
import { createUserDto } from "../../dto/userDto";
import { ZodError } from "zod";

export interface IUserDocument extends IUser, Document {
  _id: mongoose.Types.ObjectId;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IUserModel extends Model<IUserDocument> {
  createValidated(data: unknown): Promise<IUserDocument>;
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

    // PASSWORD RESET FIELDS:
    passwordResetToken: {
      type: String,
      select: true, 
    },
    passwordResetExpires: {
      type: Date,
      select: true, 
    },
  },
  { timestamps: true }
);

//#region Satic Methods
// Pre-save: hash password if modified
userSchema.pre<IUserDocument>("save", async function (next) {
  if (!this.isModified("password")) return next();
  if (this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

/**
 * Compares a given plain-text password with the user's stored hashed password.
 *
 * @param candidatePassword - The plain text password to compare.
 * @returns {Promise<boolean>} Resolves to true if the password matches, false otherwise.
 */
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password!);
};

/**
 * Static method to create a user after validating with Zod DTO.
 * Validates the input data strictly and removes any extra fields before saving.
 *
 * @param data - The unvalidated user data to create.
 * @returns {Promise<IUserDocument>} The created and saved user document.
 * @throws {ZodError} If validation fails.
 * @throws {Error} For other errors such as MongoDB duplicate key errors.
 */
userSchema.statics.createValidated = async function (
  data: unknown
): Promise<IUserDocument> {
  try {
    // Validate & strip extra fields
    const parsedData = createUserDto.parse(data);

    // Create user using validated data
    const user = new this(parsedData) as IUserDocument;
    await user.save(); // triggers pre-save hooks
    return user;
  } catch (err) {
    if (err instanceof ZodError) {
      throw err; // Let controller handle Zod validation errors
    }
    throw err; // Other errors (e.g., MongoDB duplicate key)
  }
};

//#endregion

const User: IUserModel = mongoose.model<IUserDocument, IUserModel>(
  "User",
  userSchema
);
export default User;
