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
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  /**
   * Validates uploaded file is CSV.
   *
   * @param {AuthRequest} _req - Express request object (not used)
   * @param {Express.Multer.File} file - Uploaded file
   * @param {FileFilterCallback} cb - Multer callback to accept/reject file
   *
   * @throws Error if file is not a CSV
   * @returns void Calls callback with error or success
   */
  fileFilter: (
    _req: AuthRequest,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ):void => {
    const isCsv =
      file.mimetype === "text/csv" ||
      file.originalname.toLowerCase().endsWith(".csv");

    if (!isCsv) {
      return cb(new Error("Only CSV files are allowed"));
    }

    cb(null, true);
  },
});