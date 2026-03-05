import express, { Router } from "express";
import auth from "../../core/middleware/authMiddleware";
import { uploadCsv } from "../../core/middleware/uploadCsv";
import { extractUsersFromCsv } from "../../core/middleware/extractUserFromCsv";
import { createProfessionlals, getAllLeads, getAllProfessionalProfiles, getprofessionalsProfile, getSortedProfessionals,  leadCreatedByProfessional,  registerProfessionals, updateProfessionalProfile  } from "./professionalController";
const router: Router = express.Router();

/**
 * @swagger
 * /api/v1/professional/import:
 *   post:
 *     summary: Register professionals via CSV upload
 *     description: Upload a CSV file to create multiple professionals at once. Requires authentication.
 *     tags:
 *       - Professionals
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file containing professionals data
 *     responses:
 *       201:
 *         description: Professionals created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Professionals registered successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Invalid file or validation error
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Server error
 */
router.post(
  "/import",
  auth,
  uploadCsv.single("file"),
  extractUsersFromCsv,
  createProfessionlals
);
// router.post("/import", auth,   uploadCsv.single("file"), extractUsersFromCsv, createProfessionlals);
/**
 * @swagger
 * /api/v1/professional:
 *   get:
 *     summary: Get all professional profiles
 *     description: Retrieve a list of all professional profiles. Requires authentication.
 *     tags:
 *       - Professionals
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Professional profiles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Professional profiles fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: 64f123abc456def789ghi012
 *                       firstName:
 *                         type: string
 *                         example: John
 *                       lastName:
 *                         type: string
 *                         example: Doe
 *                       email:
 *                         type: string
 *                         example: john.doe@example.com
 *                       profession:
 *                         type: string
 *                         example: Software Engineer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2024-01-15T10:30:00Z
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2024-01-20T12:00:00Z
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Server error
 */
router.get("/", auth, getAllProfessionalProfiles);


/**
 * @swagger
 * /api/v1/professional/register:
 *   post:
 *     summary: Register a professional
 *     description: Allows an Admin user to register a professional by professionalId and email.
 *     tags:
 *       - Professionals
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - professionalId
 *               - email
 *             properties:
 *               professionalId:
 *                 type: string
 *                 example: "PROF12345"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "professional@example.com"
 *     responses:
 *       200:
 *         description: Professional registered successfully
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
 *                   example: Professional registered successfully
 *                 data:
 *                   type: object
 *                   example:
 *                     professionalId: "PROF12345"
 *                     status: "Registered"
 *       400:
 *         description: Bad request (Missing fields or email mismatch)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized (Invalid token or role not Admin)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Professional not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/register", auth, registerProfessionals);

/**
 * @swagger
 * /api/v1/professional/getSortedProfessionals:
 *   get:
 *     summary: Get professionals sorted by distance, subscription priority, and rating
 *     description: >
 *       Returns a list of professionals sorted primarily by nearest distance 
 *       (based on user latitude and longitude), then by subscription priority,
 *       and finally by rating. Supports optional category filtering and pagination.
 *     tags:
 *       - Professionals
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *           format: float
 *         description: User latitude
 *         example: 12.9716
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *           format: float
 *         description: User longitude
 *         example: 77.5946
 *       - in: query
 *         name: category
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter professionals by category
 *         example: plumber
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Number of results to return (max 100)
 *         example: 20
 *       - in: query
 *         name: offset
 *         required: false
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Pagination offset
 *         example: 0
 *     responses:
 *       200:
 *         description: Sorted professionals retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 20
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       company_name:
 *                         type: string
 *                       category:
 *                         type: string
 *                       city:
 *                         type: string
 *                       state:
 *                         type: string
 *                       assessment:
 *                         type: number
 *                         format: float
 *                       distance:
 *                         type: number
 *                         format: float
 *                         description: Distance in kilometers
 *       400:
 *         description: Invalid or missing latitude/longitude
 *       401:
 *         description: Unauthorized (Bearer token required)
 *       500:
 *         description: Internal server error
 */
router.get("/getSortedProfessionals",auth, getSortedProfessionals);

/**
 * @swagger
 * /api/v1/professional/ProfessionalsProfile:
 *   get:
 *     summary: Get authenticated professional profile
 *     description: Retrieves the professional profile details of the currently authenticated user.
 *     tags:
 *       - Professionals
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Professional profile retrieved successfully
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
 *                   example: Professional profile retrieved successfully
 *                 data:
 *                   type: object
 *                   description: Professional profile object
 *       401:
 *         description: Unauthorized (Invalid token, user not found, or invalid user ID)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       404:
 *         description: Professional profile not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Professional profile not found
 *       500:
 *         description: Internal server error
 */
router.get("/ProfessionalsProfile", auth, getprofessionalsProfile);


/**
 * @swagger
 * /api/v1/professional/update:
 *   patch:
 *     summary: Update professional profile
 *     description: Allows an authenticated professional to update their name, email, and profile image. Any field can be updated individually.
 *     tags: [Professionals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: johndoe@example.com
 *               profileImage:
 *                 type: string
 *                 description: Base64 encoded image string (data:image/...;base64,...)
 *                 example: data:image/jpeg;base64,/9j/4AAQSkZJRgABAQE...
 *     responses:
 *       200:
 *         description: Professional profile updated successfully
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
 *                   example: Professional profile updated successfully
 *       400:
 *         description: Invalid input or email already exists
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User or profile not found
 *       500:
 *         description: Internal server error
 */
router.patch("/update", auth,  updateProfessionalProfile);

/**
 * @swagger
 * /api/v1/professional/createLeads:
 *   post:
 *     summary: Create new leads for multiple professionals
 *     tags:
 *       - Professionals
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - professionalIds
 *             properties:
 *               professionalIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 example:
 *                   - b3bf7ac3-7724-40ff-b998-c353f231412f
 *                   - a2cd7ac3-1111-40ff-b998-c353f2314999
 *     responses:
 *       201:
 *         description: Leads created successfully
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
 *                   example: Leads created successfully
 *       401:
 *         description: Unauthorized or User not found
 *       500:
 *         description: Failed to create leads
 */
router.post("/createLeads", auth , leadCreatedByProfessional);


router.get("/getLeads",auth, getAllLeads);


 

export default router;