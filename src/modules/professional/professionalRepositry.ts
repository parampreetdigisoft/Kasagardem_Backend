import { connectDB, getDB } from "../../core/config/db";
import { sendProfessionalWelcomeEmail } from "../../core/services/emailService";
import { csvUser } from "../../interface/auth";
import { ProfessionalProfileResponse, RegistrationResult, ServiceResult } from "../../interface/professional";
import bcrypt from "bcryptjs";

/**
 * Bulk registers professionals from CSV data.
 * 
 * - Creates user accounts with "Professional" role
 * - Generates random password
 * - Creates professional profile with 30-day trial
 * - Assigns founder status if founder limit not exceeded
 * - Sends welcome email with credentials
 * 
 * Each professional is processed inside its own DB transaction.
 * If one fails, others continue processing.
 *
 * @param professionals - Array of professionals parsed from CSV
 * @returns ServiceResult containing summary + per-row results
 * 
 * @throws Error if required system configuration (role or founder_config) is missing
 */
export async function registerProfessionalsService(
    professionals: csvUser[]
): Promise<ServiceResult> {
    const client = await connectDB();
    const results: RegistrationResult[] = [];
    let successful = 0;
    let failed = 0;
    let emailsSent = 0;
    let emailsFailed = 0;

    try {
        // Get the "Professional" role ID
        const roleQuery = `SELECT id FROM roles WHERE LOWER(name) = 'professional' LIMIT 1`;
        const roleResult = await client.query(roleQuery);

        if (roleResult.rows.length === 0) {
            throw new Error("Professional role not found in database. Please create it first.");
        }

        const professionalRoleId = roleResult.rows[0].id;

        const founderConfigQuery = `SELECT founder_counter, founder_limit FROM founder_config LIMIT 1`;
        const founderConfigResult = await client.query(founderConfigQuery);

        if (founderConfigResult.rows.length === 0) {
            throw new Error("Founder config not found in database. Please create it first.");
        }

        const { founder_counter: currentFounderCounter, founder_limit: founderLimit } = founderConfigResult.rows[0];

        // Process each professional
        for (const professional of professionals) {
            let userId: string | undefined;
            let generatedPassword: string | undefined;

            try {
                // Start transaction
                await client.query('BEGIN');

                // Validate required fields
                if (!professional.email || !professional.name) {
                    throw new Error("Email and name are required");
                }

                // Validate email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(professional.email)) {
                    throw new Error("Invalid email format");
                }

                // Check if email already exists
                const emailCheckQuery = `SELECT id FROM users WHERE email = $1`;
                const emailCheck = await client.query(emailCheckQuery, [professional.email]);

                if (emailCheck.rows.length > 0) {
                    throw new Error("Email already exists");
                }

                // Generate password
                generatedPassword = generatePassword();
                const hashedPassword = await bcrypt.hash(generatedPassword, 10);

                // Insert into users table
                const userInsertQuery = `
                    INSERT INTO users (
                        name, 
                        email, 
                        password, 
                        role_id, 
                        phone_number,
                        is_email_verified,
                        created_at,
                        updated_at
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    RETURNING id
                `;

                const userResult = await client.query(userInsertQuery, [
                    professional.name,
                    professional.email,
                    hashedPassword,
                    professionalRoleId,
                    professional.phone || null,
                    false
                ]);

                userId = userResult.rows[0].id;

                // Calculate trial dates
                const trialStartDate = new Date();
                const trialEndDate = new Date();
                trialEndDate.setDate(trialEndDate.getDate() + 30);

                // Prepare states JSON
                const statesJson = professional.state
                    ? JSON.stringify([professional.state.trim()])
                    : JSON.stringify([]);


                const isFounder = currentFounderCounter < founderLimit;
                let founderNumber: number | null = null;

                if (isFounder) {
                    // Get the next founder number and increment the counter
                    const nextFounderNumber = currentFounderCounter + 1;
                    founderNumber = nextFounderNumber;

                    // Update founder counter
                    const updateCounterQuery = `
                        UPDATE founder_config 
                        SET founder_counter = $1 
                        WHERE id = (SELECT id FROM founder_config LIMIT 1)
                    `;
                    await client.query(updateCounterQuery, [nextFounderNumber]);
                }

                // Insert into professional_profiles table
                // Insert into professional_profiles table
                const profileInsertQuery = `
                    INSERT INTO professional_profiles (
                        user_id,
                        status,
                        trial_start_date,
                        trial_end_date,
                        primary_city,
                        states,
                        profile_visible,
                        is_founder,
                        founder_number,
                        national_coverage,
                        created_at,
                        updated_at
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    RETURNING id
                `;

                await client.query(profileInsertQuery, [
                    userId,
                    'trial',
                    trialStartDate,
                    trialEndDate,
                    professional.city || null,
                    statesJson,
                    false,
                    isFounder,
                    founderNumber,
                    false
                ]);
                // Commit transaction
                await client.query('COMMIT');
                successful++;

                // Try to send email (don't fail the registration if email fails)
                try {
                    await sendProfessionalWelcomeEmail({
                        email: professional.email,
                        name: professional.name,
                        password: generatedPassword,
                        trialEndDate: trialEndDate
                    });

                    const result: RegistrationResult = {
                        rowNumber: professional.__rowNumber || 0,
                        success: true,
                        email: professional.email,
                        name: professional.name,
                        emailSent: true,
                    };

                    if (userId) {
                        result.userId = userId;
                    }

                    results.push(result);
                    emailsSent++;

                } catch (emailError) {
                    const emailErrorMessage = emailError instanceof Error
                        ? emailError.message
                        : String(emailError);

                    console.error(`Email failed for ${professional.email}:`, emailErrorMessage);

                    const result: RegistrationResult = {
                        rowNumber: professional.__rowNumber || 0,
                        success: true,
                        email: professional.email,
                        name: professional.name,
                        emailSent: false,
                        emailError: emailErrorMessage,
                    };

                    if (userId) {
                        result.userId = userId;
                    }

                    results.push(result);
                    emailsFailed++;
                }

            } catch (error) {
                // Rollback transaction on error
                await client.query('ROLLBACK');

                const errorMessage = error instanceof Error ? error.message : String(error);

                results.push({
                    rowNumber: professional.__rowNumber || 0,
                    success: false,
                    email: professional.email,
                    name: professional.name,
                    error: errorMessage
                });
                failed++;
            }
        }

        return {
            total: professionals.length,
            successful,
            failed,
            emailsSent,
            emailsFailed,
            results
        };

    } catch (error) {
        console.error("Service error:", error);
        throw error;
    }
}




