import { getDB } from "../../core/config/db";
import { getSignedFileUrl } from "../../core/services/s3UploadService";
import { createPlantDto, updatePlantDto } from "../../dto/plantDto";
import { IPlant, ILocation } from "./plantModel";

/**
 * CREATE MAIN PLANT RECORD
 * Validates using Zod before inserting into database
 *
 * @param data - Plant input object (validated using Zod)
 * @returns {Promise<string>} Returns the newly created plant ID (UUID)
 */
export const createPlantRepo = async (data: IPlant): Promise<string> => {
  // Validate using Zod DTO (extra safety)
  const validated = createPlantDto.parse(data);

  const client = await getDB();

  const query = `
    INSERT INTO plants (
      scientific_name, 
      common_name, 
      image_search_url, 
      description,
      native, 
      light, 
      water_needs, 
      maintenance_level, 
      growth_form,
      is_deleted,
      version
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,0)
    RETURNING id;
  `;

  const values = [
    validated.scientific_name,
    validated.common_name,
    validated.image_search_url ?? null,
    validated.description ?? null,
    validated.native ?? null,
    validated.light ?? null,
    validated.water_needs ?? null,
    validated.maintenance_level ?? null,
    validated.growth_form ?? null,
    validated.is_deleted ?? false,
  ];

  const result = await client.query(query, values);
  return result.rows[0].id;
};

/**
 * INSERT ARRAY-BASED RELATION VALUES (space_types, area_sizes, etc.)
 * @param table
 * @param plantId
 * @param column
 * @param arr
 */
export const insertArrayRepo = async (
  table: string,
  plantId: string,
  column: string,
  arr?: string[]
): Promise<void> => {
  if (!arr || arr.length === 0) return;

  const client = await getDB();
  const query = `INSERT INTO ${table} (plant_id, ${column}) VALUES ($1, $2)`;

  for (const item of arr) {
    await client.query(query, [plantId, item]);
  }
};

/**
 * INSERT LOCATIONS
 * @param plantId
 * @param locations
 */
export const insertLocationsRepo = async (
  plantId: string,
  locations?: ILocation[]
): Promise<void> => {
  if (!locations || locations.length === 0) return;

  const client = await getDB();
  const query = `
    INSERT INTO plant_locations (
      plant_id,
      location_type,
      location_value
    )
    VALUES ($1, $2, $3)
  `;

  for (const loc of locations) {
    await client.query(query, [plantId, loc.location_type, loc.location_value]);
  }
};

export interface PaginatedPlants {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  plants: IPlant[];
}

/**
 * GET ALL PLANTS
 * @param page
 * @param limit
 * @param search
 * @returns {Promise<IPlant[]>} Returns an array of plant records
 */
export const getAllPlantsRepo = async (
  page: number,
  limit: number,
  search: string
): Promise<PaginatedPlants> => {
  const client = await getDB();

  const offset = (page - 1) * limit;
  const searchQuery = `%${search}%`;

  // Total count for pagination WITH SEARCH (only name fields)
  const countResult = await client.query(
    `
      SELECT COUNT(*)
      FROM plants
      WHERE is_deleted = FALSE
      AND (
        scientific_name ILIKE $1
        OR common_name ILIKE $1
      )
    `,
    [searchQuery]
  );

  const totalCount = Number(countResult.rows[0].count);
  const totalPages = Math.ceil(totalCount / limit);

  // Fetch paginated rows WITH SEARCH (only name fields)
  const query = `
   SELECT 
    p.id,
    p.scientific_name,
    p.common_name,
    p.image_search_url,
    p.description,
    p.native,
    p.light,
    p.water_needs,
    p.maintenance_level,
    p.growth_form,

    COALESCE(array_agg(DISTINCT pst.space_type) FILTER (WHERE pst.space_type IS NOT NULL), '{}') AS space_types,
    COALESCE(array_agg(DISTINCT pas.area_size) FILTER (WHERE pas.area_size IS NOT NULL), '{}') AS area_sizes,
    COALESCE(array_agg(DISTINCT pc.challenge) FILTER (WHERE pc.challenge IS NOT NULL), '{}') AS challenges,
    COALESCE(array_agg(DISTINCT ptp.tech_preference) FILTER (WHERE ptp.tech_preference IS NOT NULL), '{}') AS tech_preferences,
    COALESCE(array_agg(DISTINCT pcn.note) FILTER (WHERE pcn.note IS NOT NULL), '{}') AS care_notes,

    COALESCE(
      json_agg(
        DISTINCT jsonb_build_object(
          'location_type', pl.location_type,
          'location_value', pl.location_value
        )
      ) FILTER (WHERE pl.location_type IS NOT NULL),
    '[]') AS locations

  FROM plants p
  LEFT JOIN plant_space_types pst ON pst.plant_id = p.id
  LEFT JOIN plant_area_sizes pas ON pas.plant_id = p.id
  LEFT JOIN plant_challenges pc ON pc.plant_id = p.id
  LEFT JOIN plant_tech_preferences ptp ON ptp.plant_id = p.id
  LEFT JOIN plant_care_notes pcn ON pcn.plant_id = p.id
  LEFT JOIN plant_locations pl ON pl.plant_id = p.id

  WHERE p.is_deleted = FALSE
    AND (
      p.scientific_name ILIKE $3
      OR p.common_name ILIKE $3
    )

  GROUP BY p.id
  ORDER BY p.created_at DESC
  LIMIT $1 OFFSET $2;
  `;

  const result = await client.query(query, [limit, offset, searchQuery]);

  const plants = result.rows as IPlant[];

  // Generate signed URLs
  for (const plant of plants) {
    if (plant.image_search_url) {
      plant.image_search_url = await getSignedFileUrl(plant.image_search_url);
    }
  }

  return {
    currentPage: page,
    totalPages,
    totalCount,
    limit,
    plants,
  };
};

