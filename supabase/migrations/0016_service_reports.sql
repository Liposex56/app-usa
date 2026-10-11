-- ============================================================================
-- Havenr — 0016_service_reports.sql
-- Service reports: the evidence a Havener leaves while a service is in
-- progress — photos/videos, one-tap log entries (potty break, fed, water,
-- play, medication, wellbeing check…) and notes. The owner reads them as a
-- live timeline and as the final report; a service can't be marked completed
-- until its requirements are met (enforced in the app, see
-- lib/service-reports.ts).
-- ============================================================================

create table if not exists public.service_updates (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references public.bookings (id) on delete cascade,
  author_id   uuid not null references public.profiles (id) on delete cascade,
  kind        text not null check (kind in (
                'photo', 'note', 'potty', 'feeding', 'water',
                'play', 'medication', 'litter', 'wellbeing'
              )),
  body        text,
  -- Storage path inside the private `service-updates` bucket
  -- (<sitter-uuid>/<booking-uuid>/<file>); null for entries without media.
  media_path  text,
  media_type  text check (media_type in ('image', 'video')),
  created_at  timestamptz not null default now()
);

create index if not exists service_updates_booking_idx
  on public.service_updates (booking_id, created_at);

alter table public.service_updates enable row level security;

-- Owner, Havener and staff read the timeline.
drop policy if exists "service_updates: participants read" on public.service_updates;
create policy "service_updates: participants read"
  on public.service_updates for select
  using (exists (
    select 1 from public.bookings b
    where b.id = booking_id
      and (auth.uid() = b.owner_id or auth.uid() = b.sitter_id or public.is_staff())
  ));

-- Only the Havener on that booking writes entries, and only while the
-- service is actually happening.
drop policy if exists "service_updates: sitter logs during service" on public.service_updates;
create policy "service_updates: sitter logs during service"
  on public.service_updates for insert
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and b.sitter_id = auth.uid()
        and b.status = 'in_progress'
    )
  );

-- A wrong tap can be taken back — but only by its author, only while the
-- service is still in progress.
drop policy if exists "service_updates: author removes during service" on public.service_updates;
create policy "service_updates: author removes during service"
  on public.service_updates for delete
  using (
    author_id = auth.uid()
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id and b.status = 'in_progress'
    )
  );

-- ---------------------------------------------------------------------------
-- Private bucket for the photos and videos. Path: <sitter>/<booking>/<file>
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'service-updates', 'service-updates', false, 52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do nothing;

drop policy if exists "service updates: participants read" on storage.objects;
create policy "service updates: participants read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'service-updates'
    and exists (
      select 1 from public.bookings b
      where b.id::text = (storage.foldername(name))[2]
        and (b.owner_id = auth.uid() or b.sitter_id = auth.uid() or public.is_staff())
    )
  );

drop policy if exists "service updates: sitter writes during service" on storage.objects;
create policy "service updates: sitter writes during service"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'service-updates'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.bookings b
      where b.id::text = (storage.foldername(name))[2]
        and b.sitter_id = auth.uid()
        and b.status = 'in_progress'
    )
  );

drop policy if exists "service updates: sitter removes own" on storage.objects;
create policy "service updates: sitter removes own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'service-updates'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
