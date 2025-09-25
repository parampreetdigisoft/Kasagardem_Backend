import { Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AuthRequest } from "../../../core/middleware/authMiddleware";
import { HTTP_STATUS, MESSAGES } from "../../../core/utils/constants";
import {
  errorResponse,
  successResponse,
} from "../../../core/utils/responseFormatter";
import { info } from "../../../core/utils/logger";
import User from "../../auth/authModel";
import Rule from "./rulesModel";
import Question, { IQuestionDocument } from "../questions/questionModel";
import mongoose, { Types } from "mongoose";

// Define a clean type for the API response
type RuleResponse = {
  _id: mongoose.Types.ObjectId;
  name: string;
  affiliateFor: string;
  conditions: {
    questionId: mongoose.Types.ObjectId;
    questionText: string;
    operator: "and" | "or";
    values: string[];
  }[];
};

/**
 * Get all rules
 * @param req
 * @param res
 * @param next
 */
export const getAllRules = async (
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
    await info("Get all rules request started", {}, { userId: user._id });

    // Populate questionId with questionText from Question collection
    const rules = await Rule.find({ isDeleted: false })
      .populate<{
        conditions: {
          questionId: IQuestionDocument;
          operator: "and" | "or";
          values: string[];
        }[];
      }>("conditions.questionId", "questionText")
      .lean();

    // Transform rules to include questionText in each condition
    const transformedRules: RuleResponse[] = rules.map((rule) => ({
      _id: rule._id,
      name: rule.name,
      affiliateFor: rule.affiliateFor!,
      conditions: rule.conditions.map((cond) => ({
        questionId: cond.questionId._id,
        questionText: cond.questionId.questionText,
        operator: cond.operator,
        values: cond.values,
      })),
    }));

    await info(
      "Rules retrieved successfully",
      { rulesCount: rules.length },
      { userId: user._id }
    );

    res
      .status(HTTP_STATUS.OK)
      .json(
        successResponse({ rules: transformedRules }, MESSAGES.RULES_RETRIEVED)
      );
  } catch (err) {
    next(err);
  }
};

/**
 * Create new rule
 * @param req
 * @param res
 * @param next
 */
export const createRule = async (
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
    await info("Rule creation attempt started", req.body, { userId: user._id });

    const { conditions } = req.body;

    // Validate that all questionIds exist
    const questionIds = conditions.map(
      (c: { questionId: string }) => new Types.ObjectId(c.questionId)
    );
    const existingQuestions = await Question.find({
      _id: { $in: questionIds },
      isDeleted: false,
    }).lean();

    if (existingQuestions.length !== questionIds.length) {
      res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(errorResponse("Some questionIds are invalid or do not exist"));
      return;
    }

    const payload = {
      ...req.body,
      isDeleted: false, // always default to false
    };

    const newRule = await Rule.createValidated(payload);

    await info(
      "Rule created successfully",
      { ruleId: newRule._id },
      { userId: user._id }
    );

    res
      .status(HTTP_STATUS.CREATED)
      .json(successResponse(newRule, MESSAGES.RULE_CREATED));
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ errors: err.issues });
      return;
    }
    next(err);
  }
};

/**
 * Update rule by ID
 * @param req
 * @param res
 * @param next
 */
export const updateRule = async (
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
    await info(
      "Rule update attempt started",
      { ruleId: req.params.id, body: req.body },
      { userId: user._id }
    );

    const updatedRule = await Rule.updateValidated(req.params.id!, req.body);

    if (!updatedRule) {
      res.status(HTTP_STATUS.NOT_FOUND).json(errorResponse("Rule not found"));
      return;
    }

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse(updatedRule, MESSAGES.RULE_UPDATED));
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ errors: err.issues });
      return;
    }
    next(err);
  }
};

/**
 * Delete rule by ID
 * @param req
 * @param res
 * @param next
 */
export const deleteRule = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const deleted = await Rule.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(HTTP_STATUS.NOT_FOUND).json(errorResponse("Rule not found"));
      return;
    }

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse(null, MESSAGES.RULE_DELETED));
  } catch (err) {
    next(err);
  }
};
