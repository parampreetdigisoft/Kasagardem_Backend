import bcrypt from "bcryptjs";
import { ZodError } from "zod";
import { createUserDto } from "../../dto/userDto";
import { IRole, IUser, IUserOAuth } from "../../interface/user";
import { getDB } from "../../core/config/db";
import { downloadImageAsBuffer } from "../../core/utils/usableMethods";
import {
  deleteFileFromS3,
  uploadBufferToS3,
} from "../../core/services/s3UploadService";

/**
 * Hash password helper
 * @param password - The password to hash
 * @returns A promise that resolves to the hashed password or undefined if no password is provided
 */
async function hashPassword(password?: string): Promise<string | undefined> {
  if (!password) return undefined;
  return bcrypt.hash(password, 12);
}

/**
 * Update a user's password and clear password reset fields
 * @param userId - ID of the user
 * @param hashedPassword - New hashed password
 */
export async function updateUserPassword(
  userId: string,
  hashedPassword: string
): Promise<void> {
  const client = await getDB();

  const query = `
    UPDATE users
    SET password = $1,
        password_reset_token = NULL,
        password_reset_expires = NULL,
        updated_at = NOW()
    WHERE id = $2;
  `;

  await client.query(query, [hashedPassword, userId]);
}

/**
 * Reset a user's password reset token and expiry
 * @param userId - ID of the user
 */
export async function resetPasswordResetFields(userId: string): Promise<void> {
  const client = await getDB();

  const query = `
    UPDATE users
    SET password_reset_token = NULL,
        password_reset_expires = NULL,
        updated_at = NOW()
    WHERE id = $1;
  `;

  await client.query(query, [userId]);
}

/**
 * Update a user's password reset token and expiry
 * @param userId - ID of the user
 * @param hashedToken - Hashed password reset token
 * @param resetTokenExpiry - Expiry date/time for the token
 */
export async function updatePasswordResetToken(
  userId: string,
  hashedToken: string,
  resetTokenExpiry: Date
): Promise<void> {
  const client = await getDB();

  const query = `
    UPDATE users
    SET password_reset_token = $1,
        password_reset_expires = $2,
        updated_at = NOW()
    WHERE id = $3;
  `;

  await client.query(query, [hashedToken, resetTokenExpiry, userId]);
}

/**
 * Get a role by its ID
 * @param roleId - ID of the role
 * @returns Role object or null if not found
 */
export async function getRoleById(roleId: string): Promise<IRole | null> {
  const client = await getDB();

  const query = `
    SELECT id, name
    FROM roles
    WHERE id = $1
    LIMIT 1;
  `;

  const result = await client.query(query, [roleId]);
  return result.rows[0] || null;
}

/**
 * Create a new user profile for a given user ID
 * @param userId - ID of the user
 * @returns void
 */
export async function createUserProfile(userId: string): Promise<void> {
  const client = await getDB();

  const query = `
    INSERT INTO userprofiles (user_id, created_at, updated_at)
    VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
  `;

  await client.query(query, [userId]);
}

/**
 * Get a role by its name
 * @param roleName - Name of the role
 * @returns Role object or null if not found
 */
export async function getRoleByName(roleName: string): Promise<IRole | null> {
  const client = await getDB();

  const query = `
    SELECT id, name
    FROM roles
    WHERE name = $1
    LIMIT 1;
  `;

  const result = await client.query(query, [roleName]);
  return result.rows[0] || null;
}

/**
 * Compare password helper
 * @param candidatePassword - The plain text password to compare
 * @param hashedPassword - The hashed password to compare against
 * @returns A promise that resolves to true if the passwords match, false otherwise
 */
export async function comparePassword(
  candidatePassword: string,
  hashedPassword?: string
): Promise<boolean> {
  if (!hashedPassword) return false;
  return bcrypt.compare(candidatePassword, hashedPassword);
}

/**
 * Creates a validated user in PostgreSQL
 * Uses Zod DTO for validation and strips extra fields.
 * @param data - The user data to validate and insert
 * @returns A promise that resolves to the created user object
 */
