-- ============================================================================
-- Havenr — 0015_calendar_capacity.sql
-- Calendar with spaces per service. A Havener sets how many pets they accept
-- for each service (a default, plus per-day overrides), and a day only counts
-- as available while booked pets are below that number.
--
-- Run once in the Supabase SQL editor.
-- ============================================================================

create table if not exists public.sitter_service_capacity (
  sitter_id    uuid not null references public.sitter_profiles (id) on delete cascade,
  service_type public.service_type not null,
  spaces       int not null check (spaces between 0 and 50),
  primary key (sitter_id, service_type)
);

create table if not exists public.sitter_capacity_overrides (
  sitter_id    uuid not null references public.sitter_profiles (id) on delete cascade,
  date         date not null,
  service_type public.service_type not null,
  spaces       int not null check (spaces between 0 and 50),
  primary key (sitter_id, date, service_type)
);

create index if not exists sitter_capacity_overrides_date_idx
  on public.sitter_capacity_overrides (sitter_id, date);

alter table public.sitter_service_capacity   enable row level security;
alter table public.sitter_capacity_overrides enable row level security;

-- The sitter manages their own; everyone can read an approved sitter's
-- capacity (search needs it); staff can read all.
drop policy if exists "capacity: sitter all" on public.sitter_service_capacity;
create policy "capacity: sitter all"
  on public.sitter_service_capacity for all
  using (auth.uid() = sitter_id) with check (auth.uid() = sitter_id);

drop policy if exists "capacity: public reads approved" on public.sitter_service_capacity;
create policy "capacity: public reads approved"
  on public.sitter_service_capacity for select
  using (public.sitter_is_approved(sitter_id) or public.is_staff());

drop policy if exists "capacity overrides: sitter all" on public.sitter_capacity_overrides;
create policy "capacity overrides: sitter all"
  on public.sitter_capacity_overrides for all
  using (auth.uid() = sitter_id) with check (auth.uid() = sitter_id);

drop policy if exists "capacity overrides: public reads approved" on public.sitter_capacity_overrides;
create policy "capacity overrides: public reads approved"
  on public.sitter_capacity_overrides for select
  using (public.sitter_is_approved(sitter_id) or public.is_staff());

-- ---------------------------------------------------------------------------
-- Which of these Haveners can NOT take `p_pets` more pets of `p_service` on
-- every day from p_start to p_end? Security definer so an owner searching can
-- count other owners' confirmed bookings without being able to read them.
--  * a day the Havener blocked outright has 0 spaces;
--  * otherwise spaces = that day's override, else their default for the
--    service, else their general "max pets per day";
--  * booked = pets on confirmed / in-progress bookings of that service that
--    cover the day (open requests don't hold a space).
-- ---------------------------------------------------------------------------
create or replace function public.sitters_unavailable(
  p_sitter_ids uuid[],
  p_service    public.service_type,
  p_start      date,
  p_end        date,
  p_pets       int default 1
)
returns table (sitter_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  with days as (
    select generate_series(p_start, p_end, interval '1 day')::date as day
  ),
  cap as (
    select s.id as sitter_id, d.day,
      case
        when exists (
          select 1 from public.sitter_availability a
          where a.sitter_id = s.id and a.date = d.day and a.is_available = false
        ) then 0
        else coalesce(
          (select o.spaces from public.sitter_capacity_overrides o
            where o.sitter_id = s.id and o.date = d.day and o.service_type = p_service),
          (select c.spaces from public.sitter_service_capacity c
            where c.sitter_id = s.id and c.service_type = p_service),
          s.max_pets_per_day
        )
      end as spaces
    from public.sitter_profiles s
    cross join days d
    where s.id = any (p_sitter_ids)
  ),
  used as (
    select b.sitter_id, d.day, sum(pc.n)::int as booked
    from public.bookings b
    join days d on d.day between b.start_date and coalesce(b.end_date, b.start_date)
    join lateral (
      select greatest(1, count(*))::int as n
      from public.booking_pets bp where bp.booking_id = b.id
    ) pc on true
    where b.sitter_id = any (p_sitter_ids)
      and b.service_type = p_service
      and b.status in ('confirmed', 'in_progress')
    group by b.sitter_id, d.day
  )
  select distinct cap.sitter_id
  from cap
  left join used u on u.sitter_id = cap.sitter_id and u.day = cap.day
  where cap.spaces - coalesce(u.booked, 0) < p_pets;
$$;

grant execute on function public.sitters_unavailable(uuid[], public.service_type, date, date, int)
  to anon, authenticated;
