import { Db } from "mongodb";

export default {
  /**
   * Migration to create or update the "users" collection with schema validation
   * and a unique index on the email field.
   * @param db - The MongoDB database instance.
   */
  async up(db: Db): Promise<void> {
    const collections = await db.listCollections({ name: "users" }).toArray();

    const userValidator = {
      $jsonSchema: {
        bsonType: "object",
        // password is no longer required because of googleId presence
        required: ["name", "email", "roleId"], // password NOT required here
        additionalProperties: false, // ❌ Reject extra fields
        properties: {
          name: {
            bsonType: "string",
            minLength: 2,
            maxLength: 50,
            description:
              "must be a string between 2-50 characters and is required",
          },
          email: {
            bsonType: "string",
            pattern: "^\\w+([.-]?\\w+)*@\\w+([.-]?\\w+)*(\\.\\w{2,3})+$",
            description: "must be a valid email and is required",
          },
          password: {
            bsonType: "string",
            minLength: 6,
            description:
              "must be a string with minimum 6 characters if provided",
          },
          roleId: {
            bsonType: "objectId",
            description: "must be an ObjectId referencing roles collection",
          },
          phoneNumber: {
            bsonType: "string",
            pattern: "^[+]?[(]?[0-9]{1,4}[)]?[-\\s./0-9]*$",
            description: "must be a valid phone number string if provided",
          },
          googleId: {
            bsonType: "string",
            description: "Google ID string if user registered via Google",
          },
          // PASSWORD RESET FIELDS:
          passwordResetToken: {
            bsonType: "string",
            description: "Hashed token used for password reset",
          },
          passwordResetExpires: {
            bsonType: "date",
            description: "Expiration date of password reset token",
          },
          createdAt: { bsonType: "date", description: "must be a date" },
          updatedAt: { bsonType: "date", description: "must be a date" },
        },
        // Custom validation to ensure either password or googleId is present
        anyOf: [{ required: ["password"] }, { required: ["googleId"] }],
      },
    };

    if (collections.length > 0) {
      // Collection exists: update validation with collMod
      await db.command({
        collMod: "users",
        validator: userValidator,
        validationLevel: "strict", // 🔒 reject invalid docs immediately
      });
    } else {
      // Collection does not exist: create collection with validator
      await db.createCollection("users", {
        validator: userValidator,
        validationLevel: "strict", // 🔒
      });
    }

    // Ensure unique index on email exists
    await db
      .collection("users")
      .createIndex({ email: 1 }, { unique: true, background: true });

    // Ensure unique sparse index on googleId (because not all users have googleId)
    await db
      .collection("users")
      .createIndex(
        { googleId: 1 },
        { unique: true, sparse: true, background: true }
      );

    // Index for password reset token lookups
    await db.collection("users").createIndex(
      { passwordResetToken: 1 },
      {
        sparse: true, // Only index documents that have this field
        background: true,
        name: "passwordResetToken_1",
      }
    );

    // Compound index for password reset token + expiry (optimizes reset queries)
    await db.collection("users").createIndex(
      {
        passwordResetToken: 1,
        passwordResetExpires: 1,
      },
      {
        sparse: true, // Only index documents that have these fields
        background: true,
        name: "passwordReset_compound_1",
      }
    );

    // TTL index to automatically cleanup expired password reset tokens
    await db.collection("users").createIndex(
      { passwordResetExpires: 1 },
      {
        expireAfterSeconds: 0, // Delete immediately when date is reached
        sparse: true, // Only apply to documents with this field
        background: true,
        name: "passwordResetExpires_ttl_1",
      }
    );
  },

  /**
   * Rolls back the migration by dropping the "users" collection.
   * @param db - The MongoDB database instance.
   */
  async down(db: Db): Promise<void> {
    await db.collection("users").drop();
  },
};