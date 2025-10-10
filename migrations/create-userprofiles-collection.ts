import { Db } from "mongodb";

export default {
  /**
   * Creates the "userprofiles" collection with schema validation.
   * @param db - The MongoDB database instance
   * @returns Resolves when the collection is created or updated
   */
  async up(db: Db): Promise<void> {
    const collections = await db
      .listCollections({ name: "userprofiles" })
      .toArray();

    const userProfileValidator = {
      $jsonSchema: {
        bsonType: "object",
        required: ["userId"],
        additionalProperties: false,
        properties: {
          _id: {
            bsonType: "objectId",
            description: "auto-generated unique identifier",
          },
          userId: {
            bsonType: "objectId",
            description: "must be an ObjectId referencing users collection",
          },
          profileImage: {
            bsonType: "string",
            description: "Base 64 of user's profile image",
          },
          dateOfBirth: {
            bsonType: "date",
            description: "user's date of birth",
          },
          gender: {
            bsonType: "string",
            enum: ["male", "female", "other"],
            description: "user's gender",
          },
          bio: {
            bsonType: "string",
            maxLength: 500,
            description: "user's biography",
          },
          address: {
            bsonType: "object",
            additionalProperties: false,
            properties: {
              street: { bsonType: "string" },
              city: { bsonType: "string" },
              state: { bsonType: "string" },
              country: { bsonType: "string" },
              zipCode: { bsonType: "string" },
            },
          },
          occupation: {
            bsonType: "string",
            description: "user's occupation",
          },
          company: {
            bsonType: "string",
            description: "user's company",
          },
          createdAt: {
            bsonType: "date",
            description: "document creation timestamp",
          },
          updatedAt: {
            bsonType: "date",
            description: "document update timestamp",
          },
          __v: {
            bsonType: "int",
            description: "internal mongoose version key",
          },
        },
      },
    };

    if (collections.length > 0) {
      try {
        await db.command({
          collMod: "userprofiles",
          validator: userProfileValidator,
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
      await db.createCollection("userprofiles", {
        validator: userProfileValidator,
        validationLevel: "strict",
      });
    }

    await db
      .collection("userprofiles")
      .createIndex({ userId: 1 }, { unique: true });
  },

  /**
   * Reverts schema validation and removes indexes without deleting data.
   * @param db - The MongoDB database instance
   */
  async down(db: Db): Promise<void> {
    const collection = db.collection("userprofiles");
    try {
      // Remove schema validation
      await db.command({
        collMod: "userprofiles",
        validator: { $jsonSchema: { bsonType: "object" } }, // allow any document
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

    // Drop indexes created in `up` (except _id)
    await collection.dropIndex("userId_1").catch(() => {});
  },
};
