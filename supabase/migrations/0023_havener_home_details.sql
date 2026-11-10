-- ============================================================================
-- Havenr — 0023_havener_home_details.sql
--
-- From Jessica's list (Nov 10, 2026) on the Havener sign-up form:
--  * children at home split by age (0-5, 6-12); dogs, cats and caged pets in
--    the home as separate answers;
--  * "unspayed or unneutered" split into unneutered male dogs and unspayed
--    female dogs.
-- The older combined columns (has_kids_at_home, has_own_pets, accepts_unfixed)
-- stay and are kept in step by the app, so search filters keep working.
--
-- Apply after 0022. Idempotent.
-- ============================================================================

alter table public.sitter_profiles
  add column if not exists has_kids_0_5 boolean not null default false,
  add column if not exists has_kids_6_12 boolean not null default false,
  add column if not exists has_dogs_at_home boolean not null default false,
  add column if not exists has_cats_at_home boolean not null default false,
  add column if not exists has_caged_pets boolean not null default false,
  add column if not exists accepts_unneutered_males boolean not null default false,
  add column if not exists accepts_unspayed_females boolean not null default false;

-- Carry over what Haveners had already answered with the combined questions.
update public.sitter_profiles
   set accepts_unneutered_males = true,
       accepts_unspayed_females = true
 where accepts_unfixed
   and not accepts_unneutered_males
   and not accepts_unspayed_females;

update public.sitter_profiles
   set has_dogs_at_home = true
 where has_own_pets
   and not has_dogs_at_home and not has_cats_at_home and not has_caged_pets;
