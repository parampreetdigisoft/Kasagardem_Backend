// ─── Generic Option (JSONB array item) ───────────────────────────────────────
export interface GenericOption {
  name: string;
  frequency: number;
  preferred_time: string;       // "HH:MM:SS"
  notification_enabled: boolean;
}

// ─── Plant Species (from /allplants) ─────────────────────────────────────────
export interface Plant {
  id: string;
  scientific_name: string;
  common_name: string;
  description: string | null;
  image_url: string | null;

  water_reminder_frequency: number;
  water_notification_enabled: boolean;

  fertilizer_schedule: number;
  fertilizer_notification_enabled: boolean;

  pruning_alert: number;
  pruning_notification_enabled: boolean;

  generic_options: GenericOption[];

  created_at: string;           // ISO date string
  updated_at: string;
}

// ─── Paginated response wrapper (/allplants) ──────────────────────────────────
export interface PaginatedPlants {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  plants: Plant[];
}

// ─── User's own plant (from /userplants) ─────────────────────────────────────
export interface UserPlant {
  user_plant_id: string;
  name: string;                 // nickname ?? common_name
  plant_image: string | null;
  health_status: string;        // "healthy" | "needs_attention" | etc.

  water_notification_enabled: boolean;
  next_watered_at: string;      // ISO date string

  fertilizer_notification_enabled: boolean;
  next_fertilized_at: string;

  pruning_notification_enabled: boolean;
  next_pruned_at: string;
}

// ─── User plants response wrapper (/userplants) ───────────────────────────────
export interface UserPlantsResult {
  totalCount: number;
  plants: UserPlant[];
}

// ─── Add plant input ──────────────────────────────────────────────────────────
export interface AddUserPlantInput {
  plant_species_id: string;
 

  water_notification_enabled?: boolean;
  water_preferred_time?: string; 

  fertilizer_notification_enabled?: boolean;
  fertilizer_preferred_time?: string;

  pruning_notification_enabled?: boolean;
  pruning_preferred_time?: string;

  generic_care_preferred_time?:string       // "HH:MM:SS"
  generic_care_notification_enabled?: boolean;

  watering_frequency_days: number;
  fertilizing_frequency_days: number;
  pruning_frequency_days: number;
  generic_frequency_days: number;
}


export interface PaginatedUserPlants {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    plants: UserPlant[];
}