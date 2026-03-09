
import { connectDB, getDB } from "../../core/config/db";
import { sendProfessionalWelcomeEmail } from "../../core/services/emailService";
import { csvUser } from "../../interface/auth";
import { GetProfessionalsParams, GetProfessionalsResponse, InsertResult, PartnerProfile, professionalProfileResponse, ProfessionalProfileResponse, RequestingUser } from "../../interface/professional";
import bcrypt from "bcryptjs";
import { getSignedFileUrl } from "../../core/services/s3UploadService";

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
// export async function registerProfessionalsService(
//     professionals: csvUser[]
// ): Promise<ServiceResult> {
//     const client = await connectDB();
//     const results: RegistrationResult[] = [];
//     let successful = 0;
//     let failed = 0;
//     let emailsSent = 0;
//     let emailsFailed = 0;

//     try {
//         // Get the "Professional" role ID
//         const roleQuery = `SELECT id FROM roles WHERE LOWER(name) = 'professional' LIMIT 1`;
//         const roleResult = await client.query(roleQuery);

//         if (roleResult.rows.length === 0) {
//             throw new Error("Professional role not found in database. Please create it first.");
//         }

//         const professionalRoleId = roleResult.rows[0].id;

//         const founderConfigQuery = `SELECT founder_counter, founder_limit FROM founder_config LIMIT 1`;
//         const founderConfigResult = await client.query(founderConfigQuery);

//         if (founderConfigResult.rows.length === 0) {
//             throw new Error("Founder config not found in database. Please create it first.");
//         }

//         const { founder_counter: currentFounderCounter, founder_limit: founderLimit } = founderConfigResult.rows[0];

//         // Process each professional
//         for (const professional of professionals) {
//             let userId: string | undefined;
//             let generatedPassword: string | undefined;

//             try {
//                 // Start transaction
//                 await client.query('BEGIN');

//                 // Validate required fields
//                 if (!professional.email || !professional.name) {
//                     throw new Error("Email and name are required");
//                 }

//                 // Validate email format
//                 const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//                 if (!emailRegex.test(professional.email)) {
//                     throw new Error("Invalid email format");
//                 }

//                 // Check if email already exists
//                 const emailCheckQuery = `SELECT id FROM users WHERE email = $1`;
//                 const emailCheck = await client.query(emailCheckQuery, [professional.email]);

//                 if (emailCheck.rows.length > 0) {
//                     throw new Error("Email already exists");
//                 }

//                 // Generate password
//                 generatedPassword = generatePassword();
//                 const hashedPassword = await bcrypt.hash(generatedPassword, 12);


//                 // Insert into users table
//                 const userInsertQuery = `
//                     INSERT INTO users (
//                         name, 
//                         email, 
//                         password, 
//                         role_id, 
//                         phone_number,
//                         is_email_verified,
//                         created_at,
//                         updated_at
//                     )
//                     VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
//                     RETURNING id
//                 `;

//                 const userResult = await client.query(userInsertQuery, [
//                     professional.name,
//                     professional.email,
//                     hashedPassword,
//                     professionalRoleId,
//                     professional.telefone || null,
//                     false
//                 ]);

//                 userId = userResult.rows[0].id;

//                 // Calculate trial dates
//                 const trialStartDate = new Date();
//                 const trialEndDate = new Date();
//                 trialEndDate.setDate(trialEndDate.getDate() + 30);

//                 // Prepare states JSON
//                 // const statesJson = professional.state
//                 //     ? JSON.stringify([professional.state.trim()])
//                 //     : JSON.stringify([]);


//                 const isFounder = currentFounderCounter < founderLimit;
//                 let founderNumber: number | null = null;

//                 if (isFounder) {
//                     // Get the next founder number and increment the counter
//                     const nextFounderNumber = currentFounderCounter + 1;
//                     founderNumber = nextFounderNumber;

//                     // Update founder counter
//                     const updateCounterQuery = `
//                         UPDATE founder_config 
//                         SET founder_counter = $1 
//                         WHERE id = (SELECT id FROM founder_config LIMIT 1)
//                     `;
//                     await client.query(updateCounterQuery, [nextFounderNumber]);
//                 }

//                 // Insert into professional_profiles table
//                 // Insert into professional_profiles table
//                 const profileInsertQuery = `
//                 INSERT INTO professional_profiles (
//                     user_id, status, trial_start_date, trial_end_date,
//                      profile_visible,
//                     is_founder, founder_number, national_coverage,
//                     category, description, city, state,
//                     telefone, whatsapp, website, instagram,
//                     address, assessment, num_avaliacoes,
//                     verified_source, latitude, longitude,
//                     created_at, updated_at
//                 )
//                 VALUES (
//                     $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
//                     $11,$12,$13,$14,$15,$16,$17,$18,
//                     $19,$20,$21,$22,
//                     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP   -- was missing comma before this
//                 )
//                 RETURNING id
//             `;
//                 await client.query(profileInsertQuery, [
//                     userId,                                                          // $1
//                     'trial',                                                         // $2
//                     trialStartDate,                                                  // $3
//                     trialEndDate,                                                    // $4                                                   // $6  states — was removed from columns but value was still passed, causing all params to shift
//                     false,                                                           // $7  profile_visible
//                     isFounder,                                                       // $8  is_founder
//                     founderNumber,                                                   // $9  founder_number
//                     false,                                                           // $10 national_coverage
//                     professional.category || null,                                   // $11 — was `category || null`, missing `professional.`
//                     professional.description || null,                                // $12 — was `description || null`, missing `professional.`
//                     professional.city || null,                                       // $13 city
//                     professional.state || null,                                      // $14 state
//                     professional.telefone || null,                                   // $15
//                     professional.whatsapp || null,                                   // $16
//                     professional.website || null,                                    // $17
//                     professional.instagram || null,                                  // $18
//                     professional.address || null,                                    // $19
//                     professional.assessment ? parseFloat(String(professional.assessment)) : null,       // $20
//                     professional.num_avaliacoes ? parseInt(String(professional.num_avaliacoes)) : null, // $21
//                     professional.verified_source || null,                            // $22
//                     professional.latitude ? parseFloat(String(professional.latitude)) : null,           // $23
//                     professional.longitude ? parseFloat(String(professional.longitude)) : null,         // $24
//                 ]);
//                 // Commit transaction
//                 await client.query('COMMIT');
//                 successful++;

