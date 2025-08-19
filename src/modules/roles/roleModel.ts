import mongoose, { Document, Schema, Model } from "mongoose";

export interface IRole {
  name: string;
  description?: string;
}

export interface IRoleDocument extends IRole, Document {
  _id: mongoose.Types.ObjectId;
}

const roleSchema = new Schema<IRoleDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      minlength: 2,
      maxlength: 30,
    },
    description: { type: String },
  },
  { timestamps: true }
);

const Role: Model<IRoleDocument> = mongoose.model<IRoleDocument>(
  "Role",
  roleSchema
);
export default Role;
