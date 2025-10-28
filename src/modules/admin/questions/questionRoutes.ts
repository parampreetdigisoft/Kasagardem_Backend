import express, { RequestHandler, Router } from "express";
import auth from "../../../core/middleware/authMiddleware";
import validateRequest from "../../../core/middleware/validateRequest";
import { questionValidation } from "./questionValidation";
import {
  createQuestionController,
  deleteQuestionController,
  getAllQuestions,
  updateQuestionController,
} from "./questionController";

const router: Router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Questions
 *   description: APIs for managing diagnostic questions
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Question:
 *       type: object
 *       required:
 *         - question_text
 *         - options
 *         - order
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the question
 *           example: "782c7b1f-b200-49b1-b001-c613a44b41fe"
 *         question_text:
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
 *         order:
 *           type: integer
 *           description: Display order of the question
 *           example: 1
 *         is_deleted:
 *           type: boolean
 *           description: Indicates whether the question is soft-deleted
 *           example: false
 *
 *     QuestionInput:
 *       type: object
 *       required:
 *         - question_text
 *         - options
 *         - order
 *       properties:
 *         question_text:
 *           type: string
 *           example: "How often do you feel anxious?"
 *         options:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Never", "Sometimes", "Often", "Always"]
 *         order:
 *           type: integer
 *           example: 1
 *
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 */

/**
 * @swagger
 * /api/v1/admin/question:
 *   post:
 *     summary: Create a new question
 *     description: Adds a new diagnostic question to the database
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuestionInput'
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
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/question",
  auth,
  validateRequest(questionValidation),
  createQuestionController
);

/**
 * @swagger
 * /api/v1/admin/question:
 *   get:
 *     summary: Get all questions
 *     description: Retrieve all diagnostic questions (excluding deleted)
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
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/question", getAllQuestions as unknown as RequestHandler);

/**
 * @swagger
 * /api/v1/admin/question/{id}:
 *   put:
 *     summary: Update an existing question
 *     description: Modify an existing diagnostic question by its ID
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the question to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuestionInput'
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
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Question not found
 */
router.put(
  "/question/:id",
  auth,
  validateRequest(questionValidation),
  updateQuestionController
);

/**
 * @swagger
 * /api/v1/admin/question/{id}:
 *   delete:
 *     summary: Soft delete a question
 *     description: Marks a question as deleted (does not permanently remove it)
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the question to delete
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
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Question not found
 */
router.delete("/question/:id", auth, deleteQuestionController);

export default router;