//                 // Try to send email (don't fail the registration if email fails)
//                 try {
//                     await sendProfessionalWelcomeEmail({
//                         email: professional.email,
//                         name: professional.name,
//                         password: generatedPassword,
//                         trialEndDate: trialEndDate
//                     });

//                     const result: RegistrationResult = {
//                         rowNumber: professional.__rowNumber || 0,
//                         success: true,
//                         email: professional.email,
//                         name: professional.name,
//                         emailSent: true,
//                     };

//                     if (userId) {
//                         result.userId = userId;
//                     }

//                     results.push(result);
//                     emailsSent++;

//                 } catch (emailError) {
//                     const emailErrorMessage = emailError instanceof Error
//                         ? emailError.message
//                         : String(emailError);

//                     console.error(`Email failed for ${professional.email}:`, emailErrorMessage);

//                     const result: RegistrationResult = {
//                         rowNumber: professional.__rowNumber || 0,
//                         success: true,
//                         email: professional.email,
//                         name: professional.name,
//                         emailSent: false,
//                         emailError: emailErrorMessage,
//                     };

//                     if (userId) {
//                         result.userId = userId;
//                     }

//                     results.push(result);
//                     emailsFailed++;
//                 }

//             } catch (error) {
//                 // Rollback transaction on error
//                 await client.query('ROLLBACK');

//                 const errorMessage = error instanceof Error ? error.message : String(error);

//                 results.push({
//                     rowNumber: professional.__rowNumber || 0,
//                     success: false,
//                     email: professional.email,
//                     name: professional.name,
//                     error: errorMessage
//                 });
//                 failed++;
//             }
//         }

//         return {
//             total: professionals.length,
//             successful,
//             failed,
//             emailsSent,
//             emailsFailed,
//             results
//         };

//     } catch (error) {
//         console.error("Service error:", error);
//         throw error;
//     }
// }


