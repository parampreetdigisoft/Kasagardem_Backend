import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { createSurveyResponse } from "./answerModel";
import { HTTP_STATUS } from "../../core/utils/constants";
import {
  errorResponse,
  successResponse,
} from "../../core/utils/responseFormatter";
import {
  getRecommendedPartners,
  getRecommendedPlants,
} from "./answerRepository";
import { translateObject } from "./answerUtility";
import { ISurveyAnswer } from "../../interface/answer";
import { detectLanguage } from "../../core/middleware/translationMiddleware";
import { getDB } from "../../core/config/db";

/**
 * Handles submission of answers for multiple questions.
 * Validates the authenticated user, and saves the answers to the database.
 *
 * Each answer can be:
 *   - type = "1" → selectedOption
 *   - type = "2" → selectedAddress (state & city)
 *
 * @param req - Express request object containing answer data in the body
 * @param res - Express response object for sending the API response
 * @param next - Express next middleware function for error handling
 * @returns Promise<void>
 */
export const submitAnswer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let { answers } = req.body;

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      res.status(400).json({ message: "No answers provided" });
      return;
    }

    // 🔍 Detect language from first string field (fast heuristic)
    const firstText =
      answers.find((a) => typeof a.selectedOption === "string")
        ?.selectedOption ||
      answers.find((a) => a.selectedAddress?.city)?.selectedAddress?.city ||
      "";

    const detectedLang = firstText ? await detectLanguage(firstText) : null;

    //If request is in Portuguese → translate to English
    if (detectedLang?.startsWith("pt")) {
      answers = await translateObject<ISurveyAnswer[]>(answers, "en");
    }

    // Insert into survey_responses + survey_answers
    const { responseId } = await createSurveyResponse({
      answers,
    });

    // Just return the responseId (no recommendation logic here)
    res.status(HTTP_STATUS.CREATED).json(
      successResponse(
        {
          responseId,
        },
        "Answers submitted successfully"
      )
    );
  } catch (err: unknown) {
    // Handle validation errors
    if (err instanceof ZodError) {
      res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(errorResponse("Validation failed", { issues: err.issues }));
      return;
    }

    // Handle all other errors
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      errorResponse("Something went wrong", {
        details: (err as Error).message,
      })
    );

    next(err);
  }
};

/**
 * Get recommended plants based on survey answers associated with a response ID.
 *
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function for error handling
 */
export const getRecommendedPlantsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { responseId } = req.params;

    if (!responseId) {
      res.status(400).json({ message: "responseId is required" });
      return;
    }

    const client = await getDB();

    // 🧠 Fetch all answers for this response
    const result = await client.query(
      `SELECT question_id, answer_type, selected_option
       FROM survey_answers
       WHERE response_id = $1`,
      [responseId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: "No answers found for this responseId" });
      return;
    }

    const answers = result.rows.map((row) => ({
      questionId: row.question_id,
      type: row.answer_type,
      selectedOption: row.selected_option,
    }));

    // 🌿 Get plant recommendations
    const recommendedPlants = await getRecommendedPlants(answers);

    res.status(200).json(
      successResponse(
        {
          plantRecommendations: recommendedPlants.map((p) => ({
            id: p.id,
            name: p.common_name,
            scientific: p.scientific_name,
            image: p.image_search_url,
            description: p.description,
            whyRecommended: p.whyRecommended,
          })),
        },
        "Plant recommendations fetched successfully"
      )
    );
  } catch (err) {
    res.status(500).json(
      errorResponse("Failed to fetch plant recommendations", {
        details: (err as Error).message,
      })
    );
    next(err);
  }
};

/**
 * Get recommended professional partners based on survey answers linked to a specific response ID.
 *
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function for error handling
 */
export const getRecommendedPartnersController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { responseId } = req.params;

    if (!responseId) {
      res.status(400).json({ message: "responseId is required" });
      return;
    }

    const client = await getDB();

    // 🧠 Fetch all answers for this response
    const result = await client.query(
      `SELECT question_id, answer_type, selected_option
       FROM survey_answers
       WHERE response_id = $1`,
      [responseId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: "No answers found for this responseId" });
      return;
    }

    const answers = result.rows.map((row) => ({
      questionId: row.question_id,
      type: row.answer_type,
      selectedOption: row.selected_option,
    }));

    // ✅ Determine if "aesthetic" answer was given (3rd question)
    const thirdAnswer = answers[2]?.selectedOption?.toLowerCase() || "";
    const showPartnerRecommendations = thirdAnswer.includes("aesthetic");

    if (!showPartnerRecommendations) {
      res.status(200).json(
        successResponse(
          {
            responseId,
            partnerRecommendations: [],
          },
          "No partner recommendations applicable for this response"
        )
      );
      return;
    }

    // 👷 Get partner recommendations
    const recommendedPartners = await getRecommendedPartners(answers);

    res.status(200).json(
      successResponse(
        {
          partnerRecommendations: recommendedPartners.map((partner) => ({
            partnerId: partner.partnerId,
            email: partner.email,
            mobileNumber: partner.mobileNumber,
            companyName: partner.companyName,
            speciality: partner.speciality,
            address: partner.address,
            website: partner.website,
            contactPerson: partner.contactPerson,
            projectImageUrl: partner.projectImageUrl,
            whyRecommended: partner.whyRecommended,
          })),
        },
        "Partner recommendations fetched successfully"
      )
    );
  } catch (err) {
    res.status(500).json(
      errorResponse("Failed to fetch partner recommendations", {
        details: (err as Error).message,
      })
    );
    next(err);
  }
};