/**
 * GET PLANT BY ID WITH LINKED DATA
 * @param id
 * @returns {Promise<IPlant | null>}
 */
export const getPlantByIdRepo = async (id: string): Promise<IPlant | null> => {
  const client = await getDB();

  const query = `
    SELECT 
      p.id,
      p.scientific_name,
      p.common_name,
      p.image_search_url,
      p.description,
      p.native,
      p.light,
      p.water_needs,
      p.maintenance_level,
      p.growth_form,

      COALESCE(array_agg(DISTINCT pst.space_type) FILTER (WHERE pst.space_type IS NOT NULL), '{}') AS space_types,
      COALESCE(array_agg(DISTINCT pas.area_size) FILTER (WHERE pas.area_size IS NOT NULL), '{}') AS area_sizes,
      COALESCE(array_agg(DISTINCT pc.challenge) FILTER (WHERE pc.challenge IS NOT NULL), '{}') AS challenges,
      COALESCE(array_agg(DISTINCT ptp.tech_preference) FILTER (WHERE ptp.tech_preference IS NOT NULL), '{}') AS tech_preferences,
      COALESCE(array_agg(DISTINCT pcn.note) FILTER (WHERE pcn.note IS NOT NULL), '{}') AS care_notes,

      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'location_type', pl.location_type,
            'location_value', pl.location_value
          )
        ) FILTER (WHERE pl.location_type IS NOT NULL),
      '[]') AS locations

    FROM plants p
    LEFT JOIN plant_space_types pst ON pst.plant_id = p.id
    LEFT JOIN plant_area_sizes pas ON pas.plant_id = p.id
    LEFT JOIN plant_challenges pc ON pc.plant_id = p.id
    LEFT JOIN plant_tech_preferences ptp ON ptp.plant_id = p.id
    LEFT JOIN plant_care_notes pcn ON pcn.plant_id = p.id
    LEFT JOIN plant_locations pl ON pl.plant_id = p.id

    WHERE p.id = $1 AND p.is_deleted = FALSE
    GROUP BY p.id;
  `;

  const result = await client.query(query, [id]);

  if (result.rows.length === 0) return null;

  const plant = result.rows[0] as IPlant;

  // Sign the image key → convert to signed URL
  if (plant.image_search_url) {
    plant.image_search_url = await getSignedFileUrl(plant.image_search_url);
  }

  return plant;
};

/**
 * GET PLANT BY ID WITH LINKED DATA
 * @param id
 * @returns {Promise<IPlant | null>}
 */
export const getPlantById = async (id: string): Promise<IPlant | null> => {
  const client = await getDB();

  const query = `
    SELECT 
      p.id,
      p.scientific_name,
      p.common_name,
      p.image_search_url,
      p.description,
      p.native,
      p.light,
      p.water_needs,
      p.maintenance_level,
      p.growth_form,

      COALESCE(array_agg(DISTINCT pst.space_type) FILTER (WHERE pst.space_type IS NOT NULL), '{}') AS space_types,
      COALESCE(array_agg(DISTINCT pas.area_size) FILTER (WHERE pas.area_size IS NOT NULL), '{}') AS area_sizes,
      COALESCE(array_agg(DISTINCT pc.challenge) FILTER (WHERE pc.challenge IS NOT NULL), '{}') AS challenges,
      COALESCE(array_agg(DISTINCT ptp.tech_preference) FILTER (WHERE ptp.tech_preference IS NOT NULL), '{}') AS tech_preferences,
      COALESCE(array_agg(DISTINCT pcn.note) FILTER (WHERE pcn.note IS NOT NULL), '{}') AS care_notes,

      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'location_type', pl.location_type,
            'location_value', pl.location_value
          )
        ) FILTER (WHERE pl.location_type IS NOT NULL),
      '[]') AS locations

    FROM plants p
    LEFT JOIN plant_space_types pst ON pst.plant_id = p.id
    LEFT JOIN plant_area_sizes pas ON pas.plant_id = p.id
    LEFT JOIN plant_challenges pc ON pc.plant_id = p.id
    LEFT JOIN plant_tech_preferences ptp ON ptp.plant_id = p.id
    LEFT JOIN plant_care_notes pcn ON pcn.plant_id = p.id
    LEFT JOIN plant_locations pl ON pl.plant_id = p.id

    WHERE p.id = $1 AND p.is_deleted = FALSE
    GROUP BY p.id;
  `;

  const result = await client.query(query, [id]);

  if (result.rows.length === 0) return null;

  return result.rows[0] as IPlant;
};

