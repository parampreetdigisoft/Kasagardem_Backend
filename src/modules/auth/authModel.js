const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: function () {
        // required if no googleId
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
      required: function () {
        // password required only if not a google user
        return !this.googleId;
      },
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: [true, "Role is required"],
    },
    phoneNumber: {
      type: String,
      trim: true,
      match: [
        /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/,
        "Please enter a valid phone number",
      ],
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // allow multiple docs without googleId
    },
  },
  {
    timestamps: true,
  }
);

// Hash password pre-save (no change needed)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

/**
 * Compares a provided password with the user's stored hashed password.
 * @param {string} candidatePassword - The plain text password to compare.
 * @returns {Promise<boolean>} True if the password matches, otherwise false.
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
