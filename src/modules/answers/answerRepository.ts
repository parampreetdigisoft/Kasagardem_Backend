import { FieldIndex } from "../../interface";
import {
  IAnswerType1,
  IAnswerType2,
  IPartnerRecommendation,
  ISubmitAnswer,
  IUserAnswer,
} from "../../interface/answer";
import Rule from "../admin/rules/rulesModel";
import PartnerProfile from "../partnerProfile/partnerProfileModel";
import Plant, { IPlantDocument } from "../plant/plantModel";

/**
 * Retrieves a list of recommended plants based on the user's provided answers.
 *
 * Builds dynamic MongoDB filters from the user's answers and queries the plants collection.
 *
 * @param {IUserAnswer[]} answers - Array of user answers used to generate filters for plant recommendations.
 * @returns {Promise<IPlantDocument[]>} A promise that resolves to an array of plant documents matching the recommendations.
 */
export const getRecommendedPlants = async (
  answers: IUserAnswer[]
): Promise<IPlantDocument[]> => {
  const filters: Record<string, unknown> = {};

  for (const [i, ans] of answers.entries()) {
    switch (i) {
      case FieldIndex.space_types:
        if (ans.selectedOption) {
          filters.space_types = { $in: [ans.selectedOption] };
        }
        break;

      case FieldIndex.area_sizes:
        if (ans.selectedOption) {
          filters.area_sizes = { $in: [ans.selectedOption] };
        }
        break;

      case FieldIndex.challenges:
        if (ans.selectedOption) {
          filters.challenges = { $in: [ans.selectedOption] };
        }
        break;

      case FieldIndex.tech_preferences:
        if (ans.selectedOption) {
          filters.tech_preferences = { $in: [ans.selectedOption] };
        }
        break;

      case FieldIndex.locations:
        if (ans.selectedAddress?.state) {
          filters.locations = {
            $elemMatch: {
              type: ans.selectedAddress.state,
              value: ans.selectedAddress.city,
            },
          };
        }
        break;
    }
  }

  return Plant.find({ ...filters, isDeleted: false })
    .select("scientific_name common_name image_search_url description")
    .limit(20)
    .exec();
};

/**
 * Generates recommended partner profiles based on submitted answers.
 *
 * @param answers - An array of user-submitted answers used to filter or rank partners.
 * @returns A promise that resolves to an array of partner recommendations.
 */
export const getRecommendedPartners = async (
  answers: ISubmitAnswer[]
): Promise<IPartnerRecommendation[]> => {
  try {
    // Step 1: Find rules with name "Professional Partner Recommendation"
    const partnerRules = await Rule.find({
      name: "Professional Partner Recommendation",
      isDeleted: false,
    });

    if (partnerRules.length === 0) {
      return [];
    }

    // Step 2: Extract type 1 answers (selectedOption answers)
    const type1Answers = answers.filter(
      (ans): ans is IAnswerType1 => ans.type === 1
    );

    // Step 3: Extract type 2 address info for filtering
    const type2Answer = answers.find(
      (ans): ans is IAnswerType2 => ans.type === 2
    );
    const userAddress = type2Answer?.selectedAddress;

    if (!userAddress?.state || !userAddress?.city) {
      return []; // No address info to filter by
    }

    // Step 4: Check which rules match the answers
    const matchingRules = [];

    for (const rule of partnerRules) {
      let ruleMatches = false;

      for (const condition of rule.conditions) {
        // Find the answer for this condition's questionId
        const relevantAnswer = type1Answers.find(
          (ans) =>
            ans.questionId &&
            ans.questionId.toString() === condition.questionId.toString()
        );

        if (relevantAnswer && relevantAnswer.selectedOption) {
          // Check if the selected option matches the condition values
          switch (condition.operator) {
            case "equals":
              if (condition.values.includes(relevantAnswer.selectedOption)) {
                ruleMatches = true;
              }
              break;
            case "in":
              if (condition.values.includes(relevantAnswer.selectedOption)) {
                ruleMatches = true;
              }
              break;
            // Add more operators as needed (and, or)
            default:
              if (condition.values.includes(relevantAnswer.selectedOption)) {
                ruleMatches = true;
              }
          }
        }

        // If any condition matches, we consider this rule matched
        // You might want to implement more complex logic for 'and'/'or' operators
        if (ruleMatches) break;
      }

      if (ruleMatches) {
        matchingRules.push(rule);
      }
    }

    if (matchingRules.length === 0) {
      return [];
    }

    // Step 5: Create multilingual patterns for state and city
    const statePattern = createMultilingualPattern(userAddress.state);
    const cityPattern = createMultilingualPattern(userAddress.city);

    const partners = await PartnerProfile.find({
      status: "active",
      $and: [
        {
          $or: [
            // Exact state matches using multilingual pattern
            {
              "address.state": statePattern,
            },
          ],
        },
        {
          $or: [
            // Exact city matches using multilingual pattern
            {
              "address.city": cityPattern,
            },
          ],
        },
      ],
    });

    // Map to the return type
    return partners.map(
      (partner): IPartnerRecommendation => ({
        email: partner.email,
        mobileNumber: partner.mobileNumber,
        companyName: partner.companyName!,
        speciality: partner.speciality!,
        address: partner.address!,
        website: partner.website!,
        contactPerson: partner.contactPerson!,
        projectImageUrl: partner.projectImageUrl!,
      })
    );
  } catch (error) {
    console.error("Error getting recommended partners:", error);
    return [];
  }
};

