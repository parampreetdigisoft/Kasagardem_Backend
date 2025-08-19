import { Db } from "mongodb";

export default {
  /**
   * Creates the "plants" collection with schema validation.
   * @param {Db} db - The MongoDB database instance
   * @returns {Promise<void>} Resolves when the collection is created or updated
   */
  async up(db: Db) {
    const collections = await db.listCollections({ name: "plants" }).toArray();

    const plantValidator = {
      $jsonSchema: {
        bsonType: "object",
        required: ["userId", "name"],
        properties: {
          userId: {
            bsonType: "objectId",
            description: "must be an ObjectId referencing users collection",
          },
          name: {
            bsonType: "string",
            minLength: 1,
            maxLength: 100,
            description:
              "plant name is required and cannot exceed 100 characters",
          },
          scientificName: {
            bsonType: "string",
            maxLength: 150,
            description: "scientific name of the plant",
          },
          commonNames: {
            bsonType: "array",
            items: { bsonType: "string" },
            description: "array of common names",
          },
          category: {
            bsonType: "string",
            enum: [
              "indoor",
              "outdoor",
              "herb",
              "flower",
              "tree",
              "succulent",
              "vegetable",
              "fruit",
            ],
            description: "plant category",
          },
          images: {
            bsonType: "array",
            items: { bsonType: "string" },
            description: "array of image URLs",
          },
          description: {
            bsonType: "string",
            maxLength: 1000,
            description: "plant description",
          },
          careInstructions: {
            bsonType: "object",
            properties: {
              watering: {
                bsonType: "object",
                properties: {
                  frequency: { bsonType: "string" },
                  amount: { bsonType: "string" },
                  notes: { bsonType: "string" },
                },
              },
              sunlight: {
                bsonType: "string",
                enum: ["full-sun", "partial-sun", "shade", "indirect-light"],
                description: "sunlight requirements",
              },
              temperature: {
                bsonType: "object",
                properties: {
                  min: { bsonType: "number" },
                  max: { bsonType: "number" },
                  unit: { bsonType: "string", enum: ["celsius", "fahrenheit"] },
                },
              },
              humidity: {
                bsonType: "object",
                properties: {
                  level: {
                    bsonType: "string",
                    enum: ["low", "medium", "high"],
                  },
                  percentage: { bsonType: "number", minimum: 0, maximum: 100 },
                },
              },
              fertilizing: {
                bsonType: "object",
                properties: {
                  frequency: { bsonType: "string" },
                  type: { bsonType: "string" },
                  notes: { bsonType: "string" },
                },
              },
            },
          },
          status: {
            bsonType: "string",
            enum: ["healthy", "needs-attention", "sick", "dead"],
            description: "current plant status",
          },
          location: {
            bsonType: "object",
            properties: {
              name: { bsonType: "string" },
              coordinates: {
                bsonType: "object",
                properties: {
                  latitude: { bsonType: "number" },
                  longitude: { bsonType: "number" },
                },
              },
            },
          },
          plantedDate: {
            bsonType: "date",
            description: "date when plant was added/planted",
          },
          lastWatered: {
            bsonType: "date",
            description: "last watering date",
          },
          nextWateringDue: {
            bsonType: "date",
            description: "next watering due date",
          },
          tags: {
            bsonType: "array",
            items: { bsonType: "string" },
            description: "tags for categorization",
          },
          isPublic: {
            bsonType: "bool",
            description: "whether plant is visible to other users",
          },
          notes: {
            bsonType: "string",
            maxLength: 500,
            description: "personal notes about the plant",
          },
        },
      },
    };

    if (collections.length > 0) {
      await db.command({
        collMod: "plants",
        validator: plantValidator,
        validationLevel: "moderate",
      });
    } else {
      await db.createCollection("plants", {
        validator: plantValidator,
      });
    }

    // Create indexes
    await db.collection("plants").createIndex({ userId: 1 });
    await db
      .collection("plants")
      .createIndex({ name: "text", scientificName: "text" });
    await db.collection("plants").createIndex({ category: 1 });
    await db.collection("plants").createIndex({ status: 1 });
    await db.collection("plants").createIndex({ nextWateringDue: 1 });
    await db
      .collection("plants")
      .createIndex({ "location.coordinates": "2dsphere" });
  },

  async down(db: Db) {
    await db.collection("plants").drop();
  },
};
