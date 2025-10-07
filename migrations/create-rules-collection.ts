import { Db } from "mongodb";

export default {
  async up(db: Db): Promise<void> {
    const collectionName = "rules";
    const collections = await db
      .listCollections({ name: collectionName })
      .toArray();

    const validator = {
      $jsonSchema: {
        bsonType: "object",
        required: ["name", "conditions"],
        additionalProperties: false,
        properties: {
          _id: {
            bsonType: "objectId",
            description: "auto-generated unique identifier",
          },
          name: {
            bsonType: "string",
            description: "Human readable rule name",
          },
          conditions: {
            bsonType: "array",
            description: "Conditions to evaluate the rule",
            items: {
              bsonType: "object",
              required: ["questionId", "operator", "values"],
              properties: {
                questionId: {
                  bsonType: "objectId",
                  description: "Reference to the question document",
                },
                operator: {
                  bsonType: "string",
                  enum: ["equals", "and", "or"],
                  description: "Comparison operator",
                },
                values: {
                  bsonType: "array",
                  items: { bsonType: "string" },
                  description: "Possible matching values",
                },
              },
            },
          },
          affiliateFor: {
            bsonType: ["string", "null"],
            description: "Affiliate keyword reference (nullable)",
          },

          isDeleted: {
            bsonType: "bool",
            description: "Soft delete flag",
          },
          createdAt: { bsonType: "date" },
          updatedAt: { bsonType: "date" },
        },
      },
    };

    if (collections.length === 0) {
      await db.createCollection(collectionName, {
        validator,
        validationLevel: "strict",
      });
    } else {
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

      // Ensure all existing documents have affiliateFor field set to null
      await db
        .collection(collectionName)
        .updateMany(
          { affiliateFor: { $exists: false } },
          { $set: { affiliateFor: null } }
        );
    }
  },

  async down(db: Db): Promise<void> {
    const collectionName = "rules";
    const collections = await db
      .listCollections({ name: collectionName })
      .toArray();

    if (collections.length > 0) {
      try {
        await db.command({
          collMod: collectionName,
          validator: {},
          validationLevel: "off",
        });
      } catch (error: any) {
        if (
          error.codeName === "Unauthorized" ||
          error.errmsg?.includes("not authorized")
        ) {
          console.error("⚠️ Skipping collMod due to insufficient privileges");
        } else {
          throw error; // rethrow if it's a real error
        }
      }

      // Optionally remove affiliateFor field from all docs on rollback
      await db
        .collection(collectionName)
        .updateMany({}, { $unset: { affiliateFor: "" } });
    }
  },
};