/**
 * Normalizes a string for multilingual matching by converting to lowercase,
 * removing accents/diacritics, and replacing certain accented characters.
 *
 * @param text - The input text to normalize.
 * @returns The normalized text.
 */
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD") // Remove accents and diacritics
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ã|á|à|â|ä/g, "a")
    .replace(/ç/g, "c")
    .replace(/é|ê/g, "e")
    .replace(/í/g, "i")
    .replace(/ó|ô|õ/g, "o")
    .replace(/ú|ü/g, "u")
    .replace(/\s+/g, " ");
};

// City/State name mappings for different languages
const locationMappings: Record<string, string[]> = {
  // Brazilian cities
  belo_horizonte: ["belo horizonte", "bh"],
  brasilia: ["brasília", "brasilia", "df"],
  salvador: ["salvador", "ssa"],
  fortaleza: ["fortaleza", "for"],
  manaus: ["manaus", "mao"],
  curitiba: ["curitiba", "cwb"],
  recife: ["recife", "rec"],
  porto_alegre: ["porto alegre", "poa"],

  // Brazilian states
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

  // Portuguese cities
  lisboa: ["lisboa", "lisbon"],
  porto: ["porto", "oporto"],
  braga: ["braga"],
  coimbra: ["coimbra"],
  funchal: ["funchal"],
};

/**
 * Returns all possible normalized variations of a given location name,
 * including known aliases from the `locationMappings`.
 *
 * @param location - The name of the location to generate variations for.
 * @returns An array of normalized variations for the location.
 */
const getLocationVariations = (location: string): string[] => {
  const normalized = normalizeText(location);
  const variations = [location, normalized];

  // Check if the normalized location matches any key in locationMappings
  for (const [key, values] of Object.entries(locationMappings)) {
    if (normalizeText(key) === normalized) {
      variations.push(...values);
      break;
    }
    // Also check if the location matches any of the mapped values
    if (values.some((v) => normalizeText(v) === normalized)) {
      variations.push(...values);
      variations.push(key); // Add the key as well
      break;
    }
  }

  return [...new Set(variations.map((v) => normalizeText(v)))]; // Remove duplicates and normalize all
};

/**
 * Creates a case-insensitive regex pattern that matches any variation
 * of the given text based on normalized and mapped location names.
 *
 * @param text - The text to generate a regex pattern for.
 * @returns A RegExp that matches any normalized variation of the text.
 */
const createMultilingualPattern = (text: string): RegExp => {
  const variations = getLocationVariations(text);

  const escapedPatterns = variations.map(
    (v) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // Escape regex special chars
  );

  const combinedPattern = escapedPatterns.join("|");
  return new RegExp(`^(${combinedPattern})$`, "i"); // Added ^ and $ for exact matching
};
