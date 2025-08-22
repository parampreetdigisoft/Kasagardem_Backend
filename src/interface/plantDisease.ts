import { SimilarImage } from ".";

export interface PlantHealthAssesmentResponse {
  access_token: string;
  model_version: string;
  custom_id?: string;
  input: {
    latitude?: number;
    longitude?: number;
    similar_images: boolean;
    health: string;
    images: string[];
    datetime: string;
  };
  result: {
    is_plant: {
      probability: number;
      threshold: number;
      binary: boolean;
    };
    is_healthy: HealthAssessment;
    disease: {
      suggestions: DiseaseSuggestion[];
      question: DiseaseQuestion;
    };
  };
  status: string;
  sla_compliant_client: boolean;
  sla_compliant_system: boolean;
  created: number;
  completed: number;
}

export interface HealthAssessment {
  binary: boolean;
  threshold: number;
  probability: number;
}

export interface DiseaseSuggestion {
  id: string;
  name: string;
  probability: number;
  similar_images?: SimilarImage[];
  details?: {
    language: string;
    entity_id: string;
  };
}

export interface DiseaseQuestion {
  text: string;
  translation: string;
  options: {
    yes: {
      suggestion_index: number;
      entity_id: string;
      name: string;
      translation: string;
    };
    no: {
      suggestion_index: number;
      entity_id: string;
      name: string;
      translation: string;
    };
  };
}
