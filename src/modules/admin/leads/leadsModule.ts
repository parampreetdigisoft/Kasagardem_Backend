import { ZodError } from "zod";
import { createLeadDto } from "../../../dto/leadDto";
import { getDB } from "../../../core/config/db";

export interface ILeadGrouped {
  lead_id: string;
  leads_status: string;
  user: {
    user_id: string;
    user_name: string;
    user_email: string;
  } | null; // allow null

  partners: {
    partner_id: string;
    company_name: string | null; // partner name may be null
  }[];
}

// Create a partial schema for updates
const updateLeadDto = createLeadDto.partial();

export interface ILead {
  id?: string;
  partnerIds?: string[];
  userId?: string;
  leadsStatus?: "new" | "converted" | "closed";
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Maps JavaScript field names to database column names.
 * @param field - The field name from the DTO.
 * @returns The corresponding PostgreSQL column name.
 */
function mapField(field: string): string {
  const mapping: Record<string, string> = {
    partnerIds: "partner_profile_ids",
    userId: "user_id",
    leadsStatus: "leads_status",
    isDeleted: "is_deleted",
  };
  return mapping[field] ?? field;
}

/**
 * Creates a new lead record after Zod validation.
 * @param data - The raw data to validate and insert.
 * @returns The created lead record, or null if insertion failed.
 */
export async function createLead(data: unknown): Promise<ILead | null> {
  // ✅ Validate first (this is fast)
  const parsedData = createLeadDto.parse(data);

  const pool = getDB();

  const query = `
    INSERT INTO leads (
      partner_profile_ids,
      user_id,
      leads_status,
      is_deleted
    )
    VALUES ($1, $2, $3, $4)
    RETURNING id, partner_profile_ids, user_id, leads_status;
  `;

  const values = [
    parsedData.partnerIds,
    parsedData.userId,
    parsedData.leadsStatus,
    parsedData.isDeleted,
  ];

  // ✅ Use pool.query directly (no client checkout needed for single query)
  const { rows } = await pool.query<ILead>(query, values);
  return rows[0] ?? null;
}

/**
 * Updates an existing lead record after validation.
 * @param id - Lead UUID.
 * @param data - Partial data for update.
 * @returns The updated lead record, or null if not found.
 */
export async function updateLead(
  id: string,
  data: unknown
): Promise<ILead | null> {
  try {
    const parsedData = updateLeadDto.parse(data);

    if (Object.keys(parsedData).length === 0) {
      throw new Error("No fields provided for update");
    }

    const client = await getDB();

    // Dynamically build SET clause
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    for (const [key, value] of Object.entries(parsedData)) {
      setClauses.push(`${mapField(key)} = $${index}`);
      values.push(value);
      index++;
    }

    // Add updated_at
    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE leads
      SET ${setClauses.join(", ")}
      WHERE id = $${index}
      RETURNING id, partner_profile_ids, user_id, leads_status, is_deleted, created_at, updated_at;
    `;

    const { rows } = await client.query<ILead>(query, values);
    return rows[0] ?? null;
  } catch (err) {
    if (err instanceof ZodError) throw err;
    throw err;
  }
}

/**
 * Fetch paginated leads.
 *
 * @param {number} page - Current page number.
 * @param {number} limit - Number of items per page.
 * @returns {Promise<{ leads: ILeadGrouped[]; total: number }>}
 * Returns an object containing the paginated leads and the total count.
 */
export async function findAllLeads(
  page: number,
  limit: number
): Promise<{ leads: ILeadGrouped[]; total: number }> {
  const client = await getDB();

  const offset = (page - 1) * limit;

  // 1️⃣ Count unique leads
  const totalResult = await client.query(
    `SELECT COUNT(*) FROM leads WHERE is_deleted = FALSE`
  );
  const total = Number(totalResult.rows[0].count);

  // 2️⃣ Get ONLY the lead IDs for the given page
  const leadIdResult = await client.query(
    `
    SELECT id
    FROM leads
    WHERE is_deleted = FALSE
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2;
    `,
    [limit, offset]
  );

  const leadIds: string[] = leadIdResult.rows.map((row) => row.id);

  if (leadIds.length === 0) {
    return { leads: [], total };
  }

  // 3️⃣ Fetch partner & user details ONLY for those leads
  const { rows } = await client.query(
    `
    SELECT 
      l.id AS lead_id,
      partner_id,
      p.company_name,
      u.id AS user_id,
      u.name AS user_name,
      u.email AS user_email,
      l.leads_status
    FROM leads l
    LEFT JOIN LATERAL UNNEST(l.partner_profile_ids) AS partner_id ON TRUE
    LEFT JOIN partner_profiles p ON p.id = partner_id
    LEFT JOIN users u ON u.id = l.user_id
    WHERE l.id = ANY($1)
    ORDER BY l.created_at DESC;
    `,
    [leadIds]
  );

  // 4️⃣ Group into unique leads
  const groups: Record<string, ILeadGrouped> = {};

  for (const row of rows) {
    if (!groups[row.lead_id]) {
      groups[row.lead_id] = {
        lead_id: row.lead_id,
        leads_status: row.leads_status,
        user: row.user_id
          ? {
              user_id: row.user_id,
              user_email: row.user_email,
              user_name: row.user_name,
            }
          : null,
        partners: [],
      };
    }

    if (row.partner_id) {
      groups[row.lead_id]!.partners.push({
        partner_id: row.partner_id,
        company_name: row.company_name,
      });
    }
  }

  return { leads: Object.values(groups), total };
}

/**
 * Soft deletes a lead record by ID.
 * @param id - Lead UUID.
 * @returns void
 */
export async function softDeleteLead(id: string): Promise<void> {
  const client = await getDB();
  await client.query(`UPDATE leads SET is_deleted = TRUE WHERE id = $1;`, [id]);
}

/**
 * Updates the status of a lead by its ID.
 *
 * @param {string} id - The unique ID of the lead.
 * @param {string} status - The new lead status to be updated.
 * @returns {Promise<ILead | null>} Returns the updated lead object or null if not found.
 */
export async function updateLeadStatus(
  id: string,
  status: string
): Promise<ILead | null> {
  const client = await getDB();

  const query = `
      UPDATE leads
      SET leads_status = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, partner_profile_ids, user_id, leads_status, is_deleted, created_at, updated_at;
    `;

  const { rows } = await client.query<ILead>(query, [status, id]);
  return rows[0] ?? null;
}
