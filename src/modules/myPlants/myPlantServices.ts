import { getDB } from "../../core/config/db";
import { AddUserPlantInput, PaginatedPlants, PaginatedUserPlants, UserPlant } from "../../interface/myPlants";



/**
 * Retrieves paginated plant species from the database.
 *
 * @param {number} page - Current page number.
 * @param {number} limit - Number of records per page.
 * @param search
 * @returns {Promise<PaginatedPlants>} Paginated plant result including
 * current page, total pages, total count, and plant list.
 */
export const getAllPlantsService = async (
    page: number,
    limit: number,
    search?: string
): Promise<PaginatedPlants> => {
    const pool = await getDB();
    const offset = (page - 1) * limit;

    const searchCondition = search
        ? `WHERE common_name ILIKE $1 OR scientific_name ILIKE $1 OR description ILIKE $1`
        : "";

    const searchParam = search ? [`%${search}%`] : [];

    // Total count
    const totalResult = await pool.query(
        `SELECT COUNT(*) FROM plant_species ${searchCondition}`,
        searchParam
    );

    const totalCount = Number(totalResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Paginated data — param indices shift when search is present
    const limitParam = search ? 2 : 1;
    const offsetParam = search ? 3 : 2;

    const plantsResult = await pool.query(
        `SELECT 
       id,
       scientific_name,
       common_name,
       description,
       image_url,
       water_reminder_frequency,
       water_notification_enabled::boolean,
       fertilizer_schedule,
       fertilizer_notification_enabled::boolean,
       pruning_alert,
       pruning_notification_enabled::boolean,
       generic_options,
       created_at,
       updated_at
     FROM plant_species
     ${searchCondition}
     ORDER BY created_at DESC
     LIMIT $${limitParam} OFFSET $${offsetParam}`,
        search ? [`%${search}%`, limit, offset] : [limit, offset]
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
export const getPlantDetailsByIdService = async (plantId: string): Promise<void> => {
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
): Promise<Record<string, unknown>> => {

    const pool = await getDB();

    const {
        plant_species_id,
        watering_frequency_days,
        fertilizing_frequency_days,
        pruning_frequency_days,
        generic_frequency_days,
        water_notification_enabled = false,
        fertilizer_notification_enabled = false,
        pruning_notification_enabled = false,
        generic_care_notification_enabled = false,
        water_preferred_time = "09:00:00",
        fertilizer_preferred_time = "09:00:00",
        pruning_preferred_time = "09:00:00",
        generic_care_preferred_time = "09:00:00",
    } = payload;

    // ─────────────────────────────────────────────
    //  Fetch species defaults
    // ─────────────────────────────────────────────
    const plantCheck = await pool.query(
        `
        SELECT 
            id,
            water_reminder_frequency,
            fertilizer_schedule,
            pruning_alert,
            generic_reminder_frequency
        FROM plant_species 
        WHERE id = $1
        `,
        [plant_species_id]
    );

    if (!plantCheck.rows.length) {
        throw new Error("Plant species not found");
    }

    const species = plantCheck.rows[0];
    const now = new Date();

/**
 * Calculates the date that is a specified number of days ahead of the current date.
 *
 * @param {number | null} days - The number of days to add to the current date. If `null`, the function will return `null`.
 * @returns {Date | null} - The resulting date after adding the specified number of days. If `days` is `null`, returns `null`.
 */
    const calculateNextDate = (days: number | null):Date | null=> {
        if (!days) return null;
        const next = new Date(now);
        next.setDate(now.getDate() + days);
        return next;
    };

    const next_watered_at = calculateNextDate(
        watering_frequency_days ?? species.water_reminder_frequency
    );

    const next_fertilized_at = calculateNextDate(
        fertilizing_frequency_days ?? species.fertilizer_schedule
    );

    const next_pruned_at = calculateNextDate(
        pruning_frequency_days ?? species.pruning_alert
    );

    const next_generic_care_at = calculateNextDate(
        generic_frequency_days ?? species.generic_reminder_frequency
    );

    // ─────────────────────────────────────────────
    // 3️⃣ Insert User Plant Data
    // ─────────────────────────────────────────────
    try {
        const result = await pool.query(
            `
            INSERT INTO user_plants (
                user_id,
                plant_species_id,
                water_notification_enabled,
                water_preferred_time,
                next_watered_at,
                fertilizer_notification_enabled,
                fertilizer_preferred_time,
                next_fertilized_at,
                pruning_notification_enabled,
                pruning_preferred_time,
                next_pruned_at,
                generic_care_notification_enabled,
                generic_care_preferred_time,
                next_generic_care_at,
                watering_frequency_days,
                fertilizing_frequency_days,
                pruning_frequency_days,
                generic_frequency_days
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
            )
            RETURNING *
            `,
            [
                userId,
                plant_species_id,
                water_notification_enabled,
                water_preferred_time,
                next_watered_at,
                fertilizer_notification_enabled,
                fertilizer_preferred_time,
                next_fertilized_at,
                pruning_notification_enabled,
                pruning_preferred_time,
                next_pruned_at,
                generic_care_notification_enabled,
                generic_care_preferred_time,
                next_generic_care_at,
                watering_frequency_days,
                fertilizing_frequency_days,
                pruning_frequency_days,
                generic_frequency_days,
            ]
        );

        return result.rows[0];

    } catch (err) {
        if (err instanceof Error && err.message.includes("duplicate key value violates unique constraint")  ) {
            throw new Error("Plant already added to user");
        }
        throw err;
    }
};

/**
 * Retrieves all plants associated with a specific user.
 *
 * @param {string} userId - UUID of the user.
 * @param {number} page - Current page number for pagination.
 * @param {number} limit - Number of records per page for pagination.
 * @param {string} [search] - Optional search term to filter plants by common name, scientific name, or description.
 * @returns {Promise<Record<string, unknown>[]>} List of plants added by the user.
 * @throws {Error} If database query fails.
 */
// ── Service ───────────────────────────────────────────────────────────────────
export const getUserPlantsService = async (
    userId: string,
    page: number = 1,
    limit: number = 10,
    search?: string
): Promise<PaginatedUserPlants> => {

    const pool = await getDB();

    const safePage = Number.isNaN(page) ? 1 : Math.max(1, page);
    const safeLimit = Number.isNaN(limit) ? 10 : Math.max(1, limit);
    const offset = (safePage - 1) * safeLimit;

    let baseParams: (string | number)[] = [userId];
    let searchCondition = "";

    if (search && search.trim() !== "") {
        baseParams.push(`%${search.trim()}%`);
        searchCondition = `
            AND (
                ps.scientific_name ILIKE $2
                OR ps.common_name ILIKE $2
            )
        `;
    }

    // TOTAL COUNT
    const totalQuery = `
        SELECT COUNT(*)::int AS count
        FROM user_plants up
        JOIN plant_species ps ON up.plant_species_id = ps.id
        WHERE up.user_id = $1
        ${searchCondition}
    `;

    const totalResult = await pool.query(totalQuery, baseParams);
    const totalCount: number = totalResult.rows[0]?.count || 0;
    const totalPages = totalCount === 0
        ? 1
        : Math.ceil(totalCount / safeLimit);

    // DATA QUERY
    const dataQuery = `
        SELECT
            up.id AS user_plant_id,
            ps.common_name AS common_name,
            ps.scientific_name AS scientific_name,
            ps.description AS description,  -- Added description from plant_species
            ps.image_url AS plant_image,
            up.health_status,
            up.water_notification_enabled,
            up.water_preferred_time,
            up.next_watered_at,
            up.watering_frequency_days,  -- Added watering frequency from user_plants
            up.fertilizer_notification_enabled,
            up.fertilizer_preferred_time,
            up.next_fertilized_at,
            up.fertilizing_frequency_days,  -- Added fertilizing frequency from user_plants
            up.pruning_notification_enabled,
            up.pruning_preferred_time,
            up.next_pruned_at,
            up.pruning_frequency_days,  -- Added pruning frequency from user_plants
            up.generic_frequency_days,  -- Added generic care frequency from user_plants
            up.generic_care_notification_enabled,
            up.generic_care_preferred_time,
            up.next_generic_care_at,
            up.created_at
        FROM user_plants up
        JOIN plant_species ps ON up.plant_species_id = ps.id
        WHERE up.user_id = $1
        ${searchCondition}
        ORDER BY up.created_at DESC
        LIMIT $${baseParams.length + 1}
        OFFSET $${baseParams.length + 2}
    `;

    const result = await pool.query<UserPlant>(dataQuery, [...baseParams, safeLimit, offset]);

    return {
        currentPage: safePage,
        totalPages,
        totalCount,
        limit: safeLimit,
        plants: result.rows,
    };
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
    up.id AS user_plant_id,
    ps.common_name AS common_name,
    ps.scientific_name AS scientific_name,
    ps.description AS description,  -- Added description from plant_species
    ps.image_url AS plant_image,
    up.health_status,
    up.water_notification_enabled,
    up.water_preferred_time,
    up.next_watered_at,
    up.watering_frequency_days,  -- Added watering frequency from user_plants
    up.fertilizer_notification_enabled,
    up.fertilizer_preferred_time,
    up.next_fertilized_at,
    up.fertilizing_frequency_days,  -- Added fertilizing frequency from user_plants
    up.pruning_notification_enabled,
    up.pruning_preferred_time,
    up.next_pruned_at,
    up.pruning_frequency_days,  -- Added pruning frequency from user_plants
    up.generic_frequency_days,  -- Added generic care frequency from user_plants
    up.generic_care_notification_enabled,
    up.generic_care_preferred_time,
    up.next_generic_care_at,
    up.created_at
    FROM user_plants up
    JOIN plant_species ps ON up.plant_species_id = ps.id
    WHERE up.user_id = $1  -- Filter by the user's ID (replace with the actual user ID when querying)
    AND up.id = $2;  -- Filter by the specific plant's ID (replace with the actual plant ID when querying)
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


