import auth from "../../../core/middleware/authMiddleware";
import { Router } from "express";
import validateRequest from "../../../core/middleware/validateRequest";
import { askPlantQuestion } from "./plantCareInformationController";
import { plantConversationValidation } from "./plantCareInformationValidations";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Plant Conversation
 *   description: Plant conversation chatbot endpoints for asking questions about identified plants
 */

/**
 * @swagger
 * /api/v1/plants/plantInformation/ask:
 *   post:
 *     summary: Ask a question about an identified plant using AI chatbot
 *     tags: [Plant Conversation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identificationId
 *               - question
 *             properties:
 *               identificationId:
 *                 type: string
 *                 description: The ID of the plant identification to ask about
 *                 example: "43igHic7zpYUYNA"
 *               question:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *                 description: The question to ask about the plant
 *                 example: "Is this plant edible?"
 *               prompt:
 *                 type: string
 *                 maxLength: 500
 *                 description: Custom prompt to modify chatbot behavior
 *                 example: "Answer in a friendly, educational tone"
 *               temperature:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 2
 *                 description: Controls response randomness (default 0.5)
 *                 example: 0.7
 *               appName:
 *                 type: string
 *                 maxLength: 100
 *                 description: App identity for the chatbot
 *                 example: "Test_Kasagardem1"
 *     responses:
 *       200:
 *         description: Plant conversation response
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
 *                     identificationId:
 *                       type: string
 *                       example: "43igHic7zpYUYNA"
 *                     question:
 *                       type: string
 *                       example: "Is this plant edible?"
 *                     answer:
 *                       type: string
 *                       example: "Based on the identification, this appears to be a rose (Rosa species). Rose petals are generally edible and often used in cooking and teas, but you should avoid eating the leaves, stems, or hips without proper preparation."
 *                     conversationHistory:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             enum: [question, answer]
 *                           content:
 *                             type: string
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                     model:
 *                       type: string
 *                       example: "gpt-4o-mini"
 *                     temperature:
 *                       type: number
 *                       example: 0.5
 *                     remainingCalls:
 *                       type: integer
 *                       example: 19
 *                     totalQuestions:
 *                       type: integer
 *                       example: 1
 *       400:
 *         description: Validation error or invalid parameters
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       404:
 *         description: Plant identification not found or access denied
 *       500:
 *         description: Internal server error
 */
router.post(
  "/ask",
  auth,
  validateRequest(plantConversationValidation),
  askPlantQuestion
);

export default router;
