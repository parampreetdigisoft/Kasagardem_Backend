import { Router } from "express";
import {
  register,
  login,
  googleAuth,
  resetPassword,
  verifyPasswordResetToken,
  handlePasswordResetToken,
  refreshTokenLogin,
} from "./authController";
import {
  registerValidation,
  loginValidation,
  resetPasswordValidation,
  verifyPasswordResetTokenValidation,
  handlePasswordResetTokenValidation,
  passwordChangeValidation,
} from "./authValidations";
import validateRequest from "../../core/middleware/validateRequest";
import auth from "../../core/middleware/authMiddleware";

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
 *               roleCode:
 *                 type: string
 *                 description: Code of the role assigned to the user
 *                 example: A
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
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh user token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Refresh Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post("/refresh", auth, refreshTokenLogin);

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
 * /api/v1/auth/resetPassword/auth:
 *   patch:
 *     summary: Reset password using JWT (logged-in user)
 *     description: Allows authenticated users to reset their password using a valid JWT token. The user's email is automatically derived from the token.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: New password to set
 *                 example: SecurePass@2025
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 message: "Password has been reset successfully"
 *                 email: "john@example.com"
 *               message: "Password reset successful"
 *       401:
 *         description: Unauthorized (missing or invalid JWT)
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Unauthorized access"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "User not found"
 *       500:
 *         description: Server error
 */
router.patch(
  "/resetPassword/auth",
  auth,
  validateRequest(passwordChangeValidation),
  resetPassword
);

/**
 * @swagger
 * /api/v1/auth/passwordResetToken:
 *   post:
 *     summary: Send or Resend password reset token
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
 *               isResend:
 *                 type: boolean
 *                 example: false
 *                 description: Pass true if you want to resend a new token
 *     responses:
 *       200:
 *         description: Token sent successfully
 *       404:
 *         description: User not found
 *       429:
 *         description: Rate limit exceeded (if resend too soon)
 *       500:
 *         description: Failed to send email
 */
router.post(
  "/passwordResetToken",
  validateRequest(handlePasswordResetTokenValidation), // you can merge validations if needed
  handlePasswordResetToken
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
