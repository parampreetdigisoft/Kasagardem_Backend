import express, { Router } from "express";
import validateRequest from "../../core/middleware/validateRequest";
import { answerValidation } from "./answerValidation";
import { submitAnswer } from "./answerController";

const router: Router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Answers
 *   description: API for submitting survey answers
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
 *           format: uuid
 *           description: Unique identifier of the question (UUID from PostgreSQL)
 *           example: "c9d4c053-49b6-410c-bc78-2d54a9991870"
 *         type:
 *           type: integer
 *           enum: [1, 2]
 *           description: "1 = selectedOption, 2 = selectedAddress"
 *           example: 1
 *         selectedOption:
 *           type: string
 *           description: Option selected by the user (required if type=1)
 *           example: "Aesthetics"
 *         selectedAddress:
 *           type: object
 *           description: Address selected by the user (required if type=2)
 *           properties:
 *             state:
 *               type: string
 *               example: "California"
 *             city:
 *               type: string
 *               example: "Los Angeles"
 *
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
 * /api/v1/answer:
 *   post:
 *     summary: Submit answers for survey questions
 *     description: Submit multiple answers in a single request. Supports both selected options and selected addresses.
 *     tags: [Answers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AnswerInput'
 *           example:
 *             answers: [
 *               {
 *                 questionId: "c9d4c053-49b6-410c-bc78-2d54a9991870",
 *                 type: 1,
 *                 selectedOption: "Aesthetics"
 *               },
 *               {
 *                 questionId: "d2f6a8c2-4fcb-4e4b-8f67-458a3c97a9f5",
 *                 type: 2,
 *                 selectedAddress: { state: "California", city: "Los Angeles" }
 *               }
 *             ]
 *     responses:
 *       201:
 *         description: Answers submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               success: true
 *               message: "Answers submitted successfully"
 *               data:
 *                 responseId: "b6e64bdb-61e2-4d58-bb58-5fcd6b9c8a77"
 *                 plantRecommendations: []
 *                 partnerRecommendations: []
 *       400:
 *         description: Validation error
 */

router.post("/answer", validateRequest(answerValidation), submitAnswer);

export default router;
