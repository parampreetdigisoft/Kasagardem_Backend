import express from "express";
import auth from "../../core/middleware/authMiddleware";
import { AddPlantToUser, getAllPlants, getAllUserPlants, getPlantById, getUserPlantById } from "./myPlantController";
import validateRequest from "../../core/middleware/validateRequest";
import { createUserPlantValidation } from "./myPlantValidation";
import { importAllPlantsHandler } from "./importAllPlnatController";
import { importPlantCareHandler } from "./importPlantCareController";
import { importPlantToxicToPetsHandler } from "./importPetToxicPlantController";
const router = express.Router();
/**
 * @swagger
 * /api/v1/allplants:
 *   get:
 *     summary: Get all plants (Paginated)
 *     description: Retrieve a paginated list of plants for the authenticated user. Requires a valid bearer token and user role "User".
 *     tags: [My Plants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The number of plants per page.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: false
 *         description: Search plants by common name, scientific name, or description (case-insensitive, partial match supported).
 *        
 *     responses:
 *       200:
 *         description: Successfully retrieved list of plants.
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
 *                   example: Plants retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 10
 *                     totalCount:
 *                       type: integer
 *                       example: 100
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     plants:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           scientific_name:
 *                             type: string
 *                             example: "Rosa rubiginosa"
 *                           common_name:
 *                             type: string
 *                             example: "Rose"
 *                           description:
 *                             type: string
 *                             example: "A beautiful flowering plant"
 *                           image_url:
 *                             type: string
 *                             example: "https://example.com/rose.jpg"
 *                           water_reminder_frequency:
 *                             type: string
 *                             example: "Every 2 days"
 *                           water_notification_enabled:
 *                             type: boolean
 *                             example: true
 *                           fertilizer_schedule:
 *                             type: string
 *                             example: "Monthly"
 *                           fertilizer_notification_enabled:
 *                             type: boolean
 *                             example: false
 *                           pruning_alert:
 *                             type: string
 *                             example: "Spring"
 *                           pruning_notification_enabled:
 *                             type: boolean
 *                             example: true
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-15T10:30:00Z"
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-06-01T08:00:00Z"
 *       401:
 *         description: Unauthorized - User must be authenticated and have the correct role.
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
 *                   example: Unauthorized
 *       500:
 *         description: Internal Server Error
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
 *                   example: Something went wrong
 */
router.get("/",auth, getAllPlants);

/**
 * @swagger
 * tags:
 *   name: My Plants
 *   description: Plant management APIs
 */

/**
 * @swagger
 * /api/v1/allplants/{id}:
 *   get:
 *     summary: Get plant by ID
 *     description: Fetch the details of a plant by its unique serial ID.
 *     tags: [My Plants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Unique serial ID of the plant
 *     responses:
 *       200:
 *         description: Plant details retrieved successfully
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
 *                   example: Plant details retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/PlantRecommendation'
 *       400:
 *         description: Bad Request (Invalid or missing ID)
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
 *                   example: Plant ID is required
 *       401:
 *         description: Unauthorized - User must be authenticated.
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
 *                   example: Unauthorized
 *       404:
 *         description: Plant not found
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
 *                   example: Plant not found
 *       500:
 *         description: Internal Server Error
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
 *                   example: Something went wrong
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PlantRecommendation:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: Rose
 *         description:
 *           type: string
 *           example: A beautiful flowering plant.
 *         imageUrl:
 *           type: string
 *           example: https://example.com/rose.jpg
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2023-02-01T10:00:00Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2023-02-01T10:00:00Z
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
router.get("/:id",auth, getPlantById);

/**
 * @swagger
 * tags:
 *   name: My Plants
 *   description: User plant management APIs
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *
 *     TimeString:
 *       type: string
 *       pattern: '^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$'
 *       example: "09:00:00"
 *       description: Time in HH:mm:ss format
 *
 *     AddUserPlantRequest:
 *       type: object
 *       required:
 *         - plant_species_id
 *       properties:
 *         plant_species_id:
 *           type: string
 *           format: uuid
 *           example: "c9d4c053-49b6-410c-bc78-2d54a9991870"
 *         water_notification_enabled:
 *           type: boolean
 *           default: false
 *           description: Enable watering notification
 *         water_preferred_time:
 *           $ref: '#/components/schemas/TimeString'
 *           description: Required when watering notification is enabled, defaults to "09:00:00".
 *         fertilizer_notification_enabled:
 *           type: boolean
 *           default: false
 *           description: Enable fertilizer notification
 *         fertilizer_preferred_time:
 *           $ref: '#/components/schemas/TimeString'
 *           description: Required when fertilizer notification is enabled, defaults to "09:00:00".
 *         pruning_notification_enabled:
 *           type: boolean
 *           default: false
 *           description: Enable pruning notification
 *         pruning_preferred_time:
 *           $ref: '#/components/schemas/TimeString'
 *           description: Required when pruning notification is enabled, defaults to "09:00:00".
 *         generic_care_notification_enabled:
 *           type: boolean
 *           default: false
 *           description: Enable generic care notification
 *         generic_care_preferred_time:
 *           $ref: '#/components/schemas/TimeString'
 *           description: Required when generic care notification is enabled, defaults to "09:00:00".
 *         watering_frequency_days:
 *           type: integer
 *           description: Optional. Defaults to the species default if not provided.
 *         fertilizing_frequency_days:
 *           type: integer
 *           description: Optional. Defaults to the species default if not provided.
 *         pruning_frequency_days:
 *           type: integer
 *           description: Optional. Defaults to the species default if not provided.
 *         generic_frequency_days:
 *           type: integer
 *           description: Optional. Defaults to the species default if not provided.
 *
 *     UserPlantResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         user_id:
 *           type: string
 *           format: uuid
 *         plant_species_id:
 *           type: string
 *           format: uuid
 *         water_notification_enabled:
 *           type: boolean
 *         water_preferred_time:
 *           $ref: '#/components/schemas/TimeString'
 *         next_watered_at:
 *           type: string
 *           format: date-time
 *         fertilizer_notification_enabled:
 *           type: boolean
 *         fertilizer_preferred_time:
 *           $ref: '#/components/schemas/TimeString'
 *         next_fertilized_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         pruning_notification_enabled:
 *           type: boolean
 *         pruning_preferred_time:
 *           $ref: '#/components/schemas/TimeString'
 *         next_pruned_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         generic_care_notification_enabled:
 *           type: boolean
 *         generic_care_preferred_time:
 *           $ref: '#/components/schemas/TimeString'
 *         next_generic_care_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Plant species not found"
 */

