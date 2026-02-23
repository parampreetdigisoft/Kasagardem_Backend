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

        // normalize + trim data
        req.professional = rows.map((row, index) => ({
            name: row.name?.trim() || "",
            category: row.category?.trim() || "",
            description: row.description?.trim() || "",
            city: row.city?.trim() || "",
            state: row.state?.trim() || "",
            email: row.email?.toLowerCase().trim() || "",
            phone: row.phone?.trim() || "",
            website: row.website?.trim() || "",
            __rowNumber: index + 1,
        }));


        next();
    } catch (error) {
        next(error);
    }
};
