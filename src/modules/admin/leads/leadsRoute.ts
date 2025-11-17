import express, { Router } from "express";
import auth from "../../../core/middleware/authMiddleware";
import validateRequest from "../../../core/middleware/validateRequest";
import {
  createLeadController,
  getAllLeads,
  updateLeadStatusController,
} from "./leadsController";
import { leadValidation, updateLeadStatus } from "./leadsValidation";

const router: Router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Leads
 *   description: API for managing leads
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Lead:
 *       type: object
 *       properties:
 *         leadId:
 *           type: string
 *           description: Unique ID of the lead
 *           example: "64f5a7b2c1234567890abcde"
 *         partnerId:
 *           type: string
 *           description: Reference ID of the partner profile associated with this lead
 *           example: "64f5a7b2c1234567890abcdf"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the lead was created
 *           example: "2024-01-20T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the lead was last updated
 *           example: "2024-01-20T12:00:00Z"
 *
 *     LeadInput:
 *       type: object
 *       required:
 *         - partnerIds
 *       properties:
 *         partnerIds:
 *           type: array
 *           description: Array of partner profile IDs to create new leads
 *           items:
 *             type: string
 *           example:
 *             - "64f5a7b2c1234567890abcdf"
 *             - "64f5a7b2c1234567890abce1"
 */

/**
 * @swagger
 * /api/v1/admin/leads:
 *   get:
 *     summary: Get paginated leads
 *     description: Retrieve leads with pagination (default 5 per page)
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: Leads retrieved successfully
 */

router.post(
  "/leads",
  auth,
  validateRequest(leadValidation),
  createLeadController
);

/**
 * @swagger
 * /api/v1/admin/leads:
 *   get:
 *     summary: Get all leads
 *     description: Retrieve all leads without pagination
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leads retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         formattedLeads:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Lead'
 *             example:
 *               success: true
 *               message: "Leads retrieved successfully"
 *               data:
 *                 formattedLeads:
 *                   - leadId: "64f5a7b2c1234567890abcde"
 *                     partnerId: "64f5a7b2c1234567890abcdf"
 *                     userId: "64f5a7b2c1234567890abce0"
 *                     leadsStatus: "new"
 *                     createdAt: "2024-01-20T10:30:00Z"
 *                     updatedAt: "2024-01-20T10:30:00Z"
 *                   - leadId: "64f5a7b2c1234567890abce1"
 *                     partnerId: "64f5a7b2c1234567890abcdf"
 *                     userId: "64f5a7b2c1234567890abce2"
 *                     leadsStatus: "converted"
 *                     createdAt: "2024-01-20T11:15:00Z"
 *                     updatedAt: "2024-01-20T12:00:00Z"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       500:
 *         description: Internal server error
 */
router.get("/leads", auth, getAllLeads);

/**
 * @swagger
 * /api/v1/admin/leads/{id}/status:
 *   put:
 *     summary: Update lead status
 *     description: Update only the leads_status field of a lead entry
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lead ID
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - leads_status
 *             properties:
 *               leads_status:
 *                 type: string
 *                 enum: [new, pending, contacted, converted, rejected]
 *                 example: "converted"
 *
 *     responses:
 *       200:
 *         description: Lead status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Lead status updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     leads_status:
 *                       type: string
 *                     updated_at:
 *                       type: string
 *
 *       400:
 *         description: Validation error
 *       404:
 *         description: Lead not found
 *       500:
 *         description: Internal server error
 */
router.put(
  "/leads/:id/status",
  auth,
  validateRequest(updateLeadStatus),
  updateLeadStatusController
);

export default router;
