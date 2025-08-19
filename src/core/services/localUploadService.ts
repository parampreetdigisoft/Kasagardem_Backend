import config from "../config/env";
import fs from "fs";
import path from "path";

/**
 * Saves a base64 image to local uploads folder and returns the file path.
 * @param base64Image - Base64 encoded image string (with data:image/... prefix)
 * @param plantName - save plant name image
 * @param userId - save images in user folder wrt user id
 * @param folder - Folder name inside /uploads
 * @returns Promise<string> - Local file path (URL-like string for demo)
 */
export const saveBase64ToLocal = async (
  base64Image: string,
  plantName: string,
  userId: string,
  folder: string = "images"
): Promise<string> => {
  try {
    const matches = base64Image.match(/^data:(.+);base64,(.+)$/);

    if (!matches || matches.length < 3) {
      throw new Error("Invalid base64 string");
    }

    const base64Data: string = matches[2]!;
    const buffer: Buffer = Buffer.from(base64Data, "base64");

    // Upload path: uploads/<userId>/images/
    const uploadDir: string = path.join(
      __dirname,
      "../../..",
      "uploads",
      userId,
      folder
    );

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filePath: string = path.join(uploadDir, plantName);

    // Save file locally
    fs.writeFileSync(filePath, buffer);

    // Return path that can be accessed (via express.static)
    return `${config.APPDEV_URL}/uploads/${userId}/${folder}/${plantName}`;
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
