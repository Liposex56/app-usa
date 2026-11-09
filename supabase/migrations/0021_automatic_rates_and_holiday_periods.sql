-- ============================================================================
-- Havenr — 0021_automatic_rates_and_holiday_periods.sql
--
-- From Jessica's answers on rates and her "Periodos festivos y reglas" PDF:
--  1. Holidays are now PERIODS (name, year, start and end date-time, on/off),
--     edited from the admin panel. A booking that touches an active period is
--     charged the holiday rate once, however many periods it touches.
--  2. Automatic rates have rules per group of services:
--       boarding / daycare / house sitting
--         holiday      +20 % on the regular rate (on top of the puppy rate)
--         extended     same as the regular rate (0 %) from 3 nights (or days)
--                      on — Havenr can add a discount later, and a Havener can
--                      always set their own
--         puppy        +10 %
--         additional   $10 less than the regular rate
--       walks / drop-in visits
--         60 minutes   +50 % on the 30-minute rate
--         additional   40 % less
--         puppy        +10 %
--    Everything is rounded to whole dollars.
--  3. Visits have a 60-minute rate of their own when automatic rates are off.
--  4. Rates are whole dollars — no cents.
--
-- Apply after 0020. Everything is idempotent.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Holiday periods
-- ---------------------------------------------------------------------------
create table if not exists public.holiday_periods (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  year       integer not null,
  starts_at  timestamp not null,
  ends_at    timestamp not null,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  check (ends_at >= starts_at),
  unique (name, year)
);

create index if not exists holiday_periods_ends_idx on public.holiday_periods (ends_at);

alter table public.holiday_periods enable row level security;

drop policy if exists "holiday periods: anyone reads" on public.holiday_periods;
create policy "holiday periods: anyone reads"
  on public.holiday_periods for select using (true);

drop policy if exists "holiday periods: staff manage" on public.holiday_periods;
create policy "holiday periods: staff manage"
  on public.holiday_periods for all
  using (public.is_staff())
  with check (public.is_staff());

grant select on public.holiday_periods to anon, authenticated;

insert into public.holiday_periods (name, year, starts_at, ends_at) values
  ('Martin Luther King Jr. Day',                2026, '2026-01-16 00:00', '2026-01-19 23:59'),
  ('Washington''s Birthday / Presidents'' Day', 2026, '2026-02-13 00:00', '2026-02-16 23:59'),
  ('Easter',                                    2026, '2026-04-03 00:00', '2026-04-06 23:59'),
  ('Memorial Day',                              2026, '2026-05-22 00:00', '2026-05-25 23:59'),
  ('Juneteenth',                                2026, '2026-06-19 00:00', '2026-06-21 23:59'),
  ('Independence Day',                          2026, '2026-07-03 00:00', '2026-07-05 23:59'),
  ('Labor Day',                                 2026, '2026-09-04 00:00', '2026-09-07 23:59'),
  ('Indigenous Peoples'' Day / Columbus Day',   2026, '2026-10-09 00:00', '2026-10-12 23:59'),
  ('Veterans Day',                              2026, '2026-11-11 00:00', '2026-11-11 23:59'),
  ('Thanksgiving',                              2026, '2026-11-25 00:00', '2026-11-29 23:59'),
  ('Christmas',                                 2026, '2026-12-23 00:00', '2026-12-29 23:59'),
  ('New Year',                                  2026, '2026-12-30 00:00', '2027-01-03 23:59'),
  ('Martin Luther King Jr. Day',                2027, '2027-01-15 00:00', '2027-01-18 23:59'),
  ('Washington''s Birthday / Presidents'' Day', 2027, '2027-02-12 00:00', '2027-02-15 23:59'),
  ('Easter',                                    2027, '2027-03-26 00:00', '2027-03-29 23:59'),
  ('Memorial Day',                              2027, '2027-05-28 00:00', '2027-05-31 23:59'),
  ('Juneteenth',                                2027, '2027-06-18 00:00', '2027-06-20 23:59'),
  ('Independence Day',                          2027, '2027-07-01 00:00', '2027-07-05 23:59'),
  ('Labor Day',                                 2027, '2027-09-03 00:00', '2027-09-06 23:59'),
  ('Indigenous Peoples'' Day / Columbus Day',   2027, '2027-10-08 00:00', '2027-10-11 23:59'),
  ('Veterans Day',                              2027, '2027-11-11 00:00', '2027-11-11 23:59'),
  ('Thanksgiving',                              2027, '2027-11-24 00:00', '2027-11-28 23:59'),
  ('Christmas',                                 2027, '2027-12-23 00:00', '2027-12-29 23:59'),
  ('New Year',                                  2027, '2027-12-30 00:00', '2028-01-02 23:59')
