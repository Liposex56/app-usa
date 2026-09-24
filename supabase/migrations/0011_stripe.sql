-- ============================================================================
-- Havenr — 0011_stripe.sql
-- Wires the columns Stripe Connect (payouts) and Stripe Identity (automated
-- document verification) need. The code that uses these (lib/stripe.ts,
-- app/api/stripe/webhook, the Havener payments dashboard, the "Pay now"
-- checkout button) is fully written and safe to deploy with no Stripe
-- account yet — every Stripe call short-circuits with a clear "payments
-- aren't turned on yet" message until STRIPE_SECRET_KEY is set in the
-- environment. Nothing here changes behavior until that key exists.
-- ============================================================================

alter table public.sitter_profiles
  add column if not exists stripe_account_id text unique,
  add column if not exists stripe_charges_enabled boolean not null default false,
  add column if not exists stripe_payouts_enabled boolean not null default false,
  add column if not exists stripe_identity_session_id text,
  add column if not exists stripe_identity_status text
    check (stripe_identity_status is null or stripe_identity_status in
      ('not_started', 'processing', 'verified', 'requires_input'));

do $$ begin create type public.booking_payment_status as enum (
  'unpaid', 'processing', 'paid', 'refunded', 'failed');
exception when duplicate_object then null; end $$;

alter table public.bookings
  add column if not exists stripe_payment_intent_id text,
  add column if not exists payment_status public.booking_payment_status not null default 'unpaid';

-- No new RLS needed: "sitters: read own" (0002_rls.sql) already scopes the
-- new stripe_* columns to the Havener themselves, and they were never added
-- to the public_sitters view (0006), so they can't leak publicly.
