module.exports = {
  /**
   * Migration to create or update the "logs" collection with schema validation.
   * @param {import('mongodb').Db} db - The MongoDB database instance.
   * @returns {Promise<void>}
   */
  async up(db) {
    const collections = await db.listCollections({ name: "logs" }).toArray();

    const logValidator = {
      $jsonSchema: {
        bsonType: "object",
        required: ["level", "message", "timestamp", "createdAt"],
        properties: {
          level: {
            bsonType: "string",
            enum: ["info", "error", "warn", "debug"],
            description:
              "must be one of: info, error, warn, debug and is required",
          },
          message: {
            bsonType: "string",
            minLength: 1,
            maxLength: 5000,
            description:
              "must be a string between 1-5000 characters and is required",
          },
          timestamp: {
            bsonType: "string",
            description: "must be an ISO string timestamp and is required",
          },
          meta: {
            bsonType: "object",
            description: "optional metadata object",
          },
          createdAt: {
            bsonType: "date",
            description: "must be a date and is required",
          },
          source: {
            bsonType: "string",
            description: "optional source/module that generated the log",
          },
          userId: {
            bsonType: "objectId",
            description: "optional ObjectId referencing users collection",
          },
          sessionId: {
            bsonType: "string",
            description: "optional session identifier",
          },
        },
      },
    };

    if (collections.length > 0) {
      // Collection exists: update validation with collMod
      await db.command({
        collMod: "logs",
        validator: logValidator,
        validationLevel: "moderate",
      });
    } else {
      // Collection does not exist: create collection with validator
      await db.createCollection("logs", {
        validator: logValidator,
      });
    }

    // Only create indexes if they don't exist
    const logsCollection = db.collection("logs");
    const existingIndexes = await logsCollection.listIndexes().toArray();
    const indexNames = existingIndexes.map((idx) => idx.name);

    // Create level index if it doesn't exist
    if (!indexNames.includes("level_1")) {
      await logsCollection.createIndex({ level: 1 }, { background: true });
    }

    // Create timestamp index if it doesn't exist
    if (!indexNames.includes("timestamp_1")) {
      await logsCollection.createIndex({ timestamp: 1 }, { background: true });
    }

    // Create compound index if it doesn't exist
    if (!indexNames.includes("level_1_createdAt_-1")) {
      await logsCollection.createIndex(
        { level: 1, createdAt: -1 },
        { background: true }
      );
    }
  },

  /**
   * Rolls back the migration by dropping the "logs" collection.
   * @param {import('mongodb').Db} db - The MongoDB database instance.
   * @returns {Promise<void>}
   */
  async down(db) {
    await db.collection("logs").drop();
  },
};
