import { ObjectId } from "mongodb";
import mongoose from "mongoose";

export interface SimilarImage {
  url: string;
  url_small: string;
  similarity: number;
  license_name: string;
}

export interface PlantSuggestion {
  name: string;
  probability: number;
  similar_images?: SimilarImage[];
}

export interface PersonalizedTip {
  type: "watering_reminder" | "seasonal" | "category_specific";
  priority: "high" | "medium" | "low";
  title: string;
  description: string | undefined;
  actionUrl: string;
}

export interface PlantHistoryQuery {
  userId: string;
  action?: string;
  plantId?: string;
}

export interface Config {
  NODE_ENV: string;
  PORT: number;
  MONGODB_URI: string;
  MONGODB_NAME: string;
  JWT_SECRET: string;
  JWT_EXPIRE: string;
  APPDEV_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  KASAGARDEM_PLANTAPI_KEY: string;
  KASAGARDEM_PLANTAPI_URL: string;
  KASAGARDEM_PLANTAPI_KEY_NAME: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_REGION: string;
  AWS_S3_BUCKET: string;
}

export interface LogOptions {
  userId?: string | ObjectId;
  sessionId?: string;
  source?: string;
}

export interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  meta: Record<string, unknown>;
  createdAt: Date;
  source: string;
  userId?: ObjectId;
  sessionId?: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, unknown> | null;
}

export interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface IUser {
  name: string;
  email?: string;
  password?: string;
  roleId: mongoose.Types.ObjectId;
  phoneNumber?: string;
  googleId?: string;
}

export interface IWatering {
  frequency?: string;
  amount?: string;
  notes?: string;
}

export interface ITemperature {
  min?: number;
  max?: number;
  unit?: "celsius" | "fahrenheit";
}

export interface IHumidity {
  level?: "low" | "medium" | "high";
  percentage?: number;
}

export interface IFertilizing {
  frequency?: string;
  type?: string;
  notes?: string;
}

export interface ICareInstructions {
  watering?: IWatering;
  sunlight?: "full-sun" | "partial-sun" | "shade" | "indirect-light";
  temperature?: ITemperature;
  humidity?: IHumidity;
  fertilizing?: IFertilizing;
}

export interface ICoordinates {
  latitude?: number;
  longitude?: number;
}

export interface ILocation {
  name?: string;
  coordinates?: ICoordinates;
}

export interface IRole {
  name: string;
  description?: string;
}

export interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

export interface ISocialLinks {
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
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

export interface HealthAssessment {
  binary: boolean;
  threshold: number;
  probability: number;
}

export interface PlantHealthResponse {
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

// Update existing SimilarImage interface if needed
export interface SimilarImage {
  id?: string;
  url: string;
  url_small: string;
  similarity: number;
  license_name: string;
  license_url?: string;
  citation?: string;
}
