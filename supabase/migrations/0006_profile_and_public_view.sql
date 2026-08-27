-- ============================================================================
-- Havenr — 0006_profile_and_public_view.sql
-- Avance: formulario de perfil del niñero (#6) y vista pública del perfil
-- (#7), a partir de las referencias en "cambios en imagen".
--
-- 1. Nuevas columnas en sitter_profiles: habilidades y las cuatro
--    secciones de "qué esperar" (horario, seguridad del hogar, día típico
--    ya existía como routine_description, y notas importantes) más
--    experiencia con gatos por separado.
-- 2. public_sitters se vuelve a crear para exponer, además de lo que ya
--    tenía, estas columnas nuevas y las reglas del hogar que ya existían
--    en sitter_profiles (0001/0005) pero nunca se habían hecho públicas.
--    Sigue siendo la única frontera de privacidad: nunca agregar aquí
--    nombre legal, teléfono ni dirección.
-- ============================================================================

alter table public.sitter_profiles
  add column if not exists skills text[] not null default '{}',
  add column if not exists schedule_description text,
  add column if not exists home_environment_description text,
  add column if not exists pet_care_notes text,
  add column if not exists cat_bio text,
  add column if not exists cat_years_experience int;

drop view if exists public.public_sitters;
create view public.public_sitters as
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
