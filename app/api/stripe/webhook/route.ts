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
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    return NextResponse.json({ error: message }, { status: 400 });
  }

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
      if (bookingId) {
        await supabase
          .from('bookings')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .update({
            payment_status: 'paid',
            stripe_payment_intent_id:
              typeof session.payment_intent === 'string' ? session.payment_intent : null,
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
            background_check_status: 'approved',
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
            background_check_status: 'rejected',
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
