'use server';

import { redirect } from 'next/navigation';

import type { BookingRow, SitterProfileRow } from '@/lib/database.types';
import { requireProfile } from '@/lib/auth';
import { getStripe, siteUrl } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { serviceName } from '@/lib/services';

export type PayActionState = { error: string | null };

export async function createCheckoutSessionAction(
  bookingId: string
): Promise<PayActionState> {
  const profile = await requireProfile();
  const stripe = getStripe();
  if (!stripe) {
    return {
      error:
        'Payments aren’t turned on yet — Havenr hasn’t connected a Stripe account.',
    };
  }

  const supabase = await createClient();
  const { data: bookingRow } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .maybeSingle();
  const booking = bookingRow as BookingRow | null;
  if (!booking || booking.owner_id !== profile.id) {
    return { error: 'Booking not found.' };
  }
  if (booking.payment_status === 'paid') {
    return { error: 'This booking is already paid.' };
  }
  if (!['confirmed', 'in_progress', 'completed'].includes(booking.status)) {
    return { error: 'This booking can no longer be paid.' };
  }

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
    return {
      error:
        'This Havener hasn’t finished setting up payouts yet — check back soon.',
    };
  }

  const base = siteUrl();
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: booking.total_cents,
          product_data: { name: `${serviceName(booking.service_type)} — Havenr` },
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: booking.platform_fee_cents,
      transfer_data: { destination: sitter.stripe_account_id },
    },
    metadata: { booking_id: booking.id },
    success_url: `${base}/dashboard/bookings/${booking.id}?paid=1`,
    cancel_url: `${base}/dashboard/bookings/${booking.id}`,
  });

  if (!session.url) return { error: 'Could not start checkout.' };
  redirect(session.url);
}
