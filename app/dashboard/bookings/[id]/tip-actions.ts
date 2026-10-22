'use server';

import { redirect } from 'next/navigation';

import type { BookingRow, SitterProfileRow } from '@/lib/database.types';
import { requireProfile } from '@/lib/auth';
import { TIP_PERCENTS, tipCents } from '@/lib/tips';
import { getStripe, siteUrl } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export type TipState = { error: string | null };

/**
 * A tip is its own payment: after the service, the owner picks 10 / 15 / 20 /
 * 25 % of what they paid and Stripe Checkout charges it. All of it goes to the
 * Havener (no Havenr fee). The webhook adds it to the booking once it clears.
 */
export async function createTipCheckoutAction(
  bookingId: string,
  percent: number
): Promise<TipState> {
  const profile = await requireProfile();
  const stripe = getStripe();
  if (!stripe) return { error: 'Online payments aren’t turned on yet.' };
  if (!TIP_PERCENTS.includes(percent as (typeof TIP_PERCENTS)[number])) {
    return { error: 'Choose one of the suggested tips.' };
  }

  const supabase = await createClient();
  const { data } = await supabase.from('bookings').select('*').eq('id', bookingId).maybeSingle();
  const booking = data as BookingRow | null;
  if (!booking || booking.owner_id !== profile.id) return { error: 'Booking not found.' };
  if (booking.status !== 'completed' && booking.status !== 'pending_payout' && booking.status !== 'paid_out') {
    return { error: 'You can leave a tip once the service is finished.' };
  }
  if (booking.payment_status !== 'paid') {
    return { error: 'Tips are added to bookings that were paid through Havenr.' };
  }
  if (booking.tip_cents > 0) return { error: 'You already left a tip for this booking. Thank you!' };

  const { data: sitterRow } = await supabase
    .from('sitter_profiles')
    .select('stripe_account_id, stripe_charges_enabled')
    .eq('id', booking.sitter_id)
    .maybeSingle();
  const sitter = sitterRow as Pick<
    SitterProfileRow,
    'stripe_account_id' | 'stripe_charges_enabled'
  > | null;
  if (!sitter?.stripe_account_id || !sitter.stripe_charges_enabled) {
    return { error: 'This Havener can’t receive tips yet.' };
  }

  const amount = tipCents(booking.total_cents, percent);
  if (amount < 100) return { error: 'That tip is too small to process.' };

  const base = siteUrl();
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: profile.email ?? undefined,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: amount,
          product_data: { name: `Tip for your Havener — ${percent}%` },
        },
        quantity: 1,
      },
    ],
    // No application fee: the tip goes to the Havener in full.
    payment_intent_data: {
      transfer_data: { destination: sitter.stripe_account_id },
      metadata: { booking_id: booking.id, kind: 'tip' },
    },
    metadata: { booking_id: booking.id, kind: 'tip', tip_cents: String(amount) },
    success_url: `${base}/dashboard/bookings/${booking.id}?tipped=1`,
    cancel_url: `${base}/dashboard/bookings/${booking.id}`,
  });

  if (!session.url) return { error: 'Could not start checkout.' };
  redirect(session.url);
}
