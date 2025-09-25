import express, { Router } from "express";
import auth from "../../core/middleware/authMiddleware";
import validateRequest from "../../core/middleware/validateRequest";
import { plantValidation } from "./plantValidation";
import { createPlant } from "./plantController";

const router: Router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Plants
 *   description: API for managing plants
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Location:
 *       type: object
 *       required: [type, value]
 *       properties:
 *         type:
 *           type: string
 *           description: Location type (climate_zone, country, region, etc.)
 *           example: "climate_zone"
 *         value:
 *           type: string
 *           description: Location value
 *           example: "Tropical"
 *     PlantInput:
 *       type: object
 *       required:
 *         - scientific_name
 *         - common_name
 *       properties:
 *         scientific_name:
 *           type: string
 *           example: "Ficus lyrata"
 *         common_name:
 *           type: string
 *           example: "Fiddle Leaf Fig"
 *         image_search_url:
 *           type: string
 *           example: "https://example.com/ficus.jpg"
 *         space_types:
 *           type: array
 *           items:
 *             type: string
 *           example: ["indoor", "balcony"]
 *         area_sizes:
 *           type: array
 *           items:
 *             type: string
 *           example: ["small", "medium"]
 *         challenges:
 *           type: array
 *           items:
 *             type: string
 *           example: ["low humidity", "root rot"]
 *         tech_preferences:
 *           type: array
 *           items:
 *             type: string
 *           example: ["hydroponics", "smart sensors"]
 *         locations:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Location'
 *         description:
 *           type: string
 *           example: "A popular indoor plant with large violin-shaped leaves."
 *         care_notes:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Water weekly", "Bright indirect light"]
 *         native:
 *           type: boolean
 *           example: false
 *         light:
 *           type: string
 *           example: "Bright indirect light"
 *         water_needs:
 *           type: string
 *           example: "Moderate"
 *         maintenance_level:
 *           type: string
 *           example: "Medium"
 *         growth_form:
 *           type: string
 *           example: "Tree"
 *         isDeleted:
 *           type: boolean
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
 *             $ref: '#/components/schemas/PlantInput'
 *           example:
 *             scientific_name: "Ficus lyrata"
 *             common_name: "Fiddle Leaf Fig"
 *             image_search_url: "https://example.com/ficus.jpg"
 *             space_types: ["indoor", "balcony"]
 *             area_sizes: ["small", "medium"]
 *             challenges: ["low humidity", "root rot"]
 *             tech_preferences: ["hydroponics"]
 *             locations:
 *               - type: "climate_zone"
 *                 value: "Tropical"
 *             description: "A popular indoor plant with large violin-shaped leaves."
 *             care_notes: ["Water weekly", "Bright indirect light"]
 *             native: false
 *             light: "Bright indirect light"
 *             water_needs: "Moderate"
 *             maintenance_level: "Medium"
 *             growth_form: "Tree"
 *     responses:
 *       201:
 *         description: Plant created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               success: true
 *               message: "Plant created successfully"
 *               data:
 *                 _id: "6501a1b9f0e7c3d5e89abc99"
 *                 scientific_name: "Ficus lyrata"
 *                 common_name: "Fiddle Leaf Fig"
 *                 isDeleted: false
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/plants", auth, validateRequest(plantValidation), createPlant);

export default router;
