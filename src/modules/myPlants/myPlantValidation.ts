import Joi from "joi";

// timePattern.ts
export const timePattern = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;


export const createUserPlantValidation = Joi.object({
    plant_species_id: Joi.string()
        .uuid()
        .required()
        .messages({
            "string.guid": "Plant species ID must be a valid UUID",
            "any.required": "Plant species ID is required"
        }),

    // ─────────────────────────────────────────────
    // WATER
    // ─────────────────────────────────────────────
    water_notification_enabled: Joi.boolean().default(false),

    water_preferred_time: Joi.when("water_notification_enabled", {
        is: true,
        then: Joi.string()
            .pattern(timePattern)
            .required()
            .messages({
                "any.required": "Water preferred time is required when notification is enabled",
                "string.pattern.base": "Water preferred time must be in HH:mm:ss format"
            }),
        otherwise: Joi.string()
            .pattern(timePattern)
            .default("09:00:00")
    }),

    watering_frequency_days: Joi.when("water_notification_enabled", {
        is: true,
        then: Joi.number()
            .integer()
            .positive()
            .required()
            .messages({
                "any.required": "Watering frequency is required when notification is enabled",
                "number.base": "Watering frequency must be a number",
                "number.integer": "Watering frequency must be an integer",
                "number.positive": "Watering frequency must be a positive integer"
            }),
        otherwise: Joi.number()
            .integer()
            .positive()
            .optional()
    }),

    // ─────────────────────────────────────────────
    // FERTILIZER
    // ─────────────────────────────────────────────
    fertilizer_notification_enabled: Joi.boolean().default(false),

    fertilizer_preferred_time: Joi.when("fertilizer_notification_enabled", {
        is: true,
        then: Joi.string()
            .pattern(timePattern)
            .required()
            .messages({
                "any.required": "Fertilizer preferred time is required when notification is enabled",
                "string.pattern.base": "Fertilizer preferred time must be in HH:mm:ss format"
            }),
        otherwise: Joi.string()
            .pattern(timePattern)
            .default("09:00:00")
    }),

    fertilizing_frequency_days: Joi.when("fertilizer_notification_enabled", {
        is: true,
        then: Joi.number()
            .integer()
            .positive()
            .required()
            .messages({
                "any.required": "Fertilizing frequency is required when notification is enabled",
                "number.base": "Fertilizing frequency must be a number",
                "number.integer": "Fertilizing frequency must be an integer",
                "number.positive": "Fertilizing frequency must be a positive integer"
            }),
        otherwise: Joi.number()
            .integer()
            .positive()
            .optional()
    }),

    // ─────────────────────────────────────────────
    // PRUNING
    // ─────────────────────────────────────────────
    pruning_notification_enabled: Joi.boolean().default(false),

    pruning_frequency_days: Joi.when("pruning_notification_enabled", {
        is: true,
        then: Joi.number()
            .integer()
            .positive()
            .required()
            .messages({
                "any.required": "Pruning frequency is required when notification is enabled",
                "number.base": "Pruning frequency must be a number",
                "number.integer": "Pruning frequency must be an integer",
                "number.positive": "Pruning frequency must be a positive integer"
            }),
        otherwise: Joi.number()
            .integer()
            .positive()
            .optional()
    }),

    // ─────────────────────────────────────────────
    // GENERIC CARE ALERT (if you added it)
    // ─────────────────────────────────────────────
    generic_care_notification_enabled: Joi.boolean().default(false),

    generic_frequency_days: Joi.when("generic_care_notification_enabled", {
        is: true,
        then: Joi.number()
            .integer()
            .positive()
            .required()
            .messages({
                "any.required": "Generic care frequency is required when notification is enabled",
                "number.base": "Generic care frequency must be a number",
                "number.integer": "Generic care frequency must be an integer",
                "number.positive": "Generic care frequency must be a positive integer"
            }),
        otherwise: Joi.number()
            .integer()
            .positive()
            .optional()
    }),

});