import validateRequest from "../../../core/middleware/validateRequest";
import auth from "../../../core/middleware/authMiddleware";
import { Router } from "express";
import { plantIdentifyValidation } from "../plantDetection/plantDetectionValidations";
import { identifyPlant } from "./plantDetectionController";

const router = Router();
/**
 * @swagger
 * tags:
 *   name: Plants Detection
 *   description: Plant detection endpoints
 */

/**
 * @swagger
 * /api/v1/plants/plantsDetection/identify:
 *   post:
 *     summary: Identify a plant from images
 *     tags: [Plants Detection]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: byte
 *                 minItems: 1
 *                 example:
 *                   - "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA..."
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                     example: 40.7128
 *                   longitude:
 *                     type: number
 *                     example: -74.0060
 *     responses:
 *       200:
 *         description: Plant identification results
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
 *                     confidence:
 *                       type: number
 *                       example: 0.85
 *                     suggestions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           scientificName:
 *                             type: string
 *                             example: "Rosa rubiginosa"
 *                           commonNames:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["Sweet Briar", "Eglantine"]
 *                           confidence:
 *                             type: number
 *                             example: 0.85
 *                           description:
 *                             type: string
 *                             example: "A species of rose native to Europe and western Asia."
 *                     careRecommendations:
 *                       type: object
 *                       properties:
 *                         watering:
 *                           type: object
 *                           properties:
 *                             frequency:
 *                               type: string
 *                               example: "weekly"
 *                             amount:
 *                               type: string
 *                               example: "moderate"
 *                         sunlight:
 *                           type: string
 *                           example: "full-sun"
 *                         temperature:
 *                           type: object
 *                           properties:
 *                             min:
 *                               type: number
 *                               example: 15
 *                             max:
 *                               type: number
 *                               example: 25
 *                             unit:
 *                               type: string
 *                               example: "celsius"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/identify",
  auth,
  validateRequest(plantIdentifyValidation),
  identifyPlant
);

export default router;