export const createProfessionalsService = async (
    professionals: csvUser[]
): Promise<InsertResult> => {
    if (!professionals.length) return { inserted: 0, failed: [] };

    const client = await connectDB();
    const values: (string | number | null)[] = [];
    const placeholders: string[] = [];
    const failed: { row: number; error: string }[] = [];

    for (let i = 0; i < professionals.length; i++) {

        const p = professionals[i];
        if (!p) continue;
        try {
            /** 
              * Converts a value to a number, or returns null if conversion is not possible.
              *
              * Rules:
              * - Returns `null` if the value is `null`, `undefined`, or an empty string.
              * - Converts other values using `Number(val)`.
              * - Returns `null` if the result of `Number(val)` is `NaN`.
              *
              * @function toNumberOrNull
              * @param {unknown} val - The value to convert to a number.
              * @returns {number | null} The numeric value, or `null` if conversion fails.
              *
              * @example
              * toNumberOrNull("42"); // returns 42
              * toNumberOrNull("");   // returns null
              * toNumberOrNull("abc"); // returns null
              * toNumberOrNull(null);  // returns null
              */
            const toNumberOrNull = (val: unknown): number | null => {
                if (val == null || val === "") return null;// eslint-disable-line eqeqeq
                const n = Number(val);
                return isNaN(n) ? null : n;
            };

            const assessment = toNumberOrNull(p.assessment);
            const num_avaliacoes = toNumberOrNull(p.num_avaliacoes);
            const latitude = toNumberOrNull(p.latitude);
            const longitude = toNumberOrNull(p.longitude);

            if (isNaN(assessment!) && assessment !== null) {
                throw new Error(`Invalid assessment value: "${p.assessment}"`);
            }
            if (isNaN(num_avaliacoes!) && num_avaliacoes !== null) {
                throw new Error(`Invalid num_avaliacoes value: "${p.num_avaliacoes}"`);
            }
            if (isNaN(latitude!) && latitude !== null) {
                throw new Error(`Invalid latitude value: "${p.latitude}"`);
            }
            if (isNaN(longitude!) && longitude !== null) {
                throw new Error(`Invalid longitude value: "${p.longitude}"`);
            }

            const b = values.length;
            placeholders.push(`(
        gen_random_uuid(),
        $${b + 1},  $${b + 2},  $${b + 3},  $${b + 4},
        $${b + 5},  $${b + 6},  $${b + 7},  $${b + 8},
        $${b + 9},  $${b + 10}, $${b + 11}, $${b + 12},
        $${b + 13}, $${b + 14}, $${b + 15}, $${b + 16},
        $${b + 17}
      )`);

            values.push(
                p.company_name ?? null,
                p.region ?? null,
                p.email ?? null,
                p.category ?? null,
                p.description ?? null,
                p.city ?? null,
                p.state ?? null,
                p.telefone ?? null,
                p.whatsapp ?? null,
                p.website ?? null,
                p.instagram ?? null,
                p.address ?? null,
                assessment,
                num_avaliacoes,
                p.verified_source ?? null,
                latitude,
                longitude
            );
        } catch (err) {
            failed.push({
                row: i + 1,
                error: err instanceof Error ? err.message : String(err),
            });
        }
    }

    if (!placeholders.length) {
        return { inserted: 0, failed };
    }

    try {
        await client.query("BEGIN");

        const result = await client.query(
            `INSERT INTO professional_profiles (
        id, company_name,region, email, category, description,
        city, state, telefone, whatsapp, website,
        instagram, address, assessment, num_avaliacoes,
        verified_source, latitude, longitude
      ) VALUES ${placeholders.join(",")}`,
            values
        );

        await client.query("COMMIT");
        return { inserted: result.rowCount ?? 0, failed };

    } catch (err) {
        await client.query("ROLLBACK").catch((e) => console.error("Rollback failed:", e));
        throw new Error(`Insert failed: ${err instanceof Error ? err.message : String(err)}`);
    }
};

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
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';

    const allChars = lowercase + numbers + symbols;

    let password = '';

    // Ensure at least one of each type
    // password += uppercase[Math.floor(Math.random() * uppercase.length)];
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

    // Fetch professionals with pagination
    const result = await client.query(
        `SELECT
            p.id,
            p.company_name,
            p.email,
            p.category,
            p.description,
            p.image_url,
            p.city,
            p.state,
            p.address,
            p.latitude,
            p.longitude,
            p.telefone,
            p.whatsapp,
            p.website,
            p.instagram,
            p.assessment,
            p.num_avaliacoes,
            p.verified_source,
            p.created_at,
            p.updated_at,
            pa.id AS professional_account_id
        FROM professional_profiles p
        LEFT JOIN professional_accounts pa
        ON p.id = pa.professional_profile_id
        ORDER BY p.created_at ASC
        LIMIT $1 OFFSET $2`,
        [limit, offset]
    );

    // Get total count
    const countResult = await client.query(
        `SELECT COUNT(*) FROM professional_profiles`
    );
    const totalCount = parseInt(countResult.rows[0].count, 10);

    // Map rows to response
    const professionals = result.rows.map((row) => ({
        id: row.id,
        companyName: row.company_name,
        email: row.email,
        category: row.category,
        image_url: row.image_url,
        description: row.description,

        location: {
            city: row.city,
            state: row.state,
            address: row.address,
            latitude: row.latitude,
            longitude: row.longitude,
        },

        contact: {
            telefone: row.telefone,
            whatsapp: row.whatsapp,
            website: row.website,
            instagram: row.instagram,
        },

        ratings: {
            assessment: row.assessment,
            numAvaliacoes: row.num_avaliacoes,
        },

        verifiedSource: row.verified_source,
        createdAt: row.created_at,
        updatedAt: row.updated_at,

        // Add the registered flag based on whether a professional account exists
        registered: !!row.professional_account_id, // true if exists, false otherwise
    }));

    return { professionals, totalCount };
};
/**
 * Retrieves a professional profile by its unique ID.
 *
 * This function:
 * - Queries the `professional_profiles` table.
 * - Maps database fields (snake_case) into a structured
 *   `ProfessionalProfileResponse` object (camelCase).
 *
 * Returned Object Structure:
 * - Basic Info: id, companyName, email, category, description
 * - Location: city, state, address, latitude, longitude
 * - Contact: telefone, whatsapp, website, instagram
 * - Ratings: assessment, numAvaliacoes
 * - Metadata: verifiedSource, createdAt, updatedAt
 *
 * @async
 * @function getProfessionalDataById
 *
 * @param {string} id - UUID of the professional profile.
 *
 * @returns {Promise<ProfessionalProfileResponse | null>}
 * Returns:
 * - ProfessionalProfileResponse object if found
 * - null if no record exists with the given ID
 *
 * @throws {Error} Propagates database errors if the query fails.
 */
