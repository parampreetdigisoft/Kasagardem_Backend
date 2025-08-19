import { Router } from "express";
import {
  createUserProfile,
  getCurrentUserProfile,
  updateUserProfile,
  deleteUserProfile,
} from "./userProfileController";
import {
  createUserProfileValidation,
  updateUserProfileValidation,
} from "./userProfileValidations";
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
 * /api/v1/profiles:
 *   post:
 *     summary: Create user profile
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
 *                 description: Base64 encoded image string
 *                 example: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: 1990-01-01
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *                 example: male
 *               bio:
 *                 type: string
 *                 maxLength: 500
 *                 example: Software developer passionate about technology
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                     example: 123 Main St
 *                   city:
 *                     type: string
 *                     example: New York
 *                   state:
 *                     type: string
 *                     example: NY
 *                   country:
 *                     type: string
 *                     example: USA
 *                   zipCode:
 *                     type: string
 *                     example: 10001
 *               occupation:
 *                 type: string
 *                 example: Software Developer
 *               company:
 *                 type: string
 *                 example: TechCorp Inc
 *     responses:
 *       201:
 *         description: Profile created successfully
 *       409:
 *         description: Profile already exists
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/",
  auth,
  validateRequest(createUserProfileValidation),
  createUserProfile
);

/**
 * @swagger
 * /api/v1/profiles:
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
 * /api/v1/profiles:
 *   put:
 *     summary: Update current user's profile
 *     tags: [UserProfile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profileImage:
 *                 type: string
 *                 description: Base64 encoded image string
 *                 example: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: 1990-01-01
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *                 example: female
 *               bio:
 *                 type: string
 *                 maxLength: 500
 *                 example: Experienced software engineer
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                     example: 456 Elm St
 *                   city:
 *                     type: string
 *                     example: Los Angeles
 *                   state:
 *                     type: string
 *                     example: CA
 *                   country:
 *                     type: string
 *                     example: USA
 *                   zipCode:
 *                     type: string
 *                     example: 90001
 *               occupation:
 *                 type: string
 *                 example: Senior Developer
 *               company:
 *                 type: string
 *                 example: InnovateTech Inc
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       404:
 *         description: Profile not found
 *       401:
 *         description: Unauthorized
 */

router.put(
  "/",
  auth,
  validateRequest(updateUserProfileValidation),
  updateUserProfile
);

/**
 * @swagger
 * /api/v1/profiles:
 *   delete:
 *     summary: Delete current user's profile
 *     tags: [UserProfile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile deleted successfully
 *       404:
 *         description: Profile not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/", auth, deleteUserProfile);

export default router;
