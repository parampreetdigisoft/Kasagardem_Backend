import z, { ZodError } from "zod";
import { getDB } from "../../core/config/db";
import { surveyAnswerDto } from "../../dto/answerDto";

// 🧩 For type=2 (address-based answer)
export interface ISelectedAddress {
  state: string;
  city: string;
}

// 🧩 For each answer in the "answers" array
export interface ISurveyAnswerItem {
  questionId: string; // UUID of the question
  responseId?: string;
  type: 1 | 2; // 1 = option, 2 = address
  selectedOption?: string;
  selectedAddress?: ISelectedAddress;
}

// 🧩 Full survey response (what the API receives)
export interface ISurveyResponse {
  answers: ISurveyAnswerItem[]; // Array of answer items
}

/**
 * Inserts a new survey response and its answers (if provided).
 * Uses Zod for validation before inserting into PostgreSQL.
 *
 * @param data - The survey response data to validate and insert.
 * @param answers
 * @returns A promise that resolves with the created response ID.
 */
export async function createSurveyResponse(
  answers: ISurveyAnswerItem[]
): Promise<{ responseId: string }> {
  const pool = getDB();

  try {
    await pool.query("BEGIN");

    // ✅ Insert survey_responses
    const responseResult = await pool.query(
      `INSERT INTO survey_responses (is_deleted) VALUES ($1) RETURNING id;`,
      [false]
    );

    const responseId = responseResult.rows[0].id;

    if (answers && answers.length > 0) {
      // ✅ Validate all answers at once
      const surveyAnswersArraySchema = z.array(surveyAnswerDto);
      const parsedAnswers = surveyAnswersArraySchema.parse(
        answers.map((ans: ISurveyAnswerItem) => ({
          responseId,
          questionId: ans.questionId,
          answerType: ans.type,
          selectedOption:
            ans.selectedOption ??
            (ans.selectedAddress
              ? `${ans.selectedAddress.state} / ${ans.selectedAddress.city}`
              : null),
        }))
      );

      // ✅ FASTEST: Use UNNEST for bulk insert
      const questionIds = parsedAnswers.map((a) => a.questionId);
      const answerTypes = parsedAnswers.map((a) => a.answerType);
      const selectedOptions = parsedAnswers.map((a) => a.selectedOption);

      await pool.query(
        `INSERT INTO survey_answers (response_id, question_id, answer_type, selected_option)
         SELECT $1, * FROM UNNEST($2::uuid[], $3::integer[], $4::text[]);`,
        [responseId, questionIds, answerTypes, selectedOptions]
      );
    }

    await pool.query("COMMIT");
    return { responseId };
  } catch (err) {
    await pool.query("ROLLBACK");
    if (err instanceof ZodError) throw err;
    throw err;
  }
}
