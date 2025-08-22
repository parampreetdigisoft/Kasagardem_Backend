import { SimilarImage } from ".";

export interface IPreparedResponse {
  confidence: number;
  suggestions: {
    scientificName: string;
    confidence: number;
    similarImages: {
      url: string;
      urlSmall: string;
      similarity: number;
      license: string;
    }[];
  }[];
  isPlant: number | null;
  status: string;
  savedImages: string[];
}

export interface PlantCreateIdentificationResponse {
  access_token: string;
  model_version: string;
  custom_id: string | null;
  input: {
    latitude: number;
    longitude: number;
    similar_images: boolean;
    images: string[];
    datetime: string; // ISO string
  };
  result: {
    is_plant: {
      probability: number;
      binary: boolean;
      threshold: number;
    };
    classification: {
      suggestions: PlantSuggestion[];
    };
  };
  status: string;
  sla_compliant_client: boolean;
  sla_compliant_system: boolean;
  created: number; // timestamp
  completed: number; // timestamp
}

export interface PlantSuggestion {
  id: string;
  name: string;
  probability: number;
  similar_images: SimilarImage[];
  details: {
    language: string;
    entity_id: string;
  };
}
