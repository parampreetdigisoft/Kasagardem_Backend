import express, { Router } from "express";
import auth from "../../../core/middleware/authMiddleware";
import validateRequest from "../../../core/middleware/validateRequest";
import { createLead, getAllLeads } from "./leadsController";
import { leadValidation } from "./leadsValidation";

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
 *         partnerProfileId:
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
 *         - partnerProfileIds
 *       properties:
 *         partnerProfileIds:
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
 *   post:
 *     summary: Create new leads
 *     description: Create multiple leads using an array of partnerProfileIds
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LeadInput'
 *           example:
 *             partnerProfileIds: ["64f5a7b2c1234567890abcdf", "64f5a7b2c1234567890abce1"]
 *     responses:
 *       201:
 *         description: Leads created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               success: true
 *               message: "Leads created successfully"
 *               data:
 *                 createdLeads:
 *                   - partnerProfileId: "64f5a7b2c1234567890abcdf"
 *                   - partnerProfileId: "64f5a7b2c1234567890abce1"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       409:
 *         description: Conflict - One or more leads already exist for the given partnerProfileIds and user
 */

router.post("/leads", auth, validateRequest(leadValidation), createLead);

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
 *                     partnerProfileId: "64f5a7b2c1234567890abcdf"
 *                     userId: "64f5a7b2c1234567890abce0"
 *                     leadsStatus: "new"
 *                     createdAt: "2024-01-20T10:30:00Z"
 *                     updatedAt: "2024-01-20T10:30:00Z"
 *                   - leadId: "64f5a7b2c1234567890abce1"
 *                     partnerProfileId: "64f5a7b2c1234567890abcdf"
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

export default router;
