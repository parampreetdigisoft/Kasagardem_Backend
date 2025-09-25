import { Db } from "mongodb";

export default {
  async up(db: Db): Promise<void> {
    const collectionName = "reports";
    const collections = await db
      .listCollections({ name: collectionName })
      .toArray();

    const validator = {
      $jsonSchema: {
        bsonType: "object",
        required: ["answers", "result", "createdAt"],
        properties: {
          userId: { bsonType: "objectId" },
          answers: {
            bsonType: "object",
            description: "User’s submitted answers",
          },
          result: {
            bsonType: "object",
            required: ["problemAnalysis"],
            properties: {
              problemAnalysis: { bsonType: "string" },
              productRecommendations: {
                bsonType: "array",
                items: {
                  bsonType: "object",
                  required: ["name", "affiliateLink"],
                  properties: {
                    name: { bsonType: "string" },
                    affiliateLink: { bsonType: "string" },
                  },
                },
              },
              professionalRecommendations: {
                bsonType: "array",
                items: { bsonType: "string" },
              },
            },
          },
          createdAt: { bsonType: "date" },
        },
      },
    };

    if (collections.length === 0) {
      await db.createCollection(collectionName, {
        validator,
        validationLevel: "strict",
      });
    } else {
      await db.command({
        collMod: collectionName,
        validator,
        validationLevel: "strict",
      });
    }

    await db.collection(collectionName).createIndex({ userId: 1 });
  },

  async down(db: Db): Promise<void> {
    const collectionName = "reports";
    const collections = await db
      .listCollections({ name: collectionName })
      .toArray();
    if (collections.length > 0) {
      await db.collection(collectionName).drop();
    }
  },
};
