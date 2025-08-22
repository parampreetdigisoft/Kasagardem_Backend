import { Router } from "express";
import {
  register,
  login,
  googleAuth,
  resetPassword,
  sendPasswordResetToken,
  resendPasswordResetToken,
  verifyPasswordResetToken,
} from "./authController";
import {
  registerValidation,
  loginValidation,
  resetPasswordValidation,
  sendPasswordResetTokenValidation,
  resendPasswordResetTokenValidation,
  verifyPasswordResetTokenValidation,
} from "./authValidations";
import validateRequest from "../../core/middleware/validateRequest";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication routes
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - roleId
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: Secret@123#
 *               roleId:
 *                 type: string
 *                 description: ID of the role assigned to the user
 *                 example: 64f7c9d8e4a1b2a345678901
 *               phoneNumber:
 *                 type: string
 *                 description: User's phone number (optional)
 *                 example: +91 9876543210
 *     responses:
 *       201:
 *         description: User registered successfully
 *       409:
 *         description: Email already exists
 */
router.post("/register", validateRequest(registerValidation), register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: secret123
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", validateRequest(loginValidation), login);

/**
 * @swagger
 * /api/v1/auth/google:
 *   post:
 *     summary: Register or login user using Google OAuth
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *               - roleId
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID token obtained from client-side Google Sign-In
 *                 example: "eyJhbGciOiJSUzI1NiIsImtpZCI6Ij..."
 *               roleId:
 *                 type: string
 *                 description: Role ID to assign the user (if registering new)
 *                 example: "64f7c9d8e4a1b2a345678901"
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                 message:
 *                   type: string
 *       201:
 *         description: New user registered successfully
 *       400:
 *         description: Invalid or missing Google token or roleId
 *       401:
 *         description: Invalid Google token
 *       409:
 *         description: Email already registered with different method
 */
router.post("/google", googleAuth);

/**
 * @swagger
 * /api/v1/auth/resetPassword:
 *   patch:
 *     summary: Reset password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - token
 *             properties:
 *               email:
 *                 type: string
 *                 description: Registered email of the user
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: New password for the user
 *                 example: newSecret123
 *               token:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid request
 *       404:
 *         description: User not found
 */

router.patch(
  "/resetPassword",
  validateRequest(resetPasswordValidation),
  resetPassword
);

/**
 * @swagger
 * /api/v1/auth/sendVerificationToken:
 *   post:
 *     summary: Send 4-digit verification token to email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *     responses:
 *       200:
 *         description: Verification token sent successfully
 *       404:
 *         description: User not found
 *       400:
 *         description: Email already verified
 */
router.post(
  "/sendVerificationToken",
  validateRequest(sendPasswordResetTokenValidation),
  sendPasswordResetToken
);

/**
 * @swagger
 * /api/v1/auth/resendVerificationToken:
 *   post:
 *     summary: Resend verification token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *     responses:
 *       200:
 *         description: New verification token sent
 *       404:
 *         description: User not found
 *       429:
 *         description: Rate limit exceeded
 */
router.post(
  "/resendVerificationToken",
  validateRequest(resendPasswordResetTokenValidation),
  resendPasswordResetToken
);

/**
 * @swagger
 * /api/v1/auth/verifyToken:
 *   post:
 *     summary: Verify password reset token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - token
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               token:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Token verified successfully
 *       400:
 *         description: Invalid or expired token
 *       404:
 *         description: User not found
 */

router.post(
  "/verifyToken",
  validateRequest(verifyPasswordResetTokenValidation),
  verifyPasswordResetToken
);

export default router;