/**
 * @swagger
 * /api/v1/allPlants/addplant:
 *   post:
 *     summary: Add plant to user's collection
 *     description: >
 *       Adds a plant species to the authenticated user's collection. 
 *       Time fields are required only when their corresponding notification is enabled. 
 *       If no frequency is provided for watering, fertilizing, pruning, or generic care, the species default is used.
 *     tags: [My Plants]
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddUserPlantRequest'
 *
 *     responses:
 *       201:
 *         description: Plant added successfully
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
 *                   example: "Plant added successfully"
 *                 data:
 *                   $ref: '#/components/schemas/UserPlantResponse'
 *
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *       404:
 *         description: Plant species not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *       409:
 *         description: Plant already added
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/addplant",auth,validateRequest(createUserPlantValidation), AddPlantToUser);
/**
 * @swagger
 * /api/v1/allPlants/user/myplants:
 *   get:
 *     summary: Get all plants of the authenticated user
 *     tags: [My Plants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by plant name or nickname
 *     responses:
 *       200:
 *         description: User plants retrieved successfully
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
 *                   example: User plants retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     plants:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PlantRecommendation'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                           example: 1
 *                         totalPages:
 *                           type: integer
 *                           example: 5
 *                         totalItems:
 *                           type: integer
 *                           example: 45
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal Server Error
 */
router.get("/user/myplants", auth, getAllUserPlants);

/**
 * @swagger
 * tags:
 *   name: My Plants
 *   description: Plant management APIs
 */

/**
 * @swagger
 * /api/v1/allplants/user/plants/{id}:
 *   get:
 *     summary: Get a specific plant of the authenticated user
 *     description: Fetch the details of a specific plant owned by the authenticated user.
 *     tags: [My Plants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier for the user's plant
 *     responses:
 *       200:
 *         description: User's plant details retrieved successfully
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
 *                   example: User plant retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/PlantRecommendation'
 *       400:
 *         description: Bad Request (Missing or invalid plant ID)
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
 *                   example: Plant ID is required
 *       401:
 *         description: Unauthorized - User must be authenticated and authorized
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
 *                   example: Unauthorized
 *       404:
 *         description: Plant not found
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
 *                   example: Plant not found
 *       500:
 *         description: Internal Server Error
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
 *                   example: Something went wrong
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.get("/user/plants/:id", auth, getUserPlantById);

/**
 * @swagger
 * /api/v1/allplants/importAllPlants:
 *   post:
 *     summary: Import all plants from an Excel file
 *     tags:
 *       - [My Plants] 
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Excel file containing plant data
 *     responses:
 *       200:
 *         description: Plants imported successfully
 *       400:
 *         description: Invalid file or data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/importAllPlants", auth, ...importAllPlantsHandler);


/**
 * @swagger
 * /api/v1/allplants/importPlantCareData:
 *   post:
 *     summary: Import all plants from an Excel file
 *     tags:
 *       - [My Plants] 
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Excel file containing plant data
 *     responses:
 *       200:
 *         description: Plants imported successfully
 *       400:
 *         description: Invalid file or data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/importPlantCareData", auth, ...importPlantCareHandler);



/**
 * @swagger
 * /api/v1/allplants/importPlantToxicToPets:
 *   post:
 *     summary: Import all plants from an Excel file
 *     tags:
 *       - [My Plants] 
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Excel file containing plant data
 *     responses:
 *       200:
 *         description: Plants imported successfully
 *       400:
 *         description: Invalid file or data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/importPlantToxicToPets", auth, ...importPlantToxicToPetsHandler);

export default router;