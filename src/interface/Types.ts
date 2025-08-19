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
