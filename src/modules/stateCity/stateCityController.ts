import { Response, NextFunction } from "express";
import axios, { AxiosError } from "axios";
import { info, error as logError } from "../../core/utils/logger";
import { HTTP_STATUS } from "../../core/utils/constants";
import {
  errorResponse,
  successResponse,
} from "../../core/utils/responseFormatter";
import User from "../auth/authModel";
import { CustomError } from "../../interface/error";
import { AuthRequest } from "../../core/middleware/authMiddleware";

interface State {
  name: string;
  iso2: string;
}

interface City {
  id?: number;
  name: string;
  iso2?: string;
}

interface Country {
  name: string;
  iso2: string;
}

// Base URL for Country State City API
const CSC_API_BASE_URL = "https://api.countrystatecity.in/v1";
const apiKey = "T0hkTnVCdDdtZFFTZVk1U0FpdE15REsxMmw0dEtRZjJrcVNPb01jNw==";

/**
 * Makes a GET request to the Country-State-City (CSC) API for the given endpoint.
 * This function is generic and returns data of type T.
 *
 * @param endpoint - The API endpoint to call, e.g., "/countries" or "/countries/IN/states".
 * @returns A Promise resolving to the data returned by the CSC API, typed as T.
 * @throws An object containing `status` and `message` if the request fails or the network is unavailable.
 */
const makeCSCRequest = async <T>(endpoint: string): Promise<T> => {
  try {
    const response = await axios.get<T>(`${CSC_API_BASE_URL}${endpoint}`, {
      headers: {
        "X-CSCAPI-KEY": apiKey,
      },
    });
    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const axiosErr = err as AxiosError<{ error?: string }>;
      throw {
        status: axiosErr.response?.status ?? 500,
        message: axiosErr.response?.data?.error || "API request failed",
      };
    }

    throw {
      status: 500,
      message: "Network error or service unavailable",
    };
  }
};

/**
 * Retrieves all states for a specific country by ISO2 code.
 * @param req - Express request object containing country ISO2 code in params
 *              and the authenticated user in `req.user`.
 * @param res - Express response object used to send HTTP responses.
 * @param next - Express next middleware function used to handle errors.
 */
export const getStatesByCountry = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userPayload = req.user as { userEmail?: string } | undefined;
  if (!userPayload?.userEmail) {
    res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json(errorResponse("Unauthorized request"));
    return;
  }

  const user = await User.findOne({ email: userPayload.userEmail });
  if (!user) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("User not found"));
    return;
  }

  try {
    const iso2 = "BR"; // use Brazil

    await info(
      "Get states by country request started",
      { countryCode: iso2 },
      { userId: user._id, source: "states.getStatesByCountry" }
    );

    if (!apiKey) {
      res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json(
          errorResponse("Server configuration error: CSC API key not found")
        );
      return;
    }

    const states = await makeCSCRequest<State[]>(`/countries/${iso2}/states`);

    await info(
      "Get states by country successful",
      {
        countryCode: iso2,
        statesCount: states.length,
        stateNames: states.map((state: State) => state.name).slice(0, 5),
      },
      { userId: user._id, source: "states.getStatesByCountry" }
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
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Extract user info from JWT populated by auth middleware
  const userPayload = req.user as { userEmail?: string } | undefined;
  if (!userPayload?.userEmail) {
    res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json(errorResponse("Unauthorized request"));
    return;
  }

  // Fetch user by email
  const user = await User.findOne({ email: userPayload?.userEmail });
  if (!user) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("User not found"));
    return;
  }

  try {
    await info(
      "Get all countries request started",
      {},
      { userId: user._id, source: "states.getCountries" }
    );

    // Check if API key is available
    if (!apiKey) {
      res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json(
          errorResponse("Server configuration error: CSC API key not found")
        );
      return;
    }

    const countries = await makeCSCRequest<Country[]>(`/countries`);

    await info(
      "Get all countries successful",
      {
        countriesCount: countries.length,
        sampleCountries: countries.slice(0, 5).map((country: Country) => ({
          name: country.name,
          iso2: country.iso2,
        })),
      },
      { userId: user._id, source: "states.getCountries" }
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
      { userId: user._id, source: "states.getCountries" }
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
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Extract user info from JWT populated by auth middleware
  const userPayload = req.user as { userEmail?: string } | undefined;
  if (!userPayload?.userEmail) {
    res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json(errorResponse("Unauthorized request"));
    return;
  }

  // Fetch user by email
  const user = await User.findOne({ email: userPayload?.userEmail });
  if (!user) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse("User not found"));
    return;
  }

  try {
    const { iso2, stateIso2 } = req.params;

    await info(
      "Get cities by state request started",
      { countryCode: iso2, stateCode: stateIso2 },
      { userId: user._id, source: "stateCity.getCitiesByState" }
    );

    // Check if API key is available
    if (!apiKey) {
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

    await info(
      "Get cities by state successful",
      {
        countryCode: iso2,
        stateCode: stateIso2,
        citiesCount: cities.length,
        cityNames: cities.map((city: City) => city.name).slice(0, 10),
      },
      { userId: user._id, source: "stateCity.getCitiesByState" }
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
          { userId: user._id, source: "stateCity.getCitiesByState" }
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
        { userId: user._id, source: "stateCity.getCitiesByState" }
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
      { userId: user._id, source: "stateCity.getCitiesByState" }
    );

    next(errorObj);
  }
};
