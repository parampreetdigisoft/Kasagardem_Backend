import AWS from "aws-sdk";
import config from "../config/env";

const s3 = new AWS.S3({
  accessKeyId: config.AWS_ACCESS_KEY_ID,
  secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  region: config.AWS_REGION,
});

// 1MB chunk size for multipart upload
const CHUNK_SIZE = 1024 * 1024; // 1MB

/**
 * Uploads a small file to AWS S3 using a simple upload.
 *
 * @param buffer - The file content as a Buffer.
 * @param fileName - The desired file name in the S3 bucket.
 * @param mimeType - The MIME type of the file.
 * @returns A promise that resolves to the public URL of the uploaded file.
 */
const simpleUpload = async (
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> => {
  const params: AWS.S3.PutObjectRequest = {
    Bucket: config.AWS_S3_BUCKET!,
    Key: fileName,
    Body: buffer,
    ContentType: mimeType,
    ACL: "public-read",
  };

  const { Location } = await s3.upload(params).promise();
  return Location!;
};

/**
 * Uploads a base64-encoded image to AWS S3.
 * Uses a simple upload for small files and multipart upload with retry logic for larger files.
 *
 * @param base64Image - The base64 string representing the image, including MIME type prefix.
 * @param plantName - save plant name image
 * @param userId - save images in user folder wrt user id
 * @param folder - Optional S3 folder to store the file in. Defaults to "plants".
 * @param maxRetries - Optional number of retry attempts for multipart uploads. Defaults to 3.
 * @returns A promise that resolves to the public URL of the uploaded file.
 * @throws Will throw an error if the base64 string is invalid or the upload fails.
 */
export const uploadBase64ToS3 = async (
  base64Image: string,
  plantName: string,
  userId: string,
  folder = "plants",
  maxRetries = 3
): Promise<string> => {
  try {
    // Extract MIME type and base64 data
    const matches = base64Image.match(/^data:(.+);base64,(.+)$/);
    if (!matches) throw new Error("Invalid base64 string");

    const mimeType = matches[1];
    const base64Data = matches[2];
    if (!mimeType || !base64Data) {
      throw new Error("Invalid base64 structure");
    }

    const buffer = Buffer.from(base64Data, "base64");

    const fileName = `${userId}/${folder}/${plantName}`;

    // Use simple upload for small files
    if (buffer.length < CHUNK_SIZE) {
      return await simpleUpload(buffer, fileName, mimeType);
    }

    // Use multipart upload with retry logic
    return await multipartUploadWithRetry(
      buffer,
      fileName,
      mimeType,
      maxRetries
    );
  } catch (error: unknown) {
    const errObj: Error =
      error instanceof Error
        ? error
        : new Error(
            typeof error === "string" ? error : "Unknown S3 upload error"
          );

    throw new Error(`S3 Upload failed: ${errObj.message}`);
  }
};

/**
 * Performs a multipart upload to S3 with retry logic for each part.
 *
 * @param buffer - The file data as a Buffer.
 * @param fileName - The destination file name in S3.
 * @param mimeType - The MIME type of the file.
 * @param maxRetries - Maximum retry attempts for each part in case of failure.
 * @returns A promise that resolves to the public URL of the uploaded file.
 * @throws Will throw an error if the multipart upload cannot be completed after retries.
 */
const multipartUploadWithRetry = async (
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  maxRetries: number
): Promise<string> => {
  let uploadId: string | undefined;

  try {
    // Create multipart upload
    const createParams: AWS.S3.CreateMultipartUploadRequest = {
      Bucket: config.AWS_S3_BUCKET!,
      Key: fileName,
      ContentType: mimeType,
      ACL: "public-read",
    };

    const { UploadId } = await s3.createMultipartUpload(createParams).promise();
    uploadId = UploadId;

    if (!uploadId) {
      throw new Error("Failed to create multipart upload");
    }

    const totalParts = Math.ceil(buffer.length / CHUNK_SIZE);
    const parts: AWS.S3.CompletedPart[] = [];

    // Upload each part with retry logic
    for (let i = 0; i < totalParts; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, buffer.length);
      const partBuffer = buffer.slice(start, end);

      let partResult: AWS.S3.CompletedPart | null = null;
      let attempts = 0;

      while (attempts < maxRetries && !partResult) {
        try {
          const uploadPartParams: AWS.S3.UploadPartRequest = {
            Bucket: config.AWS_S3_BUCKET!,
            Key: fileName,
            PartNumber: i + 1,
            UploadId: uploadId,
            Body: partBuffer,
          };

          const result = await s3.uploadPart(uploadPartParams).promise();
          partResult = {
            ETag: result.ETag!,
            PartNumber: i + 1,
          };
        } catch (partError: unknown) {
          attempts++;

          // Narrow unknown to Error
          const errObj: Error =
            partError instanceof Error
              ? partError
              : new Error(
                  typeof partError === "string"
                    ? partError
                    : `Unknown error uploading part ${i + 1}`
                );

          if (attempts >= maxRetries) {
            throw new Error(
              `Failed to upload part ${i + 1} after ${maxRetries} attempts: ${errObj.message}`
            );
          }

          // Wait before retry (exponential backoff)
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempts) * 1000)
          );
        }
      }

      parts.push(partResult!);
    }

    // Complete multipart upload
    const completeParams: AWS.S3.CompleteMultipartUploadRequest = {
      Bucket: config.AWS_S3_BUCKET!,
      Key: fileName,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.sort((a, b) => a.PartNumber! - b.PartNumber!),
      },
    };

    const { Location } = await s3
      .completeMultipartUpload(completeParams)
      .promise();
    return Location!;
  } catch (error) {
    // Abort multipart upload on failure
    if (uploadId) {
      try {
        await s3
          .abortMultipartUpload({
            Bucket: config.AWS_S3_BUCKET!,
            Key: fileName,
            UploadId: uploadId,
          })
          .promise();
      } catch (abortError: unknown) {
        const errObj: Error =
          abortError instanceof Error
            ? abortError
            : new Error(
                typeof abortError === "string"
                  ? abortError
                  : "Unknown error during abort multipart upload"
              );

        console.error("Failed to abort multipart upload:", errObj.message);
      }
    }
    throw error;
  }
};
