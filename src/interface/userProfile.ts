// Interface for flattened full user profile response
export interface IFullUserProfile {
  name: string | null;
  email: string | null;
  contactNumber: string | null;
  profileImage: string | null;
  dateOfBirth: Date | string | null | undefined;
  gender: "male" | "female" | "other" | null;
  bio: string | null;
  address: {
    street: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    zipCode: string | null;
  };
  occupation: string | null;
  company: string | null;
}

export interface IUserProfile {
  id?: string;
  userId: string;
  profile_image?: string | null;
  dateOfBirth?: string | Date | null;
  gender?: "male" | "female" | "other" | "";
  bio?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  zipCode?: string | null;
  occupation?: string | null;
  company?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
