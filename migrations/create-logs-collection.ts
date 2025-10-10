import { Db } from "mongodb";

export default {
  /**
   * Migration to create or update the "logs" collection with strict schema validation.
   * @param db - The MongoDB database instance.
   */
  async up(db: Db): Promise<void> {
    const collections = await db.listCollections({ name: "logs" }).toArray();

    const logValidator = {
      $jsonSchema: {
        bsonType: "object",
        required: ["_id", "level", "message", "timestamp", "createdAt"],
        additionalProperties: false, // 🚫 no extra fields allowed at root
        properties: {
          _id: {
            bsonType: "objectId",
            description: "auto-generated unique identifier",
          },
          level: {
            bsonType: "string",
            enum: ["info", "error", "warn", "debug"],
            description: "must be one of: info, error, warn, debug",
          },
          message: {
            bsonType: "string",
            minLength: 1,
            maxLength: 5000,
            description: "log message, 1–5000 characters",
          },
          timestamp: {
            bsonType: "date",
            description: "when the log event occurred",
          },
          meta: {
            bsonType: ["object", "null"],
            description: "optional metadata object",
          },
          createdAt: {
            bsonType: "date",
            description: "when the log document was created",
          },
          source: {
            bsonType: ["string", "null"],
            maxLength: 200,
            description: "optional source/module that generated the log",
          },
          userId: {
            bsonType: ["objectId", "null"],
            description: "optional reference to users collection",
          },
          sessionId: {
            bsonType: ["string", "null"],
            maxLength: 200,
            description: "optional session identifier",
          },
        },
      },
    };
    if (collections.length > 0) {
      try {
        await db.command({
          collMod: "logs",
          validator: logValidator,
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
      await db.createCollection("logs", {
        validator: logValidator,
        validationLevel: "strict",
      });
    }

    // Indexes
    const logsCollection = db.collection("logs");
    const existingIndexes = await logsCollection.listIndexes().toArray();
    const indexNames = existingIndexes.map((idx) => idx.name);

    if (!indexNames.includes("level_1")) {
      await logsCollection.createIndex({ level: 1 }, { background: true });
    }

    if (!indexNames.includes("timestamp_1")) {
      await logsCollection.createIndex({ timestamp: 1 }, { background: true });
    }

    if (!indexNames.includes("level_1_createdAt_-1")) {
      await logsCollection.createIndex(
        { level: 1, createdAt: -1 },
        { background: true }
      );
    }
  },

  /**
   * Rolls back the migration by dropping the "logs" collection.
   * @param db - The MongoDB database instance.
   */
  async down(db: Db): Promise<void> {
    await db.collection("logs").drop();
  },
};
