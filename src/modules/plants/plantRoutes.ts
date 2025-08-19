import { Router } from "express";
import {
  createPlant,
  getUserPlants,
  getPlantById,
  updatePlant,
  deletePlant,
  identifyPlant,
  getPersonalizedTips,
  savePlantHistoryEndpoint,
  getUserPlantHistory,
} from "./plantController";
import {
  createPlantValidation,
  updatePlantValidation,
  plantQueryValidation,
  plantIdentifyValidation,
  plantHistoryValidation,
} from "./plantValidations";
import validateRequest from "../../core/middleware/validateRequest";
import auth from "../../core/middleware/authMiddleware";

const router = Router();
/**
 * @swagger
 * tags:
 *   name: Plants
 *   description: Plant management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Plant:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           maxLength: 100
 *           example: "Fiddle Leaf Fig"
 *         scientificName:
 *           type: string
 *           maxLength: 150
 *           example: "Ficus lyrata"
 *         commonNames:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Fiddle Leaf Fig Tree", "Banjo Fig"]
 *         category:
 *           type: string
 *           enum: [indoor, outdoor, herb, flower, tree, succulent, vegetable, fruit]
 *           example: "indoor"
 *         images:
 *           type: array
 *           items:
 *             type: string
 *             format: byte
 *             description: Base64 encoded image string (e.g., "data:image/png;base64,...")
 *           example:
 *             - "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
 *         description:
 *           type: string
 *           maxLength: 1000
 *           example: "A popular houseplant with large, violin-shaped leaves"
 *         careInstructions:
 *           type: object
 *           properties:
 *             watering:
 *               type: object
 *               properties:
 *                 frequency:
 *                   type: string
 *                   example: "weekly"
 *                 amount:
 *                   type: string
 *                   example: "moderate"
 *                 notes:
 *                   type: string
 *                   example: "Water when top inch of soil is dry"
 *             sunlight:
 *               type: string
 *               enum: [full-sun, partial-sun, shade, indirect-light]
 *               example: "indirect-light"
 *             temperature:
 *               type: object
 *               properties:
 *                 min:
 *                   type: number
 *                   example: 18
 *                 max:
 *                   type: number
 *                   example: 24
 *                 unit:
 *                   type: string
 *                   enum: [celsius, fahrenheit]
 *                   example: "celsius"
 *             humidity:
 *               type: object
 *               properties:
 *                 level:
 *                   type: string
 *                   enum: [low, medium, high]
 *                   example: "medium"
 *                 percentage:
 *                   type: number
 *                   minimum: 0
 *                   maximum: 100
 *                   example: 50
 *             fertilizing:
 *               type: object
 *               properties:
 *                 frequency:
 *                   type: string
 *                   example: "monthly"
 *                 type:
 *                   type: string
 *                   example: "balanced liquid fertilizer"
 *                 notes:
 *                   type: string
 *                   example: "Fertilize during growing season"
 *         status:
 *           type: string
 *           enum: [healthy, needs-attention, sick, dead]
 *           example: "healthy"
 *         location:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: "Living Room"
 *             coordinates:
 *               type: object
 *               properties:
 *                 latitude:
 *                   type: number
 *                   example: 40.7128
 *                 longitude:
 *                   type: number
 *                   example: -74.0060
 *         plantedDate:
 *           type: string
 *           format: date
 *           example: "2024-01-15"
 *         lastWatered:
 *           type: string
 *           format: date
 *           example: "2024-08-10"
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["houseplant", "beginner-friendly"]
 *         isPublic:
 *           type: boolean
 *           example: false
 *         notes:
 *           type: string
 *           maxLength: 500
 *           example: "Purchased from local nursery, responds well to regular misting"
 */

