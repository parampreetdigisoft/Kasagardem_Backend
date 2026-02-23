import { connectDB } from "../core/config/db";

/**
 * Creates the `user_plants` table in the database if it does not already exist.
 * 
 * The table stores the association between users and the plants they own, 
 * along with optional custom care schedules, plant health status, and images.
 *
 * @async
 * @function
 * @returns {Promise<void>} Resolves when the table creation query completes.
 * @throws {Error} If the database query fails.
 */
export async function userplantTable(): Promise<void> {
    try {
        const client = await connectDB();
        await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
        const query = `
        CREATE TABLE IF NOT EXISTS user_plants (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

            user_id UUID NOT NULL,
            plant_species_id UUID NOT NULL,

            nickname VARCHAR(255),
            added_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

            -- ══════════════════════════════════════
            -- Watering Tracking
            -- ══════════════════════════════════════
            last_watered_at TIMESTAMPTZ,
            next_watered_at TIMESTAMPTZ,
            custom_water_frequency INTEGER CHECK (custom_water_frequency > 0),
            water_notification_enabled BOOLEAN DEFAULT FALSE,
            water_preferred_time TIME DEFAULT '09:00:00',

            -- ══════════════════════════════════════
            -- Fertilizer Tracking
            -- ══════════════════════════════════════
            last_fertilized_at TIMESTAMPTZ,
            next_fertilized_at TIMESTAMPTZ,
            custom_fertilizer_schedule INTEGER CHECK (custom_fertilizer_schedule > 0),
            fertilizer_notification_enabled BOOLEAN DEFAULT FALSE,
            fertilizer_preferred_time TIME DEFAULT '09:00:00',

            -- ══════════════════════════════════════
            -- Pruning Tracking
            -- ══════════════════════════════════════
            last_pruned_at TIMESTAMPTZ,
            next_pruned_at TIMESTAMPTZ,
            custom_pruning_schedule INTEGER CHECK (custom_pruning_schedule > 0),
            pruning_notification_enabled BOOLEAN DEFAULT FALSE,
            pruning_preferred_time TIME DEFAULT '09:00:00',

            -- ══════════════════════════════════════
            -- Generic Options Tracking
            -- Mirrors generic_options from plant_species
            -- Each object: { name, last_done_at, next_due_at, custom_frequency, preferred_time, notification_enabled }
            -- ══════════════════════════════════════
            generic_options_tracking JSONB DEFAULT '[]'::jsonb,

            health_status VARCHAR(50) DEFAULT 'healthy',

            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT fk_user
                FOREIGN KEY(user_id)
                REFERENCES users(id)
                ON DELETE CASCADE,

            CONSTRAINT fk_plant_species
                FOREIGN KEY(plant_species_id)
                REFERENCES plant_species(id)
                ON DELETE CASCADE

            CONSTRAINT unique_user_plant        
            UNIQUE (user_id, plant_species_id)
        );
        `;

        await client.query(query);
        console.error("User plants table created successfully!");

    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Error creating user plants table:", error.message);
        } else {
            console.error("Unknown error:", error);
        }
    }
}

