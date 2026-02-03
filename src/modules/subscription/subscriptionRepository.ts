import { ISubscriptionPlan, SubscriptionPlanInput } from "../../interface/subscription";
import { getDB } from "../../core/config/db";

/**
 * Inserts a new subscription plan into the database.
 * 
 * @param {SubscriptionPlanInput} plan - The subscription plan data to create
 * @returns {Promise<ISubscriptionPlan>} The newly created subscription plan
 *
 * @example
 * const newPlan = await createSubscriptionPlan({
 *   plan_name: "Gold",
 *   description: "Best plan for professionals",
 *   monthly_price: 99.00,
 *   annual_price: 1188.00,
 *   lead_limit_per_month: 100,
 *   number_of_regions: 3,
 *   highlight_in_result: true,
 *   verification_badge: true,
 *   status: "active"
 * });
 */
export async function createSubscriptionPlan(
  plan: SubscriptionPlanInput 
): Promise<ISubscriptionPlan> {
  const client = await getDB();

  const query = `
    INSERT INTO subscrptionPlans (
      plan_name,
      description,
      monthly_price,
      annual_price,
      lead_limit_per_month,
      number_of_regions,
      highlight_in_result,
      verification_badge,
      status
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *;
  `;

  const values = [
    plan.plan_name,
    plan.description,
    plan.monthly_price,
    plan.annual_price,
    plan.lead_limit_per_month,
    plan.number_of_regions,
    plan.highlight_in_result,
    plan.verification_badge,
    plan.status,
  ];

  const result = await client.query<ISubscriptionPlan>(query, values);
  return result.rows[0]!;
}

/**
 * Fetches all subscription plans from the database, ordered by creation date descending.
 *
 * @returns {Promise<ISubscriptionPlan[]>} Array of subscription plans
 *
 * @example
 * const plans = await getAllSubscriptionPlans();
 * console.log(plans);
 */
export const getAllSubscriptionPlans = async (): Promise<ISubscriptionPlan[]> => {
  const client = await getDB();

  const query = `
    SELECT *
    FROM subscrptionPlans
    ORDER BY created_at DESC;
  `;

  const result = await client.query<ISubscriptionPlan>(query);
  return result.rows;
};



/**
 * Updates an existing subscription plan by its ID.
 *
 * @param {string} planId - The ID of the subscription plan to update
 * @param {SubscriptionPlanInput} updates - The updated subscription plan data
 * @returns {Promise<ISubscriptionPlan | null>} The updated subscription plan, or null if not found
 *
 * @example
 * const updatedPlan = await updateSubscriptionPlan("uuid-of-plan", {
 *   plan_name: "Gold",
 *   description: "Updated description",
 *   monthly_price: 99.00,
 *   annual_price: 1188.00,
 *   lead_limit_per_month: 150,
 *   number_of_regions: 3,
 *   highlight_in_result: true,
 *   verification_badge: true,
 *   status: "active"
 * });
 */
export const updateSubscriptionPlan = async (
  planId: string,
  updates: SubscriptionPlanInput
): Promise<ISubscriptionPlan | null> => {
  const client = await getDB();

  const query = `
    UPDATE subscrptionPlans
    SET 
      plan_name = $1,
      description = $2,
      monthly_price = $3,
      annual_price = $4,
      lead_limit_per_month = $5,
      number_of_regions = $6,
      highlight_in_result = $7,
      verification_badge = $8,
      status = $9,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $10
    RETURNING *;
  `;

  const values = [
    updates.plan_name,
    updates.description,
    updates.monthly_price,
    updates.annual_price,
    updates.lead_limit_per_month,
    updates.number_of_regions,
    updates.highlight_in_result,
    updates.verification_badge,
    updates.status,
    planId,
  ];

  const result = await client.query<ISubscriptionPlan>(query, values);
  return result.rows[0] || null;
};


/**
 * Fetches a subscription plan by its ID.
 *
 * @param {string} planId - The ID of the subscription plan to retrieve
 * @returns {Promise<ISubscriptionPlan | null>} The subscription plan if found, otherwise null
 *
 * @example
 * const plan = await getSubscriptionPlanById("uuid-of-plan");
 * if (plan) {
 *   console.log(plan.plan_name);
 * }
 */
export const getSubscriptionPlanById = async (
  planId: string
): Promise<ISubscriptionPlan | null> => {
  const client = await getDB();

  const query = `
    SELECT
      id,
      plan_name,
      description,
      monthly_price,
      annual_price,
      lead_limit_per_month,
      number_of_regions,
      highlight_in_result,
      verification_badge,
      status,
      created_at,
      updated_at
    FROM subscrptionPlans
    WHERE id = $1
    LIMIT 1;
  `;

  const result = await client.query<ISubscriptionPlan>(query, [planId]);

  // Explicit type-safe conversion: undefined -> null
  const plan: ISubscriptionPlan | undefined = result.rows[0];
  return plan ?? null;
 // TS now sees this as ISubscriptionPlan
};

