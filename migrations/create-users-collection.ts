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
        required: ["name", "email", "roleId"],
        additionalProperties: false,
        properties: {
          _id: {
            bsonType: "objectId",
            description: "auto-generated unique identifier",
          },
          name: { bsonType: "string", minLength: 2, maxLength: 50 },
          email: { bsonType: "string" },
          password: { bsonType: "string" },
          firebaseUid: {
            bsonType: "string",
          },
          roleId: { bsonType: "objectId" },
          phoneNumber: { bsonType: "string" },
          isEmailVerified: {
            bsonType: "bool",
          },
          passwordResetToken: { bsonType: "string" },
          passwordResetExpires: { bsonType: "date" },
          createdAt: { bsonType: "date" },
          updatedAt: { bsonType: "date" },
          __v: {
            bsonType: "int",
            description: "internal mongoose version key",
          },
        },
        // Either password OR firebaseUid must be present
        anyOf: [{ required: ["password"] }, { required: ["firebaseUid"] }],
      },
    };

    if (collections.length > 0) {
      try {
        await db.command({
          collMod: "users",
          validator: userValidator,
          validationLevel: "strict",
        });
      } catch (err: any) {
        if (
          err.codeName === "Unauthorized" ||
          err.errmsg?.includes("not authorized")
        ) {
          console.error("⚠️ Skipping collMod due to insufficient privileges");
        } else {
          throw err; // rethrow if it's a real error
        }
      }
    } else {
      await db.createCollection("users", {
        validator: userValidator,
        validationLevel: "strict",
      });
    }

    const users = db.collection("users");

    await users.createIndex({ email: 1 }, { unique: true, background: true });

    // Firebase UID index (unique, sparse for non-OAuth users)
    users.createIndex(
      { firebaseUid: 1 },
      { unique: true, sparse: true, background: true, name: "firebaseUid_1" }
    );
    await users.createIndex(
      { passwordResetToken: 1 },
      { sparse: true, background: true, name: "passwordResetToken_1" }
    );
    await users.createIndex(
      { passwordResetToken: 1, passwordResetExpires: 1 },
      { sparse: true, background: true, name: "passwordReset_compound_1" }
    );

    // ===== Add Missing Fields to Existing Documents =====

    await users.updateMany(
      { isEmailVerified: { $exists: false } },
      { $set: { isEmailVerified: false } }
    );
  },

  /**
   * Rolls back the migration by dropping the "users" collection.
   * @param db - The MongoDB database instance.
   */
  async down(db: Db): Promise<void> {
    try {
      await db.command({
        collMod: "users",
        validator: { $jsonSchema: { bsonType: "object" } },
        validationLevel: "off",
      });
    } catch (err: any) {
      if (
        err.codeName === "Unauthorized" ||
        err.errmsg?.includes("not authorized")
      ) {
        console.error("⚠️ Skipping collMod due to insufficient privileges");
      } else {
        throw err; // rethrow if it's a real error
      }
    }

    // Drop indexes (these don’t need special privileges)
    const users = db.collection("users");
    await Promise.all([
      users.dropIndex("email_1").catch(() => {}),
      users.dropIndex("firebaseUid_1").catch(() => {}),
      users.dropIndex("passwordResetToken_1").catch(() => {}),
      users.dropIndex("passwordReset_compound_1").catch(() => {}),
      users.dropIndex("passwordResetExpires_ttl_1").catch(() => {}),
    ]);
  },
};
