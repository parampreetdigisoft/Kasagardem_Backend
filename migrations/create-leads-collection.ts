import { Db } from "mongodb";

export default {
  async up(db: Db): Promise<void> {
    const collectionName = "leads";
    const collections = await db
      .listCollections({ name: collectionName })
      .toArray();

    const validator = {
      $jsonSchema: {
        bsonType: "object",
        required: ["partnerProfileIds", "userId", "leadsStatus"],
        additionalProperties: false,
        properties: {
          _id: {
            bsonType: "objectId",
            description: "auto-generated unique identifier",
          },
          partnerProfileIds: {
            bsonType: "array",
            items: { bsonType: "objectId" },
            description: "Array of references to partner profiles",
          },
          userId: {
            bsonType: "objectId",
            description: "Reference to user",
          },
          leadsStatus: {
            bsonType: "string",
            enum: ["new", "converted", "closed"],
            description: "Status of the lead",
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
          throw err;
        }
      }

      // Ensure all existing documents have isDeleted field
      await db
        .collection(collectionName)
        .updateMany(
          { isDeleted: { $exists: false } },
          { $set: { isDeleted: false } }
        );

      // Set default leadsStatus for existing documents without it
      await db
        .collection(collectionName)
        .updateMany(
          { leadsStatus: { $exists: false } },
          { $set: { leadsStatus: "new" } }
        );
    }
  },

  async down(db: Db): Promise<void> {
    const collectionName = "leads";
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
          throw err;
        }
      }
    }
  },
};
