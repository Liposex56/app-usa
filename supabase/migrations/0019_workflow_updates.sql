-- ============================================================================
-- Havenr — 0019_workflow_updates.sql
--
-- From Jessica's "CAMBIOS PÁGINA WEB" list (Oct 2026):
--  1. Daycare is no longer time-driven: like walks and drop-in visits, the
--     Havener starts and finishes it. Only boarding and house sitting run on
--     their drop-off / pick-up times.
--  2. Walks and drop-in visits have a booked length (30 or 60 minutes) that
--     can't be finished early.
--  3. Holidays are recognised automatically: a stay that touches one is
--     charged at the Havener's holiday rate for the whole stay. A stay of more
--     than one day can use the Havener's extended-stay rate.
--  4. "Automatic rates": Havenr sets the percentages (Admin → Settings) for
--     the holiday, additional-pet and extended-stay rates; a Havener can
--     switch their service to them.
--  5. In-app notifications (new request / message, both sides booked,
--     confirmed, completed, review received / visible) and daily reminders
--     (send photos on a stay; leave your review).
--
-- Apply after 0018. Everything is idempotent.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Only boarding and house sitting start / finish by themselves.
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
  perform set_config('havenr.trusted_write', 'on', true);

  update public.bookings b
     set status = 'in_progress',
         started_at = coalesce(b.started_at, now())
   where b.status = 'confirmed'
     and b.service_type in ('boarding', 'house_sitting')
     and ((b.start_date + coalesce(b.dropoff_from, time '00:00')) at time zone 'America/New_York') <= now();
  get diagnostics v_started = row_count;

  update public.bookings b
     set status = 'completed',
         completed_at = coalesce(b.completed_at, now()),
         started_at = coalesce(b.started_at, now())
   where b.status = 'in_progress'
     and b.service_type in ('boarding', 'house_sitting')
     and ((coalesce(b.end_date, b.start_date) + coalesce(b.pickup_from, time '23:59')) at time zone 'America/New_York') <= now();
  get diagnostics v_finished = row_count;

  return v_started + v_finished;
end;
$$;

grant execute on function public.advance_booking_statuses() to authenticated;

-- ---------------------------------------------------------------------------
-- 2 + 3. New booking columns: booked length, and which rate was applied.
-- ---------------------------------------------------------------------------
alter table public.bookings
  add column if not exists duration_minutes integer
    check (duration_minutes is null or duration_minutes in (30, 60)),
  add column if not exists rate_kind text not null default 'standard'
    check (rate_kind in ('standard', 'holiday', 'extended'));

-- ---------------------------------------------------------------------------
-- 3. Holidays (Havenr edits this list; the defaults are the usual peak days).
-- ---------------------------------------------------------------------------
create table if not exists public.holidays (
  day  date primary key,
  name text not null
);

alter table public.holidays enable row level security;

drop policy if exists "holidays: anyone reads" on public.holidays;
create policy "holidays: anyone reads"
  on public.holidays for select using (true);

drop policy if exists "holidays: staff manage" on public.holidays;
create policy "holidays: staff manage"
  on public.holidays for all
  using (public.is_staff())
  with check (public.is_staff());

grant select on public.holidays to anon, authenticated;

