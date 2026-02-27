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