-- ============================================================================
-- Havenr — 0001_schema.sql
-- Core schema: accounts, pets, sitter (Havener) profiles, services, badges.
--
-- Run this in the Supabase SQL Editor (or `supabase db push`) BEFORE 0002/0003.
-- Everything lives in the `public` schema and is locked down by RLS in 0002.
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
-- Each type gets its own DO block: a plpgsql exception handler rolls back the
-- whole block, so grouping them would undo the ones that succeeded.
do $$ begin create type public.species as enum ('dog', 'cat');
exception when duplicate_object then null; end $$;

do $$ begin create type public.pet_sex as enum ('male', 'female');
exception when duplicate_object then null; end $$;

do $$ begin create type public.pet_size as enum ('small', 'medium', 'large', 'giant');
exception when duplicate_object then null; end $$;

do $$ begin create type public.energy_level as enum ('low', 'moderate', 'high');
exception when duplicate_object then null; end $$;

do $$ begin create type public.home_type as enum ('house', 'apartment', 'condo', 'townhouse');
exception when duplicate_object then null; end $$;

do $$ begin create type public.service_type as enum (
  'boarding', 'daycare', 'house_sitting', 'dog_walking', 'drop_in_visit');
exception when duplicate_object then null; end $$;

do $$ begin create type public.sitter_status as enum (
  'draft', 'pending_review', 'approved', 'rejected', 'suspended');
exception when duplicate_object then null; end $$;

do $$ begin create type public.check_status as enum (
  'not_started', 'pending', 'approved', 'rejected', 'expired');
exception when duplicate_object then null; end $$;

do $$ begin create type public.staff_role as enum (
  'admin', 'support', 'finance', 'verification', 'moderation');
exception when duplicate_object then null; end $$;

do $$ begin create type public.badge_type as enum (
  'background_check', 'interviewed', 'home_verified', 'insured',
  'certified_havener', 'cat_specialist', 'puppy_specialist',
  'senior_specialist', 'medication_experienced', 'quick_responder',
  'top_rated', 'repeat_favorite');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles — one row per auth user. Holds PII; never exposed to other users.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id                      uuid primary key references auth.users (id) on delete cascade,
  email                   citext,
  first_name              text,
  last_name               text,
  -- Public-facing name. For joint profiles: "Pamela & Sebastian".
  display_name            text,
  avatar_url              text,
  phone                   text,
  phone_verified_at       timestamptz,

  -- Address is PII. Sitters never read this table; matching uses city/postal
  -- via the security-definer functions added when search lands.
  address_line1           text,
  address_line2           text,
  city                    text,
  state                   text,
  postal_code             text,
  country                 text default 'US',
  latitude                double precision,
  longitude               double precision,

  emergency_contact_name  text,
  emergency_contact_phone text,

  is_owner                boolean not null default false,
  is_havener              boolean not null default false,

  -- Drives the onboarding wizard: 'role', 'owner_profile', 'pet', 'havener', 'done'
  onboarding_step         text not null default 'role',
  onboarding_completed_at timestamptz,

  marketing_opt_in        boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create the profile row automatically when someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, display_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'first_name', '') || ' ' ||
                coalesce(new.raw_user_meta_data ->> 'last_name', '')), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- staff_members — internal Havenr team. Drives admin access in RLS.
-- ---------------------------------------------------------------------------
create table if not exists public.staff_members (
  user_id    uuid primary key references public.profiles (id) on delete cascade,
  role       public.staff_role not null default 'support',
  created_at timestamptz not null default now()
);

-- SECURITY DEFINER so RLS policies can call it without recursing into
-- staff_members' own policies.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.staff_members s where s.user_id = auth.uid());
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.staff_members s
    where s.user_id = auth.uid() and s.role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- pets
