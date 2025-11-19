import { Response, NextFunction } from "express";
import { HTTP_STATUS } from "../../../core/utils/constants";
import {
  errorResponse,
  successResponse,
} from "../../../core/utils/responseFormatter";
import {
  getActiveProfessionalsCount,
  getClosedLeadsCount,
  getLeadStatusCounts,
  getLeadTrendData,
  getTotalLeadsCount,
} from "./dashboardmModel";
import { AuthRequest } from "../../../core/middleware/authMiddleware";
import { AuthUserPayload } from "../../roles/roleController";
import { findUserByEmail } from "../../auth/authRepository";

interface DashboardData {
  total_leads: {
    count: number;
    today: number;
    message: string;
  };
  active_professionals: {
    count: number;
    today: number;
    message: string;
  };
  closed_leads: {
    total: number;
    this_month: number;
    message: string;
  };
  lead_status_counts: Array<{
    leads_status: string;
    count: number;
  }>;
  lead_trend: {
    all_leads: LeadTrendPoint[];
    new_leads: LeadTrendPoint[];
    closed_leads: LeadTrendPoint[];
    contacted_leads: LeadTrendPoint[];
  };
}
interface LeadTrendPoint {
  date: string;
  count: number;
}
let dashboardCache: {
  expiresAt: number;
  data: DashboardData;
} | null = null;

const CACHE_TTL = 2.5 * 60 * 1000; // 2.5 minutes

/**
 * Retrieves complete dashboard analytics including:
 * - Total leads count
 * - Active professionals count
 * - Lead status aggregated counts
 * - Lead generation trend data for charts
 *
 * @param {AuthRequest} req - Authenticated request containing user payload
 * @param {Response} res - Express response object used to send JSON output
 * @param {NextFunction} next - Next middleware for error handling
 * @returns {Promise<void>} Resolves when the response has been sent
 */
export const getDashboardData = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userPayload = req.user as AuthUserPayload | undefined;

  if (!userPayload?.userEmail) {
    res.status(401).json(errorResponse("Unauthorized"));
    return;
  }

  const user = await findUserByEmail(userPayload.userEmail);
  if (!user) {
    res.status(401).json(errorResponse("User not found"));
    return;
  }

  if (userPayload.role !== "Admin") {
    res.status(401).json(errorResponse("Unauthorized Role"));
    return;
  }

  try {
    if (dashboardCache && dashboardCache.expiresAt > Date.now()) {
      res
        .status(HTTP_STATUS.OK)
        .json(successResponse(dashboardCache.data, "Dashboard cache hit"));
      return;
    }

    const [leadCounts, professionals, leadStatuses, leadTrend, closedLeads] =
      await Promise.all([
        getTotalLeadsCount(),
        getActiveProfessionalsCount(),
        getLeadStatusCounts(),
        getLeadTrendData(),
        getClosedLeadsCount(),
      ]);

    const todayMessage =
      leadCounts.today > 0
        ? `Today we will receive ${leadCounts.today} leads`
        : "No leads created today";

    const professionalsMessage =
      professionals.today > 0
        ? `Today, ${professionals.today} professionals joined us.`
        : "No professionals joined today.";

    const dashboard = {
      total_leads: {
        count: leadCounts.total,
        today: leadCounts.today,
        message: todayMessage,
      },
      active_professionals: {
        count: professionals.total,
        today: professionals.today,
        message: professionalsMessage,
      },
      closed_leads: {
        total: closedLeads.total,
        this_month: closedLeads.this_month,
        message:
          closedLeads.this_month > 0
            ? `${closedLeads.this_month} leads closed this month`
            : "No leads closed this month",
      },
      lead_status_counts: leadStatuses,
      lead_trend: leadTrend,
    };

    dashboardCache = {
      expiresAt: Date.now() + CACHE_TTL,
      data: dashboard,
    };

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse(dashboard, "All data retrieved successfully"));
    return;
  } catch (error) {
    next(error);
  }
};
