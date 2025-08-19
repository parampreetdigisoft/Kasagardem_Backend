import validateRequest from "../../../core/middleware/validateRequest";
import auth from "../../../core/middleware/authMiddleware";
import { Router } from "express";
import { plantDiseaseValidation } from "../diseaseDetection/diseaseDetectionValidations";
import { detectPlantDisease } from "../diseaseDetection/diseaseDetectionController";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Plant Disease Detection
 *   description: Plant disease and health assessment endpoints
 */

/**
 * @swagger
 * /api/v1/plants/plantDisease/detect:
 *   post:
 *     summary: Detect diseases and assess plant health from images
 *     tags: [Plant Disease Detection]
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
 *                     example: 49.207
 *                   longitude:
 *                     type: number
 *                     example: 16.608
 *     responses:
 *       200:
 *         description: Plant disease detection results
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
 *                     isHealthy:
 *                       type: boolean
 *                       example: false
 *                     healthProbability:
 *                       type: number
 *                       example: 0.042
 *                     confidence:
 *                       type: number
 *                       example: 0.8306
 *                     diseases:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "765b06482c4e4ae9"
 *                           name:
 *                             type: string
 *                             example: "nutrient deficiency"
 *                           confidence:
 *                             type: number
 *                             example: 0.8306
 *                           similarImages:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 url:
 *                                   type: string
 *                                   example: "https://plant-id.ams3.cdn.digitaloceanspaces.com/..."
 *                                 urlSmall:
 *                                   type: string
 *                                   example: "https://plant-id.ams3.cdn.digitaloceanspaces.com/...small.jpg"
 *                                 similarity:
 *                                   type: number
 *                                   example: 0.599
 *                                 license:
 *                                   type: string
 *                                   example: "CC BY-NC-SA 4.0"
 *                                 citation:
 *                                   type: string
 *                                   example: "FlowerChecker s.r.o."
 *                           details:
 *                             type: object
 *                             properties:
 *                               language:
 *                                 type: string
 *                                 example: "en"
 *                               entity_id:
 *                                 type: string
 *                                 example: "765b06482c4e4ae9"
 *                     question:
 *                       type: object
 *                       properties:
 *                         text:
 *                           type: string
 *                           example: "After watering, do the leaves remain wilted and soft instead of becoming firm?"
 *                         translation:
 *                           type: string
 *                           example: "After watering, do the leaves remain wilted and soft instead of becoming firm?"
 *                         options:
 *                           type: object
 *                           properties:
 *                             yes:
 *                               type: object
 *                               properties:
 *                                 suggestion_index:
 *                                   type: number
 *                                   example: 1
 *                                 entity_id:
 *                                   type: string
 *                                   example: "e5eed7f688efa59e"
 *                                 name:
 *                                   type: string
 *                                   example: "water excess or uneven watering"
 *                                 translation:
 *                                   type: string
 *                                   example: "Yes"
 *                             no:
 *                               type: object
 *                               properties:
 *                                 suggestion_index:
 *                                   type: number
 *                                   example: 0
 *                                 entity_id:
 *                                   type: string
 *                                   example: "765b06482c4e4ae9"
 *                                 name:
 *                                   type: string
 *                                   example: "nutrient deficiency"
 *                                 translation:
 *                                   type: string
 *                                   example: "No"
 *                     isPlant:
 *                       type: number
 *                       example: 0.99337137
 *                     status:
 *                       type: string
 *                       example: "COMPLETED"
 *                     savedImages:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["/uploads/disease_detections/user123/nutrient_deficiency_1642905089826.jpg"]
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/detect",
  auth,
  validateRequest(plantDiseaseValidation),
  detectPlantDisease
);

export default router;
