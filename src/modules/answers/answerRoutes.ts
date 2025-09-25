import express, { Router } from "express";
import auth from "../../core/middleware/authMiddleware";
import validateRequest from "../../core/middleware/validateRequest";
import { answerValidation } from "./answerValidation";
import { submitAnswer } from "./answerController";

const router: Router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Answers
 *   description: API for submitting answers to diagnostic questions
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AnswerItem:
 *       type: object
 *       required:
 *         - questionId
 *         - type
 *       properties:
 *         questionId:
 *           type: string
 *           description: Unique identifier of the question
 *           example: "6501a1b9f0e7c3d5e89abc12"
 *         type:
 *           type: integer
 *           enum: [1, 2]
 *           description: "1 = selectedOption, 2 = selectedAddress"
 *           example: 1
 *         selectedOption:
 *           type: string
 *           description: Option selected by the user (required if type=1)
 *           example: "Option A"
 *         selectedAddress:
 *           type: object
 *           description: Address selected by the user (required if type=2)
 *           properties:
 *             state:
 *               type: string
 *               description: State selected
 *               example: "California"
 *             city:
 *               type: string
 *               description: City selected
 *               example: "Los Angeles"
 *     AnswerInput:
 *       type: object
 *       required:
 *         - answers
 *       properties:
 *         answers:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AnswerItem'
 *         isDeleted:
 *           type: boolean
 *           description: Soft delete flag (optional)
 *           default: false
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
 * /api/v1/answer:
 *   post:
 *     summary: Submit answers for diagnostic questions
 *     description: Submit multiple answers for a user in one request.
 *                  Each answer can be either a selected option (type=1) or a selected address (type=2).
 *     tags: [Answers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AnswerInput'
 *           example:
 *             answers: [
 *               { questionId: "6501a1b9f0e7c3d5e89abc12", type: 1, selectedOption: "Option B" },
 *               { questionId: "6501a1b9f0e7c3d5e89abc34", type: 2, selectedAddress: { state: "California", city: "Los Angeles" } }
 *             ]
 *     responses:
 *       201:
 *         description: Answers submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AnswerInput'
 *             example:
 *               success: true
 *               message: "Answers submitted successfully"
 *               data:
 *                 answers: [
 *                   { questionId: "6501a1b9f0e7c3d5e89abc12", type: 1, selectedOption: "Option B" },
 *                   { questionId: "6501a1b9f0e7c3d5e89abc34", type: 2, selectedAddress: { state: "California", city: "Los Angeles" } }
 *                 ]
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 */
router.post("/answer", auth, validateRequest(answerValidation), submitAnswer);

export default router;