export const getProfessionalDataById = async (id: string): Promise<ProfessionalProfileResponse | null> => {
    const client = await getDB();

    const result = await client.query(
        `SELECT * from professional_profiles where id = $1`,
        [id]
    );

    if (result.rows.length === 0) {
        return null;
    }

    const row = result.rows[0];

    return {
        id: row.id,
        companyName: row.company_name,
        email: row.email,
        category: row.category,
        description: row.description,
        location: {
            city: row.city,
            state: row.state,
            address: row.address,
            latitude: row.latitude,
            longitude: row.longitude,
        },
        contact: {
            telefone: row.telefone,
            whatsapp: row.whatsapp,
            website: row.website,
            instagram: row.instagram,
        },
        ratings: {
            assessment: row.assessment,
            numAvaliacoes: row.num_avaliacoes,
        },
        verifiedSource: row.verified_source,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}


/**
 * Registers a professional user and their associated professional account.
 *
 * Workflow:
 * 1. Connects to the database and starts a transaction.
 * 2. Fetches and locks the founder configuration to determine founder eligibility.
 * 3. Ensures the professional's email is unique in the `users` table.
 * 4. Resolves the "Professional" role ID.
 * 5. Creates the user in the `users` table and generates a password.
 * 6. Updates founder counter atomically if the user qualifies as a founder.
 * 7. Creates the professional account in `professional_accounts`.
 * 8. Commits the transaction.
 * 9. Sends a mandatory welcome email after user creation.
 *
 * Error Handling & Safety:
 * - Rolls back the transaction if any DB step fails before commit.
 * - Logs critical errors for operational awareness if email sending fails post-commit.
 * - Ensures partial data does not leave the system in an inconsistent state.
 *
 * Notes:
 * - If the welcome email fails after commit, the user is still registered,
 *   but manual intervention is required to resend credentials.
 * - Transaction rollback is only attempted if it was started and uncommitted.
 *
 * @async
 * @function registerProfessionalService
 *
 * @param {string} professionalId - UUID of the professional profile to register.
 * @param {ProfessionalProfileResponse} professional - Professional profile data.
 *
 * @returns {Promise<{ success: boolean; message: string }>}
 * Returns an object indicating success or failure, including a message:
 * - `success: true` if registration completes (with or without email failure warning).
 * - `success: false` if any critical error occurs during registration.
 */
export const registerProfessionalService = async (
    professionalId: string,
    professional: ProfessionalProfileResponse
): Promise<{ success: boolean; message: string }> => {

    let client;
    let transactionStarted = false;
    let userCreated = false;
    let generatedPassword: string | null = null;

    // ─── Connect to DB ─────────────────────────────────────────────────────────
    try {
        client = await connectDB();
    } catch (connectionError) {
        console.error("Database connection failed:", connectionError);
        return {
            success: false,
            message: "Unable to connect to the database. Please try again later.",
        };
    }

    try {
        await client.query("BEGIN");
        transactionStarted = true;

        // ─── 1. Fetch founder config ───────────────────────────────────────────
        const founderConfigResult = await client.query<{
            id: number;
            founder_counter: number;
            founder_limit: number;
        }>(
            `SELECT id, founder_counter, founder_limit 
             FROM founder_config 
             LIMIT 1 
             FOR UPDATE`
        );

        const founderConfigRow = founderConfigResult.rows[0];
        if (!founderConfigRow) {
            throw new Error(
                "Founder config not found in database. Please create it first."
            );
        }

        const {
            founder_counter: currentFounderCounter,
            founder_limit: founderLimit,
        } = founderConfigRow;

        // ─── 2. Email uniqueness check ─────────────────────────────────────────
        const emailCheck = await client.query(
            `SELECT id FROM users WHERE email = $1`,
            [professional.email]
        );

        if (emailCheck.rows.length > 0) {
            throw new Error("Email already exists");
        }

        // ─── 3. Resolve Professional role ─────────────────────────────────────
        const roleResult = await client.query<{ id: number }>(
            `SELECT id FROM roles WHERE name = 'Professional' LIMIT 1`
        );

        const roleRow = roleResult.rows[0];
        if (!roleRow) {
            throw new Error(
                "Professional role not found in database. Please create it first."
            );
        }

        const professionalRoleId = roleRow.id;

        // ─── 4. Create user ────────────────────────────────────────────────────
        generatedPassword = generatePassword();
        // console.log(`Generated password for ${professional.email}: ${generatedPassword}`); // Log generated password for debugging (remove in production!)
        const hashedPassword = await bcrypt.hash(generatedPassword, 12);

        const userResult = await client.query<{ id: number }>(
            `INSERT INTO users (
                name,
                email,
                password,
                role_id,
                phone_number,
                is_email_verified,
                created_at,
                updated_at
            )
            VALUES ($1, $2, $3, $4, $5, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id`,
            [
                professional.companyName,
                professional.email,
                hashedPassword,
                professionalRoleId,
                professional.contact?.telefone ?? null,
            ]
        );

        const userRow = userResult.rows[0];
        if (!userRow) {
            throw new Error("Failed to create user. Please try again.");
        }

        const userId = userRow.id;
        userCreated = true; // ← mark user as created so email is enforced

        // ─── 5. Determine founder status (atomic counter update) ──────────────
        const isFounder = currentFounderCounter < founderLimit;
        // let founderNumber: number | null = null;

        if (isFounder) {
            const updatedCounterResult = await client.query<{
                founder_counter: number;
            }>(
                `UPDATE founder_config
                 SET founder_counter = founder_counter + 1
                 WHERE id = (SELECT id FROM founder_config LIMIT 1)
                 RETURNING founder_counter`
            );

            const updatedRow = updatedCounterResult.rows[0];
            if (!updatedRow) {
                throw new Error("Failed to update founder counter. Please try again.");
            }

            // founderNumber = updatedRow.founder_counter;
        }

        // ─── 6. Create professional account ───────────────────────────────────
        await client.query(
            `INSERT INTO professional_accounts (
                user_id,
                professional_profile_id,
                subscription_plan_id,
                is_founder,
                is_first_login,
                trial_start_date,
                trial_end_date,
                plan
            )
            VALUES ($1, $2, null, $3, true, CURRENT_TIMESTAMP, null, 'trial')`,
            [userId, professionalId, isFounder]
        );

        await client.query("COMMIT");
        transactionStarted = false;

        // ─── 7. Send welcome email — mandatory if user was created ─────────────
        // Even if something below throws, user exists in DB so email must be sent
        try {
            await sendProfessionalWelcomeEmail({
                email: professional.email!,
                name: professional.companyName!,
                password: generatedPassword,
                trialEndDate: "Your trial period will begin after your first login.",
            });
        } catch (emailError) {
            // User is registered — do NOT rollback or return failure.
            // Log a critical alert so ops team can manually resend credentials.
            console.error(
                `[CRITICAL] Professional registered (ID: ${professionalId}) but welcome email failed to send to ${professional.email}. Manual intervention required.`,
                emailError
            );

            // Return success but include a warning so the caller is aware
            return {
                success: true,
                message:
                    "Professional registered successfully, but the welcome email failed to send. Please resend credentials manually.",
            };
        }

        return { success: true, message: "Professional registered successfully" };

    } catch (error) {

        // ─── Rollback only if transaction is still open ────────────────────────
        if (transactionStarted) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error(
                    "[CRITICAL] ROLLBACK failed — database may be in an inconsistent state:",
                    rollbackError
                );
            }
        }

        // ─── If user was created but account insert failed, log for ops ────────
        if (userCreated) {
            console.error(
                `[CRITICAL] User record was created for ${professional.email} but professional_accounts insert failed. Manual cleanup required.`
            );
        }

        return {
            success: false,
            message: error instanceof Error ? error.message : String(error),
        };

    }
};



