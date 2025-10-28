import { ZodError } from "zod";
import { getDB } from "../../../core/config/db";
import { createQuestionWithOptionsDto } from "../../../dto/questionDto";
import {
  QuestionOption,
  QuestionWithOptions,
} from "../../../interface/quetion";

/**
 * Create a new question with options
 * @param data - The input data to create the question and its options.
 * @returns {Promise<QuestionWithOptions>} A promise that resolves to the created question with its options.
 */
export async function createQuestion(
  data: unknown
): Promise<QuestionWithOptions> {
  const client = await getDB();

  try {
    const parsed = createQuestionWithOptionsDto.parse(data);

    // Start transaction
    await client.query("BEGIN");

    // Insert question
    const questionQuery = `
      INSERT INTO questions (question_text, "order", is_deleted)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;

    const questionValues = [
      parsed.question_text,
      parsed.order ?? null,
      parsed.is_deleted ?? false,
    ];

    const questionResult = await client.query(questionQuery, questionValues);
    const question = questionResult.rows[0];

    // Insert options if provided
    const options: QuestionOption[] = [];
    if (parsed.options && parsed.options.length > 0) {
      for (const option of parsed.options) {
        const optionResult = await client.query(
          `INSERT INTO question_options (question_id, option_text)
     VALUES ($1, $2)
     RETURNING *;`,
          [question.id, option.option_text] // ✅ option_text inside object
        );
        options.push(optionResult.rows[0]);
      }
    }

    await client.query("COMMIT");

    return {
      ...question,
      options,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    if (err instanceof ZodError) throw err;
    throw new Error(`❌ Failed to create question: ${(err as Error).message}`);
  }
}

/**
 * Update an existing question and its options by ID
 * @param {string} questionId - The ID of the question to update.
 * @param {unknown} data - The updated question data including options.
 * @returns {Promise<QuestionWithOptions | null>} A promise that resolves to the updated question with its options, or null if not found.
 */
export async function updateQuestion(
  questionId: string,
  data: unknown
): Promise<QuestionWithOptions | null> {
  const client = await getDB();

  try {
    const parsed = createQuestionWithOptionsDto.partial().parse(data);

    await client.query("BEGIN");

    // Update question
    const questionQuery = `
      UPDATE questions
      SET
        question_text = COALESCE($1, question_text),
        "order" = COALESCE($2, "order"),
        is_deleted = COALESCE($3, is_deleted),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *;
    `;

    const questionValues = [
      parsed.question_text ?? null,
      parsed.order ?? null,
      parsed.is_deleted ?? null,
      questionId,
    ];

    const questionResult = await client.query(questionQuery, questionValues);

    if (questionResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    const question = questionResult.rows[0];

    // Handle options update if provided
    let options: QuestionOption[] = [];

    if (parsed.options !== undefined) {
      // Delete existing options
      await client.query(
        "DELETE FROM question_options WHERE question_id = $1",
        [questionId]
      );

      // Insert new options (array of strings)
      if (parsed.options.length > 0) {
        for (const option of parsed.options) {
          const optionResult = await client.query(
            `INSERT INTO question_options (question_id, option_text)
     VALUES ($1, $2)
     RETURNING *;`,
            [questionId, option.option_text] // ✅ option is string
          );
          options.push(optionResult.rows[0]);
        }
      }
    } else {
      // Fetch existing options if not updating
      const existingOptions = await client.query(
        "SELECT * FROM question_options WHERE question_id = $1",
        [questionId]
      );
      options = existingOptions.rows;
    }

    await client.query("COMMIT");

    return {
      ...question,
      options,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    if (err instanceof ZodError) throw err;
    throw new Error(`❌ Failed to update question: ${(err as Error).message}`);
  }
}

/**
 * Get all active (non-deleted) questions with their options
 * @returns {Promise<QuestionWithOptions[]>} A promise that resolves to a list of all active questions and their associated options.
 */
export async function findAllQuestions(): Promise<QuestionWithOptions[]> {
  const client = await getDB();

  try {
    const query = `
      SELECT 
        q.id,
        q.question_text,
        q."order",
        q.is_deleted,
        json_agg(
          json_build_object(
            'id', qo.id,
            'option_text', qo.option_text
          ) ORDER BY qo.id
        ) FILTER (WHERE qo.id IS NOT NULL) AS options
      FROM questions q
      LEFT JOIN question_options qo ON q.id = qo.question_id
      WHERE q.is_deleted = FALSE
      GROUP BY q.id
      ORDER BY q."order" ASC, q.created_at ASC;
    `;

    const result = await client.query(query);

    return result.rows.map((row) => ({
      id: row.id,
      question_text: row.question_text,
      order: row.order,
      options: row.options || [],
    }));
  } catch (err) {
    throw new Error(`❌ Failed to fetch questions: ${(err as Error).message}`);
  }
}

/**
 * 🔍 Get a single question by ID with its options
 * @param {string} questionId - The ID of the question to retrieve.
 * @returns {Promise<QuestionWithOptions | null>} A promise that resolves to the question with its options, or null if not found.
 */
export async function findQuestionById(
  questionId: string
): Promise<QuestionWithOptions | null> {
  const client = await getDB();

  try {
    const query = `
      SELECT 
        q.*,
        json_agg(
          json_build_object(
            'id', qo.id,
            'question_id', qo.question_id,
            'option_text', qo.option_text,
            'created_at', qo.created_at,
            'updated_at', qo.updated_at
          ) ORDER BY qo.created_at
        ) FILTER (WHERE qo.id IS NOT NULL) as options
      FROM questions q
      LEFT JOIN question_options qo ON q.id = qo.question_id
      WHERE q.id = $1 AND q.is_deleted = FALSE
      GROUP BY q.id;
    `;

    const result = await client.query(query, [questionId]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      ...row,
      options: row.options || [],
    };
  } catch (err) {
    throw new Error(`❌ Failed to fetch question: ${(err as Error).message}`);
  }
}

/**
 * Soft delete a question (set is_deleted = true)
 * Options are preserved but the question becomes inactive.
 * @param {string} id - The ID of the question to soft delete.
 * @returns {Promise<boolean>} A promise that resolves to true if the question was successfully soft deleted, or false otherwise.
 */
export async function softDeleteQuestion(id: string): Promise<boolean> {
  const client = await getDB();

  try {
    const result = await client.query(
      `
      UPDATE questions
      SET is_deleted = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1;
      `,
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  } catch (err) {
    throw new Error(`❌ Failed to delete question: ${(err as Error).message}`);
  }
}

/**
 * Hard delete a question (permanently removes the question and all its options)
 * @param {string} id - The ID of the question to permanently delete.
 * @returns {Promise<boolean>} A promise that resolves to true if the question and its options were successfully deleted, or false otherwise.
 */
export async function hardDeleteQuestion(id: string): Promise<boolean> {
  const client = await getDB();

  try {
    await client.query("BEGIN");

    // Delete options first (or rely on CASCADE)
    await client.query("DELETE FROM question_options WHERE question_id = $1", [
      id,
    ]);

    // Delete question
    const result = await client.query("DELETE FROM questions WHERE id = $1", [
      id,
    ]);

    await client.query("COMMIT");

    return result.rowCount !== null && result.rowCount > 0;
  } catch (err) {
    await client.query("ROLLBACK");
    throw new Error(
      `❌ Failed to hard delete question: ${(err as Error).message}`
    );
  }
}
