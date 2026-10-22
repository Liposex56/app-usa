-- ============================================================================
-- Havenr — 0020_payment_columns_protected.sql
--
-- Before online payments go live: whether a booking is paid (or refunded), its
-- Stripe PaymentIntent and the tip are written only by Stripe's webhook and by
-- the server (service role) — never by an owner or a Havener through the API.
-- Without this, a pet owner could mark their own booking "paid".
--
-- This is the transition guard of 0019 plus three frozen columns. Staff and
-- trusted writes (no auth.uid(): the webhook, the service role) still pass.
-- Apply after 0019. Idempotent.
-- ============================================================================

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
  new.payment_status            := old.payment_status;
  new.stripe_payment_intent_id  := old.stripe_payment_intent_id;
  new.tip_cents                 := old.tip_cents;

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