/**
 * Handles professional user login, including first login trial setup and trial status checks.
 *
 * Workflow:
 * 1. Connects to the database and fetches the professional account by `userId`.
 * 2. If the account is logging in for the first time (`is_first_login = true`):
 *    - Sets a 30-day trial period starting from the current date.
 *    - Updates `is_first_login`, `trial_start_date`, and `trial_end_date`.
 * 3. If the account is on a trial plan:
 *    - Checks if the trial has expired.
 *    - Returns remaining trial days if still active.
 * 4. Returns status for active paid accounts.
 *
 * Logging:
 * - Logs critical errors and warnings with `userId` context for operational monitoring.
 *
 * @async
 * @function handleProfessionalLogin
 *
 * @param {string} userId - UUID of the professional user logging in.
 *
 * @returns {Promise<{ success: boolean; message: string; accountStatus?: string }>}
 * - `success`: indicates whether login is allowed.
 * - `message`: user-facing login message.
 * - `accountStatus`: one of `"trial_started"`, `"trial_active"`, `"trial_expired"`, `"active"`.
 *
 * @throws {Error} If the professional account cannot be found or database errors occur.
 *
 * Example Usage:
 * ```ts
 * const result = await handleProfessionalLogin("user-uuid");
 * if (!result.success && result.accountStatus === "trial_expired") {
 *     // Prompt user to upgrade
 * }
 * ```
 */