-- ---------------------------------------------------------------------------
create table if not exists public.pets (
  id                   uuid primary key default gen_random_uuid(),
  owner_id             uuid not null references public.profiles (id) on delete cascade,

  name                 text not null,
  species              public.species not null,
  breed                text,
  birthdate            date,
  sex                  public.pet_sex,
  weight_lb            numeric(5,1),
  size                 public.pet_size,
  energy_level         public.energy_level,
  photo_url            text,

  -- Health. Vaccination record is required by Havenr before a booking.
  is_fixed             boolean,           -- neutered (male) / spayed (female)
  is_in_heat           boolean not null default false,
  vaccination_doc_path text,              -- private storage object path
  vaccinated_through   date,
  allergies            text,
  medical_conditions   text,
  medications          text,
  vet_name             text,
  vet_phone            text,
  mobility_notes       text,

  -- Feeding
  food_type            text,
  feeding_schedule     text,
  feeding_notes        text,
  treats_allowed       boolean not null default true,

  -- Behaviour
  is_crate_trained     boolean,
  has_anxiety          boolean not null default false,
  has_bitten           boolean not null default false,
  is_reactive          boolean not null default false,
  is_escape_risk       boolean not null default false,
  guards_resources     boolean not null default false,
  requires_muzzle      boolean not null default false,
  behavior_notes       text,

  -- Compatibility
  good_with_dogs       boolean,
  good_with_cats       boolean,
  good_with_kids       boolean,
  good_with_strangers  boolean,

  special_needs        text,

  -- Owner-only notes. Sitters gain read access only through a confirmed
  -- booking; that policy ships with the bookings migration.
  private_notes        text,

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists pets_owner_id_idx on public.pets (owner_id);

drop trigger if exists pets_set_updated_at on public.pets;
create trigger pets_set_updated_at
  before update on public.pets
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- sitter_profiles — the public-facing Havener record.
-- Only rows with status = 'approved' are readable by other users (see 0002).
-- ---------------------------------------------------------------------------
create table if not exists public.sitter_profiles (
  id                      uuid primary key references public.profiles (id) on delete cascade,

  headline                text,
  bio                     text,
  routine_description     text,      -- "what a day of care looks like with me"
  years_experience        int,

  -- Where they operate. City/state are public; the street address stays on
  -- profiles and is revealed only after a booking is confirmed.
  service_city            text,
  service_state           text,
  service_postal_code     text,
  service_radius_miles    int not null default 10,
  latitude                double precision,
  longitude               double precision,
  provides_transport      boolean not null default false,

  -- Home details (shown for boarding / daycare)
  home_type               public.home_type,
  has_yard                boolean not null default false,
  yard_is_fenced          boolean not null default false,
  has_kids_at_home        boolean not null default false,
  has_own_pets            boolean not null default false,
  own_pets_description    text,
  works_outside_home      boolean not null default false,
  provides_daily_exercise boolean not null default true,
  has_stairs              boolean not null default false,
  max_pets_per_day        int not null default 2,

  -- What they accept
  accepts_dogs            boolean not null default true,
  accepts_cats            boolean not null default false,
  accepted_sizes          public.pet_size[] not null default '{small,medium}',
  accepts_puppies         boolean not null default false,
  accepts_seniors         boolean not null default true,
  accepted_energy_levels  public.energy_level[] not null default '{low,moderate}',
  accepts_unfixed         boolean not null default false,
  accepts_in_heat         boolean not null default false,
  comfortable_with_meds   boolean not null default false,
  comfortable_with_anxiety boolean not null default false,
  comfortable_with_reactive boolean not null default false,

  cancellation_policy     text not null default 'moderate', -- flexible|moderate|strict

  -- Lifecycle + trust signals (all set by staff, never by the sitter)
  status                  public.sitter_status not null default 'draft',
  submitted_at            timestamptz,
  approved_at             timestamptz,
  rejection_reason        text,
  background_check_status public.check_status not null default 'not_started',
  interview_status        public.check_status not null default 'not_started',
  home_check_status       public.check_status not null default 'not_started',
  insurance_status        public.check_status not null default 'not_started',

  -- Denormalised stats, refreshed by the app / jobs
  rating                  numeric(3,2),
  review_count            int not null default 0,
  completed_bookings      int not null default 0,
  response_time_minutes   int,
  -- "Calendar updated 2 days ago" badge on the profile
  calendar_updated_at     timestamptz,

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists sitter_profiles_status_idx
  on public.sitter_profiles (status);
create index if not exists sitter_profiles_location_idx
  on public.sitter_profiles (service_state, service_city);

drop trigger if exists sitter_profiles_set_updated_at on public.sitter_profiles;
create trigger sitter_profiles_set_updated_at
  before update on public.sitter_profiles
  for each row execute function public.set_updated_at();

-- A Havener is "Certified" only when all four checks pass.
create or replace function public.is_certified_havener(p_sitter_id uuid)
returns boolean
language sql
stable
as $$
  select coalesce((
    select s.background_check_status = 'approved'
       and s.interview_status        = 'approved'
       and s.home_check_status       = 'approved'
       and s.insurance_status        = 'approved'
    from public.sitter_profiles s
    where s.id = p_sitter_id
  ), false);
$$;

-- ---------------------------------------------------------------------------
-- sitter_services — one row per service the Havener offers, with its rate.
-- ---------------------------------------------------------------------------
create table if not exists public.sitter_services (
  id                        uuid primary key default gen_random_uuid(),
  sitter_id                 uuid not null references public.sitter_profiles (id) on delete cascade,
  service_type              public.service_type not null,
  is_active                 boolean not null default true,

  -- Rates are stored in cents to avoid float drift.
  base_rate_cents           int not null check (base_rate_cents >= 0),
  additional_pet_rate_cents int not null default 0 check (additional_pet_rate_cents >= 0),
  holiday_rate_cents        int,
  puppy_rate_cents          int,

  -- Species accepted for THIS service specifically (a sitter may board dogs
  -- but only do drop-in visits for cats).
  accepts_dogs              boolean not null default true,
  accepts_cats              boolean not null default false,

  duration_minutes          int,   -- walks / drop-ins
  description               text,

  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  unique (sitter_id, service_type)
);

create index if not exists sitter_services_sitter_idx on public.sitter_services (sitter_id);

drop trigger if exists sitter_services_set_updated_at on public.sitter_services;
create trigger sitter_services_set_updated_at
  before update on public.sitter_services
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- sitter_photos — profile gallery + "meet my home" section.
-- ---------------------------------------------------------------------------
create table if not exists public.sitter_photos (
  id          uuid primary key default gen_random_uuid(),
  sitter_id   uuid not null references public.sitter_profiles (id) on delete cascade,
  storage_path text not null,
  category    text not null default 'profile' check (category in ('profile', 'home')),
  caption     text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists sitter_photos_sitter_idx on public.sitter_photos (sitter_id, category, sort_order);

-- ---------------------------------------------------------------------------
-- sitter_availability — day-level overrides. Absent row = available.
-- ---------------------------------------------------------------------------
create table if not exists public.sitter_availability (
  sitter_id  uuid not null references public.sitter_profiles (id) on delete cascade,
  date       date not null,
  is_available boolean not null default false,
  note       text,
  primary key (sitter_id, date)
);

-- ---------------------------------------------------------------------------
-- sitter_insurance — private. Owners only ever see the "Insured" badge.
-- ---------------------------------------------------------------------------
create table if not exists public.sitter_insurance (
  sitter_id      uuid primary key references public.sitter_profiles (id) on delete cascade,
  provider       text,
  policy_number  text,
  coverage_type  text,
  effective_date date,
  expires_at     date,
  document_path  text,
  status         public.check_status not null default 'not_started',
  reviewed_by    uuid references public.profiles (id),
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

drop trigger if exists sitter_insurance_set_updated_at on public.sitter_insurance;
create trigger sitter_insurance_set_updated_at
  before update on public.sitter_insurance
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- sitter_badges — awarded by staff or by automatic rules.
-- ---------------------------------------------------------------------------
create table if not exists public.sitter_badges (
  sitter_id  uuid not null references public.sitter_profiles (id) on delete cascade,
  badge      public.badge_type not null,
  awarded_at timestamptz not null default now(),
  awarded_by uuid references public.profiles (id),
  primary key (sitter_id, badge)
);

-- ---------------------------------------------------------------------------
-- favorites / rebook list
-- ---------------------------------------------------------------------------
create table if not exists public.favorites (
  owner_id   uuid not null references public.profiles (id) on delete cascade,
  sitter_id  uuid not null references public.sitter_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner_id, sitter_id)
);

-- ---------------------------------------------------------------------------
-- waitlist — landing page email capture (pre-launch).
-- ---------------------------------------------------------------------------
create table if not exists public.waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      citext not null unique,
  role       text check (role in ('owner', 'havener', 'both')),
  zip_code   text,
  source     text,
  created_at timestamptz not null default now()
);
