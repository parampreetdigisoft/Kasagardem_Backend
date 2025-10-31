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
 * @returns A promise that resolves with the created response ID.
 */
export async function createSurveyResponse(
  data: ISurveyResponse
): Promise<{ responseId: string }> {
  const client = await getDB();

  try {
    // Insert into survey_responses
    const responseResult = await client.query(
      `INSERT INTO survey_responses ( is_deleted)
       VALUES ($1)
       RETURNING id;`,
      [false]
    );

    const responseId = responseResult.rows[0].id;

    // ✅ Create array schema
    const surveyAnswersArraySchema = z.array(surveyAnswerDto);

    if (data.answers && data.answers.length > 0) {
      // ✅ Validate array of answers
      const parsedAnswers = surveyAnswersArraySchema.parse(
        data.answers.map((ans: ISurveyAnswerItem) => ({
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

      // ✅ Only proceed if validation passes
      for (const ans of parsedAnswers) {
        await client.query(
          `INSERT INTO survey_answers (response_id, question_id, answer_type, selected_option)
       VALUES ($1, $2, $3, $4);`,
          [ans.responseId, ans.questionId, ans.answerType, ans.selectedOption]
        );
      }
    }

    return { responseId };
  } catch (err) {
    if (err instanceof ZodError) throw err;
    throw err;
  }
}
