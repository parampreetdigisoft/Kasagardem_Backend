import { Router } from "express";
import {
  getCurrentUserProfile,
  updateUserProfile,
} from "./userProfileController";
import { updateUserProfileValidation } from "./userProfileValidations";
import validateRequest from "../../core/middleware/validateRequest";
import auth from "../../core/middleware/authMiddleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: UserProfile
 *   description: User profile management endpoints
 */

/**
 * @swagger
 * /api/v1/userProfile:
 *   get:
 *     summary: Get current user's profile
 *     tags: [UserProfile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       404:
 *         description: Profile not found
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.get("/", auth, getCurrentUserProfile);

/**
 * @swagger
 * /api/v1/userProfile:
 *   put:
 *     summary: Update current user's profile
 *     tags: [UserProfile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profileImage:
 *                 type: string
 *                 description: Base64 encoded image string (uploaded to S3 Bucket)
 *                 example: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 description: User's date of birth (cannot be in the future)
 *                 example: "1990-01-01"
 *               gender:
 *                 type: string
 *                 enum: [male, female, other, ""]
 *                 description: User's gender (optional)
 *                 example: "female"
 *               bio:
 *                 type: string
 *                 maxLength: 500
 *                 description: Short biography or personal summary
 *                 example: "Experienced software engineer with 8+ years in backend development."
 *               street:
 *                 type: string
 *                 description: Street address (optional)
 *                 example: "456 Elm St"
 *               city:
 *                 type: string
 *                 description: City (optional)
 *                 example: "Los Angeles"
 *               state:
 *                 type: string
 *                 description: State or province (optional)
 *                 example: "CA"
 *               country:
 *                 type: string
 *                 description: Country (optional)
 *                 example: "USA"
 *               zipCode:
 *                 type: string
 *                 description: Postal or ZIP code (optional)
 *                 example: "90001"
 *               occupation:
 *                 type: string
 *                 maxLength: 255
 *                 description: User's current occupation or job title
 *                 example: "Senior Developer"
 *               company:
 *                 type: string
 *                 maxLength: 255
 *                 description: User's company or organization
 *                 example: "InnovateTech Inc"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation failed or image upload error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
router.put(
  "/",
  auth,
  validateRequest(updateUserProfileValidation),
  updateUserProfile
);

export default router;
