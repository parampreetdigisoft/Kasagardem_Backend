import mongoose, { Document, Schema, Model } from "mongoose";
import { IRole } from "../../interface/user";
import { createRoleDto } from "../../dto/roleDto"; // Import your Zod DTO
import { ZodError } from "zod";

export interface IRoleDocument extends IRole, Document {
  _id: mongoose.Types.ObjectId;
}

export interface IRoleModel extends Model<IRoleDocument> {
  createValidated(data: unknown): Promise<IRoleDocument>;
  updateValidated(
    roleId: string | undefined,
    data: unknown
  ): Promise<IRoleDocument | null>;
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

/**
 * Static method to create a role after validating with Zod DTO.
 * @param data - Unvalidated role data
 * @returns Created role document
 * @throws ZodError if validation fails
 */
roleSchema.statics.createValidated = async function (
  data: unknown
): Promise<IRoleDocument> {
  try {
    // Validate & strip extra fields
    const parsedData = createRoleDto.parse(data);

    // Create role using validated data
    const role = new this(parsedData) as IRoleDocument;
    await role.save();
    return role;
  } catch (err) {
    if (err instanceof ZodError) {
      throw err; // Let controller handle validation errors
    }
    throw err; // MongoDB duplicate key or other errors
  }
};

/**
 * Static method to update a role with strict validation.
 * @param roleId - The role's _id
 * @param data - Unvalidated update data
 * @returns Updated role document or null
 * @throws ZodError if validation fails
 */
roleSchema.statics.updateValidated = async function (
  roleId: string,
  data: unknown
): Promise<IRoleDocument | null> {
  try {
    const parsedData = createRoleDto.parse(data);

    // Find role and update
    const updatedRole = await this.findByIdAndUpdate(roleId, parsedData, {
      new: true, // Return the updated document
      runValidators: true, // Ensure Mongoose validation runs
    });

    return updatedRole;
  } catch (err) {
    if (err instanceof ZodError) {
      throw err;
    }
    throw err;
  }
};

const Role: IRoleModel = mongoose.model<IRoleDocument, IRoleModel>(
  "Role",
  roleSchema
);

export default Role;
