-- ============================================================================
-- Havenr — 0008_bookings_chat_reviews.sql
-- The core marketplace loop the proposal calls "reservas" (§7), "chat
-- interno" (§9) and "reseñas de publicación doble" (§10.3).
--
-- Payment is NOT wired here — there is no payment gateway account yet
-- (proposal §17 lists "proveedor para marketplace", e.g. Stripe Connect;
-- see lib/payments.ts). A booking moves straight from `requested` to
-- `confirmed` when the Havener accepts; `total_cents` / the 20-80 split
-- from computeFeeSplit() are recorded on the row so the real charge can be
-- wired in later without changing this schema.
--
-- Also NOT wired: background-check / SSN / insurance verification through
-- a specialized external provider (proposal §12) — that still needs a
-- vendor account. Until then staff keep approving `sitter_insurance` by
-- hand from /dashboard/admin/insurance, same as today.
-- ============================================================================

do $$ begin create type public.booking_status as enum (
  'requested', 'confirmed', 'in_progress', 'completed',
  'pending_payout', 'paid_out', 'cancelled', 'declined', 'disputed', 'refunded');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------------
create table if not exists public.bookings (
  id                        uuid primary key default gen_random_uuid(),
  owner_id                  uuid not null references public.profiles (id),
  sitter_id                 uuid not null references public.sitter_profiles (id),
  service_type              public.service_type not null,
  status                    public.booking_status not null default 'requested',

  start_date                date not null,
  end_date                  date,
  start_time                time,
  end_time                  time,

  owner_notes               text, -- sent with the request
  decline_reason            text,
  cancellation_reason       text,
  cancelled_by              uuid references public.profiles (id),

  -- Money, in cents. Recorded at request time from the sitter's published
  -- rate so both sides see the same total before any gateway is wired in.
  base_rate_cents           int not null default 0,
  additional_pet_rate_cents int not null default 0,
  extra_fees_cents          int not null default 0,
  tip_cents                 int not null default 0,
  commission_percent        numeric(5,2) not null default 20.00,
  platform_fee_cents        int not null default 0,
  sitter_payout_cents       int not null default 0,
  total_cents               int not null default 0,

  requested_at              timestamptz not null default now(),
  confirmed_at              timestamptz,
  started_at                timestamptz,
  completed_at              timestamptz,
  paid_out_at               timestamptz,
  cancelled_at              timestamptz,

  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index if not exists bookings_owner_idx on public.bookings (owner_id);
create index if not exists bookings_sitter_idx on public.bookings (sitter_id);
create index if not exists bookings_status_idx on public.bookings (status);

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

-- Pets included in the booking (a stay can cover more than one).
create table if not exists public.booking_pets (
  booking_id uuid not null references public.bookings (id) on delete cascade,
  pet_id     uuid not null references public.pets (id),
  primary key (booking_id, pet_id)
);

-- A Havener may only read a pet once a booking naming that pet exists and
-- has moved past the request stage — never while it's still just a request.
create or replace function public.sitter_has_booking_for_pet(p_pet_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.booking_pets bp
    join public.bookings b on b.id = bp.booking_id
    where bp.pet_id = p_pet_id
      and b.sitter_id = auth.uid()
      and b.status not in ('requested', 'declined', 'cancelled')
  );
$$;

drop policy if exists "pets: sitter reads via booking" on public.pets;
create policy "pets: sitter reads via booking"
  on public.pets for select
  using (public.sitter_has_booking_for_pet(id));

-- Only the two participants (or staff) may act on a booking; guard the
-- transitions themselves so neither side can jump the queue from the client.
create or replace function public.protect_booking_transitions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_staff() then
    return new;
  end if;

  -- Money and payout bookkeeping are staff/system-owned once a booking
  -- exists; a party can only move `status` (and only within the allowed
  -- transitions below) plus the small set of fields tied to that move.
  new.base_rate_cents           := old.base_rate_cents;
  new.additional_pet_rate_cents := old.additional_pet_rate_cents;
  new.extra_fees_cents          := old.extra_fees_cents;
  new.commission_percent        := old.commission_percent;
  new.platform_fee_cents        := old.platform_fee_cents;
  new.sitter_payout_cents       := old.sitter_payout_cents;
  new.total_cents                := old.total_cents;
  new.paid_out_at                := old.paid_out_at;

  if new.status is distinct from old.status then
    if auth.uid() = old.sitter_id
       and old.status = 'requested'
       and new.status in ('confirmed', 'declined') then
      -- Havener accepts or declines a request.
      if new.status = 'confirmed' then new.confirmed_at := now(); end if;
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
      -- Any other attempted jump is silently reverted.
      new.status := old.status;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists bookings_protect_transitions on public.bookings;
create trigger bookings_protect_transitions
  before update on public.bookings
  for each row execute function public.protect_booking_transitions();

alter table public.bookings     enable row level security;
alter table public.booking_pets enable row level security;

drop policy if exists "bookings: participants read" on public.bookings;
create policy "bookings: participants read"
  on public.bookings for select
  using (auth.uid() = owner_id or auth.uid() = sitter_id or public.is_staff());

drop policy if exists "bookings: owner creates" on public.bookings;
create policy "bookings: owner creates"
  on public.bookings for insert
  with check (auth.uid() = owner_id and status = 'requested');

drop policy if exists "bookings: participants update" on public.bookings;
create policy "bookings: participants update"
  on public.bookings for update
  using (auth.uid() = owner_id or auth.uid() = sitter_id or public.is_staff())
  with check (auth.uid() = owner_id or auth.uid() = sitter_id or public.is_staff());

drop policy if exists "booking_pets: participants read" on public.booking_pets;
create policy "booking_pets: participants read"
  on public.booking_pets for select
  using (exists (
    select 1 from public.bookings b
    where b.id = booking_id
      and (auth.uid() = b.owner_id or auth.uid() = b.sitter_id or public.is_staff())
  ));

drop policy if exists "booking_pets: owner inserts" on public.booking_pets;
create policy "booking_pets: owner inserts"
  on public.booking_pets for insert
  with check (exists (
    select 1 from public.bookings b
    where b.id = booking_id and b.owner_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- messages — in-app chat scoped to a booking. §9: the app never blocks a
-- message from sending; suspicious content is flagged for staff instead.
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id             uuid primary key default gen_random_uuid(),
  booking_id     uuid not null references public.bookings (id) on delete cascade,
  sender_id      uuid not null references public.profiles (id),
  recipient_id   uuid not null references public.profiles (id),
  body           text not null check (char_length(body) between 1 and 4000),
  flagged        boolean not null default false,
  flagged_reason text,
  read_at        timestamptz,
  created_at     timestamptz not null default now()
);

create index if not exists messages_booking_idx on public.messages (booking_id, created_at);

-- Live chat: let clients subscribe to new rows via Supabase Realtime.
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;

alter table public.messages enable row level security;

drop policy if exists "messages: participants read" on public.messages;
create policy "messages: participants read"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id or public.is_staff());

-- Either participant of the booking may send, at any status — a
-- declined/cancelled thread should stay readable and repliable for support.
drop policy if exists "messages: participants send" on public.messages;
create policy "messages: participants send"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and (b.owner_id = auth.uid() or b.sitter_id = auth.uid())
        and (recipient_id = b.owner_id or recipient_id = b.sitter_id)
        and recipient_id <> sender_id
    )
  );

