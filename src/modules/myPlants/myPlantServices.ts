import { getDB } from "../../core/config/db";
import { AddUserPlantInput, PaginatedPlants } from "../../interface/myPlants";



/**
 * Retrieves paginated plant species from the database.
 *
 * @param {number} page - Current page number.
 * @param {number} limit - Number of records per page.
 * @returns {Promise<PaginatedPlants>} Paginated plant result including
 * current page, total pages, total count, and plant list.
 */
export const getAllPlantsService = async (
  page: number,
  limit: number
): Promise<PaginatedPlants> => {
    const pool = await getDB(); 
  
  const offset = (page - 1) * limit;

  // Total count
  const totalResult = await pool.query(
    `SELECT COUNT(*) FROM plant_species`
  );

  const totalCount = Number(totalResult.rows[0].count);
  const totalPages = Math.ceil(totalCount / limit);

  // Paginated data
  const plantsResult = await pool.query(
    `SELECT *
     FROM plant_species
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return {
    currentPage: page,
    totalPages,
    totalCount,
    limit,
    plants: plantsResult.rows,
  };
};


/**
 * Retrieves detailed information about a plant by its ID.
 *
 * @param {string} plantId - UUID of the plant.
 * @throws {Error} If plant is not found or database query fails.
 * @returns {Promise<void>} Plant details object.
 * @throws {Error} If plant is not found or database query fails.
 */
export const getPlantDetailsByIdService = async (plantId: string):Promise<void> => {
  try {
    const pool = await getDB();

    const result = await pool.query(
      `SELECT *
       FROM plant_species
       WHERE id = $1`,
      [plantId]
    );

    if (result.rows.length === 0) {
      throw new Error("Plant not found");
    }

    return result.rows[0];

  } catch (err) {
    if (err instanceof Error) {
      throw err; // rethrow original error
    }

    throw new Error("Failed to fetch plant details");
  }
};

/**
 * Adds a plant to a user's plant collection.
 *
 * @param {string} userId - UUID of the user.
 * @param {string} payload - UUID of the plant to add.
 * @returns {Promise<void>} Inserted user_plant record.
 * @throws {Error} If plant does not exist, already added,
 * or database operation fails.
 */
// service.ts
export const addPlantToUserService = async (
    userId: string,
    payload: AddUserPlantInput
):Promise<Record<string, unknown>> => {
    const pool = await getDB();

    const { plant_species_id, nickname, health_status = "healthy" } = payload;

    // ── 1. Fetch plant species (for defaults fallback) ────────────────────────
    const plantCheck = await pool.query(
        `SELECT 
            id,
            water_reminder_frequency,
            water_notification_enabled,
            fertilizer_schedule,
            fertilizer_notification_enabled,
            pruning_alert,
            pruning_notification_enabled
        FROM plant_species 
        WHERE id = $1`,
        [plant_species_id]
    );

    if (!plantCheck.rows.length) {
        throw new Error("Plant species not found");
    }

    const species = plantCheck.rows[0];

    // ── 2. Resolve values: user input OR fall back to species defaults ─────────
    const water_frequency      = payload.custom_water_frequency     ?? species.water_reminder_frequency;
    const fertilizer_schedule  = payload.custom_fertilizer_schedule ?? species.fertilizer_schedule ?? null;
    const pruning_schedule     = payload.custom_pruning_schedule     ?? species.pruning_alert       ?? null;

    const water_notification      = payload.water_notification_enabled      ?? species.water_notification_enabled      ?? false;
    const fertilizer_notification = payload.fertilizer_notification_enabled ?? species.fertilizer_notification_enabled ?? false;
    const pruning_notification    = payload.pruning_notification_enabled    ?? species.pruning_notification_enabled    ?? false;

    const water_time      = payload.water_preferred_time      ?? "09:00:00";
    const fertilizer_time = payload.fertilizer_preferred_time ?? "09:00:00";
    const pruning_time    = payload.pruning_preferred_time    ?? "09:00:00";

    // ── 3. Calculate next dates in JS (avoids Postgres param type conflict) ───
    const now = new Date();

    const next_watered_at = new Date(now);
    next_watered_at.setDate(now.getDate() + water_frequency);

    const next_fertilized_at = fertilizer_schedule
        ? new Date(new Date().setDate(now.getDate() + fertilizer_schedule))
        : null;

    const next_pruned_at = pruning_schedule
        ? new Date(new Date().setDate(now.getDate() + pruning_schedule))
        : null;

    // ── 4. Insert ─────────────────────────────────────────────────────────────
    try {
        const result = await pool.query(
            `
            INSERT INTO user_plants (
                user_id,
                plant_species_id,
                nickname,
                health_status,

                custom_water_frequency,
                water_notification_enabled,
                water_preferred_time,
                next_watered_at,

                custom_fertilizer_schedule,
                fertilizer_notification_enabled,
                fertilizer_preferred_time,
                next_fertilized_at,

                custom_pruning_schedule,
                pruning_notification_enabled,
                pruning_preferred_time,
                next_pruned_at
            )
            VALUES (
                $1,  $2,  $3,  $4,
                $5,  $6,  $7,  $8,
                $9,  $10, $11, $12,
                $13, $14, $15, $16
            )
            RETURNING *
            `,
            [
                userId,           // $1
                plant_species_id, // $2
                nickname ?? null, // $3
                health_status,    // $4

                water_frequency,       // $5
                water_notification,    // $6
                water_time,            // $7
                next_watered_at,       // $8

                fertilizer_schedule,      // $9
                fertilizer_notification,  // $10
                fertilizer_time,          // $11
                next_fertilized_at,       // $12

                pruning_schedule,      // $13
                pruning_notification,  // $14
                pruning_time,          // $15
                next_pruned_at,        // $16
            ]
        );

        return result.rows[0];

    } catch (err) {
        if (err instanceof Error ) throw err;
        throw new Error("Plant already added to user");
        
       
    }
};


/**
 * Retrieves all plants associated with a specific user.
 *
 * @param {string} userId - UUID of the user.
 * @returns {Promise<Record<string, unknown>[]>} List of plants added by the user.
 * @throws {Error} If database query fails.
 */
// ── Service ───────────────────────────────────────────────────────────────────
export const getUserPlantsService = async (
    userId: string
): Promise<Record<string, unknown>[]> => {

    const pool = await getDB();

    try {
        const result = await pool.query(
            `
            SELECT
                up.id                       AS user_plant_id,

                -- Name: nickname if set, fallback to species common name
                COALESCE(up.nickname, ps.common_name) AS name,
                ps.image_url                AS plant_image,

                -- ── Health ──────────────────────────────────────────────────
                up.health_status,

                -- ── Water Notification & Next Schedule ──────────────────────
                up.water_notification_enabled,
                up.next_watered_at,

                -- ── Fertilizer Notification & Next Schedule ─────────────────
                up.fertilizer_notification_enabled,
                up.next_fertilized_at,

                -- ── Pruning Notification & Next Schedule ────────────────────
                up.pruning_notification_enabled,
                up.next_pruned_at

            FROM user_plants up
            JOIN plant_species ps
                ON up.plant_species_id = ps.id
            WHERE up.user_id = $1
            ORDER BY up.created_at DESC
            `,
            [userId]
        );

        return result.rows;

    } catch (err) {
        if (err instanceof Error) throw err;
        throw new Error("Failed to fetch user plants");
    }
};



/**
 * Retrieves detailed information for a specific user-owned plant.
 *
 * @async
 * @function getUserPlantByIdService
 *
 * @param {string} userId - The unique identifier of the authenticated user.
 * @param {string} userPlantId - The unique identifier of the user’s plant record.
 *
 * @returns {Promise<Record<string, unknown> | null>}
 * Returns a promise that resolves to:
 * - An object containing merged user plant data and species data if found.
 * - `null` if the plant does not exist or does not belong to the user.
 *
 * @throws {Error} Throws an error if a database query failure occurs.
 *
 * @description
 * This service:
 * - Fetches plant data from the `user_plants` table.
 * - Joins with the `plant_species` table to include species metadata.
 * - Merges custom user schedules (water, fertilizer, pruning) with species defaults using COALESCE.
 * - Calculates overdue flags for watering, fertilizing, and pruning.
 * - Returns enriched plant details including:
 *   - User-specific settings and notifications
 *   - Species details (common name, scientific name, description, image)
 *   - Default schedule values for frontend comparison
 */
export const getUserPlantByIdService = async (
    userId: string,
    userPlantId: string
): Promise<Record<string, unknown> | null> => {

    const pool = await getDB();

    try {
        const result = await pool.query(
            `
            SELECT
                -- ── User Plant Info ──────────────────────────────────────────
                up.id                   AS user_plant_id,
                up.nickname,
                up.health_status,
                up.added_at,
                up.created_at,
                up.updated_at,

                -- ── Water ────────────────────────────────────────────────────
                COALESCE(up.custom_water_frequency, ps.water_reminder_frequency)
                                        AS water_frequency,
                up.custom_water_frequency,
                up.water_notification_enabled,
                up.water_preferred_time,
                up.last_watered_at,
                up.next_watered_at,
                CASE WHEN up.next_watered_at < NOW() THEN true ELSE false END
                                        AS water_overdue,

                -- ── Fertilizer ───────────────────────────────────────────────
                COALESCE(up.custom_fertilizer_schedule, ps.fertilizer_schedule)
                                        AS fertilizer_frequency,
                up.custom_fertilizer_schedule,
                up.fertilizer_notification_enabled,
                up.fertilizer_preferred_time,
                up.last_fertilized_at,
                up.next_fertilized_at,
                CASE WHEN up.next_fertilized_at < NOW() THEN true ELSE false END
                                        AS fertilizer_overdue,

                -- ── Pruning ──────────────────────────────────────────────────
                COALESCE(up.custom_pruning_schedule, ps.pruning_alert)
                                        AS pruning_frequency,
                up.custom_pruning_schedule,
                up.pruning_notification_enabled,
                up.pruning_preferred_time,
                up.last_pruned_at,
                up.next_pruned_at,
                CASE WHEN up.next_pruned_at < NOW() THEN true ELSE false END
                                        AS pruning_overdue,

                -- ── Plant Species Info ────────────────────────────────────────
                ps.id                   AS plant_species_id,
                ps.common_name,
                ps.scientific_name,
                ps.description,
                ps.image_url            AS species_image_url,
                ps.generic_options,

                -- ── Species Defaults (so frontend knows what was overridden) ──
                ps.water_reminder_frequency     AS default_water_frequency,
                ps.fertilizer_schedule          AS default_fertilizer_frequency,
                ps.pruning_alert                AS default_pruning_frequency

            FROM user_plants up
            JOIN plant_species ps
                ON up.plant_species_id = ps.id
            WHERE up.user_id = $1
              AND up.id = $2
            `,
            [userId, userPlantId]
        );

        if (!result.rows.length) return null;

        return result.rows[0];

    } catch (err) {
        if (err instanceof Error) throw err;
        throw new Error("Error retrieving plant");
    }
};


