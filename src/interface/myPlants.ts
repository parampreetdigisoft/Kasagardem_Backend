export interface Plant {
  id: string;
  scientific_name: string;
  common_name: string;
  description: string | null;
  image_url: string | null;
  water_reminder_frequency: number;
  preferred_time?: string; // optional if included
  fertilizer_schedule?: number;
  pruning_alert?: number;
  generic_options?: Record<string, string>; // JSONB
  created_at: string;
  updated_at: string;
}

export interface PaginatedPlants {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  plants: Plant[];
}


// types.ts
export interface AddUserPlantInput {
    plant_species_id: string;
    nickname?: string;
    health_status?: string;

    // Water — all optional, fallback to plant_species
    custom_water_frequency?: number;
    water_notification_enabled?: boolean;
    water_preferred_time?: string;

    // Fertilizer — all optional, fallback to plant_species
    custom_fertilizer_schedule?: number;
    fertilizer_notification_enabled?: boolean;
    fertilizer_preferred_time?: string;

    // Pruning — all optional, fallback to plant_species
    custom_pruning_schedule?: number;
    pruning_notification_enabled?: boolean;
    pruning_preferred_time?: string;
}