/**
 * Generates a secure random password.
 * 
 * Ensures:
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 * 
 * Then shuffles characters for randomness.
 *
 * @param length - Desired password length (default: 12)
 * @returns Generated password string
 */
function generatePassword(length: number = 12): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';

    const allChars = uppercase + lowercase + numbers + symbols;

    let password = '';

    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
}



/**
 * Retrieves paginated professional profiles from database.
 *
 * Returns:
 * - Professional details
 * - Trial period information
 * - Founder information
 * - Coverage details
 * - Total count for pagination
 *
 * @param limit - Number of records to fetch
 * @param offset - Number of records to skip
 * 
 * @returns Object containing:
 *  - professionals: formatted professional list
 *  - totalCount: total number of professional profiles in DB
 */
export const getAllProfessionalProfilesDb = async (
    limit: number,
    offset: number
): Promise<{
    professionals: ProfessionalProfileResponse[];
    totalCount: number;
}> => {
    const client = await getDB();

    // Get paginated professional profiles
    const result = await client.query(
        `
    SELECT
      id,
      user_id,
      status,
      profile_visible,
      trial_start_date,
      trial_end_date,
      active_subscription_id,
      is_founder,
      founder_number,
      primary_city,
      states,
      national_coverage,
      created_at
    FROM professional_profiles
    ORDER BY created_at ASC
    LIMIT $1 OFFSET $2
    `,
        [limit, offset]
    );

    // Get total count
    const countResult = await client.query(
        `SELECT COUNT(*) FROM professional_profiles`
    );
    const totalCount = parseInt(countResult.rows[0].count, 10);

    // Format response
    const formatted = result.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        status: row.status,
        profileVisible: row.profile_visible,

        trialPeriod: {
            startDate: row.trial_start_date,
            endDate: row.trial_end_date,
        },

        activeSubscriptionId: row.active_subscription_id,

        founder: {
            isFounder: row.is_founder,
            founderNumber: row.founder_number,
        },

        coverage: {
            primaryCity: row.primary_city,
            states: row.states,
            national: row.national_coverage,
        },

        createdAt: row.created_at,
    }));

    return {
        professionals :formatted,
        totalCount,
    };
};

