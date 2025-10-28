import axios from "axios";

// BunnyCDN config (put these in env variables)
const BUNNY_STORAGE_ZONE = "myplantstorages";
const BUNNY_STORAGE_API_KEY = "301e24ab-ed3d-4c08-9d6bc2db5870-1cd1-4b6b";

/**
 * Uploads a Base64-encoded image to BunnyCDN and returns the public CDN URL.
 *
 * @param base64Data - The Base64 string of the image (e.g., "data:image/png;base64,...").
 * @param fileName - The file name to use when storing the image on BunnyCDN.
 * @returns The public URL of the uploaded image on BunnyCDN.
 */
export const uploadBase64ToBunny = async (
  base64Data: string,
  fileName: string
): Promise<string> => {
  const buffer = Buffer.from(
    base64Data.replace(/^data:image\/\w+;base64,/, ""),
    "base64"
  );

  const url = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${fileName}`;

  await axios.put(url, buffer, {
    headers: {
      AccessKey: BUNNY_STORAGE_API_KEY,
      "Content-Type": "application/octet-stream",
    },
  });

  // Return public CDN URL (via Pull Zone or direct storage URL)
  return `https://${BUNNY_STORAGE_ZONE}.b-cdn.net/${fileName}`;
};