export async function createValidatedUser(data: unknown): Promise<IUser> {
  try {
    // Validate input using Zod schema
    const parsedData = createUserDto.parse(data);

    const client = getDB();

    // Hash password if provided
    const hashedPassword = await hashPassword(parsedData.password);

    const query = `
      INSERT INTO users (
        name,
        email,
        password,
        firebase_uid,
        role_id,
        phone_number,
        is_email_verified
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, email, firebase_uid, role_id, phone_number,
                is_email_verified, created_at, updated_at;
    `;

    const values = [
      parsedData.name,
      parsedData.email,
      hashedPassword ?? null,
      parsedData.firebaseUid ?? null,
      parsedData.roleId,
      parsedData.phoneNumber ?? null,
      parsedData.isEmailVerified ?? false,
    ];

    const result = await client.query(query, values);
    const user = result.rows[0];

    return user as IUser;
  } catch (err) {
    if (err instanceof ZodError) {
      throw err; // handled by controller
    }
    throw err; // database or runtime error
  }
}

/**
 * Finds user by email (for login)
 * @param email - The email address of the user to find
 * @returns A promise that resolves to the user object if found, or null if not found
 */
export async function findUserByEmail(email: string): Promise<IUser | null> {
  const client = await getDB();

  const query = `
    SELECT *
    FROM users
    WHERE email = $1
    LIMIT 1;
  `;

  const result = await client.query(query, [email]);
  return result.rows[0] || null;
}

/**
 * Find a user using email or phone number.
 * Returns the user and identifies which field matched (email or phone).
 *
 * @param {string} email - Email to check for existing user.
 * @param {string} phoneNumber - Phone number to check for existing user.
 * @returns {Promise<{ user: IUser | null; conflictField?: "email" | "phone" }>}
 * An object containing the found user (if any) and the matched conflict field.
 */
export async function findUserByEmailOrPhone(
  email: string,
  phoneNumber: string
): Promise<{ user: IUser | null; conflictField?: "email" | "phone" }> {
  const client = await getDB();

  const query = `
    SELECT *
    FROM users
    WHERE email = $1 OR phone_number = $2
    LIMIT 1;
  `;

  const result = await client.query(query, [email, phoneNumber]);
  const user = result.rows[0];

  if (!user) return { user: null };

  // Determine what field caused conflict
  if (user.email === email) {
    return { user, conflictField: "email" };
  }

  if (user.phone_number === phoneNumber) {
    return { user, conflictField: "phone" };
  }

  return { user: null };
}

/**
 * Finds a user by either email or Firebase UID.
 * @param email - The user's email address
 * @param firebaseUid - The Firebase UID from Google sign-in
 * @returns A promise that resolves to the user object if found, or null if not found
 */
export async function findUserByEmailOrFirebaseUid(
  email: string,
  firebaseUid: string
): Promise<IUser | null> {
  const client = await getDB();

  const query = `
    SELECT 
      id,
      name,
      email,
      password,
      firebase_uid,
      role_id,
      phone_number,
      is_email_verified,
      profile_picture,
      created_at,
      updated_at
    FROM users
    WHERE email = $1 OR firebase_uid = $2
    LIMIT 1;
  `;

  const result = await client.query(query, [email, firebaseUid]);
  return result.rows[0] || null;
}

/**
 * Finds a user by their unique ID.
 * @param userId - The unique identifier of the user to find.
 * @returns A promise that resolves to the user object if found, or null if not found.
 */
export async function findUserById(userId: string): Promise<IUser | null> {
  const client = await getDB();

  const query = `
    SELECT *
    FROM users
    WHERE id = $1
    LIMIT 1;
  `;

  const result = await client.query(query, [userId]);
  return result.rows[0] || null;
}

/**
 * Validates password for login
 * @param email - The email address of the user
 * @param password - The plain text password to validate
 * @returns A promise that resolves to the user object (without password) if credentials are valid, or null if invalid or user not found
 */
