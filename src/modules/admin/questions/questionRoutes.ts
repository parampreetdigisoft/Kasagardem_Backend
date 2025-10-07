import express, { Router } from "express";
import auth from "../../../core/middleware/authMiddleware";
import validateRequest from "../../../core/middleware/validateRequest";
import { questionValidation } from "./questionValidation";
import {
  createQuestion,
  deleteQuestion,
  getAllQuestions,
  updateQuestion,
} from "./questionController";

const router: Router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Questions
 *   description: API for managing diagnostic questions
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Question:
 *       type: object
 *       required:
 *         - text
 *         - options
 *         - order
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the question
 *           example: "64f5a7b2c1234567890abcde"
 *         text:
 *           type: string
 *           minLength: 5
 *           maxLength: 255
 *           description: The question text
 *           example: "How often do you feel anxious?"
 *         options:
 *           type: array
 *           items:
 *             type: string
 *           minItems: 2
 *           description: Array of answer options
 *           example: ["Never", "Sometimes", "Often", "Always"]
 *         category:
 *           type: string
 *           description: Question category (optional)
 *           example: "Mental Health"
 *         order:
 *           type: integer
 *           minimum: 1
 *           description: Display order of the question
 *           example: 1
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     QuestionInput:
 *       type: object
 *       required:
 *         - text
 *         - options
 *         - order
 *       properties:
 *         text:
 *           type: string
 *           minLength: 5
 *           maxLength: 255
 *           description: The question text
 *           example: "How often do you feel anxious?"
 *         options:
 *           type: array
 *           items:
 *             type: string
 *           minItems: 2
 *           description: Array of answer options
 *           example: ["Never", "Sometimes", "Often", "Always"]
 *         category:
 *           type: string
 *           description: Question category (optional)
 *           example: "Mental Health"
 *         order:
 *           type: integer
 *           minimum: 1
 *           description: Display order of the question
 *           example: 1
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *     ValidationError:
 *       type: object
 *       properties:
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               message:
 *                 type: string
 *               path:
 *                 type: array
 *                 items:
 *                   type: string
 */

/**
 * @swagger
 * /api/v1/admin/question:
 *   post:
 *     summary: Create a new question
 *     description: Create a new diagnostic question with validation
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuestionInput'
 *           example:
 *             text: "How often do you feel anxious?"
 *             options: ["Never", "Sometimes", "Often", "Always"]
 *             order: 1
 *     responses:
 *       201:
 *         description: Question created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Question'
 *             example:
 *               success: true
 *               message: "Created successfully"
 *               data:
 *                 _id: "64f5a7b2c1234567890abcde"
 *                 text: "How often do you feel anxious?"
 *                 options: ["Never", "Sometimes", "Often", "Always"]
 *                 order: 1
 *                 createdAt: "2024-01-20T10:30:00Z"
 *                 updatedAt: "2024-01-20T10:30:00Z"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       409:
 *         description: Conflict - Question with the same text already exists
 */
router.post(
  "/question",
  auth,
  validateRequest(questionValidation),
  createQuestion
);

/**
 * @swagger
 * /api/v1/admin/question/{id}:
 *   put:
 *     summary: Update an existing question
 *     description: Modify details of an existing question by ID with validation
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: The MongoDB ObjectId of the question to update
 *         example: "64f5a7b2c1234567890abcde"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuestionInput'
 *           example:
 *             text: "How frequently do you experience anxiety?"
 *             options: ["Never", "Rarely", "Sometimes", "Often", "Always"]
 *             category: "Mental Health Assessment"
 *             order: 2
 *     responses:
 *       200:
 *         description: Question updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Question'
 *             example:
 *               success: true
 *               message: "Updated successfully"
 *               data:
 *                 _id: "64f5a7b2c1234567890abcde"
 *                 text: "How frequently do you experience anxiety?"
 *                 options: ["Never", "Rarely", "Sometimes", "Often", "Always"]
 *                 category: "Mental Health Assessment"
 *                 order: 2
 *                 createdAt: "2024-01-20T10:30:00Z"
 *                 updatedAt: "2024-01-20T11:15:00Z"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       404:
 *         description: Question not found
 */
router.put(
  "/question/:id",
  auth,
  validateRequest(questionValidation),
  updateQuestion
);

/**
 * @swagger
 * /api/v1/admin/question/{id}:
 *   delete:
 *     summary: Delete a question
 *     description: Remove a question from the system by ID
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: The MongoDB ObjectId of the question to delete
 *         example: "64f5a7b2c1234567890abcde"
 *     responses:
 *       200:
 *         description: Question deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: 'null'
 *             example:
 *               success: true
 *               message: "Deleted successfully"
 *               data: null
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       404:
 *         description: Question not found
 */
router.delete("/question/:id", auth, deleteQuestion);

/**
 * @swagger
 * /api/v1/admin/question:
 *   get:
 *     summary: Get all questions
 *     description: Retrieve all diagnostic questions without pagination
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Questions retrieved successfully
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
 *                         questions:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Question'
 *             example:
 *               success: true
 *               message: "Questions retrieved successfully"
 *               data:
 *                 questions:
 *                   - _id: "64f5a7b2c1234567890abcde"
 *                     questionText: "How often do you feel anxious?"
 *                     options: ["Never", "Sometimes", "Often", "Always"]
 *                     order: 1
 *                     isActive: true
 *                     createdAt: "2024-01-20T10:30:00Z"
 *                     updatedAt: "2024-01-20T10:30:00Z"
 *                   - _id: "64f5a7b2c1234567890abcdf"
 *                     questionText: "How is your sleep quality?"
 *                     options: ["Very Poor", "Poor", "Fair", "Good", "Excellent"]
 *                     order: 2
 *                     isActive: true
 *                     createdAt: "2024-01-20T11:15:00Z"
 *                     updatedAt: "2024-01-20T11:15:00Z"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       500:
 *         description: Internal server error
 */

// Router configuration
router.get("/question", getAllQuestions);

export default router;
