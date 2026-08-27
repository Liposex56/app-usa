/**
 * Database types for the Supabase client.
 *
 * Hand-maintained to match supabase/migrations/*.sql. Once the project is
 * linked you can regenerate this file instead:
 *
 *   npx supabase gen types typescript --project-id <ref> > lib/database.types.ts
 *
 * Note: every shape below is a `type` alias, not an `interface` — Supabase's
 * generic constraints require an implicit index signature, which interfaces
 * do not have.
 */

export type Species = 'dog' | 'cat';
export type PetSex = 'male' | 'female';
export type PetSize = 'small' | 'medium' | 'large' | 'giant';
export type EnergyLevel = 'low' | 'moderate' | 'high';
export type HomeType = 'house' | 'apartment' | 'condo' | 'townhouse';
export type ServiceType =
  | 'boarding'
  | 'daycare'
  | 'house_sitting'
  | 'dog_walking'
  | 'drop_in_visit';
export type SitterStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'suspended';
export type CheckStatus =
  | 'not_started'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'expired';
export type StaffRole =
  | 'admin'
  | 'support'
  | 'finance'
  | 'verification'
  | 'moderation';
export type BadgeType =
  | 'background_check'
  | 'interviewed'
  | 'home_verified'
  | 'insured'
  | 'certified_havener'
  | 'cat_specialist'
  | 'puppy_specialist'
  | 'senior_specialist'
  | 'medication_experienced'
  | 'quick_responder'
  | 'top_rated'
  | 'repeat_favorite';

export type PottyBreakFrequency = '0-2h' | '2-4h' | '4-8h' | '8+h';
export type ServiceCancellationPolicy =
  | 'same_day'
  | 'one_day'
  | 'three_day'
  | 'seven_day';
export type DayOfWeek = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';
export type Skill =
  | 'first_aid_cpr'
  | 'oral_medication'
  | 'injectable_medication'
  | 'senior_care'
  | 'special_needs_care'
  | 'daily_exercise_high_energy';

export type OnboardingStep =
  | 'role'
  | 'owner_profile'
  | 'pet'
  | 'havener'
  | 'done';

export type ProfileRow = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  phone_verified_at: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  is_owner: boolean;
  is_havener: boolean;
  onboarding_step: OnboardingStep;
  onboarding_completed_at: string | null;
  marketing_opt_in: boolean;
  created_at: string;
  updated_at: string;
};

