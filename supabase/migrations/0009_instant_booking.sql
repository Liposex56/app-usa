-- ============================================================================
-- Havenr — 0009_instant_booking.sql
-- Switches booking creation from "request → Havener accepts/declines" to
-- instant confirmation: the owner can only ever request dates a Havener has
-- no conflicting confirmed/in_progress booking for (enforced in app code,
-- see requestBookingAction), so the request is created straight at
-- `confirmed` instead of `requested`. No manual accept step remains.
-- ============================================================================

drop policy if exists "bookings: owner creates" on public.bookings;
create policy "bookings: owner creates"
  on public.bookings for insert
  with check (auth.uid() = owner_id and status in ('requested', 'confirmed'));

-- ---------------------------------------------------------------------------
-- meet_greets — either side can propose a meet & greet time inside a
-- booking's chat; the other side accepts or declines it. Modeled separately
-- from `messages` so the chat UI can render it as a structured card instead
-- of plain text.
-- ---------------------------------------------------------------------------
do $$ begin create type public.meet_greet_status as enum (
  'proposed', 'accepted', 'declined', 'cancelled');
exception when duplicate_object then null; end $$;

create table if not exists public.meet_greets (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid not null references public.bookings (id) on delete cascade,
  proposed_by   uuid not null references public.profiles (id),
  starts_at     timestamptz not null,
  location_note text,
  status        public.meet_greet_status not null default 'proposed',
  responded_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists meet_greets_booking_idx on public.meet_greets (booking_id, created_at);

drop trigger if exists meet_greets_set_updated_at on public.meet_greets;
create trigger meet_greets_set_updated_at
  before update on public.meet_greets
  for each row execute function public.set_updated_at();

alter table public.meet_greets enable row level security;

drop policy if exists "meet_greets: participants read" on public.meet_greets;
create policy "meet_greets: participants read"
  on public.meet_greets for select
  using (exists (
    select 1 from public.bookings b
    where b.id = booking_id
      and (auth.uid() = b.owner_id or auth.uid() = b.sitter_id or public.is_staff())
  ));

drop policy if exists "meet_greets: participants propose" on public.meet_greets;
create policy "meet_greets: participants propose"
  on public.meet_greets for insert
  with check (
    auth.uid() = proposed_by
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and (auth.uid() = b.owner_id or auth.uid() = b.sitter_id)
    )
  );

-- Only the party who did NOT propose it may accept/decline; only the
-- proposer may cancel their own still-pending proposal.
drop policy if exists "meet_greets: counterparty responds" on public.meet_greets;
create policy "meet_greets: counterparty responds"
  on public.meet_greets for update
  using (exists (
    select 1 from public.bookings b
    where b.id = booking_id
      and (auth.uid() = b.owner_id or auth.uid() = b.sitter_id)
  ))
  with check (
    status = 'proposed' -- immutable once responded to; supersede with a new row instead
    or (auth.uid() = proposed_by and status = 'cancelled')
    or (auth.uid() <> proposed_by and status in ('accepted', 'declined'))
  );

do $$ begin
  alter publication supabase_realtime add table public.meet_greets;
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Call-through preference (§ "Connect through Havenr"): the window during
-- which the counterparty may call the owner's/sitter's masked Havenr number.
-- The masked number itself needs a telephony provider (e.g. Twilio) account
-- that does not exist yet — this column just records the preference so the
-- UI and the eventual provider wiring have something to read from day one.
-- ---------------------------------------------------------------------------
alter table public.bookings
  add column if not exists call_window text;

-- ---------------------------------------------------------------------------
-- public_sitter_reviews() — the Havener public profile's Reviews tab needs
-- to show *something* about who left each review, but `profiles` is never
-- publicly readable (see 0002_rls.sql). This is the same narrow pattern as
-- booking_counterparty(): a security-definer function that hands back only
-- a first name and avatar, and only for reviews that are already published
-- (both sides submitted — see publish_paired_reviews() in 0008).
-- ---------------------------------------------------------------------------
create or replace function public.public_sitter_reviews(p_sitter_id uuid)
returns table (
  id uuid,
  rating smallint,
  punctuality smallint,
  communication smallint,
  pet_care smallint,
  body text,
  created_at timestamptz,
  reviewer_first_name text,
  reviewer_avatar_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.id,
    r.rating,
    r.punctuality,
    r.communication,
    r.pet_care,
    r.body,
    r.created_at,
    split_part(coalesce(p.display_name, 'A Havenr owner'), ' ', 1),
    p.avatar_url
  from public.reviews r
  join public.profiles p on p.id = r.reviewer_id
  where r.reviewee_id = p_sitter_id
    and r.published_at is not null
  order by r.created_at desc;
$$;

grant execute on function public.public_sitter_reviews(uuid) to anon, authenticated;
