import { Db } from "mongodb";

export default {
  /**
   * Creates the "roles" collection with schema validation and unique index on name.
   * Handles existing collections gracefully for alterations.
   * @param db - The MongoDB database instance.
   */
  async up(db: Db): Promise<void> {
    const collectionName = "roles";
    const collections = await db
      .listCollections({ name: collectionName })
      .toArray();

    const validator = {
      $jsonSchema: {
        bsonType: "object",
        required: ["name"],
        properties: {
          name: {
            bsonType: "string",
            minLength: 2,
            maxLength: 30,
            description:
              "must be a string between 2-30 characters and is required",
          },
          description: {
            bsonType: "string",
            description: "optional description",
          },
        },
      },
    };

    if (collections.length === 0) {
      // Collection doesn't exist, create it
      await db.createCollection(collectionName, {
        validator,
        validationLevel: "strict",
      });
    } else {
      // Collection exists, update the validator
      await db.command({
        collMod: collectionName,
        validator: validator,
        validationLevel: "strict",
      });
    }

    // Create or ensure unique index exists
    const rolesCollection = db.collection(collectionName);

    try {
      await rolesCollection.createIndex({ name: 1 }, { unique: true });
    } catch (error: any) {
      // Index might already exist, check if it's the same
      if (error.code !== 85) {
        // 85 = Index already exists error code
        throw error;
      }
    }
  },

  /**
   * Drops the "roles" collection if it exists.
   * @param db - The MongoDB database instance.
   */
  async down(db: Db): Promise<void> {
    const collectionName = "roles";
    const collections = await db
      .listCollections({ name: collectionName })
      .toArray();

    if (collections.length > 0) {
      await db.collection(collectionName).drop();
    }
  },
};
