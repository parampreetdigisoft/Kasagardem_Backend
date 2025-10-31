import { ZodError } from "zod";
import { createLeadDto } from "../../../dto/leadDto";
import { connectDB } from "../../../core/config/db";

// Create a partial schema for updates
const updateLeadDto = createLeadDto.partial();

export interface ILead {
  id?: string;
  partnerProfileIds?: string[];
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
    partnerProfileIds: "partner_profile_ids",
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
  try {
    const parsedData = createLeadDto.parse(data);
    const client = await connectDB();

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
      parsedData.partnerProfileIds,
      parsedData.userId,
      parsedData.leadsStatus,
      parsedData.isDeleted,
    ];

    const { rows } = await client.query<ILead>(query, values);
    return rows[0] ?? null;
  } catch (err) {
    if (err instanceof ZodError) throw err;
    throw err;
  }
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

    const client = await connectDB();

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
 * Fetches all non-deleted leads.
 * @returns A list of all active leads.
 */
export async function findAllLeads(): Promise<ILead[]> {
  const client = await connectDB();
  const { rows } = await client.query<ILead>(
    `SELECT * FROM leads WHERE is_deleted = FALSE ORDER BY created_at DESC;`
  );
  return rows;
}

/**
 * Soft deletes a lead record by ID.
 * @param id - Lead UUID.
 * @returns void
 */
export async function softDeleteLead(id: string): Promise<void> {
  const client = await connectDB();
  await client.query(`UPDATE leads SET is_deleted = TRUE WHERE id = $1;`, [id]);
}
