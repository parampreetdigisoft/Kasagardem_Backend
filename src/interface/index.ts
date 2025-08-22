export interface SimilarImage {
  id?: string;
  url: string;
  url_small: string;
  similarity: number;
  license_name: string;
  license_url?: string;
  citation?: string;
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