export async function validateUserCredentials(
  email: string,
  password: string
): Promise<IUser | null> {
  const client = await getDB();

  const query = `
    SELECT *
    FROM users
    WHERE email = $1;
  `;

  const result = await client.query(query, [email]);
  const user = result.rows[0];
  if (!user || !user.password) return null;

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) return null;

  delete user.password;
  return user;
}

/**
 * Finds a role by its name.
 *
 * @param roleName - The name of the role to look up (e.g., "admin", "user").
 * @returns {Promise<IRole | null>} A promise that resolves to the role object if found, or null if not found.
 */
export async function findRoleByName(roleName: string): Promise<IRole | null> {
  const client = await getDB();

  const query = `
    SELECT 
      id,
      name,
      description,
      created_at,
      updated_at
    FROM roles
    WHERE name = $1
    LIMIT 1;
  `;

  const result = await client.query(query, [roleName]);
  return result.rows[0] || null;
}

/**
 * Create new user from OAuth (Google, Facebook, Apple)
 * @param name
 * @param email
 * @param googleUid
 * @param roleId
 * @param isVerified
 * @returns Created user row
 */
export async function createUserFromOAuth(
  name: string,
  email: string,
  googleUid: string,
  roleId: string,
  isVerified: boolean
): Promise<IUserOAuth> {
  const db = await getDB();
  const query = `
    INSERT INTO users (name, email, google_uid, role_id, is_email_verified, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    RETURNING id, name, email, role_id, is_email_verified;
  `;

  const result = await db.query(query, [
    name,
    email,
    googleUid,
    roleId,
    isVerified,
  ]);

  return result.rows[0];
}

/**
 * Creates a user profile with an image
 * @param userId
 * @param pictureLink
 */
export async function createUserProfileWithImage(
  userId: string,
  pictureLink: string
): Promise<void> {
  const db = await getDB();
  const query = `
    INSERT INTO userprofiles (user_id, profile_image, created_at, updated_at)
    VALUES ($1, $2, NOW(), NOW());
  `;
  await db.query(query, [userId, pictureLink]);
}

/**
 * Update existing user OAuth info (google_uid, profile picture)
 * @param userId
 * @param googleUid
 * @param picture
 * @param pictureLink
 */
export async function updateUserFromOAuth(
  userId: string,
  googleUid?: string,
  pictureLink?: string
): Promise<void> {
  const db = await getDB();

  // Update users table only google_uid
  if (googleUid) {
    await db.query(
      `
        UPDATE users 
        SET google_uid = $1, updated_at = NOW()
        WHERE id = $2
      `,
      [googleUid, userId]
    );
  }

  //  Update userprofiles table (only profile_image)
  if (pictureLink) {
    // Fetch existing profile image key
    const profile = await db.query(
      `SELECT id, profile_image FROM userprofiles WHERE user_id = $1`,
      [userId]
    );

    const oldImageKey = profile.rows[0]?.profile_image || null;

    // Download Google picture
    const buffer = await downloadImageAsBuffer(pictureLink);

    // Generate a new S3 key
    const fileName = `${Date.now()}_${userId}.jpg`;
    const folder = "Users/ProfileImages";

    // Upload new image to S3
    const newImageKey = await uploadBufferToS3(buffer, fileName, folder);

    // Delete old image from S3 (if exists)
    if (oldImageKey) {
      try {
        await deleteFileFromS3(oldImageKey);
      } catch (err) {
        console.error("Failed to delete old S3 image:", err);
      }
    }

    // Update or Insert user profile record
    if (profile.rows.length === 0) {
      // Create new profile (edge case)
      await db.query(
        `
        INSERT INTO userprofiles (user_id, profile_image, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        `,
        [userId, newImageKey]
      );
    } else {
      // Update existing profile
      await db.query(
        `
        UPDATE userprofiles
        SET profile_image = $1, updated_at = NOW()
        WHERE user_id = $2
        `,
        [newImageKey, userId]
      );
    }
  }
}