insert into public.holidays (day, name) values
  ('2026-01-01', 'New Year''s Day'),
  ('2026-05-25', 'Memorial Day'),
  ('2026-07-04', 'Independence Day'),
  ('2026-09-07', 'Labor Day'),
  ('2026-11-26', 'Thanksgiving'),
  ('2026-12-24', 'Christmas Eve'),
  ('2026-12-25', 'Christmas Day'),
  ('2026-12-31', 'New Year''s Eve'),
  ('2027-01-01', 'New Year''s Day'),
  ('2027-05-31', 'Memorial Day'),
  ('2027-07-04', 'Independence Day'),
  ('2027-09-06', 'Labor Day'),
  ('2027-11-25', 'Thanksgiving'),
  ('2027-12-24', 'Christmas Eve'),
  ('2027-12-25', 'Christmas Day'),
  ('2027-12-31', 'New Year''s Eve'),
  ('2028-01-01', 'New Year''s Day'),
  ('2028-05-29', 'Memorial Day'),
  ('2028-07-04', 'Independence Day'),
  ('2028-09-04', 'Labor Day'),
  ('2028-11-23', 'Thanksgiving'),
  ('2028-12-24', 'Christmas Eve'),
  ('2028-12-25', 'Christmas Day'),
  ('2028-12-31', 'New Year''s Eve'),
  ('2029-01-01', 'New Year''s Day'),
  ('2029-05-28', 'Memorial Day'),
  ('2029-07-04', 'Independence Day'),
  ('2029-09-03', 'Labor Day'),
  ('2029-11-22', 'Thanksgiving'),
  ('2029-12-24', 'Christmas Eve'),
  ('2029-12-25', 'Christmas Day'),
  ('2029-12-31', 'New Year''s Eve'),
  ('2030-01-01', 'New Year''s Day'),
  ('2030-05-27', 'Memorial Day'),
  ('2030-07-04', 'Independence Day'),
  ('2030-09-02', 'Labor Day'),
  ('2030-11-28', 'Thanksgiving'),
  ('2030-12-24', 'Christmas Eve'),
  ('2030-12-25', 'Christmas Day'),
  ('2030-12-31', 'New Year''s Eve'),
  ('2031-01-01', 'New Year''s Day'),
  ('2031-05-26', 'Memorial Day'),
  ('2031-07-04', 'Independence Day'),
  ('2031-09-01', 'Labor Day'),
  ('2031-11-27', 'Thanksgiving'),
  ('2031-12-24', 'Christmas Eve'),
  ('2031-12-25', 'Christmas Day'),
  ('2031-12-31', 'New Year''s Eve'),
  ('2032-01-01', 'New Year''s Day'),
  ('2032-05-31', 'Memorial Day'),
  ('2032-07-04', 'Independence Day'),
  ('2032-09-06', 'Labor Day'),
  ('2032-11-25', 'Thanksgiving'),
  ('2032-12-24', 'Christmas Eve'),
  ('2032-12-25', 'Christmas Day'),
  ('2032-12-31', 'New Year''s Eve'),
  ('2033-01-01', 'New Year''s Day'),
  ('2033-05-30', 'Memorial Day'),
  ('2033-07-04', 'Independence Day'),
  ('2033-09-05', 'Labor Day'),
  ('2033-11-24', 'Thanksgiving'),
  ('2033-12-24', 'Christmas Eve'),
  ('2033-12-25', 'Christmas Day'),
  ('2033-12-31', 'New Year''s Eve'),
  ('2034-01-01', 'New Year''s Day'),
  ('2034-05-29', 'Memorial Day'),
  ('2034-07-04', 'Independence Day'),
  ('2034-09-04', 'Labor Day'),
  ('2034-11-23', 'Thanksgiving'),
  ('2034-12-24', 'Christmas Eve'),
  ('2034-12-25', 'Christmas Day'),
  ('2034-12-31', 'New Year''s Eve'),
  ('2035-01-01', 'New Year''s Day'),
  ('2035-05-28', 'Memorial Day'),
  ('2035-07-04', 'Independence Day'),
  ('2035-09-03', 'Labor Day'),
  ('2035-11-22', 'Thanksgiving'),
  ('2035-12-24', 'Christmas Eve'),
  ('2035-12-25', 'Christmas Day'),
  ('2035-12-31', 'New Year''s Eve')

on conflict (day) do nothing;

-- ---------------------------------------------------------------------------
-- 4. Automatic rates
--    Percentages are Havenr's to set; null = not set yet (the switch stays off).
--      holiday        — added to the base rate           (holiday rate)
--      additional pet — share of the base rate per extra pet
--      extended stay  — change vs the base rate (negative = a discount)
-- ---------------------------------------------------------------------------
alter table public.platform_settings
  add column if not exists auto_holiday_percent numeric(6, 2)
    check (auto_holiday_percent is null or auto_holiday_percent between 0 and 500),
  add column if not exists auto_additional_pet_percent numeric(6, 2)
    check (auto_additional_pet_percent is null or auto_additional_pet_percent between 0 and 200),
  add column if not exists auto_extended_stay_percent numeric(6, 2)
    check (auto_extended_stay_percent is null or auto_extended_stay_percent between -90 and 200);

