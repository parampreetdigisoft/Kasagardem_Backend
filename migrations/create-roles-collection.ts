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
        additionalProperties: false,
        properties: {
          _id: {
            bsonType: "objectId",
            description: "auto-generated unique identifier",
          },
          name: {
            bsonType: "string",
            minLength: 2,
            maxLength: 30,
            description:
              "must be a string between 2-30 characters and is required",
          },
          description: {
            bsonType: ["string", "null"],
            description: "optional description",
          },
          createdAt: { bsonType: "date" },
          updatedAt: { bsonType: "date" },
          __v: {
            bsonType: "int",
            description: "internal mongoose version key",
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
      try {
        // Collection exists, update the validator
        await db.command({
          collMod: collectionName,
          validator: validator,
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
   * Rolls back the "roles" collection schema but preserves the data.
   * Removes the validator and unique index on name instead of dropping the collection.
   * @param db - The MongoDB database instance.
   */
  async down(db: Db): Promise<void> {
    const collectionName = "roles";
    const collections = await db
      .listCollections({ name: collectionName })
      .toArray();

    if (collections.length > 0) {
      // Remove validator (schema enforcement)
      try {
        await db.command({
          collMod: collectionName,
          validator: {},
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

      // Drop the unique index on name if it exists
      const rolesCollection = db.collection(collectionName);
      try {
        await rolesCollection.dropIndex("name_1");
      } catch (error: any) {
        if (error.code !== 27) {
          // 27 = index not found
          throw error;
        }
      }
    }
  },
};
