import { Response, NextFunction } from "express";
import { ZodError } from "zod";
import Question from "../questions/questionModel";
import { AuthRequest } from "../../../core/middleware/authMiddleware";
import { HTTP_STATUS, MESSAGES } from "../../../core/utils/constants";
import {
  errorResponse,
  successResponse,
} from "../../../core/utils/responseFormatter";
import { info } from "../../../core/utils/logger";
import User from "../../auth/authModel";

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
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // const userPayload = req.user as { userEmail?: string } | undefined;
  // if (!userPayload?.userEmail) {
  //   res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("Unauthorized"));
  //   return;
  // }

  // const user = await User.findOne({ email: userPayload.userEmail });
  // if (!user) {
  //   res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("User not found"));
  //   return;
  // }

  try {
    // await info("Get all questions request started", {}, { userId: user._id });

    // Retrieve all questions
    const questions = await Question.aggregate([
      { $match: { isDeleted: false } },
      { $sort: { order: 1 } },
      { $project: { createdAt: 0, updatedAt: 0, __v: 0, isDeleted: 0 } },
    ]);

    // Map _id → questionId and drop _id
    const formattedQuestions = questions.map(({ _id, ...rest }) => ({
      questionId: _id, // rename _id
      ...rest,
    }));

    await info(
      "Questions retrieved successfully",
      { questionsCount: questions.length }
      // { userId: user._id }
    );

    res
      .status(HTTP_STATUS.OK)
      .json(
        successResponse({ formattedQuestions }, MESSAGES.QUESTIONS_RETRIEVED)
      );
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ errors: err.issues });
      return;
    }
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
export const createQuestion = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userPayload = req.user as { userEmail?: string } | undefined;
  if (!userPayload?.userEmail) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("Unauthorized"));
    return;
  }

  const user = await User.findOne({ email: userPayload.userEmail });
  if (!user) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("User not found"));
    return;
  }

  try {
    const { text, options, order } = req.body;

    await info(
      "Question creation attempt started",
      { text, options },
      { userId: user._id }
    );

    const existing = await Question.findOne({ text });
    if (existing) {
      res
        .status(HTTP_STATUS.CONFLICT)
        .json(errorResponse("Question already exists"));
      return;
    }

    const newQuestion = await Question.createValidated({
      questionText: text, // ✅ map "text" → "questionText"
      options,
      order,
      isDeleted: false,
    });

    await info(
      "Question created successfully",
      { questionId: newQuestion._id },
      { userId: user._id }
    );

    res
      .status(HTTP_STATUS.CREATED)
      .json(successResponse(null, MESSAGES.QUESTION_CREATED));
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ errors: err.issues });
      return;
    }
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
export const updateQuestion = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userPayload = req.user as { userEmail?: string } | undefined;
  if (!userPayload?.userEmail) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("Unauthorized"));
    return;
  }

  const user = await User.findOne({ email: userPayload.userEmail });
  if (!user) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("User not found"));
    return;
  }
  try {
    const { text, options, order } = req.body;

    await info(
      "Question update attempt started",
      { text, options, order },
      { userId: user._id }
    );

    // Map incoming fields before sending to updateValidated
    const mappedData = {
      questionText: text,
      options,
      order,
      isDeleted: false, // or keep original if optional
    };

    const updated = await Question.updateValidated(req.params.id!, mappedData);
    if (!updated) {
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse("Question not found"));
      return;
    }
    res
      .status(HTTP_STATUS.OK)
      .json(successResponse(updated, MESSAGES.QUESTION_UPDATED));
  } catch (err) {
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
export const deleteQuestion = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const deleted = await Question.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse("Question not found"));
      return;
    }
    res
      .status(HTTP_STATUS.OK)
      .json(successResponse(null, MESSAGES.QUESTION_DELETED));
  } catch (err) {
    next(err);
  }
};
