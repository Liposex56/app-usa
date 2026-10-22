import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

import { getStripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';

/**
 * Handles two event types:
 *  - account.updated: syncs a Havener's charges/payouts-enabled flags once
 *    their Stripe Express onboarding finishes.
 *  - checkout.session.completed: marks the booking paid once the owner
 *    finishes a "Pay now" Checkout session.
 * Returns 200 even when Stripe isn't configured / the signature is missing,
 * for the same reason every other Stripe call in this app no-ops instead of
 * crashing: there's no live account yet, so there's nothing to verify —
 * but a webhook endpoint that 500s gets disabled by Stripe after enough
 * failures, so this stays quiet until a real secret is set.
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ received: true, skipped: 'not_configured' });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const body = await request.text();
  // Stripe gives every endpoint its own signing secret. The platform's events
  // and the connected accounts' events (account.updated) can be two endpoints
  // on this same URL, so STRIPE_WEBHOOK_SECRET may hold several, comma-separated.
  const secrets = webhookSecret
    .split(',')
    .map((secret) => secret.trim())
    .filter(Boolean);
  let event: Stripe.Event | null = null;
  let failure = 'Invalid signature';
  for (const secret of secrets) {
    try {
      event = stripe.webhooks.constructEvent(body, signature, secret);
      break;
    } catch (err) {
      failure = err instanceof Error ? err.message : failure;
    }
  }
  if (!event) return NextResponse.json({ error: failure }, { status: 400 });

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ received: true, skipped: 'no_service_role_key' });
  }

  switch (event.type) {
    case 'account.updated': {
      const account = event.data.object as Stripe.Account;
      await supabase
        .from('sitter_profiles')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({
          stripe_charges_enabled: account.charges_enabled ?? false,
          stripe_payouts_enabled: account.payouts_enabled ?? false,
        } as never)
        .eq('stripe_account_id', account.id);
      break;
    }

    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.booking_id;

      // A tip is its own payment: it only adds to the booking's tip.
      if (session.metadata?.kind === 'tip') {
        const tip = Number(session.metadata.tip_cents);
        if (bookingId && session.payment_status === 'paid' && Number.isFinite(tip) && tip > 0) {
          const { data: current } = await supabase
            .from('bookings')
            .select('tip_cents, sitter_id')
            .eq('id', bookingId)
            .maybeSingle();
          // Only the first time, so a retried event can't count it twice.
          if (current && current.tip_cents === 0) {
            await supabase
              .from('bookings')
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .update({ tip_cents: tip } as never)
              .eq('id', bookingId);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any).rpc('notify_user', {
              p_user: current.sitter_id,
              p_kind: 'tip',
              p_title: 'You received a tip',
              p_body: `A pet owner left you a $${(tip / 100).toFixed(2)} tip. It goes to your account in full.`,
              p_href: `/dashboard/bookings/${bookingId}`,
              p_booking: bookingId,
              p_dedupe: `tip:${bookingId}`,
            });
          }
        }
        break;
      }

      // Paying is only real once Stripe says the money arrived.
      if (bookingId && session.payment_status === 'paid') {
        const now = new Date().toISOString();
        const { data: current } = await supabase
          .from('bookings')
          .select('status, sitter_booked_at, owner_booked_at')
          .eq('id', bookingId)
          .maybeSingle();

        // Paying is the owner's "Book". If the Havener has already booked too,
        // the service is now confirmed; otherwise it stays pending.
        const stillOpen = current?.status === 'requested';
        const bothBooked = stillOpen && Boolean(current?.sitter_booked_at);
        await supabase
          .from('bookings')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .update({
            payment_status: 'paid',
            stripe_payment_intent_id:
              typeof session.payment_intent === 'string' ? session.payment_intent : null,
            ...(stillOpen ? { owner_booked_at: current?.owner_booked_at ?? now } : {}),
            ...(bothBooked ? { status: 'confirmed', confirmed_at: now } : {}),
          } as never)
          .eq('id', bookingId);
      }
      break;
    }

    case 'identity.verification_session.verified': {
      const session = event.data.object as Stripe.Identity.VerificationSession;
      const sitterId = session.metadata?.sitter_id;
      if (sitterId) {
        await supabase
          .from('sitter_profiles')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .update({
            stripe_identity_status: 'verified',
            // An ID + selfie match is *identity*, not a criminal check: the
            // "Background checked" badge comes from background_checks.
            identity_status: 'approved',
          } as never)
          .eq('id', sitterId);
      }
      break;
    }

    case 'identity.verification_session.requires_input': {
      const session = event.data.object as Stripe.Identity.VerificationSession;
      const sitterId = session.metadata?.sitter_id;
      if (sitterId) {
        await supabase
          .from('sitter_profiles')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .update({
            stripe_identity_status: 'requires_input',
            identity_status: 'rejected',
          } as never)
          .eq('id', sitterId);
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
