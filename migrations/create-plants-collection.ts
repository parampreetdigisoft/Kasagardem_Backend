import { Db } from "mongodb";

export default {
  async up(db: Db): Promise<void> {
    const collectionName = "plants";
    const collections = await db
      .listCollections({ name: collectionName })
      .toArray();

    const validator = {
      $jsonSchema: {
        bsonType: "object",
        required: ["scientific_name", "common_name"],
        additionalProperties: false,
        properties: {
          _id: {
            bsonType: "objectId",
            description: "auto-generated unique identifier",
          },
          scientific_name: {
            bsonType: "string",
            description: "Scientific/botanical name of the plant",
          },
          common_name: {
            bsonType: "string",
            description: "Common name of the plant",
          },
          image_search_url: {
            bsonType: ["string", "null"],
            description: "URL for plant image or search query",
          },
          space_types: {
            bsonType: ["array", "null"],
            description:
              "Types of spaces where plant can grow (indoor, outdoor, balcony, etc.)",
            items: {
              bsonType: "string",
            },
          },
          area_sizes: {
            bsonType: ["array", "null"],
            description: "Suitable area sizes (small, medium, large, etc.)",
            items: {
              bsonType: "string",
            },
          },
          challenges: {
            bsonType: ["array", "null"],
            description: "Growing challenges or difficulties",
            items: {
              bsonType: "string",
            },
          },
          tech_preferences: {
            bsonType: ["array", "null"],
            description:
              "Technology preferences for growing (hydroponics, smart sensors, etc.)",
            items: {
              bsonType: "string",
            },
          },
          locations: {
            bsonType: ["array", "null"],
            description:
              "Geographic locations or climate zones where plant thrives",
            items: {
              bsonType: "object",
              required: ["type", "value"],
              properties: {
                type: {
                  bsonType: "string",
                  description:
                    "Location type: climate_zone, country, region, etc.",
                },
                value: {
                  bsonType: "string",
                  description: "Location value",
                },
              },
              additionalProperties: false,
            },
          },
          description: {
            bsonType: ["string", "null"],
            description: "Detailed description of the plant",
          },
          care_notes: {
            bsonType: ["array", "null"],
            description: "Care instructions and notes",
            items: {
              bsonType: "string",
            },
          },
          native: {
            bsonType: ["bool", "null"],
            description: "Whether the plant is native (yes/no)",
          },
          light: {
            bsonType: ["string", "null"],
            description: "Light requirements as single string",
          },
          water_needs: {
            bsonType: ["string", "null"],
            description: "Water requirements as single string",
          },
          maintenance_level: {
            bsonType: ["string", "null"],
            description:
              "Overall maintenance difficulty level as single string",
          },
          growth_form: {
            bsonType: ["string", "null"],
            description: "Plant growth form as single string",
          },
          isDeleted: {
            bsonType: "bool",
            description: "Soft delete flag",
          },
          createdAt: {
            bsonType: "date",
            description: "Record creation timestamp",
          },
          updatedAt: {
            bsonType: "date",
            description: "Record last update timestamp",
          },
          __v: {
            bsonType: "int",
            description: "Internal mongoose version key",
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
    // Create useful indexes
    await db.collection(collectionName).createIndexes([
      { key: { scientific_name: 1 }, unique: true },
      {
        key: {
          common_name: "text",
          scientific_name: "text",
          description: "text",
        },
      },
      { key: { maintenance_level: 1 } },
      { key: { light: 1 } },
      { key: { water_needs: 1 } },
      { key: { growth_form: 1 } },
      { key: { isDeleted: 1 } },
      { key: { createdAt: -1 } },
    ]);
  },

  async down(db: Db): Promise<void> {
    const collectionName = "plants";
    const collections = await db
      .listCollections({ name: collectionName })
      .toArray();

    if (collections.length > 0) {
      // Drop indexes first
      await db.collection(collectionName).dropIndexes();

      // Remove validation but keep collection & data
      try {
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
