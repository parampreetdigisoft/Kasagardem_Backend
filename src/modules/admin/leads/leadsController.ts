import { Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AuthRequest } from "../../../core/middleware/authMiddleware";
import { HTTP_STATUS } from "../../../core/utils/constants";
import {
  errorResponse,
  successResponse,
} from "../../../core/utils/responseFormatter";
import { error, info } from "../../../core/utils/logger";
import User from "../../auth/authModel";
import Lead from "./leadsModule";
import PartnerProfile, {
  IPartnerProfile,
} from "../../partnerProfile/partnerProfileModel";
import { sendLeadEmails } from "../../../core/services/emailService";

// extended type for response
export interface IPartnerProfileResponse extends Omit<IPartnerProfile, "_id"> {
  partnerProfileId: string;
}

/**
 * Retrieves all leads from the database.
 * Validates the authenticated user and returns all leads.
 *
 * @param req - Express request object
 * @param res - Express response object for sending the API response
 * @param next - Express next middleware function for error handling
 * @returns Promise<void>
 */
export const getAllLeads = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userPayload = req.user as
    | { userEmail?: string; role?: string }
    | undefined;

  if (!userPayload?.userEmail || userPayload?.role === "User") {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("Unauthorized"));
    return;
  }

  const user = await User.findOne({ email: userPayload?.userEmail });
  if (!user) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("User not found"));
    return;
  }

  try {
    await info("Get all leads request started", {}, { userId: user._id });

    // Retrieve all leads
    const leads = await Lead.aggregate([
      { $match: { isDeleted: false } },
      { $sort: { createdAt: -1 } },
      {
        $project: {
          __v: 0,
          isDeleted: 0,
          createdAt: 0,
          updatedAt: 0, // removed timestamps
        },
      },
    ]);

    // Enrich each lead with user info + partnerProfiles
    const formattedLeads = await Promise.all(
      leads.map(async ({ _id, userId, partnerProfileIds, ...rest }) => {
        // Fetch user details
        const leadUser = await User.findById(userId).select("name email");

        // Fetch partner profiles
        const partnerProfiles: IPartnerProfileResponse[] = [];
        for (const pid of partnerProfileIds) {
          const profile = await PartnerProfile.findById(pid)
            .select("-__v -createdAt -updatedAt") // remove unwanted fields
            .lean();
          if (profile) {
            const { _id, ...profileRest } = profile;
            partnerProfiles.push({
              partnerProfileId: _id.toString(),
              ...profileRest,
            });
          }
        }

        return {
          leadId: _id,
          user: leadUser
            ? { name: leadUser.name, email: leadUser.email }
            : null,
          partnerProfiles,
          ...rest,
        };
      })
    );

    await info(
      "Leads retrieved successfully",
      { leadsCount: formattedLeads.length },
      { userId: user._id }
    );

    res
      .status(HTTP_STATUS.OK)
      .json(
        successResponse({ formattedLeads }, "All Leads fetched successfully")
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
 * Handles the creation of a new lead.
 * Validates the authenticated user, checks for duplicate leads,
 * and saves the new lead to the database if valid.
 *
 * @param req - Express request object containing lead data in the body
 * @param res - Express response object for sending the API response
 * @param next - Express next middleware function for error handling
 * @returns Promise<void>
 */
export const createLead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userPayload = req.user as
    | { userEmail?: string; role?: string }
    | undefined;
  if (!userPayload?.userEmail || userPayload?.role !== "User") {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("Unauthorized"));
    return;
  }

  const user = await User.findOne({ email: userPayload?.userEmail });
  if (!user) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("User not found"));
    return;
  }

  try {
    const { partnerProfileIds } = req.body;

    if (!Array.isArray(partnerProfileIds) || partnerProfileIds.length === 0) {
      res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(errorResponse("partnerProfileIds must be a non-empty array"));
      return;
    }

    await info(
      "Lead creation attempt started",
      { partnerProfileIds, userId: user._id },
      { userId: user._id }
    );

    // Create leads for all partnerProfileIds
    const createdLead = await Lead.createValidated({
      partnerProfileIds, // array of IDs
      userId: user._id.toString(),
      leadsStatus: "new",
      isDeleted: false,
    });

    await info(
      "Leads created successfully",
      { partnerProfileIds, userId: user._id },
      { userId: user._id }
    );

    const partnerProfiles: IPartnerProfile[] = [];

    for (const id of partnerProfileIds) {
      const profile = await await PartnerProfile.findById(id);

      if (profile) {
        partnerProfiles.push(profile);
      }
    }

    if (partnerProfiles.length === 0) {
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(errorResponse("No valid partner profiles found"));
      return;
    }

    // Prepare partner data for emails
    const partnersData = partnerProfiles.map((profile) => ({
      email: profile.email!,
      name: profile.companyName!,
      logoUrl: profile.projectImageUrl!,
    }));

    // Prepare user data
    const userData = {
      email: "gurpreetsingh02979@gmail.com",
      name: user.name!,
    };

    // Prepare lead details
    const leadDetails = {
      phone: user.phoneNumber!,
      message: req.body.message!,
      service: req.body.service!,
      leadId: createdLead._id.toString(),
      timestamp: new Date().toLocaleString(),
    };

    // Get admin email from environment variable
    const adminEmail = "ranjeet.singh@digisoftsolution.com";

    // Send emails to user, partners, and admin
    try {
      await sendLeadEmails(userData, partnersData, adminEmail, leadDetails);

      await info(
        "Lead created & emails sent successfully to the user , partner & admin",
        { leadId: createdLead._id, recipientCount: partnersData.length + 2 },
        { userId: user._id }
      );
    } catch (emailError: unknown) {
      const errObj =
        emailError instanceof Error
          ? {
              message: emailError.message,
              stack: emailError.stack,
              leadId: createdLead._id,
            }
          : { error: String(emailError), leadId: createdLead._id };

      await error("Failed to send lead emails", errObj);
    }

    res
      .status(HTTP_STATUS.CREATED)
      .json(successResponse(null, "New Leads created successfully"));
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ errors: err.issues });
      return;
    }
    next(err);
  }
};
