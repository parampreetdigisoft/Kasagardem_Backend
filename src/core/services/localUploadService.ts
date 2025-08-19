import config from "../config/env";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

/**
 * Saves a base64 image to local uploads folder and returns the file path.
 * @param base64Image - Base64 encoded image string (with data:image/... prefix)
 * @param folder - Folder name inside /uploads
 * @returns Promise<string> - Local file path (URL-like string for demo)
 */
export const saveBase64ToLocal = async (
  base64Image: string,
  folder: string = "plants"
): Promise<string> => {
  try {
    const matches = base64Image.match(/^data:(.+);base64,(.+)$/);

    if (!matches || matches.length < 3) {
      throw new Error("Invalid base64 string");
    }

    const mimeType: string = matches[1]!;
    const base64Data: string = matches[2]!;
    const fileExt: string = mimeType.split("/")[1] || "png"; // fallback
    const buffer: Buffer = Buffer.from(base64Data, "base64");

    // ✅ Uploads folder outside src (backendClone/uploads/<folder>)
    const uploadDir: string = path.join(
      __dirname,
      "../../..",
      "uploads",
      folder
    );
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName: string = `${uuidv4()}.${fileExt}`;
    const filePath: string = path.join(uploadDir, fileName);

    // Save file locally
    fs.writeFileSync(filePath, buffer);

    // For demo, return relative path (served by express.static)
    return `${config.APPDEV_URL}/uploads/${folder}/${fileName}`;
  } catch (error: unknown) {
    const errObj: Error =
      error instanceof Error
        ? error
        : new Error(
            typeof error === "string" ? error : "Unknown local upload error"
          );

    throw new Error(`Local upload failed: ${errObj.message}`);
  }
};
