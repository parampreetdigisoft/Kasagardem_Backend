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
