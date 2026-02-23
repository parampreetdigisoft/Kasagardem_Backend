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
    userId: string;
    status: string;
    profileVisible: boolean;
    trialPeriod: {
        startDate: Date;
        endDate: Date;
    };
    activeSubscriptionId: string | null;
    founder: {
        isFounder: boolean;
        founderNumber: number | null;
    };
    coverage: {
        primaryCity: string;
        states: string[];
        national: boolean;
    };
    createdAt: Date;
}