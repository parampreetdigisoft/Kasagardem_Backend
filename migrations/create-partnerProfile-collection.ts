import { Db } from "mongodb";

export default {
  /**
   * Creates the "partnerprofiles" collection with schema validation.
   * @param db - The MongoDB database instance
   * @returns Resolves when the collection is created or updated
   */
  async up(db: Db): Promise<void> {
    const collections = await db
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
            bsonType: "string",
            description: "company or organization name",
          },
          speciality: {
            bsonType: "array",
            items: {
              bsonType: "string",
              description: "area of expertise or speciality",
            },
            description: "list of partner's specialities",
          },
          address: {
            bsonType: "object",
            additionalProperties: false,
            properties: {
              street: { bsonType: "string" },
              city: { bsonType: "string" },
              state: { bsonType: "string" },
              country: { bsonType: "string" },
              zipCode: { bsonType: "string" },
            },
          },
          website: {
            bsonType: "string",
            description: "official website URL",
          },
          contactPerson: {
            bsonType: "string",
            description: "name of primary contact person",
          },
          projectImageUrl: {
            bsonType: "string",
            description: "Url of partner's project image",
          },
          status: {
            bsonType: "string",
            enum: ["active", "inactive", "pending", "suspended"],
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

    if (collections.length > 0) {
      await db.command({
        collMod: "partnerprofiles",
        validator: partnerProfileValidator,
        validationLevel: "strict",
      });
    } else {
      await db.createCollection("partnerprofiles", {
        validator: partnerProfileValidator,
        validationLevel: "strict",
      });
    }

    // Create unique index on partnerId, email, and mobileNumber
    await db.collection("partnerprofiles").createIndexes([
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

    // Remove schema validation
    await db.command({
      collMod: "partnerprofiles",
      validator: { $jsonSchema: { bsonType: "object" } }, // allow any document
      validationLevel: "off",
    });

    // Drop indexes created in `up` (except _id)
    await Promise.all([
      collection.dropIndex("partnerId_1").catch(() => {}),
      collection.dropIndex("email_1").catch(() => {}),
      collection.dropIndex("mobileNumber_1").catch(() => {}),
    ]);
  },
};
