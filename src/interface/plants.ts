/** Represents an image returned from Plant.ID (base64 or URL). */
export interface PlantIDImage {
  value: string;
  url?: string;
}

/** Dynamic taxonomy fields such as family, genus, species, etc. */
export interface PlantIDTaxonomy {
  [key: string]: string;
}

/** Detailed plant information returned by Plant.ID. */
export interface PlantIDDetails {
  common_names?: string[];
  description?: { value: string };
  description_gpt?: string;
  taxonomy?: PlantIDTaxonomy;
  images?: PlantIDImage[];
  best_watering?: string;
  best_light_condition?: string;
  best_soil_type?: string;
  propagation_methods?: string[];
  common_uses?: string;
  toxicity?: string;
  cultural_significance?: string;
}
/** One plant or disease identification suggestion. */
export interface PlantIDSuggestion {
  name: string;
  probability: number;
  redundant?: boolean;
  details?: PlantIDDetails;
  similar_images?: { url: string }[];
}
/** Plant classification result (list of suggested species). */
export interface PlantIDClassification {
  suggestions: PlantIDSuggestion[];
}
/** Disease or issue classification result. */
export interface PlantIDDisease {
  suggestions: PlantIDSuggestion[];
}
/** Overall Plant.ID result including plant check, health check, and suggestions. */
export interface PlantIDResult {
  is_plant: { binary: boolean; probability: number };
  is_healthy: { binary: boolean; probability: number };
  classification: PlantIDClassification;
  disease: PlantIDDisease;
}
/** Root response format from Plant.ID API. */
export interface PlantIDApiResponse {
  status: "COMPLETED" | "CREATED" | string;
  access_token?: string;
  result: PlantIDResult;
}

/** Payload your backend sends to Plant.ID for identification. */
export interface IdentifyPlantPayload {
  images: string[];
  latitude?: number;
  longitude?: number;
  similar_images?: boolean;
}

/** Final structured plant diagnosis returned by your application. */
export interface PlantDiagnosis {
  isPlant: boolean;
  confidence: number;
  plantInfo: {
    scientificName: string;
    commonNames: string[];
    probability: number;
    description: string;
    taxonomy?: Record<string, string>;
    images: string[];
    careGuide: {
      watering: string;
      lightCondition: string;
      soilType: string;
      propagation: string[];
    };
    uses: string;
    toxicity: string;
    culturalSignificance: string;
  } | null;
  healthStatus: {
    isHealthy: boolean;
    healthProbability: number;
    issues: HealthIssue[];
  };
  kasagardemSolutions: AutomationSolution[];
}

/** Represents an individual plant health issue (disease, pest, environmental, nutrient). */
export interface HealthIssue {
  name: string;
  type: "disease" | "pest" | "environmental" | "nutrient";
  probability: number;
  severity: "low" | "medium" | "high";
  description: string;
  symptoms: string[];
  causes: string[];
  treatment: {
    immediate: string[];
    longTerm: string[];
    prevention: string[];
  };
  similarImages: string[];
}

/** Represents automation/IoT-based solutions for managing plant issues. */
export interface AutomationSolution {
  issue: string;
  automationFeature: string;
  howItHelps: string;
  benefits: string[];
  setupSteps: string[];
}
/** Defines treatment steps for immediate, long-term, and preventive care. */
export interface TreatmentPlan {
  immediate: string[];
  longTerm: string[];
  prevention: string[];
}
/** Light version of plant details used in simplified suggestions. */
export interface SuggestionDetails {
  common_names?: string[];
}
/** Simplified suggestion object used for lightweight plant lists. */
export interface Suggestion {
  name: string;
  details?: SuggestionDetails;
}
