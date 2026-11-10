-- ============================================================================
-- Havenr — 0024_rates_extended_care_adjustments.sql
--
-- From Jessica's updated rate rules (Nov 9-10, 2026):
--  * Holidays also raise the additional-dog rate (+20 %), and apply to walks
--    and drop-in visits too.
--  * House sitting: an additional dog pays 50 % less (not $10 less).
--  * Drop-in visits for cats cost 10 % less than the regular rate.
--  * Extended care (boarding and house sitting): the nightly rate covers 24
--    hours from drop-off to pick-up. With a 2-hour grace period, 2 to 8 extra
--    hours add 50 % of the nightly rate and 8 or more add 100 %. It replaces
--    the per-hour "extra hour rate".
--  * The Havener can adjust the cost of a request (add or subtract an amount)
--    and switch a walk or visit between 30 and 60 minutes when modifying it.
--  * Drop-off and pick-up are time ranges; a stay finishes at the end of the
--    pick-up range.
--
-- Apply after 0023. Idempotent.
-- ============================================================================

alter table public.platform_settings
  add column if not exists auto_house_additional_less_percent numeric(6, 2)
    check (auto_house_additional_less_percent is null
           or auto_house_additional_less_percent between 0 and 100),
  add column if not exists auto_visit_holiday_percent numeric(6, 2)
    check (auto_visit_holiday_percent is null or auto_visit_holiday_percent between 0 and 500),
  add column if not exists auto_visit_cat_less_percent numeric(6, 2)
    check (auto_visit_cat_less_percent is null or auto_visit_cat_less_percent between 0 and 100);

update public.platform_settings
   set auto_house_additional_less_percent = coalesce(auto_house_additional_less_percent, 50),
       auto_visit_holiday_percent         = coalesce(auto_visit_holiday_percent, 20),
       auto_visit_cat_less_percent        = coalesce(auto_visit_cat_less_percent, 10)
 where id = 1;

drop function if exists public.auto_rate_percents();