export const handleProfessionalLogin = async (
    userId: string
): Promise<{ success: boolean; message: string; accountStatus?: string }> => {

    let client;

    try {
        client = await getDB();
    } catch (connectionError) {
        console.error("[handleProfessionalLogin] Database connection failed:", {
            userId,
            error: connectionError instanceof Error ? connectionError.message : String(connectionError),
        });
        throw new Error("Unable to connect to the database. Please try again later.");
    }

    try {
        // ─── 1. Fetch professional account ────────────────────────────────────
        const accountResult = await client.query<{
            id: number;
            is_first_login: boolean;
            trial_start_date: Date | null;
            trial_end_date: Date | null;
            plan: string;
        }>(
            `SELECT id, is_first_login, trial_start_date, trial_end_date, plan
             FROM professional_accounts
             WHERE user_id = $1
             LIMIT 1`,
            [userId]
        );

        const account = accountResult.rows[0];
        if (!account) {
            console.error("[handleProfessionalLogin] Professional account not found:", { userId });
            throw new Error("Professional account not found.");
        }

        const now = new Date();

        // ─── 2. Handle first login — set trial dates ───────────────────────────
        if (account.is_first_login) {
            const trialEndDate = new Date(now);
            trialEndDate.setDate(trialEndDate.getDate() + 30);

            await client.query(
                `UPDATE professional_accounts
                 SET 
                    is_first_login = false,
                    trial_start_date = $1,
                    trial_end_date = $2,
                    updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $3`,
                [now, trialEndDate, userId]
            );

            // console.error("[handleProfessionalLogin] First login — trial period started:", {
            //     userId,
            //     trialStartDate: now,
            //     trialEndDate,
            // });

            return {
                success: true,
                message: "Welcome! Your trial period has started.",
                accountStatus: "trial_started",
            };
        }

        // ─── 3. Check trial expiry ─────────────────────────────────────────────
        if (account.plan === "trial" && account.trial_end_date) {
            const trialExpired = now > new Date(account.trial_end_date);

            if (trialExpired) {
                // console.warn("[handleProfessionalLogin] Trial expired — blocking login:", {
                //     userId,
                //     trialEndDate: account.trial_end_date,
                // });

                return {
                    success: false,
                    message: "Your trial period has expired. Please upgrade your plan to continue.",
                    accountStatus: "trial_expired",
                };
            }

            // Trial still active — calculate days remaining
            const msRemaining = new Date(account.trial_end_date).getTime() - now.getTime();
            const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

            return {
                success: true,
                message: `Trial active. ${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining.`,
                accountStatus: "trial_active",
            };
        }

        // ─── 4. Active paid plan ───────────────────────────────────────────────
        return {
            success: true,
            message: "Login successful.",
            accountStatus: "active",
        };

    } catch (error) {
        console.error("[handleProfessionalLogin] Unexpected error:", {
            userId,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
    }

};

/**
 * Calculates the great-circle distance between two geographic coordinates
 * using the Haversine formula.
 *
 * The Haversine formula accounts for Earth's curvature and returns
 * the shortest distance over the Earth's surface.
 *
 * @function haversineDistance
 *
 * @param {number} lat1 - Latitude of the first point in decimal degrees
 * @param {number} lon1 - Longitude of the first point in decimal degrees
 * @param {number} lat2 - Latitude of the second point in decimal degrees
 * @param {number} lon2 - Longitude of the second point in decimal degrees
 *
 * @returns {number} Distance between the two points in kilometers (km)
 *
 * @example
 * const distance = haversineDistance(
 *   12.9716, 77.5946,   // Bangalore
 *   12.2958, 76.6394    // Mysore
 * );
 * console.log(distance); // ~126 km
 */
function haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371;
    /**
 * Converts degrees to radians.
 *
 * JavaScript trigonometric functions (Math.sin, Math.cos, etc.)
 * expect angles in radians, not degrees.
 *
 * @param {number} deg - Angle in degrees
 * @returns {number} Angle converted to radians
 *
 * @example
 * const radians = toRad(180);
 * console.log(radians); // 3.141592653589793 (π)
 */
    const toRad = (deg: number): number => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// ----------------------------
// Subscription plan priority
// Adjust names to match your DB values
// ----------------------------
const PLAN_PRIORITY: Record<string, number> = {
    Diamante: 4,
    Gold: 3,
    Talk: 2,
    trial: 0,
};

/**
 * Returns the numeric priority of a subscription plan.
 *
 * Plans with higher priority values are ranked higher
 * when sorting professionals.
 *
 * @param {string | null} planName - The name of the subscription plan
 * @returns {number} Numeric priority value.
 *                   Returns -1 if plan is null or not found.
 *
 * @example
 * getPlanPriority("premium"); // 3
 * getPlanPriority(null); // -1
 */
function getPlanPriority(planName: string | null): number {
    if (!planName) return -1;
    return PLAN_PRIORITY[planName.toLowerCase()] ?? -1;
}

/**
 * Fetches professionals from the database and sorts them by:
 *   1️ Distance from user (ascending)
 *   2️ Subscription plan priority (descending)
 *   3️ Rating (descending)
 *
 * Steps:
 *   - Apply optional category filter
 *   - Fetch professionals with valid coordinates
 *   - Calculate Haversine distance in memory
 *   - Sort using multi-level comparator
 *   - Apply pagination
 *
 *  Note:
 * Sorting and distance calculation currently happen in memory.
 * For large datasets, this should be moved to SQL for better performance.
 *
 * @param {GetProfessionalsParams} params - Filtering and pagination parameters
 * @param {number} params.userLat - User latitude
 * @param {number} params.userLng - User longitude
 * @param {string} [params.category] - Optional category filter
 * @param {number} params.limit - Maximum number of records to return
 * @param {number} params.offset - Pagination offset
 *
 * @returns {Promise<GetProfessionalsResponse>} Sorted and paginated professionals list
 */
export async function fetchSortedProfessionals(
    params: GetProfessionalsParams
): Promise<GetProfessionalsResponse> {
    const { userLat, userLng, category, limit, offset } = params;

    const client = await connectDB();

    const conditions: string[] = [
        "pp.latitude IS NOT NULL",
        "pp.longitude IS NOT NULL",
    ];
    const values: unknown[] = [];

    if (category) {
        values.push(category);
        conditions.push(`pp.category = $${values.length}`);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const query = `
    SELECT
      pp.id                   AS professional_profile_id,
      pp.company_name,
      pp.category,
      pp.description,
      pp.city,
      pp.state,
      pp.address,
      pp.latitude,
      pp.longitude,
      pp.telefone,
      pp.whatsapp,
      pp.website,
      pp.instagram,
      pp.assessment           AS rating,
      pp.num_avaliacoes,
      pp.verified_source,
      pp.image_url,

      pa.plan                 AS plan_name,
      pa.account_status, 
      pa.user_id     AS userID,                  -- ✅ select it too (optional, for debugging)

      sp.plan_name            AS subscription_plan_name,
      sp.appear_in_search,
      sp.premium_profile_badge
    FROM professional_profiles pp
    INNER JOIN professional_accounts pa          -- ✅ INNER JOIN: excludes profiles with no account
      ON pa.professional_profile_id = pp.id
      AND pa.account_status = 'active'             -- ✅ only active accounts
    LEFT JOIN subscrptionPlans sp
      ON sp.id = pa.subscription_plan_id
    ${whereClause}
`;

    const result = await client.query(query, values);

    // Attach distance to each row
    const withDistance = result.rows.map((pro) => ({
        ...pro,
        distance_km: haversineDistance(
            userLat,
            userLng,
            parseFloat(pro.latitude),
            parseFloat(pro.longitude)
        ),
    }));

    // Sort: 1) Distance  2) Subscription Plan  3) Rating
    withDistance.sort((a, b) => {
        // 1. Distance ascending (10m tolerance)
        const distDiff = a.distance_km - b.distance_km;
        if (Math.abs(distDiff) > 0.01) return distDiff;

        // 2. Subscription plan descending
        const planA = getPlanPriority(a.subscription_plan_name ?? a.plan_name);
        const planB = getPlanPriority(b.subscription_plan_name ?? b.plan_name);
        if (planA !== planB) return planB - planA;

        // 3. Rating descending
        const ratingA = parseFloat(a.rating) || 0;
        const ratingB = parseFloat(b.rating) || 0;
        return ratingB - ratingA;
    });

    // Paginate
    const paginated = withDistance.slice(offset, offset + limit);

    return {
        total: withDistance.length,
        limit,
        offset,
        user_location: { lat: userLat, lng: userLng },
        data: paginated.map((pro) => ({
            id: pro.userid, // ✅ return userID for frontend to fetch profile details
            company_name: pro.company_name,
            category: pro.category,
            description: pro.description,
            image_url: pro.image_url,
            city: pro.city,
            state: pro.state,
            address: pro.address,
            contact: {
                telefone: pro.telefone,
                whatsapp: pro.whatsapp,
                website: pro.website,
                instagram: pro.instagram,
            },
            rating: pro.rating,
            num_avaliacoes: pro.num_avaliacoes,
            verified_source: pro.verified_source,
            subscription: {
                plan_name: pro.subscription_plan_name ?? pro.plan_name ?? "free",
                highlight_in_result: pro.highlight_in_result ?? false,
                verification_badge: pro.verification_badge ?? false,
            },
            distance_km: parseFloat(pro.distance_km.toFixed(2)),
        })),
    };
}

// eslint-disable-next-line
/**
 * @function professionalProfileById
 * Retrieves a professional user's complete profile details by user ID.
 * 
 * This function:
 * 1. Fetches basic user information (name, email) from the `users` table.
 * 2. Retrieves professional account details from the `professional_accounts` table.
 * 3. Fetches the subscription plan name (if available).
 * 4. Generates a signed URL for the stored profile image.
 * 
 * @async
 * @param {string} id - The unique identifier of the user.
 * 
 * @returns {Promise<professionalProfileResponse>} 
 * Returns a structured professional profile response object containing:
 * - `name` (string): User's full name
 * - `email` (string): User's email address
 * - `imageUrl` (string | null): Signed URL of profile image (if exists)
 * - `subscriptionPlan` (string): Name of the subscription plan or "trial"
 * - `trialStartDate` (Date | null): Trial start date
 * - `trialEndDate` (Date | null): Trial end date
 * 
 * @throws {Error} 
 * - Throws an error if the user does not exist.
 * - Throws an error if the professional profile does not exist.
 * - Throws an error if any database operation fails.
 */
export const professionalProfileById = async (id: string): Promise<professionalProfileResponse> => {
    const client = await getDB();

    const usertableResult = await client.query(
        `SELECT name,email from users where id = $1`,
        [id]
    );

    if (usertableResult.rows.length === 0) {
        throw new Error("User not found for ID: " + id);
    }

    const result = await client.query(
        `SELECT  profile_image, subscription_plan_id,trial_start_date ,trial_end_date ,account_status from professional_accounts where user_id = $1`,
        [id]
    );

    const row = result.rows[0];
    if (!row) {
        throw new Error("Professional profile not found for user ID: " + id);
    }


    const subscriptionPlanResult = await client.query(
        `SELECT plan_name from subscrptionPlans where id = $1`,
        [row.subscription_plan_id]
    );
    const subscriptionPlanRow = subscriptionPlanResult.rows[0];
    const profile_image = await getSignedFileUrl(row.profile_image) || null;

    return {
        name: usertableResult.rows[0].name,
        email: usertableResult.rows[0].email,
        imageUrl: profile_image,
        subscriptionPlan: subscriptionPlanRow ? subscriptionPlanRow.plan_name : "trial",
        StartDate: row.trial_start_date,
        EndDate: row.trial_end_date,
        AccountStatus: row.account_status,
    };

}


/**
 * Creates a new lead storing multiple professional IDs
 * in partner_profile_ids (UUID[] column).
 *
 * @param {string[]} professionalIds - Array of professional UUIDs.
 * @param {string} userId - UUID of the user creating the lead.
 * @returns {Promise<void>}
 * @throws {Error} If insertion fails.
 */
export const leadCreatedByProfessionalService = async (
    professionalIds: string[],
    userId: string
): Promise<void> => {
    const client = await getDB();

    try {
        for (const professionalId of professionalIds) {

            // Check if lead already exists for this user + professional
            const existing = await client.query(
                `SELECT id FROM leads_Schema 
                 WHERE user_id = $1 
                 AND partner_profile_ids = $2 
                 AND is_deleted = false`,
                [userId, professionalId]
            );

            if (existing.rows.length > 0) {
                throw new Error(`Professional ${professionalId} has already been added as a lead`);
            }

            await client.query(
                `INSERT INTO leads_Schema 
                 (partner_profile_ids, user_id, leads_status, is_deleted)  
                 VALUES ($1, $2, 'new', false)`,
                [professionalId, userId]
            );
        }
    } catch (error: unknown) {
        console.error("Error creating lead:", {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            userId,
            professionalIds,
        });

        throw new Error("Failed to create lead.");
    }
};





/**
 * Retrieves all leads associated with a specific user and returns
 * detailed partner profile information for each lead.
 *
 * The function performs the following operations:
 * 1. Fetches all lead records for the given user from the `leads_Schema` table.
 * 2. Extracts all `partner_profile_ids` linked to those leads.
 * 3. Retrieves the roles of those users from the `users` table.
 * 4. Maps role IDs to role names using the `roles` table.
 * 5. Retrieves the requesting user's professional profile and description.
 * 6. For each partner profile:
 *    - If the role is `professional`, it fetches company and location details
 *      from the `professional_profiles` table.
 *    - If the role is `user`, it fetches basic user details from the `users` table.
 * 7. Constructs a unified `PartnerProfile` response containing the partner details
 *    and the requesting user's information.
 *
 * @async
 * @param searchQuery
 * @function getAllLeadsForUser
 * @param {string} userId - The unique identifier of the user whose leads are being retrieved.
 * @returns {Promise<PartnerProfile[]>} A promise that resolves to an array of partner profile objects,
 * each containing role-specific details and information about the requesting user.
 *
 * @throws {Error} Throws an error if any database query fails.
 */
export const getAllLeadsForUser = async (
    userId: string,
    searchQuery?: string
): Promise<PartnerProfile[]> => {
    const client = await getDB();

    // Fetch all leads for this user
    const result = await client.query(
        `SELECT id, partner_profile_ids, leads_status, created_at, updated_at
         FROM leads_schema
         WHERE user_id = $1 AND is_deleted = false`,
        [userId]
    );

    // ✅ Build a map: profileId -> { leads_status, created_at } from leads_schema
    const leadsMetaMap = new Map<string, { leads_status: string; created_at: string }>();
    for (const lead of result.rows) {
        if (lead.partner_profile_ids) {
            leadsMetaMap.set(lead.partner_profile_ids, {
                leads_status: lead.leads_status,
                created_at: lead.created_at,
            });
        }
    }

    const allPartnerProfileIds: string[] = [...leadsMetaMap.keys()];
    if (allPartnerProfileIds.length === 0) return [];

    // Get role_id for each partner profile (user)
    const rolesResult = await client.query(
        `SELECT id, role_id FROM users WHERE id = ANY($1)`,
        [allPartnerProfileIds]
    );

    const roleIdMap = new Map<string, string>(
        rolesResult.rows.map((u) => [u.id, u.role_id])
    );

    const allRoleIds = [...new Set(rolesResult.rows.map((u) => u.role_id))];

    // Get role names
    const roleNamesResult = await client.query(
        `SELECT id, name FROM roles WHERE id = ANY($1)`,
        [allRoleIds]
    );

    const roleNameMap = new Map<string, string>(
        roleNamesResult.rows.map((role) => [role.id, role.name])
    );

    // Get requesting user's professional profile
    const requestingUserAccount = await client.query(
        `SELECT professional_profile_id FROM professional_accounts WHERE user_id = $1`,
        [userId]
    );

    const requestingUserProfileId: string | null =
        requestingUserAccount.rows[0]?.professional_profile_id ?? null;

    const requestingUserDescription = await client.query(
        `SELECT description FROM professional_profiles WHERE id = $1`,
        [requestingUserProfileId]
    );

    const requestingUser: RequestingUser = {
        userId,
        professionalProfileId: requestingUserProfileId,
        description: requestingUserDescription.rows[0]?.description ?? null,
    };

    // Build search filter
    const search = searchQuery?.trim().toLowerCase() ?? "";

    const response: PartnerProfile[] = [];

    for (const profileId of allPartnerProfileIds) {
        // ✅ Pull leads_status and created_at from leadsMetaMap
        const leads_status = leadsMetaMap.get(profileId)?.leads_status ?? null;
        const created_at = leadsMetaMap.get(profileId)?.created_at ?? null;

        const role_id = roleIdMap.get(profileId) ?? null;
        const roleName = role_id ? roleNameMap.get(role_id) : null;

        if (roleName === "Professional") {
            const professionalAccount = await client.query(
                `SELECT professional_profile_id FROM professional_accounts WHERE user_id = $1`,
                [profileId]
            );

            const professionalProfileId: string | null =
                professionalAccount.rows[0]?.professional_profile_id ?? null;

            const professionalProfile = await client.query(
                `SELECT company_name, city, state, address, latitude, longitude
                 FROM professional_profiles WHERE id = $1`,
                [professionalProfileId]
            );

            const profile = professionalProfile.rows[0];

            if (search) {
                const searchableText = [profile?.company_name, profile?.city, profile?.state, profile?.address]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();
                if (!searchableText.includes(search)) continue;
            }

            response.push({
                userId: profileId,
                role: "professional",
                company_name: profile?.company_name ?? null,
                leads_status,   // ✅ from leads_schema
                created_at,     // ✅ from leads_schema
                location: {
                    city: profile?.city ?? null,
                    state: profile?.state ?? null,
                    address: profile?.address ?? null,
                    latitude: profile?.latitude ?? null,
                    longitude: profile?.longitude ?? null,
                },
                requestingUser,
            });

        } else if (roleName === "User") {
            const userResult = await client.query(
                `SELECT name, email FROM users WHERE id = $1`,
                [profileId]
            );

            const user = userResult.rows[0];

            if (search) {
                const searchableText = [user?.name, user?.email]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();
                if (!searchableText.includes(search)) continue;
            }

            response.push({
                userId: profileId,
                role: "user",
                name: user?.name ?? null,
                email: user?.email ?? null,
                leads_status,   // ✅ from leads_schema
                created_at,     // ✅ from leads_schema
                requestingUser,
            });
        }
    }

    return response;
};

/**
 * Retrieves a professional profile from the database by its ID.
 *
 * Queries the `professional_profiles` table for the row matching the given `id`.
 * Returns a structured `ProfessionalProfileResponse` object including company info,
 * location, contact details, ratings, and verification status.
 *
 * @async
 * @function getProfessionalProfileByIdService
 * @param {string} id - The unique identifier of the professional profile to retrieve.
 *
 * @throws {Error} Throws an error if no professional profile is found with the given ID.
 *
 * @returns {Promise<ProfessionalProfileResponse>} - A promise that resolves to an object containing:
 *   - id: string
 *   - companyName: string | null
 *   - email: string | null
 *   - category: string | null
 *   - description: string | null
 *   - location: {
 *       city: string | null,
 *       state: string | null,
 *       address: string | null,
 *       latitude: number | null,
 *       longitude: number | null
 *     }
 *   - contact: {
 *       telefone: string | null,
 *       whatsapp: string | null,
 *       website: string | null,
 *       instagram: string | null
 *     }
 *   - ratings: {
 *       assessment: number | null,
 *       numAvaliacoes: number
 *     }
 *   - verifiedSource: string | null
 *   - createdAt: Date
 *   - updatedAt: Date
 *
 * @example
 * const profile = await getProfessionalProfileByIdService("12345");
 * console.log(profile.companyName);
 */
export const getProfessionalProfileByIdService = async (id: string): Promise<ProfessionalProfileResponse> => {
    const client = await getDB();
    const result = await client.query(
        `SELECT pp.id,
         pp.company_name,
          pp.category,
          pp.description,
          pp.city,
           pp.state,
            pp.address,
             pp.latitude,
              pp.longitude,
               pp.telefone,
                pp.whatsapp,
                 pp.website,
                  pp.instagram,
                   pp.assessment,
                    pp.num_avaliacoes,
                     pp.verified_source,
                      pp.image_url

         FROM professional_profiles pp
         WHERE pp.id = $1`,
        [id]
    );
    const row = result.rows[0];
    if (!row) {
        throw new Error("Professional profile not found for ID: " + id);
    }
    return {
        id: row.id,
        companyName: row.company_name,
        email: row.email ?? null,
        category: row.category ?? null,
        description: row.description ?? null,

        location: {
            city: row.city ?? null,
            state: row.state ?? null,
            address: row.address ?? null,
            latitude: row.latitude ?? null,
            longitude: row.longitude ?? null,
        },

        contact: {
            telefone: row.telefone ?? null,
            whatsapp: row.whatsapp ?? null,
            website: row.website ?? null,
            instagram: row.instagram ?? null,
        },

        ratings: {
            assessment: row.assessment ?? null,
            numAvaliacoes: row.num_avaliacoes ?? 0,
        },

        verifiedSource: row.verified_source ?? null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}