alter table public.sitter_services
  add column if not exists auto_rates boolean not null default false;

-- platform_settings is staff-only, so everybody else reads the percentages here.
create or replace function public.auto_rate_percents()
returns table (holiday numeric, additional_pet numeric, extended_stay numeric)
language sql
stable
security definer
set search_path = public
as $$
  select auto_holiday_percent, auto_additional_pet_percent, auto_extended_stay_percent
  from public.platform_settings
  where id = 1
$$;

grant execute on function public.auto_rate_percents() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- The price of a stay — the single rule the app mirrors in lib/pricing.ts
-- (that copy only drives the live estimate on the contact form).
--   * nightly services (boarding, house sitting) bill per night, daycare per
--     calendar day, walks and visits once;
--   * a stay that touches a holiday is charged at the holiday rate for the
--     whole stay; otherwise a stay of more than one unit can use the
--     extended-stay rate; otherwise the base rate;
--   * every extra pet adds the additional-pet rate per unit; pick-up and
--     drop-off adds its flat rate;
--   * with "automatic rates" on, the holiday / additional-pet / extended-stay
--     rates come from Havenr's percentages, rounded to whole dollars.
-- ---------------------------------------------------------------------------
create or replace function public.stay_price(
  p_sitter   uuid,
  p_service  public.service_type,
  p_start    date,
  p_end      date,
  p_pets     integer,
  p_pickup   boolean
)
returns table (
  unit_cents       integer,
  additional_cents integer,
  rate_kind        text,
  quantity         integer,
  extra_cents      integer,
  total_cents      integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  s        public.sitter_services;
  v_pct    record;
  v_base   integer;
  v_add    integer;
  v_hol    integer;
  v_ext    integer;
  v_gap    integer;
  v_qty    integer;
  v_unit   integer;
  v_kind   text := 'standard';
  v_extra  integer;
begin
  select * into s
  from public.sitter_services
  where sitter_id = p_sitter and service_type = p_service;
  if not found then
    raise exception 'This Havener does not offer that service';
  end if;

  v_base := s.base_rate_cents;
  v_add  := s.additional_pet_rate_cents;
  v_hol  := s.holiday_rate_cents;
  v_ext  := s.extended_stay_rate_cents;

  if s.auto_rates then
    select * into v_pct from public.auto_rate_percents();
    if v_pct.holiday is not null then
      v_hol := (round(v_base * (1 + v_pct.holiday / 100.0) / 100.0))::integer * 100;
    end if;
    if v_pct.additional_pet is not null then
      v_add := (round(v_base * v_pct.additional_pet / 100.0 / 100.0))::integer * 100;
    end if;
    if v_pct.extended_stay is not null then
      v_ext := (round(v_base * (1 + v_pct.extended_stay / 100.0) / 100.0))::integer * 100;
    end if;
  end if;

  v_gap := greatest(0, coalesce(p_end, p_start) - p_start);
  v_qty := case p_service
    when 'boarding'      then greatest(1, v_gap)
    when 'house_sitting' then greatest(1, v_gap)
    when 'daycare'       then v_gap + 1
    else 1
  end;

  v_unit := v_base;
  if v_hol is not null and v_hol > 0
     and exists (
       select 1 from public.holidays h
       where h.day between p_start and coalesce(p_end, p_start)
     ) then
    v_unit := v_hol;
    v_kind := 'holiday';
  elsif v_qty > 1 and v_ext is not null and v_ext > 0 then
    v_unit := v_ext;
    v_kind := 'extended';
  end if;

  v_extra := greatest(0, coalesce(p_pets, 1) - 1) * v_add * v_qty
             + case when p_pickup then coalesce(s.pickup_dropoff_rate_cents, 0) else 0 end;

  return query select v_unit, v_add, v_kind, v_qty, v_extra, v_unit * v_qty + v_extra;
end;
$$;

grant execute on function public.stay_price(uuid, public.service_type, date, date, integer, boolean)
  to authenticated;

-- ---------------------------------------------------------------------------
-- Modify an open request: same as 0014, but priced with stay_price() so the
-- holiday / extended-stay rules hold after an edit too.
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
  b     public.bookings;
  pets  integer;
  pr    record;
  fee   integer;
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

  select count(*) into pets from public.booking_pets where booking_id = b.id;

  select * into pr
  from public.stay_price(b.sitter_id, b.service_type, p_start, p_end, pets, p_wants_pickup);

  fee := round(pr.total_cents * b.commission_percent / 100.0);

  perform set_config('havenr.trusted_write', 'on', true);

  update public.bookings
  set start_date                = p_start,
      end_date                  = p_end,
      dropoff_from              = p_dropoff_from,
      dropoff_to                = p_dropoff_to,
      pickup_from               = p_pickup_from,
      pickup_to                 = p_pickup_to,
      wants_pickup_dropoff      = p_wants_pickup,
      owner_notes               = p_notes,
      base_rate_cents           = pr.unit_cents,
      additional_pet_rate_cents = pr.additional_cents,
      rate_kind                 = pr.rate_kind,
      extra_fees_cents          = pr.extra_cents,
      total_cents               = pr.total_cents,
      platform_fee_cents        = fee,
      sitter_payout_cents       = pr.total_cents - fee,
      owner_booked_at           = null,
      sitter_booked_at          = null
  where id = b.id;

  perform set_config('havenr.trusted_write', 'off', true);
end;
$$;

grant execute on function public.modify_booking_request(
  uuid, date, date, time, time, time, time, boolean, text
) to authenticated;

-- ---------------------------------------------------------------------------
-- The transition guard of 0018, plus: the booked length and the applied rate
-- kind are not the participants' to change.
-- ---------------------------------------------------------------------------
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
  new.rate_kind                 := old.rate_kind;
  new.duration_minutes          := old.duration_minutes;

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
-- 5. Notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  kind        text not null,
  title       text not null,
  body        text,
  href        text,
  booking_id  uuid references public.bookings (id) on delete cascade,
  dedupe_key  text,
  created_at  timestamptz not null default now(),
  read_at     timestamptz,
  emailed_at  timestamptz
);

