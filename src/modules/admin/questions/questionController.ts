import { Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AuthRequest } from "../../../core/middleware/authMiddleware";
import { HTTP_STATUS, MESSAGES } from "../../../core/utils/constants";
import {
  errorResponse,
  successResponse,
} from "../../../core/utils/responseFormatter";
import { info } from "../../../core/utils/logger";
import { findUserByEmail } from "../../auth/authRepository";
import {
  createQuestion,
  findAllQuestions,
  softDeleteQuestion,
  updateQuestion,
} from "./questionModel";
import NodeCache from "node-cache";
import { QuestionWithOptions } from "../../../interface/quetion";

export interface AuthUserPayload {
  userEmail?: string;
  role?: string;
}

// ✅ Cache questions for 10 minutes (they rarely change)
const questionsCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });
const QUESTIONS_CACHE_KEY = "all_questions";

/**
 * Retrieves all questions from the database.
 * Validates the authenticated user and returns all questions.
 *
 * @param req - Express request object
 * @param res - Express response object for sending the API response
 * @param next - Express next middleware function for error handling
 * @returns Promise<void>
 */
export const getAllQuestions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // ✅ Check cache first
    const cached =
      questionsCache.get<QuestionWithOptions[]>(QUESTIONS_CACHE_KEY);

    if (cached) {
      const formattedQuestions = cached.map(({ id, ...rest }) => ({
        question_id: id,
        ...rest,
      }));

      res
        .status(HTTP_STATUS.OK)
        .json(
          successResponse(
            { questions: formattedQuestions },
            MESSAGES.QUESTIONS_RETRIEVED
          )
        );
      return;
    }

    // ✅ Retrieve from database (optimized query below)
    const questions = await findAllQuestions();

    // ✅ Cache the raw data
    questionsCache.set(QUESTIONS_CACHE_KEY, questions);

    // Format data
    const formattedQuestions = questions.map(({ id, ...rest }) => ({
      question_id: id,
      ...rest,
    }));

    // Success log (non-blocking)
    setImmediate(() => {
      info("Questions retrieved successfully", {
        count: formattedQuestions.length,
        req,
      }).catch(console.error);
    });

    res
      .status(HTTP_STATUS.OK)
      .json(
        successResponse(
          { questions: formattedQuestions },
          MESSAGES.QUESTIONS_RETRIEVED
        )
      );
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ errors: err.issues });
      return;
    }
    console.error("❌ Error fetching questions:", err);
    next(err);
  }
};

/**
 * Handles the creation of a new question.
 * Validates the authenticated user, checks for duplicate questions,
 * and saves the new question to the database if valid.
 *
 * @param req - Express request object containing question data in the body
 * @param res - Express response object for sending the API response
 * @param next - Express next middleware function for error handling
 * @returns Promise<void>
 */
export const createQuestionController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userPayload = req.user as AuthUserPayload | undefined;

  if (!userPayload?.userEmail) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("Unauthorized"));
    return;
  }

  const user = await findUserByEmail(userPayload.userEmail);
  if (!user) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("User not found"));
    return;
  }

  if (userPayload.role !== "Admin") {
    res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json(errorResponse("Unauthorized Role"));
    return;
  }

  try {
    const { question_text, options, order } = req.body;

    await info(
      "Question creation attempt started",
      { question_text, options },
      { userId: user.id!, req }
    );

    // ✅ Call PostgreSQL service layer
    const newQuestion = await createQuestion({
      question_text: question_text,
      options: options?.map((opt: string) => ({ option_text: opt })),
      order,
      is_deleted: false,
    });

    await info(
      "Question created successfully",
      { questionId: newQuestion.id },
      { userId: user.id!, req }
    );

    res
      .status(HTTP_STATUS.CREATED)
      .json(successResponse(null, MESSAGES.QUESTION_CREATED));
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ errors: err.issues });
      return;
    }
    console.error("❌ Failed to create question:", err);
    next(err);
  }
};

/**
 * Updates an existing question by its ID.
 * Validates the provided data against the schema before applying changes,
 * and returns the updated question if found.
 *
 * @param req - Express request object containing question ID in params and updated data in the body
 * @param res - Express response object for sending the API response
 * @param next - Express next middleware function for error handling
 * @returns Promise<void>
 */
export const updateQuestionController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userPayload = req.user as { userEmail?: string } | undefined;

  if (!userPayload?.userEmail) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("Unauthorized"));
    return;
  }

  const user = await findUserByEmail(userPayload.userEmail);
  if (!user) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("User not found"));
    return;
  }

  try {
    const questionId = req.params.id;
    const { question_text, options, order, is_deleted } = req.body;

    await info(
      "Question update attempt started",
      { questionId, question_text, options, order },
      { userId: user.id!, req }
    );

    // ✅ Map body to PostgreSQL schema
    const updateData = {
      question_text: question_text,
      options: options?.map((opt: string) => ({ option_text: opt })),
      order,
      is_deleted: is_deleted ?? false,
    };

    const updatedQuestion = await updateQuestion(questionId!, updateData);

    if (!updatedQuestion) {
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse("Question not found"));
      return;
    }

    await info(
      "Question updated successfully",
      { questionId },
      { userId: user.id!, req }
    );

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse(null, MESSAGES.QUESTION_UPDATED));
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ errors: err.issues });
      return;
    }
    console.error("❌ Failed to update question:", err);
    next(err);
  }
};

/**
 * Deletes an existing question by its ID.
 * If the question does not exist, responds with a not found error.
 *
 * @param req - Express request object containing the question ID in params
 * @param res - Express response object for sending the API response
 * @param next - Express next middleware function for error handling
 * @returns Promise<void>
 */
export const deleteQuestionController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userPayload = req.user as { userEmail?: string } | undefined;
    if (!userPayload?.userEmail) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("Unauthorized"));
      return;
    }

    const user = await findUserByEmail(userPayload.userEmail);
    if (!user) {
      res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(errorResponse("User not found"));
      return;
    }

    const questionId = req.params.id;

    await info(
      "Question delete attempt started",
      { questionId },
      { userId: user.id!, req }
    );

    const deleted = await softDeleteQuestion(questionId!);

    if (!deleted) {
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse("Question not found"));
      return;
    }

    await info(
      "Question soft deleted successfully",
      { questionId },
      { userId: user.id!, req }
    );

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse(null, MESSAGES.QUESTION_DELETED));
  } catch (err) {
    console.error("❌ Failed to delete question:", err);
    next(err);
  }
};
