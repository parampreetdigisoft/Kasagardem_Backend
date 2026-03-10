import multer, { FileFilterCallback } from "multer";
import { AuthRequest } from "../../interface/auth";

/**
 * Creates multer middleware for CSV file uploads.
 *
 * - Uses memory storage
 * - Limits file size to 5MB
 * - Allows only CSV files
 *
 * @returns {multer.Multer} Configured multer instance
 */
export const uploadCsv = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    /**
     * Filters incoming files to allow only CSV uploads.
     *
     * @param {AuthRequest} _req - The authenticated Express request object.
     * @param {Express.Multer.File} file - The uploaded file metadata.
     * @param {FileFilterCallback} cb - Callback to accept or reject the file.
     * @returns {void}
     *
     * @throws {Error} If the uploaded file is not a CSV.
     */
    fileFilter: (
        _req: AuthRequest,
        file: Express.Multer.File,
        cb: FileFilterCallback
    ): void => {
        const isCsv =
            file.mimetype === "text/csv" ||
            file.originalname.toLowerCase().endsWith(".csv");

        if (!isCsv) {
            cb(new Error("Only CSV files are allowed"));
            return;
        }

        cb(null, true);
    },
});