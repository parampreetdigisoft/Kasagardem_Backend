import { Db } from "mongodb";

export default {
  /**
   * Creates the "partnerprofiles" collection with schema validation.
   * @param db - The MongoDB database instance
   * @returns Resolves when the collection is created or updated
   */
  async up(db: Db): Promise<void> {
    const existingcollections = await db
      .listCollections({ name: "partnerprofiles" })
      .toArray();

    const partnerProfileValidator = {
      $jsonSchema: {
        bsonType: "object",
        required: ["email", "mobileNumber"],
        additionalProperties: false,
        properties: {
          _id: {
            bsonType: "objectId",
            description: "auto-generated unique identifier",
          },
          email: {
            bsonType: "string",
            pattern: "^[\\w.-]+@([\\w-]+\\.)+[\\w-]{2,4}$",
            description: "partner's email address",
          },
          mobileNumber: {
            bsonType: "string",
            pattern: "^\\+?[1-9]\\d{7,14}$",
            description: "partner's mobile number (E.164 format preferred)",
          },
          companyName: {
            bsonType: ["string", "null"],
            description: "company or organization name",
          },
          speciality: {
            bsonType: ["array", "null"],
            items: {
              bsonType: "string",
              description: "area of expertise or speciality",
            },
            description: "list of partner's specialities",
          },
          address: {
            bsonType: ["object", "null"],
            additionalProperties: false,
            properties: {
              street: { bsonType: ["string", "null"] },
              city: { bsonType: ["string", "null"] },
              state: { bsonType: ["string", "null"] },
              country: { bsonType: ["string", "null"] },
              zipCode: { bsonType: ["string", "null"] },
            },
          },
          website: {
            bsonType: ["string", "null"],
            description: "official website URL",
          },
          contactPerson: {
            bsonType: ["string", "null"],
            description: "name of primary contact person",
          },
          projectImageUrl: {
            bsonType: ["string", "null"],
            description: "Url of partner's project image",
          },
          rating: {
            bsonType: ["double", "null"],
            minimum: 0,
            maximum: 5,
            description: "partner rating from 0 to 5 (e.g., 3.5, 4.5)",
          },
          status: {
            bsonType: ["string", "null"],
            enum: ["active", "inactive", "pending", "suspended", null],
            description: "partner account status",
          },
          createdAt: {
            bsonType: "date",
            description: "document creation timestamp",
          },
          updatedAt: {
            bsonType: "date",
            description: "document update timestamp",
          },
          __v: {
            bsonType: "int",
            description: "internal mongoose version key",
          },
        },
      },
    };

    if (existingcollections.length > 0) {
      try {
        await db.command({
          collMod: "partnerprofiles",
          validator: partnerProfileValidator,
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

      // Add rating field to existing documents with default value of 0
      await db
        .collection("partnerprofiles")
        .updateMany({ rating: { $exists: false } }, { $set: { rating: 0.0 } });
    } else {
      await db.createCollection("partnerprofiles", {
        validator: partnerProfileValidator,
        validationLevel: "strict",
      });
    }

    // Create indexes (won’t error if they already exist)
    const collection = db.collection("partnerprofiles");

    await collection.createIndexes([
      { key: { email: 1 }, unique: true },
      { key: { mobileNumber: 1 }, unique: true },
    ]);
  },

  /**
   * Reverts schema validation and removes indexes without deleting data.
   * @param db - The MongoDB database instance
   */
  async down(db: Db): Promise<void> {
    const collection = db.collection("partnerprofiles");
    // Remove rating field from all documents
    await collection.updateMany(
      { rating: { $exists: true } },
      { $unset: { rating: "" } }
    );

    // Drop indexes created in `up` (except _id)
    await Promise.all([
      collection.dropIndex("partnerId_1").catch(() => {}),
      collection.dropIndex("email_1").catch(() => {}),
      collection.dropIndex("mobileNumber_1").catch(() => {}),
    ]);
  },
};
