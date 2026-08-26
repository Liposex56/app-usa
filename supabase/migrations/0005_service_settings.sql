-- ============================================================================
-- Havenr — 0005_service_settings.sql
-- Avance: configuración por servicio (Boarding, House Sitting, Drop-In
-- Visits, Doggy Daycare, Dog Walking), a partir de las referencias en
-- "cambios en imagen".
--
-- Dos tipos de campo, igual que en la referencia (nota "* Shared
-- preferences" en cada pantalla):
--   1. Por servicio (en sitter_services): activo, en pausa, acepta clientes
--      nuevos, tarifas adicionales, política de cancelación. Cada servicio
--      del Havener tiene los suyos.
--   2. Compartidos (en sitter_profiles): disponibilidad semanal, frecuencia
--      de salidas al baño, reglas de la casa, a quién puede hospedar. Se
--      editan una sola vez y aplican a todos los servicios — la mayoría de
--      estos campos ya existían (home_type, has_yard, accepts_puppies,
--      accepted_sizes, etc.); esta migración solo agrega lo que faltaba.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- sitter_services — nuevas columnas por servicio.
-- ---------------------------------------------------------------------------
alter table public.sitter_services
  add column if not exists is_paused boolean not null default false,
  add column if not exists accepts_new_customers boolean not null default true,
  add column if not exists extended_stay_rate_cents int,
  add column if not exists bathing_rate_cents int,
  add column if not exists pickup_dropoff_rate_cents int,
  add column if not exists cancellation_policy text not null default 'three_day'
    check (cancellation_policy in ('same_day', 'one_day', 'three_day', 'seven_day'));

comment on column public.sitter_services.is_paused is
  'El Havener se marcó "Away" para este servicio — sigue activo pero no recibe solicitudes nuevas por ahora.';

-- ---------------------------------------------------------------------------
-- sitter_profiles — columnas compartidas entre servicios que faltaban.
-- ---------------------------------------------------------------------------
alter table public.sitter_profiles
  add column if not exists home_full_time boolean not null default true,
  add column if not exists available_days text[] not null default
    '{sun,mon,tue,wed,thu,fri,sat}',
  add column if not exists potty_break_frequency text
    check (potty_break_frequency in ('0-2h', '2-4h', '4-8h', '8+h')),
  add column if not exists advance_notice_days int not null default 0
    check (advance_notice_days >= 0),
  add column if not exists accepts_extended_stays boolean not null default true,
  add column if not exists allows_smoking boolean not null default false,
  add column if not exists dogs_on_furniture boolean not null default false,
  add column if not exists dogs_on_bed boolean not null default false,
  add column if not exists hosts_multiple_families boolean not null default true,
  add column if not exists accepts_not_crate_trained boolean not null default true;
