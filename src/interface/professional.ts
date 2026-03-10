export interface RegistrationResult {
    rowNumber: number;
    success: boolean;
    email: string;
    name: string;
    userId?: string;
    emailSent?: boolean;
    emailError?: string;
    error?: string;
}

export interface ServiceResult {
    total: number;
    successful: number;
    failed: number;
    emailsSent: number;
    emailsFailed: number;
    results: RegistrationResult[];
}

export interface ProfessionalProfileResponse {
    id: string;
    companyName: string | null;
    email: string | null;
    category: string | null;
    description: string | null;

    location: {
        city: string | null;
        state: string | null;
        address: string | null;
        latitude: number | null;
        longitude: number | null;
    };

    contact: {
        telefone: string | null;
        whatsapp: string | null;
        website: string | null;
        instagram: string | null;
    };

    ratings: {
        assessment: number | null;
        numAvaliacoes: number;
    };

    verifiedSource: string | null;
    createdAt: Date;
    updatedAt: Date;
}



export type InsertResult = {
    inserted: number;
    failed: { row: number; error: string }[];
};




export interface GetProfessionalsParams {
  userLat: number;
  userLng: number;
  category?: string |undefined;
  limit: number;
  offset: number;
}

export interface ProfessionalResult {
  id: string;
  company_name: string;
  category: string;
  description: string;
  city: string;
  state: string;
  address: string;
  contact: {
    telefone: string;
    whatsapp: string;
    website: string;
    instagram: string;
  };
  rating: number;
  num_avaliacoes: number;
  verified_source: string;
  subscription: {
    plan_name: string;
    highlight_in_result: boolean;
    verification_badge: boolean;
  };
  distance_km: number;
}
export interface GetProfessionalsResponse {
  total: number;
  limit: number;
  offset: number;
  user_location: { lat: number; lng: number };
  data: ProfessionalResult[];
}



export interface professionalProfileResponse{
    name: string;
    email: string;
    imageUrl: string | null;
    subscriptionPlan: string;
    StartDate: Date | null;
    EndDate: Date | null;
    AccountStatus: string;
}



export interface Location {
    city: string | null;
    state: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
}

export interface RequestingUser {
    userId: string;
    professionalProfileId: string | null;
    description: string | null;
}

export interface ProfessionalPartner {
    leads_status: string | null;
    userId: string;
    role: "professional";
    company_name: string | null;
    location: Location;
    telefone: string | null;
    whatsapp: string | null;
    website: string | null;
    // instagram: string | null;
    requestingUser: RequestingUser;
    created_at: string | null;
}

export interface UserPartner {
    leads_status: string | null;
    userId: string;
    role: "user";
    name: string | null;
    email: string | null;
    phone_number: string | null;
    requestingUser: RequestingUser;
    created_at: string | null;
}

export type PartnerProfile = ProfessionalPartner | UserPartner;