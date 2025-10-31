// Types for answers
export interface IAnswerType1 {
  type: 1;
  questionId: string;
  selectedOption: string;
}

export interface IAnswerType2 {
  type: 2;
  questionId: string;
  selectedAddress: {
    state: string;
    city: string;
    street?: string;
    country?: string;
    zipCode?: string;
  };
}

export type ISubmitAnswer = IAnswerType1 | IAnswerType2;

export interface IPartnerRecommendation {
  email: string;
  mobileNumber: string;
  companyName?: string;
  speciality?: string[];
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  website?: string;
  contactPerson?: string;
  projectImageUrl?: string;
  status?: string;
  whyRecommended?: string;
}

export interface ISelectedAddress {
  state: string;
  city: string;
}

export interface IUserAnswer {
  questionId: string;
  type: number; // 1 = option, 2 = address
  selectedOption?: string;
  selectedAddress?: ISelectedAddress;
}

// ===============================
// Interfaces
// ===============================

export interface IPlantRecommendation {
  id: string;
  scientific_name: string;
  common_name: string;
  image_search_url: string | null;
  description: string | null;
  space_types: string[];
  area_sizes: string[];
  challenges: string[];
  tech_preferences: string[];
  locations: Array<{ type: string; value: string }>;
  whyRecommended: string[];
}

export interface IPartnerProfile {
  id: string;
  email: string;
  mobile_number: string;
  company_name: string | null;
  speciality_1: string | null;
  speciality_2: string | null;
  speciality_3: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zip_code: string | null;
  website: string | null;
  contact_person: string | null;
  project_image_url: string | null;
  rating: number | null;
  status: string;
}

// 🧩 Interfaces
// ----------------------

export interface ISelectedAddress {
  state: string;
  city: string;
}

export interface ISurveyAnswer {
  questionId: string;
  type: number;
  selectedOption?: string | null;
  selectedAddress?: ISelectedAddress | null;
}
