'use server';

import { revalidatePath } from 'next/cache';

import { requireStaff } from '@/lib/auth';
import { refundBookingPayment } from '@/lib/refunds';
import { createClient } from '@/lib/supabase/server';
import { text } from '@/lib/utils';

export type CancellationDecisionState = { error: string | null };

/**
 * Havenr's decision on a cancellation request. Confirming cancels the
 * booking (who asked and why are kept); declining clears the request and the
 * booking stays as it was. Either way both sides are told in the chat.
 */
export async function decideCancellationAction(
  _prev: CancellationDecisionState,
  formData: FormData
): Promise<CancellationDecisionState> {
  const { profile } = await requireStaff();

  const bookingId = text(formData, 'bookingId');
  const decision = text(formData, 'decision');
  if (!bookingId || (decision !== 'confirm' && decision !== 'decline')) {
    return { error: 'Invalid request.' };
  }

  const supabase = await createClient();
  const { data: booking } = await supabase
    .from('bookings')
    .select(
      'id, owner_id, sitter_id, status, cancellation_requested_at, cancellation_requested_by, cancellation_request_reason'
    )
    .eq('id', bookingId)
    .maybeSingle();

  if (!booking || !booking.cancellation_requested_at) {
    return { error: 'There is no cancellation request on this booking.' };
  }

  const now = new Date().toISOString();
  const patch =
    decision === 'confirm'
      ? {
          status: 'cancelled',
          cancelled_at: now,
          cancelled_by: booking.cancellation_requested_by ?? profile.id,
          cancellation_reason: booking.cancellation_request_reason,
        }
      : {
          cancellation_requested_at: null,
          cancellation_requested_by: null,
          cancellation_request_reason: null,
        };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('bookings') as any).update(patch).eq('id', bookingId);
  if (error) return { error: error.message };

  // A confirmed cancellation is inside the Havener's window, so the owner is
  // refunded in full (the payout and Havenr's fee are taken back with it).
  const refund = decision === 'confirm' ? await refundBookingPayment(bookingId) : null;

  // Tell both sides, from the person who asked so it reads naturally in the thread.
  const asker = booking.cancellation_requested_by ?? booking.owner_id;
  const other = asker === booking.owner_id ? booking.sitter_id : booking.owner_id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('messages') as any).insert({
    booking_id: bookingId,
    sender_id: profile.id,
    recipient_id: other,
    body:
      decision === 'confirm'
        ? 'Havenr confirmed the cancellation of this booking.'
        : 'Havenr reviewed the cancellation request and the booking stays as it was.',
  });

  revalidatePath('/dashboard/admin/cancellations');
  revalidatePath('/dashboard/admin');
  revalidatePath(`/dashboard/bookings/${bookingId}`);
  if (refund?.error) {
    return {
      error: `Cancelled, but the automatic refund didn’t go through (${refund.error}). Refund it from the Stripe dashboard.`,
    };
  }
  return { error: null };
}
