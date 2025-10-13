import { Db } from "mongodb";

export default {
  async up(db: Db): Promise<void> {
    const collectionName = "answers";
    const collections = await db
      .listCollections({ name: collectionName })
      .toArray();

    const validator = {
      $jsonSchema: {
        bsonType: "object",
        required: ["answers"],
        additionalProperties: false,
        properties: {
          _id: {
            bsonType: "objectId",
            description: "auto-generated unique identifier",
          },
          userId: {
            bsonType: ["objectId", "null"],
            description: "Reference to the user who answered , it is optional",
          },
          answers: {
            bsonType: "array",
            description:
              "List of answered questions with selected options or addresses",
            items: {
              bsonType: "object",
              required: ["questionId", "type"],
              properties: {
                questionId: {
                  bsonType: "objectId",
                  description: "Reference to the question answered",
                },
                type: {
                  bsonType: "int",
                  description: "1 = option, 2 = address",
                  enum: [1, 2],
                },
                selectedOption: {
                  bsonType: ["string", "null"],
                  description:
                    "The option selected by the user (required if type=1)",
                },
                selectedAddress: {
                  bsonType: ["object", "null"],
                  description:
                    "Address selected by the user (required if type=2)",
                  required: ["state", "city"],
                  properties: {
                    state: {
                      bsonType: ["string", "null"],
                      description: "State selected",
                    },
                    city: {
                      bsonType: ["string", "null"],
                      description: "City selected",
                    },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },
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
      try {
        // Update existing collection validator
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
    }

    // Create indexes for better query performance
    await db.collection(collectionName).createIndexes([
      { key: { isDeleted: 1 }, name: "isDeleted_1" },
      { key: { createdAt: -1 }, name: "createdAt_-1" },
    ]);
  },

  async down(db: Db): Promise<void> {
    const collectionName = "answers";
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
    await db
      .collection(collectionName)
      .dropIndex("")
      .catch(() => {});
  },
};