create unique index if not exists notifications_dedupe_idx
  on public.notifications (user_id, dedupe_key)
  where dedupe_key is not null;

create index if not exists notifications_user_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications: read own" on public.notifications;
create policy "notifications: read own"
  on public.notifications for select
  using (user_id = auth.uid());

drop policy if exists "notifications: mark own read" on public.notifications;
create policy "notifications: mark own read"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- People can read their own and mark them read — nothing else. Rows are
-- written only by the functions below.
revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

create or replace function public.notify_user(
  p_user     uuid,
  p_kind     text,
  p_title    text,
  p_body     text,
  p_href     text,
  p_booking  uuid,
  p_dedupe   text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user is null then
    return;
  end if;
  insert into public.notifications (user_id, kind, title, body, href, booking_id, dedupe_key)
  values (p_user, p_kind, p_title, p_body, p_href, p_booking, p_dedupe)
  on conflict (user_id, dedupe_key) where dedupe_key is not null do nothing;
end;
$$;

revoke execute on function public.notify_user(uuid, text, text, text, text, uuid, text)
  from public, anon, authenticated;

-- A new chat message (at most one unread alert per conversation every 15 min).
create or replace function public.trg_notify_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  if exists (
    select 1 from public.notifications n
    where n.user_id = new.recipient_id
      and n.booking_id = new.booking_id
      and n.kind = 'message'
      and n.read_at is null
      and n.created_at > now() - interval '15 minutes'
  ) then
    return new;
  end if;

  select coalesce(display_name, first_name, 'Someone') into v_name
    from public.profiles where id = new.sender_id;

  perform public.notify_user(
    new.recipient_id,
    'message',
    'New message from ' || coalesce(v_name, 'someone'),
    case when new.media_path is not null then 'Sent you a photo or video.' else left(new.body, 120) end,
    '/dashboard/bookings/' || new.booking_id,
    new.booking_id
  );
  return new;
end;
$$;

drop trigger if exists messages_notify on public.messages;
create trigger messages_notify
  after insert on public.messages
  for each row execute function public.trg_notify_message();

-- A new request, and each step of a booking.
create or replace function public.trg_notify_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner  text;
  v_sitter text;
  v_href   text;
begin
  v_href := '/dashboard/bookings/' || new.id;
  select coalesce(display_name, first_name, 'a pet owner') into v_owner
    from public.profiles where id = new.owner_id;
  select coalesce(display_name, first_name, 'your Havener') into v_sitter
    from public.profiles where id = new.sitter_id;

  if tg_op = 'INSERT' then
    if new.status = 'requested' then
      perform public.notify_user(
        new.sitter_id, 'request',
        'New request from ' || v_owner,
        'Open it to review the details and book or decline.',
        v_href, new.id
      );
    end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    if new.status = 'confirmed' then
      perform public.notify_user(new.owner_id, 'confirmed', 'Booking confirmed',
        'Both of you booked — it''s confirmed.', v_href, new.id);
      perform public.notify_user(new.sitter_id, 'confirmed', 'Booking confirmed',
        'Both of you booked — it''s confirmed.', v_href, new.id);
    elsif new.status = 'declined' then
      perform public.notify_user(new.owner_id, 'declined', v_sitter || ' declined your request',
        'You can contact other Haveners who are free for your dates.', v_href, new.id);
    elsif new.status = 'cancelled' then
      if new.cancelled_by is distinct from new.owner_id then
        perform public.notify_user(new.owner_id, 'cancelled', 'Request cancelled', null, v_href, new.id);
      end if;
      if new.cancelled_by is distinct from new.sitter_id then
        perform public.notify_user(new.sitter_id, 'cancelled', 'Request cancelled', null, v_href, new.id);
      end if;
    elsif new.status = 'in_progress' then
      perform public.notify_user(new.owner_id, 'started', 'The service has started', null, v_href, new.id);
    elsif new.status = 'completed' then
      perform public.notify_user(new.owner_id, 'completed', 'Service completed',
        'Leave your review — theirs stays hidden until you both have.', v_href, new.id);
      perform public.notify_user(new.sitter_id, 'completed', 'Service completed',
        'Leave your review — theirs stays hidden until you both have.', v_href, new.id);
    end if;
  elsif new.status = 'requested' then
    if new.owner_booked_at is not null and old.owner_booked_at is null and new.sitter_booked_at is null then
      perform public.notify_user(new.sitter_id, 'turn', v_owner || ' booked — your turn',
        'Click Book to confirm the service.', v_href, new.id);
    end if;
    if new.sitter_booked_at is not null and old.sitter_booked_at is null and new.owner_booked_at is null then
      perform public.notify_user(new.owner_id, 'turn', v_sitter || ' booked — your turn',
        'Click Book to confirm the service.', v_href, new.id);
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists bookings_notify_insert on public.bookings;
create trigger bookings_notify_insert
  after insert on public.bookings
  for each row execute function public.trg_notify_booking();

drop trigger if exists bookings_notify_update on public.bookings;
create trigger bookings_notify_update
  after update on public.bookings
  for each row execute function public.trg_notify_booking();

-- Reviews: tell the other side one has arrived, and both when they publish.
create or replace function public.trg_notify_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count    int;
  v_reviewer text;
  v_other    text;
  v_href     text;
begin
  v_href := '/dashboard/bookings/' || new.booking_id;
  select count(*) into v_count from public.reviews where booking_id = new.booking_id;
  select coalesce(display_name, first_name, 'Someone') into v_reviewer
    from public.profiles where id = new.reviewer_id;
  select coalesce(display_name, first_name, 'the other side') into v_other
    from public.profiles where id = new.reviewee_id;

  if v_count = 1 then
    perform public.notify_user(
      new.reviewee_id, 'review_received',
      v_reviewer || ' reviewed you',
      'Leave your review to see theirs — both are published together.',
      v_href, new.booking_id, 'review_received:' || new.booking_id || ':' || new.reviewee_id
    );
  else
    perform public.notify_user(
      new.reviewee_id, 'review_visible',
      'The review from ' || v_reviewer || ' is now visible',
      null, v_href, new.booking_id, 'review_visible:' || new.booking_id || ':' || new.reviewee_id
    );
    perform public.notify_user(
      new.reviewer_id, 'review_visible',
      'The review from ' || v_other || ' is now visible',
      null, v_href, new.booking_id, 'review_visible:' || new.booking_id || ':' || new.reviewer_id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists reviews_notify on public.reviews;
create trigger reviews_notify
  after insert on public.reviews
  for each row execute function public.trg_notify_review();

-- ---------------------------------------------------------------------------
-- Daily reminders (6 PM Boston):
--   * boarding / house sitting in progress and no photo or video from the
--     Havener in the chat today -> remind them to send one;
--   * a finished service the person hasn't reviewed (1 and 4 days after).
-- ---------------------------------------------------------------------------
create or replace function public.send_daily_reminders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r         record;
  v_count   int := 0;
  v_today   text := to_char(now() at time zone 'America/New_York', 'YYYY-MM-DD');
  v_start   timestamptz := (date_trunc('day', now() at time zone 'America/New_York')) at time zone 'America/New_York';
  v_stage   text;
begin
  for r in
    select b.id, b.sitter_id
    from public.bookings b
    where b.status = 'in_progress'
      and b.service_type in ('boarding', 'house_sitting')
      and not exists (
        select 1 from public.messages m
        where m.booking_id = b.id
          and m.sender_id = b.sitter_id
          and m.media_path is not null
          and m.created_at >= v_start
      )
  loop
    perform public.notify_user(
      r.sitter_id, 'photo_reminder',
      'Send today''s photos',
      'Owners love a daily update. Send at least one photo or video of the pet in the chat today.',
      '/dashboard/bookings/' || r.id, r.id,
      'photo:' || r.id || ':' || v_today
    );
    v_count := v_count + 1;
  end loop;

  for r in
    select b.id, b.owner_id, b.sitter_id, b.completed_at
    from public.bookings b
    where b.status in ('completed', 'pending_payout', 'paid_out')
      and b.completed_at between now() - interval '7 days' and now() - interval '1 day'
  loop
    v_stage := case when r.completed_at < now() - interval '4 days' then '2' else '1' end;

    if not exists (select 1 from public.reviews where booking_id = r.id and reviewer_id = r.owner_id) then
      perform public.notify_user(
        r.owner_id, 'review_reminder', 'Don''t forget your review',
        'Rate your Havener — it helps other pet owners.',
        '/dashboard/bookings/' || r.id, r.id, 'review:' || r.id || ':' || r.owner_id || ':' || v_stage
      );
      v_count := v_count + 1;
    end if;
    if not exists (select 1 from public.reviews where booking_id = r.id and reviewer_id = r.sitter_id) then
      perform public.notify_user(
        r.sitter_id, 'review_reminder', 'Don''t forget your review',
        'Rate the pet owner — it helps other Haveners.',
        '/dashboard/bookings/' || r.id, r.id, 'review:' || r.id || ':' || r.sitter_id || ':' || v_stage
      );
      v_count := v_count + 1;
    end if;
  end loop;

  return v_count;
end;
$$;

revoke execute on function public.send_daily_reminders() from public, anon, authenticated;

-- Run it every day at 22:00 UTC (6 PM EDT / 5 PM EST) when pg_cron is there.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    begin
      perform cron.unschedule('daily-reminders');
    exception when others then
      null;
    end;
    perform cron.schedule('daily-reminders', '0 22 * * *', 'select public.send_daily_reminders()');
  end if;
exception when others then
  raise notice 'Could not schedule daily-reminders: %', sqlerrm;
end;
$$;

-- ---------------------------------------------------------------------------
-- Commission: platform_settings can only be read by staff, so a pet owner's
-- request (and a Havener's earnings preview) always fell back to the 20%
-- default even after an admin changed it. Everyone reads the real value here.
-- ---------------------------------------------------------------------------
create or replace function public.current_commission_percent()
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select company_commission_percent from public.platform_settings where id = 1),
    20.00
  )
$$;

grant execute on function public.current_commission_percent() to authenticated;
