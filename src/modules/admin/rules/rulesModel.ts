import { ZodError } from "zod";
import { createRuleDto, CreateRuleDto } from "../../../dto/ruleDto";
import { getDB } from "../../../core/config/db"; // your existing DB helper

// ---------- Interfaces ----------
export interface ICondition {
  questionId: string; // ✅ UUID
  operator: "equals" | "and" | "or";
  value: string; // ✅ single string (not array)
}

export interface IRule {
  id?: string;
  name?: string;
  conditions: ICondition[];
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Create a new Rule with validation and insert it into PostgreSQL.
 * @param data - The input rule data.
 * @returns The newly created rule object.
 */
export async function createValidatedRule(data: unknown): Promise<IRule> {
  const client = await getDB();

  try {
    // ✅ Validate input using Zod
    const parsedData: CreateRuleDto = createRuleDto.parse(data);

    // 1️⃣ Insert main rule
    const ruleResult = await client.query<IRule>(
      `
      INSERT INTO rules (name)
      VALUES ($1)
      RETURNING *;
      `,
      [parsedData.name]
    );

    const rule = ruleResult.rows[0];

    // 2️⃣ Insert related conditions
    for (const c of parsedData.conditions) {
      await client.query(
        `
        INSERT INTO rule_conditions (rule_id, question_id, operator, value)
        VALUES ($1, $2, $3, $4);
        `,
        [rule?.id, c.questionId, c.operator, c.value]
      );
    }

    // ✅ Return combined object
    return {
      ...rule,
      conditions: parsedData.conditions,
    };
  } catch (err) {
    if (err instanceof ZodError) throw err;
    throw err;
  }
}

/**
 * Update a Rule by ID with validation.
 * @param ruleId - The rule ID.
 * @param data - Updated rule data.
 * @returns The updated rule or null if not found.
 */
export async function updateValidatedRule(
  ruleId: string,
  data: unknown
): Promise<IRule | null> {
  const client = await getDB();

  try {
    const parsedData: CreateRuleDto = createRuleDto.parse(data);

    // 1️⃣ Update main rule
    const updateRule = await client.query<IRule>(
      `
      UPDATE rules
      SET name = $1,
          affiliate_for = $2
      WHERE id = $3
      RETURNING *;
      `,
      [parsedData.name, parsedData.isDeleted, parsedData.updatedAt, ruleId]
    );

    if (updateRule.rowCount === 0) return null;
    const rule = updateRule.rows[0];

    // 2️⃣ Delete old conditions (simple approach)
    await client.query(`DELETE FROM rule_conditions WHERE rule_id = $1;`, [
      ruleId,
    ]);

    // 3️⃣ Insert new conditions
    for (const c of parsedData.conditions) {
      await client.query(
        `
        INSERT INTO rule_conditions (rule_id, question_id, operator, value)
        VALUES ($1, $2, $3, $4);
        `,
        [rule?.id, c.questionId, c.operator, c.value]
      );
    }

    return {
      ...rule,
      conditions: parsedData.conditions,
    };
  } catch (err) {
    if (err instanceof ZodError) throw err;
    throw err;
  }
}

/**
 * Get all Rules (with their conditions).
 * @returns An array of all active rules.
 */
export async function getAllRules(): Promise<IRule[]> {
  const client = await getDB();

  const rulesResult = await client.query(`
    SELECT * FROM rules WHERE is_deleted = false ORDER BY created_at DESC;
  `);

  const rules: IRule[] = [];

  for (const rule of rulesResult.rows) {
    const conditionsResult = await client.query<ICondition>(
      `SELECT question_id AS "questionId", operator, values FROM rule_conditions WHERE rule_id = $1;`,
      [rule.id]
    );

    rules.push({
      ...rule,
      conditions: conditionsResult.rows,
    });
  }

  return rules;
}

/**
 * Delete a Rule by ID (soft delete).
 * @param ruleId - The ID of the rule to delete.
 * @returns True if successfully deleted, otherwise false.
 */
export async function deleteRule(ruleId: string): Promise<boolean> {
  const client = await getDB();

  const result = await client.query(
    `UPDATE rules SET is_deleted = true WHERE id = $1;`,
    [ruleId]
  );

  return result.rowCount! > 0;
}
