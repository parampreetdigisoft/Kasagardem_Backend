// Interface for flattened full user profile response
export interface IFullUserProfile {
  name: string | null;
  email: string | null;
  contactNumber: string | null;
  profileImage: string | null;
  dateOfBirth: Date | null;
  gender: "male" | "female" | "other" | null;
  bio: string | null;
  address: {
    street: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    zipCode: string | null;
  };
  socialLinks: {
    facebook: string | null;
    twitter: string | null;
    linkedin: string | null;
    instagram: string | null;
  };
  occupation: string | null;
  company: string | null;
}
