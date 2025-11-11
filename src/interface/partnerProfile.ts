export interface IPartnerProfile {
  id?: string; // UUID (optional when creating)

  email: string;
  mobileNumber: string;

  companyName?: string;

  speciality1?: string;
  speciality2?: string;
  speciality3?: string;

  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;

  website?: string;
  contactPerson?: string;
  projectImageUrl?: string;

  status?: "active" | "inactive" | "pending" | "suspended";
  rating?: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface RawPartnerProfileInput {
  email?: string;
  mobileNumber?: string;
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
  rating?: number;
}
