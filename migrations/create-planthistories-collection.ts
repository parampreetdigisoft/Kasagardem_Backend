import { Db } from "mongodb";

export default {
  /**
   * Creates the "planthistory" collection with schema validation.
   * @param {Db} db - The MongoDB database instance
   * @returns {Promise<void>} Resolves when the collection is created or updated
   */
  async up(db: Db) {
    const collections = await db
      .listCollections({ name: "planthistory" })
      .toArray();

    const plantHistoryValidator = {
      $jsonSchema: {
        bsonType: "object",
        required: ["userId", "action", "timestamp"],
        properties: {
          userId: {
            bsonType: "objectId",
            description: "must be an ObjectId referencing users collection",
          },
          plantId: {
            bsonType: "objectId",
            description:
              "ObjectId referencing plants collection (optional for some actions)",
          },
          action: {
            bsonType: "string",
            enum: [
              "viewed",
              "added",
              "identified",
              "watered",
              "fertilized",
              "updated",
              "deleted",
            ],
            description: "type of action performed",
          },
          timestamp: {
            bsonType: "date",
            description: "when the action was performed",
          },
          metadata: {
            bsonType: "object",
            description: "additional data related to the action",
          },
        },
      },
    };

    if (collections.length > 0) {
      await db.command({
        collMod: "planthistory",
        validator: plantHistoryValidator,
        validationLevel: "moderate",
      });
    } else {
      await db.createCollection("planthistory", {
        validator: plantHistoryValidator,
      });
    }

    // Create indexes
    await db.collection("planthistory").createIndex({ userId: 1 });
    await db.collection("planthistory").createIndex({ plantId: 1 });
    await db.collection("planthistory").createIndex({ timestamp: -1 });
    await db.collection("planthistory").createIndex({ action: 1 });
  },

  async down(db: Db) {
    await db.collection("planthistory").drop();
  },
};
