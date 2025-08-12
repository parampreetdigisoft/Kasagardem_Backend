module.exports = {
  /**
   * Creates the "userprofiles" collection with schema validation.
   * @param {import('mongodb').Db} db
   * @returns {Promise<void>}
   */
  async up(db) {
    const collections = await db.listCollections({ name: 'userprofiles' }).toArray();

    const userProfileValidator = {
      $jsonSchema: {
        bsonType: "object",
        required: ["userId"],
        properties: {
          userId: {
            bsonType: "objectId",
            description: "must be an ObjectId referencing users collection"
          },
          profileImageUrl: {
            bsonType: "string",
            description: "URL of user's profile image"
          },
          dateOfBirth: {
            bsonType: "date",
            description: "user's date of birth"
          },
          gender: {
            bsonType: "string",
            enum: ["male", "female", "other"],
            description: "user's gender"
          },
          bio: {
            bsonType: "string",
            maxLength: 500,
            description: "user's biography"
          },
          address: {
            bsonType: "object",
            properties: {
              street: { bsonType: "string" },
              city: { bsonType: "string" },
              state: { bsonType: "string" },
              country: { bsonType: "string" },
              zipCode: { bsonType: "string" }
            }
          },
          occupation: {
            bsonType: "string",
            description: "user's occupation"
          },
          company: {
            bsonType: "string",
            description: "user's company"
          },
        }
      }
    };

    if (collections.length > 0) {
      await db.command({
        collMod: "userprofiles",
        validator: userProfileValidator,
        validationLevel: "moderate"
      });
    } else {
      await db.createCollection("userprofiles", {
        validator: userProfileValidator
      });
    }

    await db.collection("userprofiles").createIndex({ userId: 1 }, { unique: true });
  },

  async down(db) {
    await db.collection("userprofiles").drop();
  }
};