drop policy if exists "messages: recipient marks read" on public.messages;
create policy "messages: recipient marks read"
  on public.messages for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

drop policy if exists "messages: staff moderate" on public.messages;
create policy "messages: staff moderate"
  on public.messages for update
  using (public.is_staff())
  with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- reviews — double-blind (§10.3): each side's review is invisible to the
-- other, and to the public, until BOTH have submitted one for that booking.
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id              uuid primary key default gen_random_uuid(),
  booking_id      uuid not null references public.bookings (id) on delete cascade,
  reviewer_id     uuid not null references public.profiles (id),
  reviewee_id     uuid not null references public.profiles (id),
  rating          smallint not null check (rating between 1 and 5),
  punctuality     smallint check (punctuality between 1 and 5),
  communication   smallint check (communication between 1 and 5),
  pet_care        smallint check (pet_care between 1 and 5),
  body            text,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  unique (booking_id, reviewer_id)
);

create index if not exists reviews_reviewee_idx on public.reviews (reviewee_id);

-- Publish both reviews for a booking the moment the second one lands, and
-- roll the sitter's rating/review_count up from published reviews only.
create or replace function public.publish_paired_reviews()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
  v_sitter_id uuid;
begin
  select count(*) into v_count from public.reviews where booking_id = new.booking_id;

  if v_count >= 2 then
    update public.reviews
      set published_at = now()
      where booking_id = new.booking_id and published_at is null;
  end if;

  select b.sitter_id into v_sitter_id from public.bookings b where b.id = new.booking_id;

  update public.sitter_profiles s
    set rating = sub.avg_rating,
        review_count = sub.n
    from (
      select round(avg(r.rating)::numeric, 2) as avg_rating, count(*) as n
      from public.reviews r
      where r.reviewee_id = v_sitter_id and r.published_at is not null
    ) sub
    where s.id = v_sitter_id;

  return new;
end;
$$;

drop trigger if exists reviews_publish_paired on public.reviews;
create trigger reviews_publish_paired
  after insert on public.reviews
  for each row execute function public.publish_paired_reviews();

alter table public.reviews enable row level security;

drop policy if exists "reviews: author reads own" on public.reviews;
create policy "reviews: author reads own"
  on public.reviews for select
  using (auth.uid() = reviewer_id);

drop policy if exists "reviews: public reads published" on public.reviews;
create policy "reviews: public reads published"
  on public.reviews for select
  using (published_at is not null);

drop policy if exists "reviews: staff read" on public.reviews;
create policy "reviews: staff read"
  on public.reviews for select
  using (public.is_staff());

drop policy if exists "reviews: participant inserts own" on public.reviews;
create policy "reviews: participant inserts own"
  on public.reviews for insert
  with check (
    auth.uid() = reviewer_id
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and b.status = 'completed'
        and (
          (b.owner_id = reviewer_id and b.sitter_id = reviewee_id)
          or (b.sitter_id = reviewer_id and b.owner_id = reviewee_id)
        )
    )
  );

-- ---------------------------------------------------------------------------
-- Owner identity inside a booking (§7): a Havener must never read an owner's
-- `profiles` row directly — no legal name, phone, address or payment info.
-- This is the one narrow, safe window: the display name and avatar of
-- whichever party in a booking is NOT the caller, and nothing else.
-- ---------------------------------------------------------------------------
create or replace function public.booking_counterparty(p_booking_id uuid)
returns table (id uuid, display_name text, avatar_url text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.display_name, p.avatar_url
  from public.bookings b
  join public.profiles p
    on p.id = case when b.owner_id = auth.uid() then b.sitter_id else b.owner_id end
  where b.id = p_booking_id
    and (b.owner_id = auth.uid() or b.sitter_id = auth.uid() or public.is_staff());
$$;

grant execute on function public.booking_counterparty(uuid) to authenticated;
