import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import Answer from "./answerModel";
import { HTTP_STATUS } from "../../core/utils/constants";
import {
  errorResponse,
  successResponse,
} from "../../core/utils/responseFormatter";
import {
  getRecommendedPartners,
  getRecommendedPlants,
} from "./answerRepository";

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
    const { answers } = req.body;

    // Optional: additional server-side validation for type consistency
    for (const ans of answers) {
      if (ans.type === 1 && !ans.selectedOption) {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(errorResponse("selectedOption is required when type=1"));
        return;
      }
      if (
        ans.type === 2 &&
        (!ans.selectedAddress ||
          !ans.selectedAddress.state ||
          !ans.selectedAddress.city)
      ) {
        res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(
            errorResponse(
              "selectedAddress with state & city is required when type=2"
            )
          );
        return;
      }
    }

    // Map userId automatically from authenticated user
    await Answer.createValidated({
      answers,
      isDeleted: false,
    });
    // Get plants recommendations
    const recommendedPlants = await getRecommendedPlants(answers);

    // Get partner recommendations
    const recommendedPartners = await getRecommendedPartners(answers);

    res.status(HTTP_STATUS.CREATED).json(
      successResponse(
        {
          plantRecommendations: recommendedPlants.map((p) => ({
            id: p._id,
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
    if (err instanceof ZodError) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ errors: err.issues });
      return;
    }
    next(err);
  }
};
