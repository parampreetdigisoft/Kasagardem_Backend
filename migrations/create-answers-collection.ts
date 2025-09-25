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
        required: ["userId", "answers"],
        additionalProperties: false,
        properties: {
          _id: {
            bsonType: "objectId",
            description: "auto-generated unique identifier",
          },
          userId: {
            bsonType: "objectId",
            description: "Reference to the user who answered",
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
                  bsonType: "string",
                  description:
                    "The option selected by the user (required if type=1)",
                },
                selectedAddress: {
                  bsonType: "object",
                  description:
                    "Address selected by the user (required if type=2)",
                  required: ["state", "city"],
                  properties: {
                    state: {
                      bsonType: "string",
                      description: "State selected",
                    },
                    city: { bsonType: "string", description: "City selected" },
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
      // Update existing collection validator
      await db.command({
        collMod: collectionName,
        validator,
        validationLevel: "strict",
      });

      // Ensure all existing documents have isDeleted field
      await db
        .collection(collectionName)
        .updateMany(
          { isDeleted: { $exists: false } },
          { $set: { isDeleted: false } }
        );
    }
  },

  async down(db: Db): Promise<void> {
    const collectionName = "answers";
    const collections = await db
      .listCollections({ name: collectionName })
      .toArray();

    if (collections.length > 0) {
      // Remove validation but keep collection & data
      await db.command({
        collMod: collectionName,
        validator: {},
        validationLevel: "off",
      });
    }
  },
};
