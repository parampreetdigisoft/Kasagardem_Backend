import { NextFunction, Response } from "express";
import { HTTP_STATUS, MESSAGES } from "../../../core/utils/constants";
import {
  errorResponse,
  successResponse,
} from "../../../core/utils/responseFormatter";
import { error, info } from "../../../core/utils/logger";
import User, { IUserDocument } from "../../auth/authModel";
import { ConversationRequest, ConversationResponse } from "../../../interface";
import { savePlantHistory } from "../homeScreen/plantController";
import { CustomError } from "../../../interface/error";
import { AuthRequest } from "../../../core/middleware/authMiddleware";
import { plantApiService } from "../../../app";

/**
 * Handles plant conversation requests using the Plant.id chatbot API.
 * Allows users to ask questions about previously identified plants.
 *
 * @param {AuthRequest} req - Express request object containing user email, question, and conversation settings.
 * @param {Response} res - Express response object used to return conversation results.
 * @param {NextFunction} next - Express middleware function for error handling.
 * @returns {Promise<void>} Resolves with conversation results or passes an error to the middleware.
 */
export const askPlantQuestion = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  //#region Authentication & Validation
  const userEmail = (req.user as { userEmail?: string } | undefined)?.userEmail;
  if (!userEmail) {
    res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json(errorResponse("Unauthorized request"));
    return;
  }

  const { identificationId, question, prompt, temperature, appName } =
    req.body as {
      identificationId: string;
      question: string;
      prompt?: string;
      temperature?: number;
      appName?: string;
    };
  //#endregion

  try {
    //#region Logging & User Verification
    await info("Plant conversation attempt", {
      email: userEmail,
      action: "askPlantQuestion",
      identificationId,
      questionLength: question.length,
    });

    const user = (await User.findOne({
      email: userEmail,
    })) as IUserDocument | null;
    if (!user) {
      await error("Plant conversation failed - User not found", {
        email: userEmail,
        action: "askPlantQuestion",
        identificationId,
      });
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse(MESSAGES.PROFILE_USER_NOTFOUND));
      return;
    }
    //#endregion

    //#region Prepare API Request
    const conversationRequest: ConversationRequest = {
      question: question.trim(),
    };

    // Add optional parameters
    if (prompt) conversationRequest.prompt = prompt;
    if (temperature !== undefined)
      conversationRequest.temperature = temperature;
    if (appName) conversationRequest.app_name = appName;
    //#endregion

    //#region External API Call using ApiService
    const apiResponse = await plantApiService.withRetry(
      () =>
        plantApiService.post<ConversationResponse>(
          `identification/${identificationId}/conversation`,
          conversationRequest
        ),
      3,
      1000
    );

    const result = apiResponse.data as ConversationResponse;
    //#endregion

    //#region Extract Latest Answer
    const latestAnswer = result.messages
      .filter((msg) => msg.type === "answer")
      .pop();

    if (!latestAnswer) {
      await error("Plant conversation failed - No answer received", {
        email: userEmail,
        identificationId,
        action: "askPlantQuestion",
      });
      res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json(
          errorResponse(
            "No answer received from the plant identification service"
          )
        );
      return;
    }
    //#endregion

    //#region Response Preparation
    const conversationResult = {
      identificationId: result.identification,
      question: question.trim(),
      answer: latestAnswer.content,
      conversationHistory: result.messages.map((msg) => ({
        type: msg.type,
        content: msg.content,
        timestamp: msg.created,
      })),
      model: result.model_parameters.model,
      temperature: result.model_parameters.temperature,
      remainingCalls: result.remaining_calls,
      totalQuestions: result.messages.filter((msg) => msg.type === "question")
        .length,
    };
    //#endregion

    //#region Update Plant History
    await savePlantHistory(
      user._id.toString(),
      identificationId,
      "conversation",
      {
        question: question.trim(),
        answer: latestAnswer.content,
        model: result.model_parameters.model,
        remainingCalls: result.remaining_calls,
      }
    );
    //#endregion

    //#region Success Logging & Response
    await info("Plant conversation completed successfully", {
      email: userEmail,
      userId: user._id,
      action: "askPlantQuestion",
      identificationId,
      model: result.model_parameters.model,
      remainingCalls: result.remaining_calls,
      answerLength: latestAnswer.content.length,
    });

    res.status(HTTP_STATUS.OK).json(successResponse(conversationResult));
    //#endregion
  } catch (err: unknown) {
    //#region Error Handling
    const errorObj: CustomError =
      err instanceof Error
        ? (err as CustomError)
        : ({
            name: "UnknownError",
            message:
              typeof err === "string" ? err : "An unknown error occurred",
          } as CustomError);

    await error("Plant conversation error", {
      email: userEmail,
      identificationId,
      error: errorObj.message,
      stack: errorObj.stack,
      action: "askPlantQuestion",
    });

    next(errorObj);
    //#endregion
  }
};
