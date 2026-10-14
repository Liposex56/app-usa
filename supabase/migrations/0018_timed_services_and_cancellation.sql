-- ============================================================================
-- Havenr — 0018_timed_services_and_cancellation.sql
--
-- 1. Boarding, daycare and house sitting run on the booked times: the service
--    starts by itself at the drop-off time and finishes by itself at the
--    pick-up time (no Start / Complete buttons for them).
-- 2. Cancelling a confirmed booking is a request: it must be inside the
--    Havener's cancellation window (counted from when the booking was made),
--    it can't happen during the service, and Havenr confirms it.
-- 3. Photos and videos can be sent in the chat.
-- 4. Each Havener can set an hourly rate for extra time / late pick-up.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 4. Extra-hour rate
-- ---------------------------------------------------------------------------
alter table public.sitter_services
  add column if not exists extra_hour_rate_cents integer
    check (extra_hour_rate_cents is null or extra_hour_rate_cents >= 0);

-- ---------------------------------------------------------------------------
-- 3. Chat attachments
-- ---------------------------------------------------------------------------
alter table public.messages
  add column if not exists media_path text,
  add column if not exists media_type text
    check (media_type is null or media_type in ('image', 'video'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-media', 'chat-media', false, 52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do nothing;

-- Path: <sender>/<booking>/<file>. Only the two sides of the booking (and
-- staff) read it; only a side of the booking writes into it.
drop policy if exists "chat media: participants read" on storage.objects;
create policy "chat media: participants read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'chat-media'
    and exists (
      select 1 from public.bookings b
      where b.id::text = (storage.foldername(name))[2]
        and (b.owner_id = auth.uid() or b.sitter_id = auth.uid() or public.is_staff())
    )
  );

drop policy if exists "chat media: participants write" on storage.objects;
create policy "chat media: participants write"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'chat-media'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.bookings b
      where b.id::text = (storage.foldername(name))[2]
        and (b.owner_id = auth.uid() or b.sitter_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- 2. Cancellation requests
-- ---------------------------------------------------------------------------
alter table public.bookings
  add column if not exists cancellation_requested_at timestamptz,
  add column if not exists cancellation_requested_by uuid references public.profiles (id),
  add column if not exists cancellation_request_reason text;

-- Replaces the transition guard of 0014. What changes:
--   * a participant can no longer move a *confirmed* booking to cancelled —
--     they file a cancellation request instead, and staff confirm it;
--   * the request is only accepted while the booking is confirmed and inside
--     the Havener's window (same_day / one_day = the day it was booked,
--     three_day = 3 days counting that day, seven_day = 7), in the
--     business's time zone.
create or replace function public.protect_booking_transitions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_policy      text;
  v_days        int;
  v_reserved    date;
  v_last_day    date;
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

  -- Cancellation requests: who asked and when are not the client's to choose.
  if new.cancellation_requested_at is distinct from old.cancellation_requested_at
     and new.cancellation_requested_at is not null then
    if old.status <> 'confirmed' then
      raise exception 'A cancellation can only be requested once the booking is confirmed';
    end if;
    if old.cancellation_requested_at is not null then
      raise exception 'A cancellation has already been requested';
    end if;

    select s.cancellation_policy into v_policy
      from public.sitter_services s
     where s.sitter_id = old.sitter_id and s.service_type = old.service_type;
    v_days := case coalesce(v_policy, 'three_day')
      when 'same_day'  then 1
      when 'one_day'   then 1
      when 'three_day' then 3
      when 'seven_day' then 7
      else 3
    end;
    v_reserved := (coalesce(old.confirmed_at, old.created_at) at time zone 'America/New_York')::date;
    v_last_day := v_reserved + (v_days - 1);
    if (now() at time zone 'America/New_York')::date > v_last_day then
      raise exception 'The cancellation window ended on % (% day policy)', to_char(v_last_day, 'Mon DD'), v_days;
    end if;

    new.cancellation_requested_at := now();
    new.cancellation_requested_by := auth.uid();
  else
    new.cancellation_requested_at     := old.cancellation_requested_at;
    new.cancellation_requested_by     := old.cancellation_requested_by;
    new.cancellation_request_reason   := old.cancellation_request_reason;
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
       and old.status = 'requested'
       and new.status = 'cancelled' then
      -- An unconfirmed request can simply be withdrawn.
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
-- 1. Time-driven start and finish for boarding, daycare and house sitting.
--    drop-off time -> in_progress ; pick-up time -> completed (America/New_York).
--    Without a time: the start of the first day / the end of the last day.
--    Called every few minutes by pg_cron when available, and also by the app
--    whenever a booking or a bookings list is opened, so it never depends on
--    the scheduler alone.
-- ---------------------------------------------------------------------------
create or replace function public.advance_booking_statuses()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_started  int := 0;
  v_finished int := 0;
begin
  -- This is a trusted, time-based write; let it through the transition guard.
  perform set_config('havenr.trusted_write', 'on', true);

  update public.bookings b
     set status = 'in_progress',
         started_at = coalesce(b.started_at, now())
   where b.status = 'confirmed'
     and b.service_type in ('boarding', 'daycare', 'house_sitting')
     and ((b.start_date + coalesce(b.dropoff_from, time '00:00')) at time zone 'America/New_York') <= now();
  get diagnostics v_started = row_count;

  update public.bookings b
     set status = 'completed',
         completed_at = coalesce(b.completed_at, now()),
         started_at = coalesce(b.started_at, now())
   where b.status = 'in_progress'
     and b.service_type in ('boarding', 'daycare', 'house_sitting')
     and ((coalesce(b.end_date, b.start_date) + coalesce(b.pickup_from, time '23:59')) at time zone 'America/New_York') <= now();
  get diagnostics v_finished = row_count;

  return v_started + v_finished;
end;
$$;

grant execute on function public.advance_booking_statuses() to authenticated;
