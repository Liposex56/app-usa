-- ============================================================================
-- Havenr — 0010_owner_profile.sql
-- A Havener-facing view of the pet owner on the other side of a booking:
-- About (joined date, past bookings, verification), Feedback (reviews other
-- Haveners left about this owner) and Pets — matching the reference app's
-- owner profile screens. `profiles` is never publicly readable, so both
-- functions here are the same narrow, booking-scoped security-definer
-- pattern as booking_counterparty(): only the sitter on that exact booking
-- (or the owner themselves, or staff) can call them.
-- ============================================================================

create or replace function public.booking_owner_profile(p_booking_id uuid)
returns table (
  id uuid,
  display_name text,
  avatar_url text,
  city text,
  state text,
  joined_at timestamptz,
  phone_verified boolean,
  email_verified boolean,
  past_bookings_count int
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.display_name,
    p.avatar_url,
    p.city,
    p.state,
    p.created_at,
    p.phone_verified_at is not null,
    exists (
      select 1 from auth.users u
      where u.id = p.id and u.email_confirmed_at is not null
    ),
    (
      select count(*)::int from public.bookings b2
      where b2.owner_id = p.id
        and b2.status in ('completed', 'pending_payout', 'paid_out')
    )
  from public.bookings b
  join public.profiles p on p.id = b.owner_id
  where b.id = p_booking_id
    and (b.sitter_id = auth.uid() or b.owner_id = auth.uid() or public.is_staff());
$$;

grant execute on function public.booking_owner_profile(uuid) to authenticated;

create or replace function public.booking_owner_feedback(p_booking_id uuid)
returns table (
  id uuid,
  rating smallint,
  punctuality smallint,
  communication smallint,
  pet_care smallint,
  body text,
  created_at timestamptz,
  reviewer_first_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.id, r.rating, r.punctuality, r.communication, r.pet_care, r.body, r.created_at,
    split_part(coalesce(p.display_name, 'A Havener'), ' ', 1)
  from public.bookings b
  join public.reviews r
    on r.reviewee_id = b.owner_id and r.published_at is not null
  join public.profiles p on p.id = r.reviewer_id
  where b.id = p_booking_id
    and (b.sitter_id = auth.uid() or b.owner_id = auth.uid() or public.is_staff())
  order by r.created_at desc;
$$;

grant execute on function public.booking_owner_feedback(uuid) to authenticated;

-- Every pet this owner has ever included in a booking with this exact
-- Havener — a superset of the current booking's own pets, so a returning
-- client's other pets show up too. Relies on the same trust boundary as
-- sitter_has_booking_for_pet() (0008): only pets tied to a non-requested
-- booking with this sitter are ever visible to them.
create or replace function public.booking_owner_pets(p_booking_id uuid)
returns setof public.pets
language sql
stable
security definer
set search_path = public
as $$
  select distinct pt.*
  from public.bookings b
  join public.bookings b2
    on b2.owner_id = b.owner_id and b2.sitter_id = b.sitter_id
    and b2.status not in ('requested', 'declined', 'cancelled')
  join public.booking_pets bp on bp.booking_id = b2.id
  join public.pets pt on pt.id = bp.pet_id
  where b.id = p_booking_id
    and (b.sitter_id = auth.uid() or b.owner_id = auth.uid() or public.is_staff());
$$;

grant execute on function public.booking_owner_pets(uuid) to authenticated;
