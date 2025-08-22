import PlantHistory from "../plantHistoryModel";
import { error } from "../../../core/utils/logger";
import { CustomError } from "../../../interface/error";

/**
 * Helper function to save plant history.
 *
 * @param {string} userId - The ID of the user performing the action.
 * @param {string | null} plantId - The ID of the plant (nullable if not applicable).
 * @param {string} action - The action performed on the plant (e.g., "watered", "added").
 * @param {Record<string, unknown>} [metadata={}] - Additional metadata related to the action.
 * @returns {Promise<void>} Resolves when the history entry is saved or logs an error on failure.
 */
export const savePlantHistory = async (
  userId: string,
  plantId: string | null,
  action: string,
  metadata: Record<string, unknown> = {}
): Promise<void> => {
  try {
    await PlantHistory.create({
      userId,
      plantId,
      action,
      metadata,
    });
  } catch (err: unknown) {
    // Type guard to safely convert unknown to CustomError
    const errorObj: CustomError =
      err instanceof Error
        ? (err as CustomError)
        : ({
            name: "UnknownError",
            message:
              typeof err === "string" ? err : "An unknown error occurred",
          } as CustomError);

    await error("Failed to save plant history", {
      userId,
      plantId,
      action,
      error: errorObj.message,
      stack: errorObj.stack,
    });
  }
};
