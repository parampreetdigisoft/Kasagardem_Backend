import Joi from "joi";

// timePattern.ts
export const timePattern = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;


export const createUserPlantValidation = Joi.object({
    plant_species_id: Joi.string()
        .uuid()
        .required()
        .messages({
            "string.guid"   : "Plant species ID must be a valid UUID",
            "any.required"  : "Plant species ID is required"
        }),

    nickname: Joi.string().max(255).optional(),

    health_status: Joi.string()
        .valid("healthy", "needs_attention", "critical")
        .default("healthy"),

    // ── Water ────────────────────────────────────────────────────────────────
    custom_water_frequency: Joi.number().integer().min(1).optional()
        .messages({
            "number.min"        : "Water frequency must be at least 1 day",
            "number.integer"    : "Water frequency must be a whole number"
        }),

    water_notification_enabled: Joi.boolean().default(false),

    water_preferred_time: Joi.when("water_notification_enabled", {
        is: true,
        then: Joi.string()
            .pattern(timePattern)
            .required()
            .messages({
                "any.required"          : "Water preferred time is required when notification is enabled",
                "string.pattern.base"   : "Water preferred time must be in HH:mm:ss format"
            }),
        otherwise: Joi.string()
            .pattern(timePattern)
            .default("09:00:00")
            .messages({
                "string.pattern.base": "Water preferred time must be in HH:mm:ss format"
            })
    }),

    // ── Fertilizer ───────────────────────────────────────────────────────────
    custom_fertilizer_schedule: Joi.number().integer().min(1).optional()
        .messages({
            "number.min"        : "Fertilizer schedule must be at least 1 day",
            "number.integer"    : "Fertilizer schedule must be a whole number"
        }),

    fertilizer_notification_enabled: Joi.boolean().default(false),

    fertilizer_preferred_time: Joi.when("fertilizer_notification_enabled", {
        is: true,
        then: Joi.string()
            .pattern(timePattern)
            .required()
            .messages({
                "any.required"          : "Fertilizer preferred time is required when notification is enabled",
                "string.pattern.base"   : "Fertilizer preferred time must be in HH:mm:ss format"
            }),
        otherwise: Joi.string()
            .pattern(timePattern)
            .default("09:00:00")
            .messages({
                "string.pattern.base": "Fertilizer preferred time must be in HH:mm:ss format"
            })
    }),

    // ── Pruning ──────────────────────────────────────────────────────────────
    custom_pruning_schedule: Joi.number().integer().min(1).optional()
        .messages({
            "number.min"        : "Pruning schedule must be at least 1 day",
            "number.integer"    : "Pruning schedule must be a whole number"
        }),

    pruning_notification_enabled: Joi.boolean().default(false),

    pruning_preferred_time: Joi.when("pruning_notification_enabled", {
        is: true,
        then: Joi.string()
            .pattern(timePattern)
            .required()
            .messages({
                "any.required"          : "Pruning preferred time is required when notification is enabled",
                "string.pattern.base"   : "Pruning preferred time must be in HH:mm:ss format"
            }),
        otherwise: Joi.string()
            .pattern(timePattern)
            .default("09:00:00")
            .messages({
                "string.pattern.base": "Pruning preferred time must be in HH:mm:ss format"
            })
    }),
});
