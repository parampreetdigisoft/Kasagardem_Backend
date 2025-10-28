import { ZodError } from "zod";
import { createUserProfileDto } from "../../dto/userProfileDto";
import { getDB } from "../../core/config/db";
import { IUserProfile } from "../../interface/userProfile";

/**
 * Creates a new validated user profile in PostgreSQL.
 * @param data - Unvalidated user profile input
 * @returns The created user profile record
 */
export async function createValidatedUserProfile(
  data: unknown
): Promise<IUserProfile> {
  const client = await getDB();
  try {
    const parsedData = createUserProfileDto.parse(data);

    const query = `
      INSERT INTO userprofiles (
        user_id, profile_image, date_of_birth, gender, bio,
        street, city, state, country, zip_code, occupation, company
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, $11, $12
      )
      RETURNING *;
    `;

    const values = [
      parsedData.userId,
      parsedData.profileImage,
      parsedData.dateOfBirth,
      parsedData.gender,
      parsedData.bio,
      parsedData.street,
      parsedData.city,
      parsedData.state,
      parsedData.country,
      parsedData.zipCode,
      parsedData.occupation,
      parsedData.company,
    ];

    const result = await client.query<IUserProfile>(query, values);
    return result.rows[0]!;
  } catch (err) {
    if (err instanceof ZodError) throw err;
    throw err;
  }
}

/**
 * Updates an existing user profile with validation.
 * @param profileId - UUID of the profile to update
 * @param data - Unvalidated input data
 * @returns Updated profile record or null if not found
 */
export async function updateValidatedUserProfile(
  profileId: string,
  data: unknown
): Promise<IUserProfile | null> {
  const client = await getDB();

  try {
    // Validate the input data using Zod schema
    const parsedData = createUserProfileDto.parse(data);

    // Update query — only set updated_at, do not touch created_at
    const query = `
      UPDATE userprofiles
      SET
        profile_image = $1,
        date_of_birth = $2,
        gender = $3,
        bio = $4,
        street = $5,
        city = $6,
        state = $7,
        country = $8,
        zip_code = $9,
        occupation = $10,
        company = $11,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING 
        id,
        user_id,
        profile_image,
        date_of_birth,
        gender,
        bio,
        street,
        city,
        state,
        country,
        zip_code,
        occupation,
        company,
        updated_at;
    `;

    const values = [
      parsedData.profileImage,
      parsedData.dateOfBirth,
      parsedData.gender,
      parsedData.bio,
      parsedData.street,
      parsedData.city,
      parsedData.state,
      parsedData.country,
      parsedData.zipCode,
      parsedData.occupation,
      parsedData.company,
      profileId,
    ];

    const result = await client.query<IUserProfile>(query, values);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];

    // ✅ Normalize timestamp fields to string
    const normalizedRow = {
      ...row,
      updated_at:
        row?.updatedAt instanceof Date
          ? row.updatedAt.toISOString()
          : row?.updatedAt,
    };

    return normalizedRow as unknown as IUserProfile;
  } catch (err) {
    if (err instanceof ZodError) throw err;
    throw err;
  }
}
