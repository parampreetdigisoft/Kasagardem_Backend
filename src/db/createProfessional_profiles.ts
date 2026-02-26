import { connectDB } from "../core/config/db";

/**
 * Creates the `professional_profiles` table if it does not already exist.
 *
 * The table stores:
 * - Profile status (trial, active, blocked)
 * - Trial period dates
 * - Subscription reference
 * - Founder flags and numbering
 * - Geographic coverage settings
 *
 * @returns {Promise<void>} Resolves when the table creation completes.
 * @throws {Error} Logs any database-related errors encountered during execution.
 */
export async function createProfessionalProfilesTable(): Promise<void> {
    try {
        const client = await connectDB();

        const query = `CREATE TABLE IF NOT EXISTS professional_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE
            REFERENCES users(id) ON DELETE CASCADE,

        status VARCHAR(20) NOT NULL
            CHECK (status IN ('trial','active','blocked')),

        profile_visible BOOLEAN DEFAULT TRUE,

        trial_start_date DATE NOT NULL,
        trial_end_date DATE NOT NULL,

        active_subscription_id UUID NULL,

      
        is_founder BOOLEAN DEFAULT FALSE,
        founder_number INTEGER,
        states JSONB,
        national_coverage BOOLEAN DEFAULT FALSE,

        category VARCHAR(100),
        description TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        telefone VARCHAR(20),
        whatsapp VARCHAR(20),
        website VARCHAR(255),
        instagram VARCHAR(100),
        address TEXT,
        assessment FLOAT,
        num_avaliacoes INTEGER,
        verified_source VARCHAR(50) DEFAULT 'false', -- Updated to store string value
        latitude FLOAT,
        longitude FLOAT,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`;

        await client.query(query);
        console.error("professional_profiles table created or already exists.");

    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Error creating professional_profiles table:", error.message);
        } else {
            console.error("Unknown error:", error);
        }

    }
}   