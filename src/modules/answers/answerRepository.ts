import { getDB } from "../../core/config/db";
import { FieldIndex } from "../../interface";
import {
  IAnswerType1or2,
  IPartnerRecommendation,
  IPlantRecommendation,
  ISubmitAnswer,
  IUserAnswer,
} from "../../interface/answer";

/**
 * Retrieves a list of recommended plants based on the user's provided answers.
 * Uses PostgreSQL with optimized joins and indexing.
 *
 * @param {IUserAnswer[]} answers - Array of user answers used to generate filters
 * @returns {Promise<IPlantRecommendation[]>} Array of plant recommendations
 */
export const getRecommendedPlants = async (
  answers: IUserAnswer[]
): Promise<IPlantRecommendation[]> => {
  const client = await getDB();

  try {
    const conditions: string[] = ["p.is_deleted = FALSE"];
    const params: unknown[] = [];
    let paramIndex = 1;

    // Store match criteria for why recommended
    const matchCriteria: Record<string, string> = {};

    for (const [i, ans] of answers.entries()) {
      if (!ans) continue;

      switch (i) {
        case FieldIndex.space_types: {
          const value = ans.selectedOption?.trim();
          if (value) {
            conditions.push(
              `EXISTS (
                SELECT 1 FROM plant_space_types pst 
                WHERE pst.plant_id = p.id 
                AND pst.space_type ILIKE $${paramIndex}
              )`
            );
            params.push(`%${value}%`);
            matchCriteria.space_types = value;
            paramIndex++;
          }
          break;
        }

        case FieldIndex.area_sizes: {
          const value = ans.selectedOption?.trim();
          if (value) {
            conditions.push(
              `EXISTS (
                SELECT 1 FROM plant_area_sizes pas 
                WHERE pas.plant_id = p.id 
                AND pas.area_size ILIKE $${paramIndex}
              )`
            );
            params.push(`%${value}%`);
            matchCriteria.area_sizes = value;
            paramIndex++;
          }
          break;
        }

        case FieldIndex.challenges: {
          const value = ans.selectedOption?.trim();
          if (value) {
            conditions.push(
              `EXISTS (
                SELECT 1 FROM plant_challenges pc 
                WHERE pc.plant_id = p.id 
                AND pc.challenge ILIKE $${paramIndex}
              )`
            );
            params.push(`%${value}%`);
            matchCriteria.challenges = value;
            paramIndex++;
          }
          break;
        }

        case FieldIndex.tech_preferences: {
          const value = ans.selectedOption?.trim();
          if (value) {
            conditions.push(
              `EXISTS (
                SELECT 1 FROM plant_tech_preferences ptp 
                WHERE ptp.plant_id = p.id 
                AND ptp.tech_preference ILIKE $${paramIndex}
              )`
            );
            params.push(`%${value}%`);
            matchCriteria.tech_preferences = value;
            paramIndex++;
          }
          break;
        }

        case FieldIndex.locations:
          if (ans.selectedAddress?.state || ans.selectedAddress?.city) {
            const stateVariations = ans.selectedAddress?.state
              ? getLocationVariations(ans.selectedAddress.state)
              : [];
            const cityVariations = ans.selectedAddress?.city
              ? getLocationVariations(ans.selectedAddress.city)
              : [];

            // Normalize both state and city
            const normalizedStates = stateVariations.map((s) =>
              normalizeText(s)
            );
            const normalizedCities = cityVariations.map((c) =>
              normalizeText(c)
            );

            // Add SQL to normalize database side using unaccent + lower
            conditions.push(`
      EXISTS (
        SELECT 1 FROM plant_locations pl
        WHERE pl.plant_id = p.id
        AND unaccent(lower(pl.location_type)) = ANY($${paramIndex})
        AND unaccent(lower(pl.location_value)) = ANY($${paramIndex + 1})
      )
    `);

            params.push(normalizedStates, normalizedCities);
            matchCriteria.locations = `${cityVariations.join(", ")}, ${stateVariations.join(", ")}`;
            paramIndex += 2;
          }
          break;
      }
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Main query with aggregated data
    const query = `
  SELECT 
    p.id,
    p.scientific_name,
    p.common_name,
    p.image_search_url,
    p.description,

    -- Space Types
    COALESCE(
      (
        SELECT json_agg(pst.space_type)
        FROM plant_space_types pst
        WHERE pst.plant_id = p.id
      ), '[]'::json
    ) AS space_types,

    -- Area Sizes
    COALESCE(
      (
        SELECT json_agg(pas.area_size)
        FROM plant_area_sizes pas
        WHERE pas.plant_id = p.id
      ), '[]'::json
    ) AS area_sizes,

    -- Challenges
    COALESCE(
      (
        SELECT json_agg(pc.challenge)
        FROM plant_challenges pc
        WHERE pc.plant_id = p.id
      ), '[]'::json
    ) AS challenges,

    -- Tech Preferences
    COALESCE(
      (
        SELECT json_agg(ptp.tech_preference)
        FROM plant_tech_preferences ptp
        WHERE ptp.plant_id = p.id
      ), '[]'::json
    ) AS tech_preferences,

    -- Locations (state = location_type, city = location_value)
    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'state', pl.location_type,
            'city', pl.location_value
          )
        )
        FROM plant_locations pl
        WHERE pl.plant_id = p.id
      ), '[]'::json
    ) AS locations

  FROM plants p
  ${whereClause}
  LIMIT 20;
`;

    const result = await client.query(query, params);

    // Build "why recommended" for each plant
    const enhanced: IPlantRecommendation[] = result.rows.map((plant) => {
      const why: string[] = [];

      if (matchCriteria.space_types && plant.space_types?.length) {
        const match = plant.space_types.find((st: string) =>
          st.toLowerCase().includes(matchCriteria.space_types!.toLowerCase())
        );
        if (match) {
          why.push(`Matches your preference for space types (${match})`);
        }
      }

      if (matchCriteria.area_sizes && plant.area_sizes?.length) {
        const match = plant.area_sizes.find((as: string) =>
          as.toLowerCase().includes(matchCriteria.area_sizes!.toLowerCase())
        );
        if (match) {
          why.push(`Matches your preference for area sizes (${match})`);
        }
      }

      if (matchCriteria.challenges && plant.challenges?.length) {
        const match = plant.challenges.find((c: string) =>
          c.toLowerCase().includes(matchCriteria.challenges!.toLowerCase())
        );
        if (match) {
          why.push(`Matches your challenge (${match})`);
        }
      }

      if (matchCriteria.tech_preferences && plant.tech_preferences?.length) {
        const match = plant.tech_preferences.find((tp: string) =>
          tp
            .toLowerCase()
            .includes(matchCriteria.tech_preferences!.toLowerCase())
        );
        if (match) {
          why.push(`Matches your tech preference (${match})`);
        }
      }

      if (matchCriteria.locations && plant.locations?.length) {
        why.push(`Available in your location (${matchCriteria.locations})`);
      }

      return {
        ...plant,
        whyRecommended: why,
      };
    });

    return enhanced;
  } catch (error) {
    console.error("Error getting recommended plants:", error);
    throw error;
  }
};

/**
 * Generates recommended partner profiles based on submitted answers.
 * Uses PostgreSQL with multilingual location matching.
 *
 * @param answers - User-submitted answers
 * @returns Array of partner recommendations
 */
export const getRecommendedPartners = async (
  answers: ISubmitAnswer[]
): Promise<Array<IPartnerRecommendation>> => {
  const client = await getDB();

  try {
    const type2Answer = answers.find((ans) => ans.type === 2);

    let userAddress: { state: string; city: string } | null = null;

    if (type2Answer) {
      const [state, city] = type2Answer.selectedOption
        .split("/")
        .map((s) => s.trim());
      if (state && city) {
        userAddress = { state, city };
      }
    }

    if (!userAddress?.state || !userAddress?.city) {
      return [];
    }

    // Normalize and generate multilingual variations
    const stateVariations = getLocationVariations(userAddress.state);
    const cityVariations = getLocationVariations(userAddress.city);

    // Build query
    const conditions: string[] = ["status = 'active'"];
    const params: unknown[] = [];
    let paramIndex = 1;

    // State matching (accent-insensitive)
    if (stateVariations.length > 0) {
      const statePlaceholders = stateVariations
        .map(() => `$${paramIndex++}`)
        .join(", ");
      conditions.push(`unaccent(lower(state)) IN (${statePlaceholders})`);
      params.push(...stateVariations.map((s) => normalizeText(s)));
    }

    // City matching (accent-insensitive)
    if (cityVariations.length > 0) {
      const cityPlaceholders = cityVariations
        .map(() => `$${paramIndex++}`)
        .join(", ");
      conditions.push(`unaccent(lower(city)) IN (${cityPlaceholders})`);
      params.push(...cityVariations.map((c) => normalizeText(c)));
    }

    const query = `
  SELECT 
    id,
    email,
    mobile_number,
    company_name,
    speciality_1,
    speciality_2,
    speciality_3,
    street,
    city,
    state,
    country,
    zip_code,
    website,
    contact_person,
    project_image_url,
    rating
  FROM partner_profiles
  WHERE ${conditions.join(" AND ")}
  ORDER BY rating DESC NULLS LAST
  LIMIT 20
`;

    const result = await client.query(query, params);

    // Build match reason
    const matchedOptions = answers
      .filter((ans): ans is IAnswerType1or2 => ans.type === 1)
      .map((ans) => ans.selectedOption)
      .filter(Boolean);

    const whyRecommended = buildMatchReason(
      userAddress,
      matchedOptions as string[]
    );

    // Map to return type
    return result.rows.map((partner) => ({
      partnerId: partner.id,
      email: partner.email,
      mobileNumber: partner.mobile_number,
      companyName: partner.company_name || "",
      speciality: [
        partner.speciality_1,
        partner.speciality_2,
        partner.speciality_3,
      ].filter(Boolean),
      address: {
        street: partner.street || "",
        city: partner.city || "",
        state: partner.state || "",
        country: partner.country || "",
        zipCode: partner.zip_code || "",
      },
      website: partner.website || "",
      contactPerson: partner.contact_person || "",
      projectImageUrl: partner.project_image_url || "",
      rating: partner.rating || "0.0",
      whyRecommended,
    }));
  } catch (error) {
    console.error("Error getting recommended partners:", error);
    return [];
  }
};

/**
 * Builds a descriptive reason for recommending partners based on the user's location
 * and their selected preferences.
 *
 * @param address - The user's selected address.
 * @param address.city - The city selected by the user.
 * @param address.state - The state selected by the user.
 * @param matchedOptions - A list of selected options that influenced the recommendation.
 * @returns A human-readable string explaining why the partner was recommended.
 */
const buildMatchReason = (
  address: { city: string; state: string },
  matchedOptions: string[]
): string => {
  const reasons = [];

  reasons.push(`Location match: ${address.city}, ${address.state}`);

  if (matchedOptions.length > 0) {
    const uniqueOptions = [...new Set(matchedOptions)];
    reasons.push(`Criteria match: ${uniqueOptions.join(", ")}`);
  }

  return reasons.join(" | ");
};

/**
 * Normalizes a text string for case-insensitive and whitespace-tolerant comparisons.
 * Converts the text to lowercase and trims extra spaces.
 *
 * @param text - The input string to normalize.
 * @returns The normalized version of the input string.
 */
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ã|á|à|â|ä/g, "a")
    .replace(/ç/g, "c")
    .replace(/é|ê/g, "e")
    .replace(/í/g, "i")
    .replace(/ó|ô|õ/g, "o")
    .replace(/ú|ü/g, "u")
    .replace(/\s+/g, " ");
};

