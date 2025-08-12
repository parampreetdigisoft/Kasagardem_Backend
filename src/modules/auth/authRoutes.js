const express = require("express");
const router = express.Router();

const { register, login, getProfile, googleAuth } = require("./authController");
const { registerValidation, loginValidation } = require("./authValidations");
const validateRequest = require("../../core/middleware/validateRequest");
const auth = require("../../core/middleware/authMiddleware");

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
 *                 example: secret123
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
 * /api/v1/auth/profile:
 *   get:
 *     summary: Get user profile (protected)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Unauthorized, token missing or invalid
 */
router.get("/profile", auth, getProfile);

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

module.exports = router;
