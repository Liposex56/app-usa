-- ============================================================================
-- Havenr — 0002_rls.sql
-- Row Level Security.
--
-- Design rules (from the proposal, section 16):
--   1. `profiles` holds PII and is NEVER readable by another user. A Havener
--      must not be able to see an owner's full name, phone, address or
--      payment data. Public identity travels through `public_sitters`.
--   2. Sitter profiles are readable by anyone only once status = 'approved'.
--   3. Verification documents and insurance are staff-only.
--   4. Staff access always goes through is_staff() / is_admin(), which are
--      SECURITY DEFINER so they don't recurse into their own policies.
--
-- Every table below has RLS enabled with NO permissive default: if there is
-- no policy for an action, that action is denied.
-- ============================================================================

alter table public.profiles            enable row level security;
alter table public.staff_members       enable row level security;
alter table public.pets                enable row level security;
alter table public.sitter_profiles     enable row level security;
alter table public.sitter_services     enable row level security;
alter table public.sitter_photos       enable row level security;
alter table public.sitter_availability enable row level security;
alter table public.sitter_insurance    enable row level security;
alter table public.sitter_badges       enable row level security;
alter table public.favorites           enable row level security;
alter table public.waitlist            enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles: staff read all" on public.profiles;
create policy "profiles: staff read all"
  on public.profiles for select
  using (public.is_staff());

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles: staff update" on public.profiles;
create policy "profiles: staff update"
  on public.profiles for update
  using (public.is_staff())
  with check (public.is_staff());

-- Insert is normally done by the handle_new_user() trigger, but allow a user
-- to self-heal a missing row.
drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- staff_members — readable by staff, writable by admins only.
-- ---------------------------------------------------------------------------
drop policy if exists "staff: read" on public.staff_members;
create policy "staff: read"
  on public.staff_members for select
  using (public.is_staff());

drop policy if exists "staff: admin writes" on public.staff_members;
create policy "staff: admin writes"
  on public.staff_members for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- pets — owner-only. Sitter access arrives with the bookings migration:
--        a Havener will read a pet only while a confirmed booking exists.
-- ---------------------------------------------------------------------------
drop policy if exists "pets: owner all" on public.pets;
create policy "pets: owner all"
  on public.pets for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "pets: staff read" on public.pets;
create policy "pets: staff read"
  on public.pets for select
  using (public.is_staff());

-- ---------------------------------------------------------------------------
-- sitter_profiles
-- ---------------------------------------------------------------------------
drop policy if exists "sitters: public reads approved" on public.sitter_profiles;
create policy "sitters: public reads approved"
  on public.sitter_profiles for select
  using (status = 'approved');

drop policy if exists "sitters: read own" on public.sitter_profiles;
create policy "sitters: read own"
  on public.sitter_profiles for select
  using (auth.uid() = id);

drop policy if exists "sitters: staff read" on public.sitter_profiles;
create policy "sitters: staff read"
  on public.sitter_profiles for select
  using (public.is_staff());

drop policy if exists "sitters: insert own" on public.sitter_profiles;
create policy "sitters: insert own"
  on public.sitter_profiles for insert
  with check (auth.uid() = id);

-- A sitter may edit their own row, but must not promote themselves. The
-- trigger below reverts any self-service change to the trust columns.
drop policy if exists "sitters: update own" on public.sitter_profiles;
create policy "sitters: update own"
  on public.sitter_profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "sitters: staff update" on public.sitter_profiles;
create policy "sitters: staff update"
  on public.sitter_profiles for update
  using (public.is_staff())
  with check (public.is_staff());

-- Guard the trust columns. Approval, background checks, insurance state and
-- public stats are staff-owned no matter what the client sends.
create or replace function public.protect_sitter_trust_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_staff() then
    return new;
  end if;

  -- A sitter may move draft -> pending_review (submit for review). Any other
  -- transition is reverted to whatever the row already had.
  if not (old.status = 'draft' and new.status = 'pending_review') then
    new.status := old.status;
  end if;

  new.background_check_status := old.background_check_status;
  new.interview_status        := old.interview_status;
  new.home_check_status       := old.home_check_status;
  new.insurance_status        := old.insurance_status;
  new.approved_at             := old.approved_at;
  new.rejection_reason        := old.rejection_reason;
  new.rating                  := old.rating;
  new.review_count            := old.review_count;
  new.completed_bookings      := old.completed_bookings;
  new.response_time_minutes   := old.response_time_minutes;

  return new;
end;
$$;

drop trigger if exists sitter_profiles_protect_trust on public.sitter_profiles;
create trigger sitter_profiles_protect_trust
  before update on public.sitter_profiles
  for each row execute function public.protect_sitter_trust_columns();

-- ---------------------------------------------------------------------------
-- sitter_services / photos / availability — public read only for approved
-- sitters; full control for the sitter themselves.
-- ---------------------------------------------------------------------------
create or replace function public.sitter_is_approved(p_sitter_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.sitter_profiles s
    where s.id = p_sitter_id and s.status = 'approved'
  );
$$;

drop policy if exists "services: public reads approved" on public.sitter_services;
create policy "services: public reads approved"
  on public.sitter_services for select
  using (is_active and public.sitter_is_approved(sitter_id));

