import { Router } from "express";
import {
  register,
  login,
  resetPassword,
  verifyPasswordResetToken,
  handlePasswordResetToken,
  refreshTokenLogin,
  googleAuth,
} from "./authController";
import {
  registerValidation,
  loginValidation,
  resetPasswordValidation,
  verifyPasswordResetTokenValidation,
  handlePasswordResetTokenValidation,
  passwordChangeValidation,
  googleAuthValidation,
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
 *   get:
 *     summary: Refresh user token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Refresh Login successful
 *       401:
 *         description: Invalid credentials
 */
router.get("/refresh", auth, refreshTokenLogin);

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

/**
 * @swagger
 * /api/v1/auth/google:
 *   post:
 *     summary: Sign in or sign up with Google (Firebase Authentication)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Firebase ID token obtained from Google Sign-In
 *                 example: eyJhbGciOiJSUzI1NiIsImtpZCI6IjFkYzBmM...
 *               roleCode:
 *                 type: string
 *                 description: Optional role code for new users (defaults to 'user').
 *                 example: U
 *     responses:
 *       200:
 *         description: Authentication successful
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
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: Your backend JWT token for API authentication
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     isNewUser:
 *                       type: boolean
 *                       description: True if this is a new user registration, false if existing user
 *                       example: false
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: 507f1f77bcf86cd799439011
 *                         name:
 *                           type: string
 *                           example: John Doe
 *                         email:
 *                           type: string
 *                           example: john@gmail.com
 *                         profilePicture:
 *                           type: string
 *                           example: https://lh3.googleusercontent.com/a/...
 *       400:
 *         description: Validation error or invalid Firebase token
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
 *                   example: Firebase ID token is required
 *       401:
 *         description: Invalid or expired Firebase token
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
 *                   example: Invalid or expired Firebase token
 */
router.post("/google", validateRequest(googleAuthValidation), googleAuth);

export default router;
