import csv from "csv-parser";
import { Readable } from "stream";
/**
 * Parses a CSV buffer and extracts its rows as objects of type T.
 *
 * @template T - The type of each row object. Defaults to `any`.
 * @param {Buffer} buffer - The CSV file content as a Buffer.
 * @returns {Promise<T[]>} Promise that resolves with an array of parsed rows.
 * @throws {Error} If parsing fails.
 *
 * @example
 * const csvBuffer = fs.readFileSync("file.csv");
 * const rows = await extractCsvData<{ name: string; email: string }>(csvBuffer);
 */
export const extractCsvData = <T>(buffer: Buffer): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    const rows: T[] = [];

    Readable.from(buffer)
      .pipe(csv())
      .on("data", (row) => rows.push(row as T))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
};