const locationMappings: Record<string, string[]> = {
  belo_horizonte: ["belo horizonte", "bh"],
  brasilia: ["brasília", "brasilia", "df"],
  salvador: ["salvador", "ssa"],
  fortaleza: ["fortaleza", "for"],
  manaus: ["manaus", "mao"],
  curitiba: ["curitiba", "cwb"],
  recife: ["recife", "rec"],
  porto_alegre: ["porto alegre", "poa"],
  sao_paulo: ["são paulo", "sao paulo", "sp"],
  rio_de_janeiro: ["rio de janeiro", "rj"],
  minas_gerais: ["minas gerais", "mg"],
  bahia: ["bahia", "ba"],
  parana: ["paraná", "parana", "pr"],
  rio_grande_do_sul: ["rio grande do sul", "rs"],
  santa_catarina: ["santa catarina", "sc"],
  goias: ["goiás", "goias", "go"],
  ceara: ["ceará", "ceara", "ce"],
  pernambuco: ["pernambuco", "pe"],
  lisboa: ["lisboa", "lisbon"],
  porto: ["porto", "oporto"],
  braga: ["braga"],
  coimbra: ["coimbra"],
  funchal: ["funchal"],
};

/**
 * Generates possible text variations for a given location name.
 * Used to improve flexible matching across multilingual or differently formatted entries.
 *
 * @param location - The location string (e.g., a city or state name).
 * @returns An array of possible normalized variations of the input location.
 */
const getLocationVariations = (location: string): string[] => {
  const normalized = normalizeText(location);
  const variations = [location, normalized];

  for (const [key, values] of Object.entries(locationMappings)) {
    if (normalizeText(key) === normalized) {
      variations.push(...values);
      break;
    }
    if (values.some((v) => normalizeText(v) === normalized)) {
      variations.push(...values);
      variations.push(key);
      break;
    }
  }

  return [...new Set(variations.map((v) => normalizeText(v)))];
};