/**
 * UPDATE MAIN PLANT RECORD
 * Validates using Zod DTO before updating
 * @param id
 * @param data
 */
export const updatePlantRepo = async (
  id: string,
  data: Partial<IPlant>
): Promise<void> => {
  // Validate update payload
  const validated = updatePlantDto.parse(data);

  const client = await getDB();

  const query = `
    UPDATE plants SET
      scientific_name = $1,
      common_name = $2,
      image_search_url = $3,
      description = $4,
      native = $5,
      light = $6,
      water_needs = $7,
      maintenance_level = $8,
      growth_form = $9,
      updated_at = NOW()
    WHERE id = $10
  `;

  const values = [
    validated.scientific_name ?? null,
    validated.common_name ?? null,
    validated.image_search_url ?? null,
    validated.description ?? null,
    validated.native ?? null,
    validated.light ?? null,
    validated.water_needs ?? null,
    validated.maintenance_level ?? null,
    validated.growth_form ?? null,
    id,
  ];

  await client.query(query, values);
};

/**
 * SOFT DELETE PLANT
 * @param id
 */
export const softDeletePlantRepo = async (id: string): Promise<void> => {
  const client = await getDB();
  await client.query(
    `UPDATE plants SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1`,
    [id]
  );
};

/**
 * Updates an array-type relational table for a given plant.
 * Removes existing entries for the plant and inserts the new values.
 *
 * @param plantId - ID of the plant whose relation should be updated
 * @param table - Database table name (e.g., plant_locations)
 * @param column - Column name that stores the value (e.g., location_value)
 * @param newValues - Array of new values to insert
 */
export const updateArrayRelation = async (
  plantId: string,
  table: string,
  column: string,
  newValues: string[]
): Promise<void> => {
  const client = await getDB();

  const { rows: existingRows } = await client.query(
    `SELECT ${column} FROM ${table} WHERE plant_id = $1`,
    [plantId]
  );

  const existingValues = existingRows.map((r) => r[column]);

  const toAdd = newValues.filter((v) => !existingValues.includes(v));
  const toRemove = existingValues.filter((v) => !newValues.includes(v));

  // Insert new values
  for (const value of toAdd) {
    await client.query(
      `INSERT INTO ${table} (plant_id, ${column}) VALUES ($1, $2)`,
      [plantId, value]
    );
  }

  // Remove deleted values
  for (const value of toRemove) {
    await client.query(
      `DELETE FROM ${table} WHERE plant_id = $1 AND ${column} = $2`,
      [plantId, value]
    );
  }
};

/**
 * Updates the locations associated with a plant.
 * Deletes old location records and inserts the updated list.
 *
 * @param plantId - The ID of the plant being updated
 * @param newLocations - Array of updated location objects
 */
export const updateLocationsRepo = async (
  plantId: string,
  newLocations: ILocation[]
): Promise<void> => {
  const client = await getDB();

  // Fetch existing
  const { rows: existingRows } = await client.query(
    `SELECT location_type, location_value
     FROM plant_locations
     WHERE plant_id = $1`,
    [plantId]
  );

  // Convert to simple strings
  const existing = existingRows.map(
    (row) => `${row.location_type}|${row.location_value}`
  );

  const incoming = (newLocations ?? []).map(
    (loc) => `${loc.location_type}|${loc.location_value}`
  );

  const toAdd = incoming.filter((x) => !existing.includes(x));
  const toRemove = existing.filter((x) => !incoming.includes(x));

  // Insert new locations
  for (const item of toAdd) {
    const [location_type, location_value] = item.split("|");

    await client.query(
      `INSERT INTO plant_locations (
        plant_id, location_type, location_value
      ) VALUES ($1, $2, $3)`,
      [plantId, location_type, location_value]
    );
  }

  // Delete removed locations
  for (const item of toRemove) {
    const [location_type, location_value] = item.split("|");

    await client.query(
      `DELETE FROM plant_locations
       WHERE plant_id = $1 
       AND location_type = $2 
       AND location_value = $3`,
      [plantId, location_type, location_value]
    );
  }
};
