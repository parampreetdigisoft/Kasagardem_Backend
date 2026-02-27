import { Response, NextFunction } from "express";
import { extractCsvData } from "../utils/extractCsvData";
import { AuthRequest, csvUser } from "../../interface/auth";


/**
 * Middleware to extract and normalize professional user data from uploaded CSV file.
 *
 * - Validates that a CSV file is provided in the request.
 * - Parses CSV buffer into structured data.
 * - Trims and normalizes all fields.
 * - Attaches formatted professional data to `req.professional`.
 *
 * @async
 * @function extractUsersFromCsv
 * @param {AuthRequest} req  Express request object extended with authentication and file data.
 * @param {Response} res  Express response object.
 * @param {NextFunction} next  Express next middleware function.
 *
 * @returns {Promise<void>} Sends 400 response if file is missing or empty, otherwise calls next().
 *
 * @throws Will pass any unexpected error to the global error handler.
 */
export const extractUsersFromCsv = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ message: "CSV file is required" });
            return;
        }

        const rows = await extractCsvData<csvUser>(req.file.buffer);

        if (!rows.length) {
            res.status(400).json({ message: "CSV file is empty" });
            return;
        }

        req.professional = rows.map((row, index) => ({
            company_name: row.company_name?.trim() || undefined,
            email: row.email?.toLowerCase().trim() || undefined,
            category: row.category?.trim() || undefined,
            description: row.description?.trim() || undefined,
            city: row.city?.trim() || undefined,
            state: row.state?.trim() || undefined,
            telefone: row.telefone?.trim() || undefined,
            whatsapp: row.whatsapp?.trim() || undefined,
            website: row.website?.trim() || undefined,
            instagram: row.instagram?.trim() || undefined,
            address: row.address?.trim() || undefined,
            assessment: row.assessment || undefined,
            num_avaliacoes: row.num_avaliacoes || undefined,
            verified_source: row.verified_source?.trim() || undefined,
            latitude: row.latitude || undefined,
            longitude: row.longitude || undefined,
            __rowNumber: index + 1,
        })) as csvUser[];

        // Reject if no rows have a valid email
        const validRows = req.professional.filter(r => r.email);
        if (!validRows.length) {
            res.status(400).json({ message: "CSV contains no rows with a valid email" });
            return;
        }

        next();
    } catch (error) {
        next(error);
    }
};
