-- ============================================================================
-- Havenr — 0012_walk_tracking.sql
-- Live GPS map for dog walks (service description already promises
-- "Live GPS map of the route" — lib/services.ts). No mapping vendor account
-- needed: the app renders this with Leaflet + OpenStreetMap tiles, which
-- are free and keyless, so this works today with no further setup.
-- ============================================================================

create table if not exists public.walk_locations (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  latitude   double precision not null,
  longitude  double precision not null,
  recorded_at timestamptz not null default now()
);

create index if not exists walk_locations_booking_idx
  on public.walk_locations (booking_id, recorded_at);

alter table public.walk_locations enable row level security;

drop policy if exists "walk_locations: participants read" on public.walk_locations;
create policy "walk_locations: participants read"
  on public.walk_locations for select
  using (exists (
    select 1 from public.bookings b
    where b.id = booking_id
      and (auth.uid() = b.owner_id or auth.uid() = b.sitter_id or public.is_staff())
  ));

-- Only the Havener on that exact booking logs points, and only while the
-- walk is actually happening.
drop policy if exists "walk_locations: sitter logs during walk" on public.walk_locations;
create policy "walk_locations: sitter logs during walk"
  on public.walk_locations for insert
  with check (exists (
    select 1 from public.bookings b
    where b.id = booking_id
      and b.sitter_id = auth.uid()
      and b.service_type = 'dog_walking'
      and b.status = 'in_progress'
  ));

do $$ begin
  alter publication supabase_realtime add table public.walk_locations;
exception when duplicate_object then null; end $$;
