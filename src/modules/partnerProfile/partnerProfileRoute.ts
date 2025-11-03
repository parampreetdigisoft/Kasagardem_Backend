// src/modules/partnerProfile/partnerProfileRoutes.ts
import { Router } from "express";
import {
  createPartnerProfile,
  updatePartnerProfile,
  deletePartnerProfile,
  getAllPartnerProfiles,
  updatePartnerRating,
} from "./partnerProfileController";
import {
  createPartnerProfileValidation,
  updatePartnerProfileValidation,
  updatePartnerRatingValidation,
} from "./partnerProfileValidation";
import validateRequest from "../../core/middleware/validateRequest";
import auth from "../../core/middleware/authMiddleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: PartnerProfile
 *   description: Partner profile management endpoints
 */

/**
 * @swagger
 * /api/v1/partnerProfile:
 *   post:
 *     summary: Create partner profile
 *     description: Creates a profile for the authenticated partner. Each partner can have only one profile.
 *     tags: [PartnerProfile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: partner@example.com
 *               mobileNumber:
 *                 type: string
 *                 example: "+14155552671"
 *               companyName:
 *                 type: string
 *                 example: Acme Solutions
 *               speciality:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["cardiology", "telemedicine"]
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                     example: "123 Main St"
 *                   city:
 *                     type: string
 *                     example: "New York"
 *                   state:
 *                     type: string
 *                     example: "NY"
 *                   country:
 *                     type: string
 *                     example: "USA"
 *                   zipCode:
 *                     type: string
 *                     example: "10001"
 *               website:
 *                 type: string
 *                 example: "https://acme.example.com"
 *               contactPerson:
 *                 type: string
 *                 example: "Jane Doe"
 *               projectImageUrl:
 *                 type: string
 *                 description: URL
 *               status:
 *                 type: string
 *                 enum: [active, inactive, pending, suspended]
 *     responses:
 *       201:
 *         description: Profile created successfully
 *       409:
 *         description: Profile already exists
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Validation error
 */
router.post(
  "/",
  auth,
  validateRequest(createPartnerProfileValidation),
  createPartnerProfile
);

/**
 * @swagger
 * /api/v1/partnerProfile:
 *   get:
 *     summary: Get all partner profiles
 *     tags: [PartnerProfile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All profiles retrieved successfully
 *       404:
 *         description: No profiles found
 *       401:
 *         description: Unauthorized
 */
router.get("/", auth, getAllPartnerProfiles);

/**
 * @swagger
 * /api/v1/partnerProfile/{id}:
 *   put:
 *     summary: Update a partner's profile by ID
 *     tags: [PartnerProfile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Partner profile ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: partner@example.com
 *               mobileNumber:
 *                 type: string
 *                 example: "+14155552671"
 *               companyName:
 *                 type: string
 *                 example: Acme Solutions
 *               speciality:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["cardiology", "telemedicine"]
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                     example: "456 Elm St"
 *                   city:
 *                     type: string
 *                     example: "Los Angeles"
 *                   state:
 *                     type: string
 *                     example: "CA"
 *                   country:
 *                     type: string
 *                     example: "USA"
 *                   zipCode:
 *                     type: string
 *                     example: "90001"
 *               website:
 *                 type: string
 *                 example: "https://acme.example.com"
 *               contactPerson:
 *                 type: string
 *                 example: "John Smith"
 *               projectImageUrl:
 *                 type: string
 *                 description: URL
 *               status:
 *                 type: string
 *                 enum: [active, inactive, pending, suspended]
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       404:
 *         description: Profile not found
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Validation error
 */
router.put(
  "/:id",
  auth,
  validateRequest(updatePartnerProfileValidation),
  updatePartnerProfile
);

/**
 * @swagger
 * /api/v1/partnerProfile/rating:
 *   patch:
 *     summary: Update the rating of a partner profile
 *     description: Updates only the rating field of a specific partner profile using the partnerId provided in the request body.
 *     tags: [PartnerProfile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - partnerId
 *               - rating
 *             properties:
 *               partnerId:
 *                 type: string
 *                 description: The unique ID of the partner profile
 *                 example: "652f8e9b4a5c9e5b4a3d9c22"
 *               rating:
 *                 type: number
 *                 description: Rating value between 0 and 5
 *                 example: 4.5
 *     responses:
 *       200:
 *         description: Rating updated successfully
 *       400:
 *         description: Invalid rating value or bad request
 *       404:
 *         description: Partner profile not found
 *       401:
 *         description: Unauthorized
 */
router.patch(
  "/rating",
  auth,
  validateRequest(updatePartnerRatingValidation),
  updatePartnerRating
);

/**
 * @swagger
 * /api/v1/partnerProfile/{id}:
 *   delete:
 *     summary: Delete a partner's profile by ID
 *     tags: [PartnerProfile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Partner profile ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Profile deleted successfully
 *       404:
 *         description: Profile not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/:id", auth, deletePartnerProfile);

export default router;
