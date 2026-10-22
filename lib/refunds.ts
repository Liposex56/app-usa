import { getStripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/service';

export type RefundResult = {
  /** True when money was actually sent back. */
  refunded: boolean;
  /** Set when a payment existed but could not be refunded. */
  error: string | null;
};

/**
 * Gives the owner their money back for a booking that was paid online. Called
 * when a request is declined or withdrawn, when a cancellation is confirmed,
 * and when a paid request is modified (the price is recomputed and the owner
 * pays again). The Havener's share and Havenr's fee are taken back too.
 *
 * It does nothing — quietly — when nothing was paid or when payments aren't
 * switched on, so the callers can use it without checking first. The caller is
 * responsible for having authorised the change that triggers it.
 */
export async function refundBookingPayment(bookingId: string): Promise<RefundResult> {
  const stripe = getStripe();
  const service = createServiceClient();
  if (!stripe || !service) return { refunded: false, error: null };

  const { data } = await service
    .from('bookings')
    .select('payment_status, stripe_payment_intent_id')
    .eq('id', bookingId)
    .maybeSingle();
  const booking = data as {
    payment_status: string;
    stripe_payment_intent_id: string | null;
  } | null;
  if (!booking || booking.payment_status !== 'paid' || !booking.stripe_payment_intent_id) {
    return { refunded: false, error: null };
  }

  try {
    await stripe.refunds.create(
      {
        payment_intent: booking.stripe_payment_intent_id,
        reverse_transfer: true,
        refund_application_fee: true,
        metadata: { booking_id: bookingId },
      },
      { idempotencyKey: `refund-${bookingId}-${booking.stripe_payment_intent_id}` }
    );
  } catch (error) {
    return {
      refunded: false,
      error: error instanceof Error ? error.message : 'Stripe could not refund the payment.',
    };
  }

  await service
    .from('bookings')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ payment_status: 'refunded' } as never)
    .eq('id', bookingId);

  return { refunded: true, error: null };
}
