import { Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AuthRequest } from "../../../core/middleware/authMiddleware";
import { HTTP_STATUS } from "../../../core/utils/constants";
import {
  errorResponse,
  successResponse,
} from "../../../core/utils/responseFormatter";
import { error, info } from "../../../core/utils/logger";
import { createLead, findAllLeads } from "./leadsModule"; // ✅ functional PostgreSQL module
import { sendLeadEmails } from "../../../core/services/emailService";
import config from "../../../core/config/env";
import { getDB } from "../../../core/config/db";
import { findUserByEmail } from "../../auth/authRepository";

interface PartnerProfile {
  id: string;
  email: string;
  company_name: string;
  projectimageurl: string | null;
}

interface PartnerData {
  email: string;
  name: string;
  logoUrl: string;
}

/**
 * Get all leads (PostgreSQL version)
 * @param req
 * @param res
 * @param next
 */
export const getAllLeads = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userPayload = req.user as
      | { userEmail?: string; role?: string }
      | undefined;

    if (!userPayload?.userEmail || userPayload?.role === "User") {
      res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("Unauthorized"));
      return;
    }

    await info("Fetching all leads from PostgreSQL");

    const leads = await findAllLeads(); // ✅ uses PostgreSQL

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse(leads, "All leads fetched successfully"));
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ errors: err.issues });
      return;
    }
    next(err);
  }
};

/**
 * Create a new lead (PostgreSQL version)
 * @param req
 * @param res
 * @param next
 */
export const createLeadController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userPayload = req.user as
      | { userEmail?: string; role?: string; userId?: string }
      | undefined;

    if (!userPayload?.userEmail || userPayload?.role !== "User") {
      res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("Unauthorized"));
      return;
    }

    const { partnerIds, message, service } = req.body;

    if (!Array.isArray(partnerIds) || partnerIds.length === 0) {
      res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(errorResponse("partnerIds must be a non-empty array"));
      return;
    }

    // ✅ Create lead in DB
    const createdLead = await createLead({
      partnerIds,
      userId: userPayload.userId,
      leadsStatus: "new",
      isDeleted: false,
    });

    if (!createdLead) {
      res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json(errorResponse("Lead could not be created"));
      return;
    }

    // ✅ Immediately send success response (non-blocking)
    res
      .status(HTTP_STATUS.CREATED)
      .json(successResponse(null, "Lead created successfully"));

    // ✅ Run background email task (does not block response)
    (async (): Promise<void> => {
      try {
        const userRecord = await findUserByEmail(userPayload.userEmail!);
        const userData = {
          email: userPayload.userEmail!,
          name: userRecord?.name ?? "User",
        };

        const db = getDB();
        const query = `
          SELECT id, email, company_name, project_image_url
          FROM public.partner_profiles
          WHERE id = ANY($1::uuid[])
          ORDER BY id ASC;
        `;

        const { rows } = await db.query<PartnerProfile>(query, [partnerIds]);

        const partnersData: PartnerData[] = rows.map((row) => ({
          email: row.email,
          name: row.company_name,
          logoUrl: row.projectimageurl || "",
        }));

        const leadDetails = {
          phone: userRecord?.phone_number ?? "N/A",
          message,
          service,
          leadId: createdLead.id!,
          timestamp: new Date().toLocaleString(),
        };

        await sendLeadEmails(
          userData,
          partnersData,
          config.ADMIN_EMAIL,
          leadDetails
        );
        await info("Lead emails sent successfully", { leadId: createdLead.id });
      } catch (emailError) {
        await error("Failed to send lead emails", {
          message:
            emailError instanceof Error
              ? emailError.message
              : String(emailError),
          leadId: createdLead.id,
        });
      }
    })();
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ errors: err.issues });
      return;
    }
    next(err);
  }
};
