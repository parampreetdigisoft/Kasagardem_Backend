import express from "express";
import auth from "../../core/middleware/authMiddleware";
import { AddPlantToUser, getAllPlants, getAllUserPlants, getPlantById, getUserPlantById } from "./myPlantController";
import validateRequest from "../../core/middleware/validateRequest";
import { createUserPlantValidation } from "./myPlantValidation";
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
 * /api/v1/myPlants/{id}:
 *   get:
 *     summary: Get plant by ID
 *     description: Fetch the details of a plant by its unique ID.
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
 *         description: Unique ID of the plant
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
 *           type: string
 *           format: uuid
 *           example: "e1b8f062-1b07-4de9-b6e2-0729a81b4d1e"
 *         name:
 *           type: string
 *           example: "Rose"
 *         description:
 *           type: string
 *           example: "A beautiful flowering plant."
 *         imageUrl:
 *           type: string
 *           example: "https://example.com/rose.jpg"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2023-02-01T10:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2023-02-01T10:00:00Z"
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
 *     # ── Reusable Schemas ─────────────────────────────────────────────────────
 *
 *     TimeString:
 *       type: string
 *       pattern: '^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$'
 *       example: "09:00:00"
 *       description: Time in HH:mm:ss format
 *
 *     HealthStatus:
 *       type: string
 *       enum: [healthy, needs_attention, critical]
 *       default: healthy
 *       example: healthy
 *
 *     # ── Request Body ─────────────────────────────────────────────────────────
 *
 *     AddUserPlantRequest:
 *       type: object
 *       required:
 *         - plant_species_id
 *       properties:
 *         plant_species_id:
 *           type: string
 *           format: uuid
 *           description: ID of the plant species to add
 *           example: "c9d4c053-49b6-410c-bc78-2d54a9991870"
 *
 *         nickname:
 *           type: string
 *           maxLength: 255
 *           description: Optional nickname for the plant
 *           example: "My Balcony Aloe"
 *
 *         health_status:
 *           $ref: '#/components/schemas/HealthStatus'
 *
 *         # ── Water ──────────────────────────────────────────────────────────
 *         custom_water_frequency:
 *           type: integer
 *           minimum: 1
 *           description: Custom watering frequency in days. Falls back to plant species default if not provided
 *           example: 3
 *
 *         water_notification_enabled:
 *           type: boolean
 *           default: false
 *           description: Enable watering reminders
 *
 *         water_preferred_time:
 *           $ref: '#/components/schemas/TimeString'
 *           description: >
 *             Preferred time for watering notifications.
 *             **Required** when water_notification_enabled is true.
 *             Defaults to 09:00:00 if not provided.
 *
 *         # ── Fertilizer ─────────────────────────────────────────────────────
 *         custom_fertilizer_schedule:
 *           type: integer
 *           minimum: 1
 *           description: Custom fertilizer schedule in days. Falls back to plant species default if not provided
 *           example: 30
 *
 *         fertilizer_notification_enabled:
 *           type: boolean
 *           default: false
 *           description: Enable fertilizer reminders
 *
 *         fertilizer_preferred_time:
 *           $ref: '#/components/schemas/TimeString'
 *           description: >
 *             Preferred time for fertilizer notifications.
 *             **Required** when fertilizer_notification_enabled is true.
 *             Defaults to 09:00:00 if not provided.
 *
 *         # ── Pruning ────────────────────────────────────────────────────────
 *         custom_pruning_schedule:
 *           type: integer
 *           minimum: 1
 *           description: Custom pruning schedule in days. Falls back to plant species default if not provided
 *           example: 60
 *
 *         pruning_notification_enabled:
 *           type: boolean
 *           default: false
 *           description: Enable pruning reminders
 *
 *         pruning_preferred_time:
 *           $ref: '#/components/schemas/TimeString'
 *           description: >
 *             Preferred time for pruning notifications.
 *             **Required** when pruning_notification_enabled is true.
 *             Defaults to 09:00:00 if not provided.
 *
 *     # ── Response Body ────────────────────────────────────────────────────────
 *
 *     UserPlantResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         user_id:
 *           type: string
 *           format: uuid
 *           example: "d73b8c16-4c69-4c5e-b2ad-63bce8f66cf7"
 *         plant_species_id:
 *           type: string
 *           format: uuid
 *           example: "c9d4c053-49b6-410c-bc78-2d54a9991870"
 *         nickname:
 *           type: string
 *           nullable: true
 *           example: "My Balcony Aloe"
 *         health_status:
 *           $ref: '#/components/schemas/HealthStatus'
 *
 *         # ── Water ──────────────────────────────────────────────────────────
 *         custom_water_frequency:
 *           type: integer
 *           example: 3
 *         water_notification_enabled:
 *           type: boolean
 *           example: true
 *         water_preferred_time:
 *           $ref: '#/components/schemas/TimeString'
 *         last_watered_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: null
 *         next_watered_at:
 *           type: string
 *           format: date-time
 *           example: "2025-03-05T09:00:00Z"
 *
 *         # ── Fertilizer ─────────────────────────────────────────────────────
 *         custom_fertilizer_schedule:
 *           type: integer
 *           nullable: true
 *           example: 30
 *         fertilizer_notification_enabled:
 *           type: boolean
 *           example: false
 *         fertilizer_preferred_time:
 *           $ref: '#/components/schemas/TimeString'
 *         last_fertilized_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: null
 *         next_fertilized_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2025-04-01T09:00:00Z"
 *
 *         # ── Pruning ────────────────────────────────────────────────────────
 *         custom_pruning_schedule:
 *           type: integer
 *           nullable: true
 *           example: 60
 *         pruning_notification_enabled:
 *           type: boolean
 *           example: false
 *         pruning_preferred_time:
 *           $ref: '#/components/schemas/TimeString'
 *         last_pruned_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: null
 *         next_pruned_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2025-05-01T09:00:00Z"
 *
 *         added_at:
 *           type: string
 *           format: date-time
 *           example: "2025-02-12T10:00:00Z"
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: "2025-02-12T10:00:00Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           example: "2025-02-12T10:00:00Z"
 *
 *     # ── Error Schemas ────────────────────────────────────────────────────────
 *
 *     ValidationError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Validation failed"
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *                 example: "water_preferred_time"
 *               message:
 *                 type: string
 *                 example: "Water preferred time is required when notification is enabled"
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
 * /api/v1/myPlants:
 *   post:
 *     summary: Add a plant to the authenticated user's collection
 *     description: >
 *       Adds a plant species to the user's personal collection.
 *       All care settings (water, fertilizer, pruning) are **optional** —
 *       if not provided, they fall back to the plant species defaults.
 *       Notification time is **required** only when the corresponding
 *       notification is enabled.
 *       `next_watered_at`, `next_fertilized_at`, and `next_pruned_at`
 *       are automatically calculated as `NOW() + frequency days` on creation.
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
 *           examples:
 *             minimal:
 *               summary: Minimal — only required field
 *               value:
 *                 plant_species_id: "c9d4c053-49b6-410c-bc78-2d54a9991870"
 *             with_water_notification:
 *               summary: Enable water notification only
 *               value:
 *                 plant_species_id: "c9d4c053-49b6-410c-bc78-2d54a9991870"
 *                 water_notification_enabled: true
 *                 water_preferred_time: "07:30:00"
 *             fully_customized:
 *               summary: Full customization
 *               value:
 *                 plant_species_id: "c9d4c053-49b6-410c-bc78-2d54a9991870"
 *                 nickname: "My Balcony Aloe"
 *                 custom_water_frequency: 3
 *                 water_notification_enabled: true
 *                 water_preferred_time: "08:00:00"
 *                 custom_fertilizer_schedule: 30
 *                 fertilizer_notification_enabled: true
 *                 fertilizer_preferred_time: "10:00:00"
 *                 custom_pruning_schedule: 60
 *                 pruning_notification_enabled: false
 *                 health_status: "healthy"
 *
 *     responses:
 *       201:
 *         description: Plant successfully added to user's collection
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
 *         description: Validation failed — missing or invalid fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *             example:
 *               success: false
 *               message: "Validation failed"
 *               errors:
 *                 - field: "plant_species_id"
 *                   message: "Plant species ID must be a valid UUID"
 *                 - field: "water_preferred_time"
 *                   message: "Water preferred time is required when notification is enabled"
 *
 *       401:
 *         description: Unauthorized — missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Unauthorized"
 *
 *       403:
 *         description: Forbidden — only users with role "User" can add plants
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Unauthorized Role"
 *
 *       404:
 *         description: Plant species not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Plant species not found"
 *
 *       409:
 *         description: Conflict — plant already added to user's collection
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Plant already added to user"
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Something went wrong"
 */
router.post("/",auth,validateRequest(createUserPlantValidation), AddPlantToUser);
/**
 * @swagger
 * /api/v1/allPlants/user/myplants:
 *   get:
 *     summary: Get all plants of the authenticated user
 *     tags: [My Plants]
 *     security:
 *       - bearerAuth: []
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PlantRecommendation'
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
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
 * /api/v1/myPlants/user/plants/{id}:
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



export default router;