create or replace function public.auto_rate_percents()
returns table (
  stay_holiday               numeric,
  stay_extended              numeric,
  stay_extended_min_units    integer,
  stay_puppy                 numeric,
  stay_additional_less_cents integer,
  house_additional_less      numeric,
  visit_sixty                numeric,
  visit_additional_less      numeric,
  visit_puppy                numeric,
  visit_holiday              numeric,
  visit_cat_less             numeric
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
         auto_house_additional_less_percent,
         auto_visit_sixty_percent,
         auto_visit_additional_less_percent,
         auto_visit_puppy_percent,
         auto_visit_holiday_percent,
         auto_visit_cat_less_percent
  from public.platform_settings
  where id = 1
$$;

grant execute on function public.auto_rate_percents() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Bookings: the extended-care charge and the Havener's adjustment are their own
-- lines, and only trusted code may change them.
-- ---------------------------------------------------------------------------
alter table public.bookings
  add column if not exists extended_care_cents integer not null default 0
    check (extended_care_cents >= 0),
  add column if not exists adjustment_cents integer not null default 0;

create or replace function public.protect_booking_extras()
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
  new.extended_care_cents := old.extended_care_cents;
  new.adjustment_cents    := old.adjustment_cents;
  return new;
end;
$$;

drop trigger if exists bookings_protect_extras on public.bookings;
create trigger bookings_protect_extras
  before update on public.bookings
  for each row execute function public.protect_booking_extras();

-- A new request never starts with an adjustment.
create or replace function public.reset_booking_adjustment()
returns trigger
language plpgsql
as $$
begin
  new.adjustment_cents := 0;
  return new;
end;
$$;

drop trigger if exists bookings_reset_adjustment on public.bookings;
create trigger bookings_reset_adjustment
  before insert on public.bookings
  for each row execute function public.reset_booking_adjustment();

-- ---------------------------------------------------------------------------
-- A stay finishes at the end of the pick-up range.
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
     and ((coalesce(b.end_date, b.start_date) + coalesce(b.pickup_to, b.pickup_from, time '23:59')) at time zone 'America/New_York') <= now();
  get diagnostics v_finished = row_count;

  return v_started + v_finished;
end;
$$;

grant execute on function public.advance_booking_statuses() to authenticated;

-- ---------------------------------------------------------------------------
-- The price of a booking — mirrored in lib/pricing.ts for the live estimate.
--
--   stays (boarding, house sitting, daycare), per night / day:
--     first dog   regular rate; a puppy raises it; a holiday raises it again
--                 on top; with no holiday, a long stay uses the extended rate.
--     other pets  additional rate ($10 less; house sitting 50 % less), raised
--                 by the holiday too.
--     extended care (boarding, house sitting): pick-up more than 2 hours
--                 later in the day than drop-off adds 50 % of a night (up to
--                 8 hours) or 100 % (8 hours or more), for every pet.
--   visits (walks, drop-in), one unit:
--     30 minutes = regular rate (cats on drop-in: 10 % less); 60 minutes has
--     its own rate; a puppy and a holiday raise it; other pets pay the
--     additional rate (40 % less), raised by the holiday too.
--   With "automatic rates" off the Havener's own rates are used.
-- ---------------------------------------------------------------------------
drop function if exists public.stay_price(uuid, public.service_type, date, date, integer, boolean, boolean, integer);

create or replace function public.stay_price(
  p_sitter       uuid,
  p_service      public.service_type,
  p_start        date,
  p_end          date,
  p_pets         integer,
  p_pickup       boolean,
  p_has_puppy    boolean default false,
  p_duration     integer default null,
  p_dropoff_time time default null,
  p_pickup_time  time default null,
  p_all_cats     boolean default false
)
returns table (
  unit_cents       integer,
  additional_cents integer,
  rate_kind        text,
  quantity         integer,
  extra_cents      integer,
  total_cents      integer,
  care_cents       integer
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
  v_extras   integer;
  v_hours    numeric;
  v_care     integer := 0;
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
  v_extras := greatest(0, coalesce(p_pets, 1) - 1);

  v_holiday := exists (
    select 1 from public.holiday_periods h
    where h.active
      and p_start <= h.ends_at::date
      and coalesce(p_end, p_start) >= h.starts_at::date
  );

  v_base := s.base_rate_cents;

  if v_visit then
    -- Cats on a drop-in visit pay a little less than the regular rate.
    if v_auto and p_all_cats and p_service = 'drop_in_visit' and a.visit_cat_less is not null then
      v_base := public.round_to_dollars(v_base * (1 - a.visit_cat_less / 100.0));
    end if;

    -- The length of the visit: 60 minutes costs more than 30.
    if p_duration = 60 then
      v_sixty := case
        when a.visit_sixty is null then v_base
        else public.round_to_dollars(v_base * (1 + a.visit_sixty / 100.0))
      end;
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

    if v_holiday then
      if v_auto and a.visit_holiday is not null then
        v_unit := public.round_to_dollars(v_unit * (1 + a.visit_holiday / 100.0));
        v_add  := public.round_to_dollars(v_add * (1 + a.visit_holiday / 100.0));
        v_kind := 'holiday';
      elsif not v_auto and coalesce(s.holiday_rate_cents, 0) > 0 and coalesce(p_duration, 30) <> 60 then
        v_unit := s.holiday_rate_cents;
        v_kind := 'holiday';
      end if;
    end if;
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

    v_add := case
      when v_auto and p_service = 'house_sitting' and a.house_additional_less is not null
        then public.round_to_dollars(v_base * (1 - a.house_additional_less / 100.0))
      when v_auto and a.stay_additional_less_cents is not null
        then greatest(0, v_base - a.stay_additional_less_cents)
      else s.additional_pet_rate_cents
    end;

    -- ...a holiday raises it again (and the additional dogs' rate with it).
    -- Overlapping periods (Christmas and New Year) count once.
    if v_holiday then
      if v_auto and a.stay_holiday is not null then
        v_unit := public.round_to_dollars(v_unit * (1 + a.stay_holiday / 100.0));
        v_add  := public.round_to_dollars(v_add * (1 + a.stay_holiday / 100.0));
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

    -- Extended care: time past the 24-hour cycle on the last day.
    if p_service in ('boarding', 'house_sitting') and v_gap >= 1
       and p_dropoff_time is not null and p_pickup_time is not null then
      v_hours := extract(epoch from (p_pickup_time - p_dropoff_time)) / 3600.0;
      if v_hours >= 8 then
        v_care := v_unit + v_extras * v_add;
      elsif v_hours > 2 then
        v_care := public.round_to_dollars((v_unit + v_extras * v_add) * 0.5);
      end if;
    end if;
  end if;

  return query select
    v_unit,
    v_add,
    v_kind,
    v_qty,
    v_extras * v_add * v_qty
      + case when p_pickup then coalesce(s.pickup_dropoff_rate_cents, 0) else 0 end
      + v_care,
    v_unit * v_qty
      + v_extras * v_add * v_qty
      + case when p_pickup then coalesce(s.pickup_dropoff_rate_cents, 0) else 0 end
      + v_care,
    v_care;
end;
$$;

grant execute on function public.stay_price(
  uuid, public.service_type, date, date, integer, boolean, boolean, integer, time, time, boolean
) to authenticated;

-- ---------------------------------------------------------------------------
-- Modify an open request. The Havener may also change the length of a walk or
-- visit and add or subtract an amount; an owner's change keeps both as they
-- were.
-- ---------------------------------------------------------------------------
drop function if exists public.modify_booking_request(uuid, date, date, time, time, time, time, boolean, text);

create or replace function public.modify_booking_request(
  p_booking_id       uuid,
  p_start            date,
  p_end              date,
  p_dropoff_from     time,
  p_dropoff_to       time,
  p_pickup_from      time,
  p_pickup_to        time,
  p_wants_pickup     boolean,
  p_notes            text,
  p_duration         integer default null,
  p_adjustment_cents integer default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  b           public.bookings;
  pets        integer;
  has_puppy   boolean;
  all_cats    boolean;
  pr          record;
  fee         integer;
  v_duration  integer;
  v_adjust    integer;
  v_total     integer;
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
         ), false),
         coalesce(bool_and(p.species::text = 'cat'), false)
    into has_puppy, all_cats
  from public.booking_pets bp
  join public.pets p on p.id = bp.pet_id
  where bp.booking_id = b.id;

  -- Only the Havener sets the length and the adjustment.
  v_duration := b.duration_minutes;
  v_adjust   := b.adjustment_cents;
  if auth.uid() = b.sitter_id then
    if p_duration in (30, 60) and b.service_type in ('dog_walking', 'drop_in_visit') then
      v_duration := p_duration;
    end if;
    if p_adjustment_cents is not null then
      v_adjust := (round(p_adjustment_cents / 100.0))::integer * 100;
    end if;
  end if;

  select * into pr
  from public.stay_price(
    b.sitter_id, b.service_type, p_start, p_end, pets, p_wants_pickup,
    has_puppy, v_duration, p_dropoff_from, p_pickup_from, all_cats
  );

  v_total := pr.total_cents + v_adjust;
  if v_total < 0 then
    raise exception 'The adjustment can''t be larger than the total';
  end if;
  fee := round(v_total * b.commission_percent / 100.0);

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
      duration_minutes          = v_duration,
      base_rate_cents           = pr.unit_cents,
      additional_pet_rate_cents = pr.additional_cents,
      rate_kind                 = pr.rate_kind,
      extra_fees_cents          = pr.extra_cents,
      extended_care_cents       = pr.care_cents,
      adjustment_cents          = v_adjust,
      total_cents               = v_total,
      platform_fee_cents        = fee,
      sitter_payout_cents       = v_total - fee,
      owner_booked_at           = null,
      sitter_booked_at          = null
  where id = b.id;

  perform set_config('havenr.trusted_write', 'off', true);
end;
$$;

grant execute on function public.modify_booking_request(
  uuid, date, date, time, time, time, time, boolean, text, integer, integer
) to authenticated;

-- ---------------------------------------------------------------------------
-- When a booking is confirmed, point each side to the guide that helps most.
-- ---------------------------------------------------------------------------
create or replace function public.notify_booking_guides()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'confirmed' and old.status is distinct from 'confirmed' then
    perform public.notify_user(
      new.sitter_id, 'guide', 'Tips before you welcome this pet',
      'A short checklist for the day before: your space, the pet''s notes and the first photo.',
      '/resources/haveners/before-welcoming-a-pet', new.id, 'guide-sitter:' || new.id
    );
    perform public.notify_user(
      new.owner_id, 'guide', 'What to pack for the stay',
      'Food, medication, leash and the little things that make a pet feel at home.',
      '/resources/owners/what-to-pack', new.id, 'guide-owner:' || new.id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_notify_guides on public.bookings;
create trigger bookings_notify_guides
  after update on public.bookings
  for each row execute function public.notify_booking_guides();
