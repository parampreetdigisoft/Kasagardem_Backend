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



export interface PlantRow {
  common_name?: string;
  scientific_name?: string;
  family?: string;
  genus?: string;
  light?: string;
  ground_humidity?: string;
  atmospheric_humidity?: string;
  soil_nutriments?: string;
  soil_salinity?: string;
  ph_minimum?: string;
  ph_maximum?: string;
  growth_rate?: string;
  growth_habit?: string;
  average_height_cm?: string;
  maximum_height_cm?: string;
  minimum_root_depth_cm?: string;
  edible?: string;
  vegetable?: string;
  flower_color?: string;
  foliage_color?: string;
  foliage_texture?: string;
  bloom_months?: string;
  growth_months?: string;
  fruit_months?: string;
  image_url?: string;
  common_names?: string;
  distributions?: string;
  growth_rate_pt?: string;
  gowth_habit_pt?: string;
  edible_pt?: string;
  vegetable_pt?: string;
  flower_color_pt?: string;
  foliage_color_pt?: string;
  foliage_texture_pt?: string;
}
 
export interface ImportResult {
  success: boolean;
  total: number;
  inserted: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}
 



export interface PlantDetails {
  id: number;
  common_name: string |null;
  scientific_name: string;
  family: string | null;
  genus: string | null;
  watering: string | null;
  sunlight: string | null;
  care_level: string | null;
  growth_rate: string | null;
  indoor: boolean | null;
  temperature_min: number | null;
  temperature_max: number | null;
  humidity_min: number | null;
  humidity_max: number | null;
  light_min: number | null;
  light_max: number | null;
  soil_moisture_min: number | null;
  soil_moisture_max: number | null;
  poisonous_to_humans: boolean | null;
  poisonous_to_pets: boolean | null;
  drought_tolerant: boolean | null;
  tropical: boolean | null;
  medical: boolean | null;
  edible: boolean | null;
  soil: string | null;
  fertilizer: string | null;
  pruning: string | null;
  cycle: string | null;
  pest: string | null;
  diseases: string | null;
  origin: string | null;
  category: string | null;
  climate: string | null;
  color: string | null;
  blooming: string | null;
  description: string | null;
  image_url: string | null;
  source: string | null;
}