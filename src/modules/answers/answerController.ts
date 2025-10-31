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
import { IPartnerRecommendation, ISurveyAnswer } from "../../interface/answer";
import { detectLanguage } from "../../core/middleware/translationMiddleware";

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

    // 🌍 If request is in Portuguese → translate to English
    if (detectedLang?.startsWith("pt")) {
      answers = await translateObject<ISurveyAnswer[]>(answers, "en");
    }

    // ✅ Insert into survey_responses + survey_answers
    const { responseId } = await createSurveyResponse({
      answers,
    });

    // ✅ Fetch recommendations
    const recommendedPlants = await getRecommendedPlants(answers);
    // 🧠 Check if user selected "Aesthetics" for the 3rd question
    const thirdQuestionAnswer = answers[2]?.selectedOption; // assuming index 2 = 3rd question
    const showPartnerRecommendations =
      typeof thirdQuestionAnswer === "string" &&
      thirdQuestionAnswer.toLowerCase().includes("aesthetic");

    let recommendedPartners: IPartnerRecommendation[] = [];

    if (showPartnerRecommendations) {
      recommendedPartners = await getRecommendedPartners(answers);
    }

    // ✅ Success response
    res.status(HTTP_STATUS.CREATED).json(
      successResponse(
        {
          responseId,
          plantRecommendations: recommendedPlants.map((p) => ({
            id: p.id,
            name: p.common_name,
            scientific: p.scientific_name,
            image: p.image_search_url,
            description: p.description,
            whyRecommended: p.whyRecommended,
          })),
          partnerRecommendations: recommendedPartners.map((partner) => ({
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
        "Answers submitted successfully with plant and partner recommendations"
      )
    );
  } catch (err: unknown) {
    // ✅ Handle validation errors
    if (err instanceof ZodError) {
      res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(errorResponse("Validation failed", { issues: err.issues }));
      return;
    }

    // ✅ Handle all other errors
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      errorResponse("Something went wrong", {
        details: (err as Error).message,
      })
    );

    next(err);
  }
};