on conflict (name, year) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Automatic-rate percentages (Havenr's, by group of services)
--    The single-day `holidays` table and the three old percentages are retired.
-- ---------------------------------------------------------------------------
drop function if exists public.auto_rate_percents();

alter table public.platform_settings
  drop column if exists auto_holiday_percent,
  drop column if exists auto_additional_pet_percent,
  drop column if exists auto_extended_stay_percent,
  add column if not exists auto_stay_holiday_percent numeric(6, 2)
    check (auto_stay_holiday_percent is null or auto_stay_holiday_percent between 0 and 500),
  add column if not exists auto_stay_extended_percent numeric(6, 2)
    check (auto_stay_extended_percent is null or auto_stay_extended_percent between -90 and 200),
  add column if not exists auto_stay_extended_min_units integer
    check (auto_stay_extended_min_units is null or auto_stay_extended_min_units >= 2),
  add column if not exists auto_stay_puppy_percent numeric(6, 2)
    check (auto_stay_puppy_percent is null or auto_stay_puppy_percent between 0 and 200),
  add column if not exists auto_stay_additional_less_cents integer
    check (auto_stay_additional_less_cents is null or auto_stay_additional_less_cents >= 0),
  add column if not exists auto_visit_sixty_percent numeric(6, 2)
    check (auto_visit_sixty_percent is null or auto_visit_sixty_percent between 0 and 500),
  add column if not exists auto_visit_additional_less_percent numeric(6, 2)
    check (auto_visit_additional_less_percent is null or auto_visit_additional_less_percent between 0 and 100),
  add column if not exists auto_visit_puppy_percent numeric(6, 2)
    check (auto_visit_puppy_percent is null or auto_visit_puppy_percent between 0 and 200);

-- Jessica's numbers (only fills what is still empty, so an edit is never undone).
update public.platform_settings
   set auto_stay_holiday_percent          = coalesce(auto_stay_holiday_percent, 20),
       auto_stay_extended_percent         = coalesce(auto_stay_extended_percent, 0),
       auto_stay_extended_min_units       = coalesce(auto_stay_extended_min_units, 3),
       auto_stay_puppy_percent            = coalesce(auto_stay_puppy_percent, 10),
       auto_stay_additional_less_cents    = coalesce(auto_stay_additional_less_cents, 1000),
       auto_visit_sixty_percent           = coalesce(auto_visit_sixty_percent, 50),
       auto_visit_additional_less_percent = coalesce(auto_visit_additional_less_percent, 40),
       auto_visit_puppy_percent           = coalesce(auto_visit_puppy_percent, 10)
 where id = 1;

-- platform_settings is staff-only, so everybody else reads the percentages here.
create or replace function public.auto_rate_percents()
returns table (
  stay_holiday              numeric,
  stay_extended             numeric,
  stay_extended_min_units   integer,
  stay_puppy                numeric,
  stay_additional_less_cents integer,
  visit_sixty               numeric,
  visit_additional_less     numeric,
  visit_puppy               numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select auto_stay_holiday_percent,
         auto_stay_extended_percent,
         auto_stay_extended_min_units,
         auto_stay_puppy_percent,
         auto_stay_additional_less_cents,
         auto_visit_sixty_percent,
         auto_visit_additional_less_percent,
         auto_visit_puppy_percent
  from public.platform_settings
  where id = 1
$$;

grant execute on function public.auto_rate_percents() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3 + 4. Havener rates: a 60-minute rate for visits, and whole dollars only.
-- ---------------------------------------------------------------------------
alter table public.sitter_services
  add column if not exists sixty_minute_rate_cents integer
    check (sixty_minute_rate_cents is null or sixty_minute_rate_cents >= 0);

update public.sitter_services
   set base_rate_cents           = (round(base_rate_cents / 100.0))::integer * 100,
       additional_pet_rate_cents = (round(additional_pet_rate_cents / 100.0))::integer * 100,
       holiday_rate_cents        = (round(holiday_rate_cents / 100.0))::integer * 100,
       puppy_rate_cents          = (round(puppy_rate_cents / 100.0))::integer * 100,
       extended_stay_rate_cents  = (round(extended_stay_rate_cents / 100.0))::integer * 100,
       bathing_rate_cents        = (round(bathing_rate_cents / 100.0))::integer * 100,
       pickup_dropoff_rate_cents = (round(pickup_dropoff_rate_cents / 100.0))::integer * 100,
       extra_hour_rate_cents     = (round(extra_hour_rate_cents / 100.0))::integer * 100
 where base_rate_cents % 100 <> 0
    or additional_pet_rate_cents % 100 <> 0
    or holiday_rate_cents % 100 <> 0
    or puppy_rate_cents % 100 <> 0
    or extended_stay_rate_cents % 100 <> 0
    or bathing_rate_cents % 100 <> 0
    or pickup_dropoff_rate_cents % 100 <> 0
    or extra_hour_rate_cents % 100 <> 0;

-- The booking records which rate priced it; puppy is a new kind.
alter table public.bookings drop constraint if exists bookings_rate_kind_check;
alter table public.bookings
  add constraint bookings_rate_kind_check
  check (rate_kind in ('standard', 'holiday', 'extended', 'puppy'));

-- ---------------------------------------------------------------------------
-- The price of a stay — the single rule the app mirrors in lib/pricing.ts
-- (that copy only drives the live estimate).
--
--   stays (boarding, house sitting, daycare), per night / day:
--     first dog  regular rate; a puppy raises it; then a holiday raises it
--                again (on top of the puppy rate) — or, with no holiday, a
--                stay of 3+ units gets the extended-stay change.
--     every other pet: the additional rate ($10 less than the regular rate).
--   visits (walks, drop-in), one unit:
--     30 minutes = regular rate; 60 minutes = the 60-minute rate;
--     a puppy raises it; every other pet pays the additional rate.
--   with "automatic rates" off, the Havener's own rates are used instead.
--   Pick-up and drop-off adds its flat rate. Results are whole dollars.
-- ---------------------------------------------------------------------------
create or replace function public.round_to_dollars(p_cents numeric)
returns integer
language sql
immutable
as $$
  select (round(p_cents / 100.0))::integer * 100
$$;

drop function if exists public.stay_price(uuid, public.service_type, date, date, integer, boolean);

create or replace function public.stay_price(
  p_sitter     uuid,
  p_service    public.service_type,
  p_start      date,
  p_end        date,
  p_pets       integer,
  p_pickup     boolean,
  p_has_puppy  boolean default false,
  p_duration   integer default null
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
  s          public.sitter_services;
  a          record;
  v_visit    boolean := p_service in ('dog_walking', 'drop_in_visit');
  v_auto     boolean;
  v_gap      integer;
  v_qty      integer;
  v_min      integer;
  v_base     integer;
  v_sixty    integer;
  v_unit     integer;
  v_add      integer;
  v_kind     text := 'standard';
  v_holiday  boolean;
  v_extra    integer;
begin
  select * into s
  from public.sitter_services
  where sitter_id = p_sitter and service_type = p_service;
  if not found then
    raise exception 'This Havener does not offer that service';
  end if;

  select * into a from public.auto_rate_percents();
  v_auto := s.auto_rates;

  v_gap := greatest(0, coalesce(p_end, p_start) - p_start);
  v_qty := case p_service
    when 'boarding'      then greatest(1, v_gap)
    when 'house_sitting' then greatest(1, v_gap)
    when 'daycare'       then v_gap + 1
    else 1
  end;
  v_min := coalesce(a.stay_extended_min_units, 3);

  v_base := s.base_rate_cents;

  if v_visit then
    -- The length of the visit: 60 minutes costs more than 30.
    v_sixty := case
      when a.visit_sixty is null then s.base_rate_cents
      else public.round_to_dollars(s.base_rate_cents * (1 + a.visit_sixty / 100.0))
    end;
    if p_duration = 60 then
      v_base := case when v_auto then v_sixty else coalesce(s.sixty_minute_rate_cents, v_sixty) end;
    end if;

    v_unit := v_base;
    if p_has_puppy and v_auto and a.visit_puppy is not null then
      v_unit := public.round_to_dollars(v_base * (1 + a.visit_puppy / 100.0));
      v_kind := 'puppy';
    end if;

    v_add := case
      when v_auto and a.visit_additional_less is not null
        then public.round_to_dollars(v_base * (1 - a.visit_additional_less / 100.0))
      else s.additional_pet_rate_cents
    end;
  else
    v_unit := v_base;

    -- A puppy raises the first dog's rate...
    if p_has_puppy then
      if v_auto and a.stay_puppy is not null then
        v_unit := public.round_to_dollars(v_base * (1 + a.stay_puppy / 100.0));
        v_kind := 'puppy';
      elsif not v_auto and coalesce(s.puppy_rate_cents, 0) > 0 then
        v_unit := s.puppy_rate_cents;
        v_kind := 'puppy';
      end if;
    end if;

    -- ...a holiday raises it again, on top of the puppy rate. Overlapping
    -- periods (Christmas and New Year) count once.
    v_holiday := exists (
      select 1 from public.holiday_periods h
      where h.active
        and p_start <= h.ends_at::date
        and coalesce(p_end, p_start) >= h.starts_at::date
    );

    if v_holiday then
      if v_auto and a.stay_holiday is not null then
        v_unit := public.round_to_dollars(v_unit * (1 + a.stay_holiday / 100.0));
        v_kind := 'holiday';
      elsif not v_auto and coalesce(s.holiday_rate_cents, 0) > 0 then
        v_unit := s.holiday_rate_cents;
        v_kind := 'holiday';
      end if;
    elsif v_qty >= v_min then
      if v_auto and a.stay_extended is not null then
        if public.round_to_dollars(v_unit * (1 + a.stay_extended / 100.0)) <> v_unit then
          v_unit := public.round_to_dollars(v_unit * (1 + a.stay_extended / 100.0));
          v_kind := 'extended';
        end if;
      elsif not v_auto and coalesce(s.extended_stay_rate_cents, 0) > 0
            and s.extended_stay_rate_cents <> v_unit then
        v_unit := s.extended_stay_rate_cents;
        v_kind := 'extended';
      end if;
    end if;

    v_add := case
      when v_auto and a.stay_additional_less_cents is not null
        then greatest(0, v_base - a.stay_additional_less_cents)
      else s.additional_pet_rate_cents
    end;
  end if;

  v_extra := greatest(0, coalesce(p_pets, 1) - 1) * v_add * v_qty
             + case when p_pickup then coalesce(s.pickup_dropoff_rate_cents, 0) else 0 end;

  return query select v_unit, v_add, v_kind, v_qty, v_extra, v_unit * v_qty + v_extra;
end;
$$;

grant execute on function public.stay_price(
  uuid, public.service_type, date, date, integer, boolean, boolean, integer
) to authenticated;

-- ---------------------------------------------------------------------------
-- Modify an open request: priced with the new stay_price (puppy and length
-- included), so an edit keeps the same rules.
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
  b          public.bookings;
  pets       integer;
  has_puppy  boolean;
  pr         record;
  fee        integer;
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

  select coalesce(bool_or(
           p.species::text = 'dog'
           and p.birthdate is not null
           and p.birthdate > (p_start - interval '1 year')::date
         ), false)
    into has_puppy
  from public.booking_pets bp
  join public.pets p on p.id = bp.pet_id
  where bp.booking_id = b.id;

  select * into pr
  from public.stay_price(
    b.sitter_id, b.service_type, p_start, p_end, pets, p_wants_pickup,
    has_puppy, b.duration_minutes
  );

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
