-- ============================================================================
-- Havenr — 0019_public_sitters_coarse_location.sql
--
-- public_sitters is readable by anyone (anon included) and used to hand out
-- each Havener's exact latitude/longitude — the geocode of their home. With a
-- map in the search that would show where people live, and the street address
-- is meant to stay private until a booking is confirmed.
--
-- The view now exposes the location rounded to two decimals (about 0.7 miles):
-- enough for "how far is this Havener" and for an approximate pin, not enough
-- to find a house. The exact value stays in sitter_profiles, which only the
-- Havener, their bookings' owner and staff can read.
--
-- Same columns, same order, same types: create or replace is enough.
-- ============================================================================

create or replace view public.public_sitters as
select
  s.id,
  p.display_name,
  p.avatar_url,
  s.headline,
  s.bio,
  s.routine_description,
  s.schedule_description,
  s.home_environment_description,
  s.pet_care_notes,
  s.skills,
  s.cat_bio,
  s.cat_years_experience,
  s.years_experience,
  s.service_city,
  s.service_state,
  s.service_postal_code,
  s.service_radius_miles,
  round(s.latitude::numeric, 2)::double precision  as latitude,
  round(s.longitude::numeric, 2)::double precision as longitude,
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
  s.allows_smoking,
  s.dogs_on_furniture,
  s.dogs_on_bed,
  s.hosts_multiple_families,
  s.accepts_not_crate_trained,
  s.accepts_unfixed,
  s.accepts_in_heat,
  s.potty_break_frequency,
  s.available_days,
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
