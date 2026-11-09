-- ============================================================================
-- Havenr — 0022_report_block_archive.sql
--
-- From Jessica's list on the Report and Archive buttons:
--  1. Report: the reporter picks what happened (inappropriate behaviour,
--     fraud, a request to pay outside the platform, threats, other), and can
--     also block the other person.
--  2. Blocking: a blocked pair can't message each other or send new requests.
--     Each person manages their own list.
--  3. Archive: only for requests that were never booked or won't be accepted.
--     It asks for a reason, and a confirmed or active booking can't be archived
--     — it has to go through cancellation first.
--
-- Apply after 0021. Everything is idempotent.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Report categories
-- ---------------------------------------------------------------------------
alter table public.booking_reports
  add column if not exists category text not null default 'other';

alter table public.booking_reports drop constraint if exists booking_reports_category_check;
alter table public.booking_reports
  add constraint booking_reports_category_check
  check (category in ('inappropriate_behavior', 'fraud', 'off_platform_payment', 'threats', 'other'));

-- ---------------------------------------------------------------------------
-- 2. Blocking
-- ---------------------------------------------------------------------------
create table if not exists public.blocked_users (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.blocked_users enable row level security;

drop policy if exists "blocked_users: read own" on public.blocked_users;
create policy "blocked_users: read own"
  on public.blocked_users for select
  using (blocker_id = auth.uid() or public.is_staff());

drop policy if exists "blocked_users: block" on public.blocked_users;
create policy "blocked_users: block"
  on public.blocked_users for insert
  with check (blocker_id = auth.uid());

drop policy if exists "blocked_users: unblock" on public.blocked_users;
create policy "blocked_users: unblock"
  on public.blocked_users for delete
  using (blocker_id = auth.uid());

-- True when either of the two has blocked the other.
create or replace function public.is_blocked_between(p_a uuid, p_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.blocked_users
    where (blocker_id = p_a and blocked_id = p_b)
       or (blocker_id = p_b and blocked_id = p_a)
  )
$$;

grant execute on function public.is_blocked_between(uuid, uuid) to authenticated;

-- The people I blocked, with the name to show (profiles are private).
create or replace function public.my_blocked_users()
returns table (id uuid, display_name text, blocked_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.display_name, b.created_at
  from public.blocked_users b
  join public.profiles p on p.id = b.blocked_id
  where b.blocker_id = auth.uid()
  order by b.created_at desc
$$;

grant execute on function public.my_blocked_users() to authenticated;

-- A blocked pair can't message each other...
create or replace function public.reject_blocked_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_blocked_between(new.sender_id, new.recipient_id) then
    raise exception 'You can''t message this person.';
  end if;
  return new;
end;
$$;

drop trigger if exists messages_reject_blocked on public.messages;
create trigger messages_reject_blocked
  before insert on public.messages
  for each row execute function public.reject_blocked_message();

-- ...nor send each other new requests.
create or replace function public.reject_blocked_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_blocked_between(new.owner_id, new.sitter_id) then
    raise exception 'You can''t send a request to this person.';
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_reject_blocked on public.bookings;
create trigger bookings_reject_blocked
  before insert on public.bookings
  for each row execute function public.reject_blocked_booking();

-- ---------------------------------------------------------------------------
-- 3. Archive: a reason each time, and only for requests that never went ahead
-- ---------------------------------------------------------------------------
create table if not exists public.booking_archives (
  booking_id uuid not null references public.bookings (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  reason     text not null check (char_length(reason) between 2 and 500),
  created_at timestamptz not null default now(),
  primary key (booking_id, user_id)
);

alter table public.booking_archives enable row level security;

drop policy if exists "booking_archives: own" on public.booking_archives;
create policy "booking_archives: own"
  on public.booking_archives for all
  using (user_id = auth.uid() or public.is_staff())
  with check (user_id = auth.uid());

-- A confirmed or active booking can't be archived directly (un-archiving is fine).
create or replace function public.guard_archive()
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

  if ((new.archived_by_owner and not old.archived_by_owner)
      or (new.archived_by_sitter and not old.archived_by_sitter))
     and new.status in ('confirmed', 'in_progress') then
    raise exception 'A confirmed booking can''t be archived — cancel it first.';
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_guard_archive on public.bookings;
create trigger bookings_guard_archive
  before update on public.bookings
  for each row execute function public.guard_archive();
