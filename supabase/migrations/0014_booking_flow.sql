-- ============================================================================
-- Havenr — 0014_booking_flow.sql
-- A booking is only `confirmed` once BOTH the owner and the Havener have
-- clicked "Book". Until then it stays `requested` and shows as "pending" once
-- one side has booked. Also adds per-person Archive, Report, and the
-- schedule details (drop-off / pick-up windows, transport) as real columns so
-- a request can be modified later.
--
-- Run once in the Supabase SQL editor.
-- ============================================================================

alter table public.bookings
  add column if not exists owner_booked_at timestamptz,
  add column if not exists sitter_booked_at timestamptz,
  add column if not exists archived_by_owner boolean not null default false,
  add column if not exists archived_by_sitter boolean not null default false,
  add column if not exists dropoff_from time,
  add column if not exists dropoff_to time,
  add column if not exists pickup_from time,
  add column if not exists pickup_to time,
  add column if not exists wants_pickup_dropoff boolean not null default false;

-- ---------------------------------------------------------------------------
-- Reports: either side of a booking can flag the conversation to staff.
-- ---------------------------------------------------------------------------
create table if not exists public.booking_reports (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references public.bookings (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id),
  reason      text not null check (char_length(reason) between 3 and 2000),
  created_at  timestamptz not null default now()
);

create index if not exists booking_reports_created_idx on public.booking_reports (created_at desc);

alter table public.booking_reports enable row level security;

drop policy if exists "booking_reports: participants report" on public.booking_reports;
create policy "booking_reports: participants report"
  on public.booking_reports for insert
  with check (
    auth.uid() = reporter_id
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and (b.owner_id = auth.uid() or b.sitter_id = auth.uid())
    )
  );

drop policy if exists "booking_reports: reporter and staff read" on public.booking_reports;
create policy "booking_reports: reporter and staff read"
  on public.booking_reports for select
  using (auth.uid() = reporter_id or public.is_staff());

-- ---------------------------------------------------------------------------
-- Transition guard. Replaces the one from 0008:
--  * a Havener no longer confirms alone — `requested -> confirmed` needs both
--    "booked" stamps, and each side can only stamp (and archive) for itself;
--  * the schedule columns join the money columns as "changed only through a
--    trusted function" (see modify_booking_request below);
--  * writes with no signed-in user (the Stripe webhook, SQL editor) and
--    staff pass straight through.
-- ---------------------------------------------------------------------------
create or replace function public.protect_booking_transitions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_staff() then
    return new;
  end if;

  if coalesce(current_setting('havenr.trusted_write', true), '') = 'on' then
    return new;
  end if;

  new.base_rate_cents           := old.base_rate_cents;
  new.additional_pet_rate_cents := old.additional_pet_rate_cents;
  new.extra_fees_cents          := old.extra_fees_cents;
  new.commission_percent        := old.commission_percent;
  new.platform_fee_cents        := old.platform_fee_cents;
  new.sitter_payout_cents       := old.sitter_payout_cents;
  new.total_cents               := old.total_cents;
  new.paid_out_at               := old.paid_out_at;

  new.start_date            := old.start_date;
  new.end_date              := old.end_date;
  new.dropoff_from          := old.dropoff_from;
  new.dropoff_to            := old.dropoff_to;
  new.pickup_from           := old.pickup_from;
  new.pickup_to             := old.pickup_to;
  new.wants_pickup_dropoff  := old.wants_pickup_dropoff;

  if auth.uid() = old.owner_id then
    new.sitter_booked_at   := old.sitter_booked_at;
    new.archived_by_sitter := old.archived_by_sitter;
  elsif auth.uid() = old.sitter_id then
    new.owner_booked_at   := old.owner_booked_at;
    new.archived_by_owner := old.archived_by_owner;
  end if;

  -- The "booked" stamps only mean something while the request is still open.
  if old.status <> 'requested' then
    new.owner_booked_at  := old.owner_booked_at;
    new.sitter_booked_at := old.sitter_booked_at;
  end if;

  if new.status is distinct from old.status then
    if old.status = 'requested'
       and new.status = 'confirmed'
       and auth.uid() in (old.owner_id, old.sitter_id)
       and new.owner_booked_at is not null
       and new.sitter_booked_at is not null then
      new.confirmed_at := now();
    elsif auth.uid() = old.sitter_id
       and old.status = 'requested'
       and new.status = 'declined' then
      null;
    elsif auth.uid() = old.sitter_id
       and old.status = 'confirmed'
       and new.status = 'in_progress' then
      new.started_at := now();
    elsif auth.uid() = old.sitter_id
       and old.status = 'in_progress'
       and new.status = 'completed' then
      new.completed_at := now();
    elsif auth.uid() in (old.owner_id, old.sitter_id)
       and old.status in ('requested', 'confirmed')
       and new.status = 'cancelled' then
      new.cancelled_at := now();
      new.cancelled_by := auth.uid();
    else
      new.status := old.status;
    end if;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Modify an open request. Either side can change the dates, windows and