drop policy if exists "services: sitter all" on public.sitter_services;
create policy "services: sitter all"
  on public.sitter_services for all
  using (auth.uid() = sitter_id)
  with check (auth.uid() = sitter_id);

drop policy if exists "services: staff read" on public.sitter_services;
create policy "services: staff read"
  on public.sitter_services for select
  using (public.is_staff());

drop policy if exists "photos: public reads approved" on public.sitter_photos;
create policy "photos: public reads approved"
  on public.sitter_photos for select
  using (public.sitter_is_approved(sitter_id));

drop policy if exists "photos: sitter all" on public.sitter_photos;
create policy "photos: sitter all"
  on public.sitter_photos for all
  using (auth.uid() = sitter_id)
  with check (auth.uid() = sitter_id);

drop policy if exists "availability: public reads approved" on public.sitter_availability;
create policy "availability: public reads approved"
  on public.sitter_availability for select
  using (public.sitter_is_approved(sitter_id));

drop policy if exists "availability: sitter all" on public.sitter_availability;
create policy "availability: sitter all"
  on public.sitter_availability for all
  using (auth.uid() = sitter_id)
  with check (auth.uid() = sitter_id);

-- ---------------------------------------------------------------------------
-- sitter_insurance — the sitter writes it, staff reviews it, owners never see
-- it. Owners only ever get the "Insured" badge.
-- ---------------------------------------------------------------------------
drop policy if exists "insurance: sitter own" on public.sitter_insurance;
create policy "insurance: sitter own"
  on public.sitter_insurance for all
  using (auth.uid() = sitter_id)
  with check (auth.uid() = sitter_id);

drop policy if exists "insurance: staff all" on public.sitter_insurance;
create policy "insurance: staff all"
  on public.sitter_insurance for all
  using (public.is_staff())
  with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- sitter_badges — world-readable for approved sitters, staff-writable.
-- ---------------------------------------------------------------------------
drop policy if exists "badges: public reads approved" on public.sitter_badges;
create policy "badges: public reads approved"
  on public.sitter_badges for select
  using (public.sitter_is_approved(sitter_id) or auth.uid() = sitter_id);

drop policy if exists "badges: staff writes" on public.sitter_badges;
create policy "badges: staff writes"
  on public.sitter_badges for all
  using (public.is_staff())
  with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- favorites
-- ---------------------------------------------------------------------------
drop policy if exists "favorites: owner all" on public.favorites;
create policy "favorites: owner all"
  on public.favorites for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- ---------------------------------------------------------------------------
-- waitlist — anonymous visitors may insert, nobody may read back.
-- ---------------------------------------------------------------------------
drop policy if exists "waitlist: anyone inserts" on public.waitlist;
create policy "waitlist: anyone inserts"
  on public.waitlist for insert
  to anon, authenticated
  with check (true);

drop policy if exists "waitlist: staff reads" on public.waitlist;
create policy "waitlist: staff reads"
  on public.waitlist for select
  using (public.is_staff());

-- ---------------------------------------------------------------------------
-- public_sitters — the ONLY place another user reads a Havener's identity.
-- Exposes display name and avatar, never legal name, phone or street address.
--
-- This view is intentionally SECURITY DEFINER (security_invoker = off, the
-- Postgres default). `profiles` is self-read-only, so an invoker-rights view
-- would return zero rows to everyone but the sitter themselves. The view is
-- the privacy boundary: it hand-picks the public columns and filters to
-- status = 'approved'. Supabase's linter flags this as
-- `security_definer_view` — that warning is expected and accepted here.
-- Never add a PII column (legal name, phone, street address) to this list.
-- ---------------------------------------------------------------------------
drop view if exists public.public_sitters;
create view public.public_sitters as
select
  s.id,
  p.display_name,
  p.avatar_url,
  s.headline,
  s.bio,
  s.routine_description,
  s.years_experience,
  s.service_city,
  s.service_state,
  s.service_postal_code,
  s.service_radius_miles,
  s.latitude,
  s.longitude,
  s.provides_transport,
  s.home_type,
  s.has_yard,
  s.yard_is_fenced,
  s.has_kids_at_home,
  s.has_own_pets,
  s.own_pets_description,
  s.works_outside_home,
  s.provides_daily_exercise,
  s.max_pets_per_day,
  s.accepts_dogs,
  s.accepts_cats,
  s.accepted_sizes,
  s.accepts_puppies,
  s.accepts_seniors,
  s.accepted_energy_levels,
  s.comfortable_with_meds,
  s.comfortable_with_anxiety,
  s.comfortable_with_reactive,
  s.cancellation_policy,
  s.rating,
  s.review_count,
  s.completed_bookings,
  s.response_time_minutes,
  s.calendar_updated_at,
  public.is_certified_havener(s.id) as is_certified,
  (s.insurance_status = 'approved')        as is_insured,
  (s.background_check_status = 'approved') as background_checked
from public.sitter_profiles s
join public.profiles p on p.id = s.id
where s.status = 'approved';

grant select on public.public_sitters to anon, authenticated;
