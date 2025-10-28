import { Request, Response, NextFunction } from "express";
import { info, error as logError } from "../../core/utils/logger";
import { HTTP_STATUS } from "../../core/utils/constants";
import {
  errorResponse,
  successResponse,
} from "../../core/utils/responseFormatter";
import { CustomError } from "../../interface/Error";
import config from "../../core/config/env";
import { City, Country, State } from "../../interface/stateCity";
import { makeCSCRequest } from "../../core/services/stateCityService";

/**
 * Retrieves all states for a specific country by ISO2 code.
 * @param req - Express request object containing country ISO2 code in params
 *              and the authenticated user in `req.user`.
 * @param res - Express response object used to send HTTP responses.
 * @param next - Express next middleware function used to handle errors.
 */
export const getStatesByCountry = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const iso2 = "BR"; // use Brazil

    await info(
      "Get states by country request started",
      { countryCode: iso2 },
      { source: "states.getStatesByCountry" }
    );

    if (!config.CSC_API_KEY) {
      res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json(
          errorResponse("Server configuration error: CSC API key not found")
        );
      return;
    }

    const states = await makeCSCRequest<State[]>(`/countries/${iso2}/states`);
    // Sort states alphabetically by name (case-insensitive)
    states.sort((a, b) =>
      a.name.localeCompare(b.name, "en", { sensitivity: "base" })
    );
    await info(
      "Get states by country successful",
      {
        countryCode: iso2,
        statesCount: states.length,
        stateNames: states.map((state: State) => state.name).slice(0, 5),
      },
      { source: "states.getStatesByCountry" }
    );

    res.status(HTTP_STATUS.OK).json(
      successResponse({
        country: iso2,
        states: states.map((state) => ({
          name: state.name,
          iso2: state.iso2,
        })),
        count: states.length,
      })
    );
  } catch (err: unknown) {
    next(err);
  }
};

/**
 * Retrieves all countries available in the CSC API.
 * @param req - Express request object with authenticated user in `req.user`.
 * @param res - Express response object used to send HTTP responses.
 * @param next - Express next middleware function used to handle errors.
 */
export const getCountries = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await info(
      "Get all countries request started",
      {},
      { source: "states.getCountries" }
    );

    // Check if API key is available
    if (!config.CSC_API_KEY) {
      res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json(
          errorResponse("Server configuration error: CSC API key not found")
        );
      return;
    }

    const countries = await makeCSCRequest<Country[]>(`/countries`);
    // Sort countries alphabetically by name (case-insensitive)
    countries.sort((a, b) =>
      a.name.localeCompare(b.name, "en", { sensitivity: "base" })
    );
    await info(
      "Get all countries successful",
      {
        countriesCount: countries.length,
        sampleCountries: countries.slice(0, 5).map((country: Country) => ({
          name: country.name,
          iso2: country.iso2,
        })),
      },
      { source: "states.getCountries" }
    );

    res.status(HTTP_STATUS.OK).json(
      successResponse({
        countries,
        count: countries.length,
      })
    );
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

    await logError(
      "Get all countries failed with unexpected error",
      { error: errorObj.message, stack: errorObj.stack },
      { source: "states.getCountries" }
    );

    next(errorObj);
  }
};

/**
 * Retrieves all cities for a specific state by country ISO2 and state ISO2 codes.
 * @param req - Express request object containing country ISO2 and state ISO2 codes in params
 *              and the authenticated user in `req.user`.
 * @param res - Express response object used to send HTTP responses.
 * @param next - Express next middleware function used to handle errors.
 */
export const getCitiesByState = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { iso2, stateIso2 } = req.params;

    await info(
      "Get cities by state request started",
      { countryCode: iso2, stateCode: stateIso2 },
      { source: "stateCity.getCitiesByState" }
    );

    // Check if API key is available
    if (!config.CSC_API_KEY) {
      res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json(
          errorResponse("Server configuration error: CSC API key not found")
        );
      return;
    }

    const cities = await makeCSCRequest<City[]>(
      `/countries/BR/states/${stateIso2}/cities`
    );
    // Sort cities alphabetically by name (case-insensitive)
    cities.sort((a, b) =>
      a.name.localeCompare(b.name, "en", { sensitivity: "base" })
    );
    await info(
      "Get cities by state successful",
      {
        countryCode: iso2,
        stateCode: stateIso2,
        citiesCount: cities.length,
        cityNames: cities.map((city: City) => city.name).slice(0, 10),
      },
      { source: "stateCity.getCitiesByState" }
    );

    res.status(HTTP_STATUS.OK).json(
      successResponse({
        country: iso2,
        state: stateIso2,
        cities,
        count: cities.length,
      })
    );
  } catch (err: unknown) {
    // Handle CSC API specific errors
    if (typeof err === "object" && err !== null && "status" in err) {
      const apiError = err as { status: number; message: string };

      if (apiError.status === 404) {
        await logError(
          "State not found or has no cities",
          {
            countryCode: req.params.iso2,
            stateCode: req.params.stateIso2,
            error: apiError.message,
          },
          { source: "stateCity.getCitiesByState" }
        );

        res
          .status(HTTP_STATUS.NOT_FOUND)
          .json(
            errorResponse(
              `No cities found for state: ${req.params.stateIso2} in country: ${req.params.iso2}`
            )
          );
        return;
      }

      await logError(
        "CSC API error occurred while fetching cities",
        {
          countryCode: req.params.iso2,
          stateCode: req.params.stateIso2,
          error: apiError.message,
          status: apiError.status,
        },
        { source: "stateCity.getCitiesByState" }
      );

      res
        .status(apiError.status)
        .json(errorResponse(apiError.message || "Failed to fetch cities"));
      return;
    }

    // Type guard to safely convert unknown to CustomError
    const errorObj: CustomError =
      err instanceof Error
        ? (err as CustomError)
        : ({
            name: "UnknownError",
            message:
              typeof err === "string" ? err : "An unknown error occurred",
          } as CustomError);

    await logError(
      "Get cities by state failed with unexpected error",
      {
        countryCode: req.params.iso2,
        stateCode: req.params.stateIso2,
        error: errorObj.message,
        stack: errorObj.stack,
      },
      { source: "stateCity.getCitiesByState" }
    );

    next(errorObj);
  }
};