/**
 * @swagger
 * /api/v1/plants:
 *   post:
 *     summary: Create a new plant
 *     tags: [Plants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Plant'
 *     responses:
 *       201:
 *         description: Plant created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Plant'
 *                 message:
 *                   type: string
 *                   example: "Plant created successfully"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/", auth, validateRequest(createPlantValidation), createPlant);

/**
 * @swagger
 * /api/v1/plants:
 *   get:
 *     summary: Get user's plants with pagination and filtering
 *     tags: [Plants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of plants per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [indoor, outdoor, herb, flower, tree, succulent, vegetable, fruit]
 *         description: Filter by plant category
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [healthy, needs-attention, sick, dead]
 *         description: Filter by plant status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in plant names and descriptions
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, createdAt, updatedAt, plantedDate, nextWateringDue]
 *           default: createdAt
 *         description: Sort by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Plants retrieved successfully
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
 *                     plants:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Plant'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalPlants:
 *                           type: integer
 *                         hasNextPage:
 *                           type: boolean
 *                         hasPrevPage:
 *                           type: boolean
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/",
  auth,
  validateRequest(plantQueryValidation, "query"),
  getUserPlants
);

/**
 * @swagger
 * /api/v1/plants/{id}:
 *   get:
 *     summary: Get a specific plant by ID
 *     tags: [Plants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Plant ID
 *     responses:
 *       200:
 *         description: Plant retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Plant'
 *       404:
 *         description: Plant not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:id", auth, getPlantById);

/**
 * @swagger
 * /api/v1/plants/{id}:
 *   put:
 *     summary: Update a specific plant
 *     tags: [Plants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Plant ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Plant'
 *     responses:
 *       200:
 *         description: Plant updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Plant'
 *                 message:
 *                   type: string
 *                   example: "Plant updated successfully"
 *       404:
 *         description: Plant not found
 *       401:
 *         description: Unauthorized
 */
router.put("/:id", auth, validateRequest(updatePlantValidation), updatePlant);

/**
 * @swagger
 * /api/v1/plants/{id}:
 *   delete:
 *     summary: Delete a specific plant
 *     tags: [Plants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Plant ID
 *     responses:
 *       200:
 *         description: Plant deleted successfully
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
 *                   example: "Plant deleted successfully"
 *       404:
 *         description: Plant not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/:id", auth, deletePlant);

/**
 * @swagger
 * /api/v1/plants/identify:
 *   post:
 *     summary: Identify a plant from images
 *     tags: [Plants]
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
 *                 minItems: 1
 *                 example: ["https://example.com/plant-image.jpg"]
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                     example: 40.7128
 *                   longitude:
 *                     type: number
 *                     example: -74.0060
 *               hints:
 *                 type: object
 *                 properties:
 *                   size:
 *                     type: string
 *                     enum: [small, medium, large]
 *                     example: "medium"
 *                   habitat:
 *                     type: string
 *                     enum: [indoor, outdoor, wild, garden]
 *                     example: "indoor"
 *                   season:
 *                     type: string
 *                     enum: [spring, summer, fall, winter]
 *                     example: "summer"
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

/**
 * @swagger
 * /api/v1/plants/tips:
 *   get:
 *     summary: Get personalized plant care tips
 *     tags: [Plants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Personalized tips retrieved successfully
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
 *                     tips:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             example: "watering_reminder"
 *                           priority:
 *                             type: string
 *                             enum: [low, medium, high]
 *                             example: "high"
 *                           title:
 *                             type: string
 *                             example: "Plants Need Watering"
 *                           description:
 *                             type: string
 *                             example: "You have 3 plant(s) that need watering today."
 *                           actionUrl:
 *                             type: string
 *                             example: "/plants/watering-schedule"
 *       401:
 *         description: Unauthorized
 */
router.get("/tips", auth, getPersonalizedTips);

/**
 * @swagger
 * /api/v1/plants/history:
 *   post:
 *     summary: Save user plant interaction history
 *     tags: [Plants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               plantId:
 *                 type: string
 *                 example: "64a7b8c9d1234567890abcde"
 *               action:
 *                 type: string
 *                 enum: [viewed, added, identified, watered, fertilized, updated, deleted]
 *                 example: "watered"
 *               metadata:
 *                 type: object
 *                 example: { "amount": "500ml", "notes": "Plant looked thirsty" }
 *     responses:
 *       201:
 *         description: Plant history saved successfully
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
 *                   example: "Plant history saved successfully"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/history",
  auth,
  validateRequest(plantHistoryValidation),
  savePlantHistoryEndpoint
);

/**
 * @swagger
 * /api/v1/plants/history:
 *   get:
 *     summary: Get user's plant interaction history
 *     tags: [Plants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Number of history records per page
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [viewed, added, identified, watered, fertilized, updated, deleted]
 *         description: Filter by action type
 *       - in: query
 *         name: plantId
 *         schema:
 *           type: string
 *         description: Filter by plant ID
 *     responses:
 *       200:
 *         description: Plant history retrieved successfully
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
 *                     history:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           userId:
 *                             type: string
 *                           plantId:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               images:
 *                                 type: array
 *                                 items:
 *                                   type: string
 *                               category:
 *                                 type: string
 *                           action:
 *                             type: string
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                           metadata:
 *                             type: object
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalHistory:
 *                           type: integer
 *                         hasNextPage:
 *                           type: boolean
 *                         hasPrevPage:
 *                           type: boolean
 *       401:
 *         description: Unauthorized
 */
router.get("/history", auth, getUserPlantHistory);

export default router;
