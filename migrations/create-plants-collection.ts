import { Db } from "mongodb";

export default {
  /**
   * Migration step: creates the `plants` collection with validation rules
   * if it does not already exist.
   *
   * @param db - The MongoDB database instance
   * @returns A promise that resolves when the migration is applied
   */
  async up(db: Db): Promise<void> {
    const collections = await db.listCollections({ name: "plants" }).toArray();

    const plantValidator = {
      $jsonSchema: {
        bsonType: "object",
        required: ["userId", "name"], // Fixed: scientificName is not actually required in model
        additionalProperties: false,
        properties: {
          userId: {
            bsonType: "objectId",
            description: "must be an ObjectId referencing users collection",
          },
          name: { bsonType: "string", minLength: 1, maxLength: 100 },
          scientificName: { bsonType: ["string", "null"], maxLength: 150 },
          commonNames: {
            bsonType: ["array", "null"],
            items: { bsonType: "string" },
          },
          category: {
            bsonType: ["string", "null"],
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
          },
          images: {
            bsonType: ["array", "null"],
            items: { bsonType: "string" },
          },
          description: { bsonType: ["string", "null"], maxLength: 1000 },

          /** --- API identification fields --- **/
          probability: {
            bsonType: ["number", "null"],
            minimum: 0,
            maximum: 1,
          },
          similarImages: {
            bsonType: ["array", "null"],
            items: {
              bsonType: "object",
              additionalProperties: false,
              properties: {
                id: { bsonType: ["string", "null"] },
                url: { bsonType: ["string", "null"] },
                url_small: { bsonType: ["string", "null"] },
                similarity: {
                  bsonType: ["number", "null"],
                  minimum: 0,
                  maximum: 1,
                },
                license_name: { bsonType: ["string", "null"] },
                license_url: { bsonType: ["string", "null"] },
                citation: { bsonType: ["string", "null"] },
              },
            },
          },
          entityId: { bsonType: ["string", "null"] },
          language: { bsonType: ["string", "null"] },
          isPlant: {
            bsonType: ["object", "null"],
            additionalProperties: false,
            properties: {
              probability: {
                bsonType: ["number", "null"],
                minimum: 0,
                maximum: 1,
              },
              binary: { bsonType: ["bool", "null"] },
              threshold: {
                bsonType: ["number", "null"],
                minimum: 0,
                maximum: 1,
              },
            },
          },
          identificationMeta: {
            bsonType: ["object", "null"],
            additionalProperties: false,
            properties: {
              accessToken: { bsonType: ["string", "null"] },
              modelVersion: { bsonType: ["string", "null"] },
              customId: { bsonType: ["string", "null"] },
              created: { bsonType: ["date", "null"] },
              completed: { bsonType: ["date", "null"] },
              status: { bsonType: ["string", "null"] },
            },
          },

          /** --- ✅ MISSING: Plant suggestions field --- **/
          suggestions: {
            bsonType: ["array", "null"],
            items: {
              bsonType: "object",
              additionalProperties: false,
              properties: {
                scientificName: { bsonType: "string" },
                probability: {
                  bsonType: "number",
                  minimum: 0,
                  maximum: 1,
                },
                similarImages: {
                  bsonType: ["array", "null"],
                  items: {
                    bsonType: "object",
                    additionalProperties: false,
                    properties: {
                      id: { bsonType: ["string", "null"] },
                      url: { bsonType: ["string", "null"] },
                      url_small: { bsonType: ["string", "null"] },
                      similarity: {
                        bsonType: ["number", "null"],
                        minimum: 0,
                        maximum: 1,
                      },
                      license_name: { bsonType: ["string", "null"] },
                      license_url: { bsonType: ["string", "null"] },
                      citation: { bsonType: ["string", "null"] },
                    },
                  },
                },
              },
            },
          },

          /** --- Care fields --- **/
          careInstructions: {
            bsonType: ["object", "null"],
            additionalProperties: false,
            properties: {
              watering: {
                bsonType: ["object", "null"],
                additionalProperties: false,
                properties: {
                  frequency: { bsonType: ["string", "null"] },
                  amount: { bsonType: ["string", "null"] },
                  notes: { bsonType: ["string", "null"] },
                },
              },
              sunlight: {
                bsonType: ["string", "null"],
                enum: ["full-sun", "partial-sun", "shade", "indirect-light"],
              },
              temperature: {
                bsonType: ["object", "null"],
                additionalProperties: false,
                properties: {
                  min: { bsonType: ["number", "null"] },
                  max: { bsonType: ["number", "null"] },
                  unit: {
                    bsonType: ["string", "null"],
                    enum: ["celsius", "fahrenheit"],
                  },
                },
              },
              humidity: {
                bsonType: ["object", "null"],
                additionalProperties: false,
                properties: {
                  level: {
                    bsonType: ["string", "null"],
                    enum: ["low", "medium", "high"],
                  },
                  percentage: {
                    bsonType: ["number", "null"],
                    minimum: 0,
                    maximum: 100,
                  },
                },
              },
              fertilizing: {
                bsonType: ["object", "null"],
                additionalProperties: false,
                properties: {
                  frequency: { bsonType: ["string", "null"] },
                  type: { bsonType: ["string", "null"] },
                  notes: { bsonType: ["string", "null"] },
                },
              },
            },
          },

          status: {
            bsonType: ["string", "null"],
            enum: ["healthy", "needs-attention", "sick", "dead"],
          },
          location: {
            bsonType: ["object", "null"],
            additionalProperties: false,
            properties: {
              name: { bsonType: ["string", "null"] },
              coordinates: {
                bsonType: ["object", "null"],
                additionalProperties: false,
                properties: {
                  latitude: { bsonType: ["number", "null"] },
                  longitude: { bsonType: ["number", "null"] },
                },
              },
            },
          },
          plantedDate: { bsonType: ["date", "null"] },
          lastWatered: { bsonType: ["date", "null"] },
          nextWateringDue: { bsonType: ["date", "null"] },
          tags: { bsonType: ["array", "null"], items: { bsonType: "string" } },
          isPublic: { bsonType: ["bool", "null"] },
          notes: { bsonType: ["string", "null"], maxLength: 500 },

          /** --- MISSING: Timestamp fields --- **/
          createdAt: { bsonType: ["date", "null"] },
          updatedAt: { bsonType: ["date", "null"] },
        },
      },
    };

    if (collections.length > 0) {
      await db.command({
        collMod: "plants",
        validator: plantValidator,
        validationLevel: "strict",
      });
    } else {
      await db.createCollection("plants", {
        validator: plantValidator,
        validationLevel: "strict",
      });
    }

    // Indexes
    await db.collection("plants").createIndex({ userId: 1 });
    await db.collection("plants").createIndex({
      name: "text",
      scientificName: "text",
      description: "text",
    });
    await db.collection("plants").createIndex({ category: 1 });
    await db.collection("plants").createIndex({ status: 1 });
    await db.collection("plants").createIndex({ nextWateringDue: 1 });
    await db
      .collection("plants")
      .createIndex({ "location.coordinates": "2dsphere" });

    // FIXED: Remove unique constraint on scientificName since model uses sparse
    await db
      .collection("plants")
      .createIndex({ scientificName: 1 }, { sparse: true });

    // MISSING: Additional indexes from Mongoose model
    await db.collection("plants").createIndex({ entityId: 1 });
    await db.collection("plants").createIndex({ probability: -1 });

    // Compound indexes
    await db.collection("plants").createIndex({ userId: 1, scientificName: 1 });
    await db.collection("plants").createIndex({ userId: 1, status: 1 });
  },

  /**
   * Rollback migration: drops the `plants` collection.
   *
   * @param db - The MongoDB database instance
   */
  async down(db: Db): Promise<void> {
    await db.collection("plants").drop();
  },
};
