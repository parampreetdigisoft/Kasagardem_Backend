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
        },
      },
    };

    if (collections.length > 0) {
      await db.command({
        collMod: "userprofiles",
        validator: userProfileValidator,
        validationLevel: "strict", 
      });
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
   * Drops the "userprofiles" collection.
   * @param db - The MongoDB database instance
   */
  async down(db: Db): Promise<void> {
    await db.collection("userprofiles").drop();
  },
};