-- transport; the price is recomputed here from the Havener's published rates
-- (same rule as lib/pricing.ts: nightly services bill per night, daycare per
-- day, walks and visits once) so nobody can edit their own total. Changing a
-- request clears both "booked" stamps — both sides have to book again.
-- ---------------------------------------------------------------------------
create or replace function public.modify_booking_request(
  p_booking_id    uuid,
  p_start         date,
  p_end           date,
  p_dropoff_from  time,
  p_dropoff_to    time,
  p_pickup_from   time,
  p_pickup_to     time,
  p_wants_pickup  boolean,
  p_notes         text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  b        public.bookings;
  s        public.sitter_services;
  gap      int;
  qty      int;
  pets     int;
  base     int;
  extra    int;
  total    int;
  fee      int;
begin
  select * into b from public.bookings where id = p_booking_id;
  if not found or auth.uid() is null or auth.uid() not in (b.owner_id, b.sitter_id) then
    raise exception 'Not allowed';
  end if;
  if b.status <> 'requested' then
    raise exception 'Only an open request can be modified';
  end if;
  if p_end is not null and p_end < p_start then
    raise exception 'The end date can''t be before the start date';
  end if;

  select * into s
  from public.sitter_services
  where sitter_id = b.sitter_id and service_type = b.service_type;
  if not found then
    raise exception 'This Havener no longer offers that service';
  end if;

  gap := greatest(0, coalesce(p_end, p_start) - p_start);
  qty := case b.service_type
    when 'boarding'      then greatest(1, gap)
    when 'house_sitting' then greatest(1, gap)
    when 'daycare'       then gap + 1
    else 1
  end;

  select count(*) into pets from public.booking_pets where booking_id = b.id;

  base  := s.base_rate_cents * qty;
  extra := greatest(0, pets - 1) * s.additional_pet_rate_cents * qty
           + case when p_wants_pickup then coalesce(s.pickup_dropoff_rate_cents, 0) else 0 end;
  total := base + extra;
  fee   := round(total * b.commission_percent / 100.0);

  perform set_config('havenr.trusted_write', 'on', true);

  update public.bookings
  set start_date           = p_start,
      end_date             = p_end,
      dropoff_from         = p_dropoff_from,
      dropoff_to           = p_dropoff_to,
      pickup_from          = p_pickup_from,
      pickup_to            = p_pickup_to,
      wants_pickup_dropoff = p_wants_pickup,
      owner_notes          = p_notes,
      extra_fees_cents     = extra,
      total_cents          = total,
      platform_fee_cents   = fee,
      sitter_payout_cents  = total - fee,
      owner_booked_at      = null,
      sitter_booked_at     = null
  where id = b.id;

  perform set_config('havenr.trusted_write', 'off', true);
end;
$$;

grant execute on function public.modify_booking_request(
  uuid, date, date, time, time, time, time, boolean, text
) to authenticated;
