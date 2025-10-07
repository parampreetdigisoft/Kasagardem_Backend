import { Db } from "mongodb";

export default {
  async up(db: Db): Promise<void> {
    const collectionName = "questions";
    const collections = await db
      .listCollections({ name: collectionName })
      .toArray();

    const validator = {
      $jsonSchema: {
        bsonType: "object",
        required: ["questionText", "options"],
        additionalProperties: false,
        properties: {
          _id: {
            bsonType: "objectId",
            description: "auto-generated unique identifier",
          },
          questionText: {
            bsonType: "string",
            description: "The full question text",
          },
          options: {
            bsonType: "array",
            items: { bsonType: "string" },
            description: "Multiple choice options",
          },
          order: {
            bsonType: "int",
            description: "Order of question in quiz",
          },
          isDeleted: {
            bsonType: "bool",
            description: "Soft delete flag",
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
      await db.createCollection(collectionName, {
        validator,
        validationLevel: "strict",
      });
    } else {
      // Update existing collection validator
      try {
        await db.command({
          collMod: collectionName,
          validator,
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

      // Ensure all existing documents have isDeleted field
      await db
        .collection(collectionName)
        .updateMany(
          { isDeleted: { $exists: false } },
          { $set: { isDeleted: false } }
        );

      // Remove projectAddress field from existing documents
      await db
        .collection(collectionName)
        .updateMany(
          { projectAddress: { $exists: true } },
          { $unset: { projectAddress: "" } }
        );
    }
  },

  async down(db: Db): Promise<void> {
    const collectionName = "questions";
    const collections = await db
      .listCollections({ name: collectionName })
      .toArray();

    if (collections.length > 0) {
      try {
        // Remove validation but keep collection & data
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
    }
  },
};
