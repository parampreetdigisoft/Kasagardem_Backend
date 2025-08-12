const express = require("express");
const router = express.Router();
const {
  createUserProfile,
  getCurrentUserProfile,
  updateUserProfile,
  deleteUserProfile,
} = require("./userProfileController");
const {
  createUserProfileValidation,
  updateUserProfileValidation,
} = require("./userProfileValidations");
const validateRequest = require("../../core/middleware/validateRequest");
const auth = require("../../core/middleware/authMiddleware");

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
 *               profileImageUrl:
 *                 type: string
 *                 example: https://example.com/profile.jpg
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     userId:
 *                       type: string
 *                     profileImageUrl:
 *                       type: string
 *                     dateOfBirth:
 *                       type: string
 *                       format: date
 *                     gender:
 *                       type: string
 *                       enum: [male, female, other]
 *                     bio:
 *                       type: string
 *                     address:
 *                       type: object
 *                     socialLinks:
 *                       type: object
 *                     occupation:
 *                       type: string
 *                     company:
 *                       type: string
 *                 message:
 *                   type: string
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
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profileImageUrl:
 *                 type: string
 *                 example: https://example.com/profile.jpg
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
 *                 example: Updated bio description
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   country:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *               occupation:
 *                 type: string
 *                 example: Senior Developer
 *               company:
 *                 type: string
 *                 example: New Company Inc
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

module.exports = router;
