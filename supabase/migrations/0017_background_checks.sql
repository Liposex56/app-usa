-- ============================================================================
-- Havenr — 0017_background_checks.sql
-- Identity verification and criminal-background checks are two different
-- things, and the public "Background checked" badge must only mean the second.
--
--   * identity_status          — government ID + live selfie (Stripe Identity)
--   * background_check_status  — criminal-record check, run by a screening
--                                provider (Checkr) or recorded by staff
--
-- Until now the Stripe Identity flow wrote background_check_status, so an ID
-- match alone would have lit the "Background checked" badge. This separates
-- them, adds the table that tracks a check from invitation to result, and
-- keeps background_check_status in sync with it.
-- ============================================================================

alter table public.sitter_profiles
  add column if not exists identity_status public.check_status not null default 'not_started';

-- ---------------------------------------------------------------------------
-- The trust-column guard. Two fixes:
--   1. identity_status is staff/webhook-owned like the other checks.
--   2. Writes with no signed-in user (the Stripe / Checkr webhooks use the
--      service-role key) pass through. Before, the guard reverted them, so a
--      webhook result never stuck. Anonymous callers never reach this trigger:
--      RLS already refuses their UPDATE.
-- ---------------------------------------------------------------------------
create or replace function public.protect_sitter_trust_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_staff() or auth.uid() is null then
    return new;
  end if;

  -- A sitter may move draft -> pending_review (submit for review). Any other
  -- transition is reverted to whatever the row already had.
  if not (old.status = 'draft' and new.status = 'pending_review') then
    new.status := old.status;
  end if;

  new.identity_status         := old.identity_status;
  new.background_check_status := old.background_check_status;
  new.interview_status        := old.interview_status;
  new.home_check_status       := old.home_check_status;
  new.insurance_status        := old.insurance_status;
  new.approved_at             := old.approved_at;
  new.rejection_reason        := old.rejection_reason;
  new.rating                  := old.rating;
  new.review_count            := old.review_count;
  new.completed_bookings      := old.completed_bookings;
  new.response_time_minutes   := old.response_time_minutes;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- background_checks — one row per Havener, from invitation to result.
--
-- status:
--   not_started  nothing sent yet
--   invited      the provider's invitation was created; waiting for the Havener
--   processing   the Havener submitted their details; the provider is running it
--   clear        no records found                 -> badge on
--   consider     the provider found something     -> staff must review by hand
--   rejected     staff decided against the Havener
--   expired      invitation or result no longer valid
--
-- Sensitive results (what a report actually contains) never come into
-- Havenr's database: the provider keeps them and we store only the verdict.
-- ---------------------------------------------------------------------------
create table if not exists public.background_checks (
  sitter_id              uuid primary key references public.sitter_profiles (id) on delete cascade,
  provider               text not null default 'manual' check (provider in ('checkr', 'manual')),
  status                 text not null default 'not_started' check (
                           status in ('not_started', 'invited', 'processing', 'clear', 'consider', 'rejected', 'expired')
                         ),
  provider_candidate_id  text,
  provider_invitation_id text,
  provider_report_id     text,
  invitation_url         text,
  invited_at             timestamptz,
  completed_at           timestamptz,
  reviewed_by            uuid references public.profiles (id),
  reviewed_at            timestamptz,
  -- Shown to the Havener: what staff decided and, if it's a no, why.
  note                   text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists background_checks_status_idx on public.background_checks (status);

drop trigger if exists background_checks_set_updated_at on public.background_checks;
create trigger background_checks_set_updated_at
  before update on public.background_checks
  for each row execute function public.set_updated_at();

alter table public.background_checks enable row level security;

drop policy if exists "background_checks: sitter reads own" on public.background_checks;
create policy "background_checks: sitter reads own"
  on public.background_checks for select
  using (sitter_id = auth.uid());

drop policy if exists "background_checks: staff all" on public.background_checks;
create policy "background_checks: staff all"
  on public.background_checks for all
  using (public.is_staff())
  with check (public.is_staff());

-- A Havener starts (or restarts) their own check, and only that: the row can
-- only go to `invited`, from a state where nothing is in flight. Results come
-- from the webhook (service role) or staff.
create or replace function public.start_background_check(
  p_provider text,
  p_candidate_id text,
  p_invitation_id text,
  p_invitation_url text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_current text;
begin
  if v_uid is null then
    raise exception 'Not signed in';
  end if;
  if p_provider not in ('checkr', 'manual') then
    raise exception 'Unknown provider';
  end if;
  if not exists (select 1 from public.sitter_profiles where id = v_uid) then
    raise exception 'Create your Havener profile first';
  end if;

  select status into v_current from public.background_checks where sitter_id = v_uid;
  if v_current in ('processing', 'clear', 'consider', 'rejected') then
    raise exception 'A background check is already in progress or finished';
  end if;

  insert into public.background_checks as bc
    (sitter_id, provider, status, provider_candidate_id, provider_invitation_id, invitation_url, invited_at)
  values
    (v_uid, p_provider, 'invited', p_candidate_id, p_invitation_id, p_invitation_url, now())
  on conflict (sitter_id) do update
    set provider = excluded.provider,
        status = 'invited',
        provider_candidate_id = excluded.provider_candidate_id,
        provider_invitation_id = excluded.provider_invitation_id,
        invitation_url = excluded.invitation_url,
        invited_at = now();
end;
$$;

grant execute on function public.start_background_check(text, text, text, text) to authenticated;

-- Keep sitter_profiles.background_check_status — what the badge, the
-- "Certified" calculation and the dashboard read — in step with the row above.
create or replace function public.sync_background_check_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status public.check_status;
begin
  v_status := case new.status
    when 'clear'      then 'approved'
    when 'rejected'   then 'rejected'
    when 'expired'    then 'expired'
    when 'not_started' then 'not_started'
    -- invited / processing / consider: not decided yet
    else 'pending'
  end;

  update public.sitter_profiles
     set background_check_status = v_status
   where id = new.sitter_id
     and background_check_status is distinct from v_status;

  if new.status = 'clear' and new.completed_at is null then
    new.completed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists background_checks_sync on public.background_checks;
create trigger background_checks_sync
  before insert or update of status on public.background_checks
  for each row execute function public.sync_background_check_status();
