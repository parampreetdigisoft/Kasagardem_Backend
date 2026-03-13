import { connectDB } from "../core/config/db";

/**
 * Creates the All_plants table in the database if it does not already exist.
 * This table stores various attributes of different plants, including 
 * common name, scientific name, family, genus, and other plant-related details.
 * 
 * @returns {Promise<void>} A promise that resolves once the table is created.
 */
export async function createAllPlantTables():Promise<void> {

    const  client = await connectDB();
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS All_plants (
                id SERIAL PRIMARY KEY,
                common_name varchar(255) NOT NULL,
                scientific_name varchar(255) NOT NULL,
                family varchar(255),
                genus varchar(255),
                light varchar(255),
                ground_humidity varchar(255),
                atmospheric_humidity varchar(255),
                soil_nutriments varchar(255),
                soil_salinity varchar(255),
                ph_minimum varchar(255),
                ph_maximum varchar(255),
                growth_rate varchar(255),
                growth_habit varchar(255),
                average_height_cm varchar(255),
                maximum_height_cm varchar(255),
                minimum_root_depth_cm varchar(255),
                edible varchar(255),
                vegetable varchar(255),
                flower_color varchar(255),
                foliage_color varchar(255),
                foliage_texture varchar(255),
                bloom_months varchar(255),
                growth_months varchar(255),
                fruit_months varchar(255),
                image_url varchar(255),
                common_names varchar(255),
                distributions varchar(255),
                growth_rate_pt varchar(255),
                gowth_habit_pt varchar(255),
                edible_pt varchar(255),
                vegetable_pt varchar(255),
                flower_color_pt varchar(255),
                foliage_color_pt varchar(255),
                foliage_texture_pt varchar(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await client.query(query);
        console.error("All plant tables created successfully.");
    } catch (error) {
        console.error("Error creating all plant tables:", error);
    } 
};