export type PetRow = {
  id: string;
  owner_id: string;
  name: string;
  species: Species;
  breed: string | null;
  birthdate: string | null;
  sex: PetSex | null;
  weight_lb: number | null;
  size: PetSize | null;
  energy_level: EnergyLevel | null;
  photo_url: string | null;
  is_fixed: boolean | null;
  is_in_heat: boolean;
  vaccination_doc_path: string | null;
  vaccinated_through: string | null;
  allergies: string | null;
  medical_conditions: string | null;
  medications: string | null;
  vet_name: string | null;
  vet_phone: string | null;
  mobility_notes: string | null;
  food_type: string | null;
  feeding_schedule: string | null;
  feeding_notes: string | null;
  treats_allowed: boolean;
  is_crate_trained: boolean | null;
  has_anxiety: boolean;
  has_bitten: boolean;
  is_reactive: boolean;
  is_escape_risk: boolean;
  guards_resources: boolean;
  requires_muzzle: boolean;
  behavior_notes: string | null;
  good_with_dogs: boolean | null;
  good_with_cats: boolean | null;
  good_with_kids: boolean | null;
  good_with_strangers: boolean | null;
  special_needs: string | null;
  private_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SitterProfileRow = {
  id: string;
  headline: string | null;
  bio: string | null;
  routine_description: string | null;
  years_experience: number | null;
  service_city: string | null;
  service_state: string | null;
  service_postal_code: string | null;
  service_radius_miles: number;
  latitude: number | null;
  longitude: number | null;
  provides_transport: boolean;
  home_type: HomeType | null;
  has_yard: boolean;
  yard_is_fenced: boolean;
  has_kids_at_home: boolean;
  has_own_pets: boolean;
  own_pets_description: string | null;
  works_outside_home: boolean;
  provides_daily_exercise: boolean;
  has_stairs: boolean;
  max_pets_per_day: number;
  accepts_dogs: boolean;
  accepts_cats: boolean;
  accepted_sizes: PetSize[];
  accepts_puppies: boolean;
  accepts_seniors: boolean;
  accepted_energy_levels: EnergyLevel[];
  accepts_unfixed: boolean;
  accepts_in_heat: boolean;
  comfortable_with_meds: boolean;
  comfortable_with_anxiety: boolean;
  comfortable_with_reactive: boolean;
  cancellation_policy: string;
  home_full_time: boolean;
  available_days: DayOfWeek[];
  potty_break_frequency: PottyBreakFrequency | null;
  advance_notice_days: number;
  accepts_extended_stays: boolean;
  allows_smoking: boolean;
  dogs_on_furniture: boolean;
  dogs_on_bed: boolean;
  hosts_multiple_families: boolean;
  accepts_not_crate_trained: boolean;
  skills: string[];
  schedule_description: string | null;
  home_environment_description: string | null;
  pet_care_notes: string | null;
  cat_bio: string | null;
  cat_years_experience: number | null;
  status: SitterStatus;
  submitted_at: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  background_check_status: CheckStatus;
  interview_status: CheckStatus;
  home_check_status: CheckStatus;
  insurance_status: CheckStatus;
  rating: number | null;
  review_count: number;
  completed_bookings: number;
  response_time_minutes: number | null;
  calendar_updated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SitterServiceRow = {
  id: string;
  sitter_id: string;
  service_type: ServiceType;
  is_active: boolean;
  base_rate_cents: number;
  additional_pet_rate_cents: number;
  holiday_rate_cents: number | null;
  puppy_rate_cents: number | null;
  accepts_dogs: boolean;
  accepts_cats: boolean;
  duration_minutes: number | null;
  description: string | null;
  is_paused: boolean;
  accepts_new_customers: boolean;
  extended_stay_rate_cents: number | null;
  bathing_rate_cents: number | null;
  pickup_dropoff_rate_cents: number | null;
  cancellation_policy: ServiceCancellationPolicy;
  created_at: string;
  updated_at: string;
};

export type SitterPhotoRow = {
  id: string;
  sitter_id: string;
  storage_path: string;
  category: 'profile' | 'home';
  caption: string | null;
  sort_order: number;
  created_at: string;
};

export type SitterAvailabilityRow = {
  sitter_id: string;
  date: string;
  is_available: boolean;
  note: string | null;
};

export type SitterInsuranceRow = {
  sitter_id: string;
  provider: string | null;
  policy_number: string | null;
  coverage_type: string | null;
  effective_date: string | null;
  expires_at: string | null;
  document_path: string | null;
  status: CheckStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SitterBadgeRow = {
  sitter_id: string;
  badge: BadgeType;
  awarded_at: string;
  awarded_by: string | null;
};

export type FavoriteRow = {
  owner_id: string;
  sitter_id: string;
  created_at: string;
};

export type StaffMemberRow = {
  user_id: string;
  role: StaffRole;
  created_at: string;
};

export type PlatformSettingsRow = {
  id: 1;
  company_commission_percent: number;
  updated_by: string | null;
  updated_at: string;
};

export type WaitlistRow = {
  id: string;
  email: string;
  role: 'owner' | 'havener' | 'both' | null;
  zip_code: string | null;
  source: string | null;
  created_at: string;
};

/** The privacy-safe projection other users read. Never contains PII. */
export type PublicSitterRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  bio: string | null;
  routine_description: string | null;
  schedule_description: string | null;
  home_environment_description: string | null;
  pet_care_notes: string | null;
  skills: string[];
  cat_bio: string | null;
  cat_years_experience: number | null;
  years_experience: number | null;
  service_city: string | null;
  service_state: string | null;
  service_postal_code: string | null;
  service_radius_miles: number;
  latitude: number | null;
  longitude: number | null;
  provides_transport: boolean;
  home_type: HomeType | null;
  has_yard: boolean;
  yard_is_fenced: boolean;
  has_kids_at_home: boolean;
  has_own_pets: boolean;
  own_pets_description: string | null;
  works_outside_home: boolean;
  provides_daily_exercise: boolean;
  max_pets_per_day: number;
  accepts_dogs: boolean;
  accepts_cats: boolean;
  accepted_sizes: PetSize[];
  accepts_puppies: boolean;
  accepts_seniors: boolean;
  accepted_energy_levels: EnergyLevel[];
  comfortable_with_meds: boolean;
  comfortable_with_anxiety: boolean;
  comfortable_with_reactive: boolean;
  cancellation_policy: string;
  allows_smoking: boolean;
  dogs_on_furniture: boolean;
  dogs_on_bed: boolean;
  hosts_multiple_families: boolean;
  accepts_not_crate_trained: boolean;
  accepts_unfixed: boolean;
  accepts_in_heat: boolean;
  potty_break_frequency: PottyBreakFrequency | null;
  available_days: DayOfWeek[];
  rating: number | null;
  review_count: number;
  completed_bookings: number;
  response_time_minutes: number | null;
  calendar_updated_at: string | null;
  is_certified: boolean;
  is_insured: boolean;
  background_checked: boolean;
};

type Table<Row, Required extends keyof Row = never> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, Required>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow, 'id'>;
      pets: Table<PetRow, 'owner_id' | 'name' | 'species'>;
      sitter_profiles: Table<SitterProfileRow, 'id'>;
      sitter_services: Table<SitterServiceRow, 'sitter_id' | 'service_type' | 'base_rate_cents'>;
      sitter_photos: Table<SitterPhotoRow, 'sitter_id' | 'storage_path'>;
      sitter_availability: Table<SitterAvailabilityRow, 'sitter_id' | 'date'>;
      sitter_insurance: Table<SitterInsuranceRow, 'sitter_id'>;
      sitter_badges: Table<SitterBadgeRow, 'sitter_id' | 'badge'>;
      favorites: Table<FavoriteRow, 'owner_id' | 'sitter_id'>;
      staff_members: Table<StaffMemberRow, 'user_id'>;
      waitlist: Table<WaitlistRow, 'email'>;
      platform_settings: Table<PlatformSettingsRow, never>;
    };
    Views: {
      public_sitters: {
        Row: PublicSitterRow;
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: {
      species: Species;
      pet_sex: PetSex;
      pet_size: PetSize;
      energy_level: EnergyLevel;
      home_type: HomeType;
      service_type: ServiceType;
      sitter_status: SitterStatus;
      check_status: CheckStatus;
      staff_role: StaffRole;
      badge_type: BadgeType;
    };
    CompositeTypes: Record<string, never>;
  };
};
