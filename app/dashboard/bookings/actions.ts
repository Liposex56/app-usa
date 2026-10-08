'use server';

import { revalidatePath } from 'next/cache';

import type { BookingRow, MeetGreetRow, MessageRow } from '@/lib/database.types';
import { requireProfile } from '@/lib/auth';
import { sitterIdsWithConflict } from '@/lib/availability';
import { rebuildNotes } from '@/lib/booking-notes';
import { getStripe } from '@/lib/stripe';
import { filterChatMessage } from '@/lib/chat-filter';
import { createClient } from '@/lib/supabase/server';

import { createCheckoutSessionAction } from './[id]/payment-actions';
import { bool, text } from '@/lib/utils';

export type ActionState = { error: string | null };
export type SendMessageState = { error: string | null; message: MessageRow | null };
export type MeetGreetState = { error: string | null; meetGreet: MeetGreetRow | null };

async function updateBooking(
  bookingId: string,
  patch: Record<string, unknown>
): Promise<ActionState> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('bookings') as any)
    .update(patch)
    .eq('id', bookingId);

  if (error) return { error: error.message };

  revalidatePath('/dashboard/bookings');
  revalidatePath('/dashboard/havener/bookings');
  revalidatePath(`/dashboard/bookings/${bookingId}`);
  return { error: null };
}

export async function cancelBookingAction(
  bookingId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireProfile();
  const reason = text(formData, 'reason');
  if (!reason) return { error: 'Please tell us why you are cancelling.' };
  return updateBooking(bookingId, {
    status: 'cancelled',
    cancellation_reason: reason,
  });
}

export type BookResult = { error: string | null; notice: string | null };

/** Once both sides have clicked Book, the request becomes a confirmed booking. */
async function confirmIfBothBooked(bookingId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('bookings')
    .select('status, owner_booked_at, sitter_booked_at')
    .eq('id', bookingId)
    .maybeSingle();
  if (data && data.status === 'requested' && data.owner_booked_at && data.sitter_booked_at) {
    await updateBooking(bookingId, { status: 'confirmed' });
  }
}

/**
 * "Book" — each side clicks it on their own. The Havener's click re-checks
 * availability (two Haveners may both have been asked); the owner's click
 * goes to payment when payments are on. Only when BOTH have booked does the
 * request become `confirmed`; with just one, it stays `requested` and shows
 * as pending.
 */
export async function bookAction(bookingId: string): Promise<BookResult> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data } = await supabase.from('bookings').select('*').eq('id', bookingId).maybeSingle();
  const booking = data as BookingRow | null;
  if (!booking || (booking.owner_id !== profile.id && booking.sitter_id !== profile.id)) {
    return { error: 'Booking not found.', notice: null };
  }
  if (booking.status !== 'requested') {
    return { error: 'This request can no longer be booked.', notice: null };
  }

  const now = new Date().toISOString();
  let notice: string | null = null;

  if (booking.sitter_id === profile.id) {
    if (!booking.sitter_booked_at) {
      const { count: petCount } = await supabase
        .from('booking_pets')
        .select('pet_id', { count: 'exact', head: true })
        .eq('booking_id', bookingId);
      const conflicts = await sitterIdsWithConflict(
        supabase,
        booking.start_date,
        booking.end_date ?? booking.start_date,
        [profile.id],
        { service: booking.service_type, pets: petCount ?? 1 }
      );
      if (conflicts.has(profile.id)) {
        return {
          error:
            'You already have a confirmed booking or blocked dates in that range, so you can’t book this one.',
          notice: null,
        };
      }
      const result = await updateBooking(bookingId, { sitter_booked_at: now });
      if (result.error) return { error: result.error, notice: null };
    }
  } else if (!booking.owner_booked_at) {
    if (getStripe()) {
      // Pays first; the Stripe webhook stamps the owner's "booked" once it clears.
      const paid = await createCheckoutSessionAction(bookingId);
      return { error: paid.error, notice: null };
    }
    const result = await updateBooking(bookingId, { owner_booked_at: now });
    if (result.error) return { error: result.error, notice: null };
    notice =
      'Payments aren’t turned on yet, so your booking is recorded without charging you. Payment will be requested once they are.';
  }

  await confirmIfBothBooked(bookingId);
  return { error: null, notice };
}

/** The Havener changes their mind before the service is confirmed. */
export async function cancelBookClickAction(bookingId: string): Promise<ActionState> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from('bookings')
    .select('sitter_id, status')
    .eq('id', bookingId)
    .maybeSingle();
  if (!data || data.sitter_id !== profile.id || data.status !== 'requested') {
    return { error: 'You can only cancel before the service is confirmed.' };
  }
  return updateBooking(bookingId, { sitter_booked_at: null });
}

/** Hides (or restores) a booking in the current user's own lists. */
export async function toggleArchiveAction(bookingId: string): Promise<ActionState> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from('bookings')
    .select('owner_id, sitter_id, archived_by_owner, archived_by_sitter')
    .eq('id', bookingId)
    .maybeSingle();
  if (!data) return { error: 'Booking not found.' };

  if (data.owner_id === profile.id) {
    return updateBooking(bookingId, { archived_by_owner: !data.archived_by_owner });
  }
  if (data.sitter_id === profile.id) {
    return updateBooking(bookingId, { archived_by_sitter: !data.archived_by_sitter });
  }
  return { error: 'Booking not found.' };
}

export async function reportBookingAction(
  bookingId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireProfile();
  const reason = text(formData, 'reason');
  if (!reason || reason.length < 3) return { error: 'Please tell us what happened.' };

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('booking_reports') as any).insert({
    booking_id: bookingId,
    reporter_id: profile.id,
    reason,
  });
  if (error) return { error: error.message };
  return { error: null };
}

/**
 * Either side edits an open request (dates, windows, transport). The price is
 * recomputed inside the database from the Havener's rates, and both sides
 * have to Book again afterwards.
 */
export async function modifyBookingAction(
  bookingId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const startDate = text(formData, 'startDate');
  const endDate = text(formData, 'endDate');
  if (!startDate) return { error: 'Please choose the start date.' };
  if (endDate && endDate < startDate) {
    return { error: 'The end date can’t be before the start date.' };
  }

  const { data } = await supabase.from('bookings').select('*').eq('id', bookingId).maybeSingle();
  const booking = data as BookingRow | null;
  if (!booking || (booking.owner_id !== profile.id && booking.sitter_id !== profile.id)) {
    return { error: 'Booking not found.' };
  }
  if (booking.status !== 'requested') {
    return { error: 'Only an open request can be modified.' };
  }

  const { data: serviceRow } = await supabase
    .from('sitter_services')
    .select('pickup_dropoff_rate_cents')
    .eq('sitter_id', booking.sitter_id)
    .eq('service_type', booking.service_type)
    .maybeSingle();

  const dropoffFrom = text(formData, 'dropoffFrom');
  const dropoffTo = text(formData, 'dropoffTo');
  const pickupFrom = text(formData, 'pickupFrom');
  const pickupTo = text(formData, 'pickupTo');
  const wantsPickupDropoff = bool(formData, 'wantsPickupDropoff');

  const notes = rebuildNotes(booking.owner_notes, {
    dropoffFrom,
    dropoffTo,
    pickupFrom,
    pickupTo,
    wantsPickupDropoff,
    pickupDropoffRateCents:
      (serviceRow as { pickup_dropoff_rate_cents: number | null } | null)
        ?.pickup_dropoff_rate_cents ?? null,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).rpc('modify_booking_request', {
    p_booking_id: bookingId,
    p_start: startDate,
    p_end: endDate,
    p_dropoff_from: dropoffFrom,
    p_dropoff_to: dropoffTo,
    p_pickup_from: pickupFrom,
    p_pickup_to: pickupTo,
    p_wants_pickup: wantsPickupDropoff,
    p_notes: notes,
  });
  if (error) return { error: error.message };

  // Tell the other side in the chat so nothing changes silently.
  const otherId = booking.owner_id === profile.id ? booking.sitter_id : booking.owner_id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('messages') as any).insert({
    booking_id: bookingId,
    sender_id: profile.id,
    recipient_id: otherId,
    body: `I modified this request (${startDate}${endDate ? ` – ${endDate}` : ''}). Please review the details and click Book again.`,
  });

  revalidatePath('/dashboard/bookings');
  revalidatePath('/dashboard/havener/bookings');
  revalidatePath(`/dashboard/bookings/${bookingId}`);
  return { error: null };
}

export async function declineBookingAction(
  bookingId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireProfile();
  return updateBooking(bookingId, {
    status: 'declined',
    decline_reason: text(formData, 'reason'),
  });
}

export async function startServiceAction(bookingId: string): Promise<ActionState> {
  await requireProfile();
  return updateBooking(bookingId, { status: 'in_progress' });
}

export async function completeServiceAction(bookingId: string): Promise<ActionState> {
  await requireProfile();
  return updateBooking(bookingId, { status: 'completed' });
}

export async function sendMessageAction(
  bookingId: string,
  recipientId: string,
  formData: FormData
): Promise<SendMessageState> {
  const profile = await requireProfile();
  const rawBody = text(formData, 'body');
  if (!rawBody) return { error: null, message: null };

  const filtered = filterChatMessage(rawBody);
  if (filtered.blocked) {
    return { error: filtered.blockedReason, message: null };
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('messages') as any)
    .insert({
      booking_id: bookingId,
      sender_id: profile.id,
      recipient_id: recipientId,
      body: filtered.body,
      flagged: filtered.flagged,
      flagged_reason: filtered.flaggedReason,
    })
    .select('*')
    .single();

  if (error) return { error: error.message, message: null };

  revalidatePath(`/dashboard/bookings/${bookingId}`);
  return { error: null, message: data as MessageRow };
}

export async function setCallWindowAction(
  bookingId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireProfile();
  return updateBooking(bookingId, { call_window: text(formData, 'callWindow') });
}

export async function proposeMeetGreetAction(
  bookingId: string,
  _prev: MeetGreetState,
  formData: FormData
): Promise<MeetGreetState> {
  const profile = await requireProfile();
  const date = text(formData, 'date');
  const time = text(formData, 'time');
  const locationNote = text(formData, 'locationNote');
  if (!date || !time) {
    return { error: 'Please choose a date and time.', meetGreet: null };
  }

  const startsAt = new Date(`${date}T${time}`);
  if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() < Date.now()) {
    return { error: 'Please choose a time in the future.', meetGreet: null };
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('meet_greets') as any)
    .insert({
      booking_id: bookingId,
      proposed_by: profile.id,
      starts_at: startsAt.toISOString(),
      location_note: locationNote || null,
    })
    .select('*')
    .single();

  if (error) return { error: error.message, meetGreet: null };

  revalidatePath(`/dashboard/bookings/${bookingId}`);
  return { error: null, meetGreet: data as MeetGreetRow };
}

export async function respondMeetGreetAction(
  bookingId: string,
  meetGreetId: string,
  response: 'accepted' | 'declined'
): Promise<ActionState> {
  await requireProfile();
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('meet_greets') as any)
    .update({ status: response, responded_at: new Date().toISOString() })
    .eq('id', meetGreetId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/bookings/${bookingId}`);
  return { error: null };
}

export async function cancelMeetGreetAction(
  bookingId: string,
  meetGreetId: string
): Promise<ActionState> {
  await requireProfile();
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('meet_greets') as any)
    .update({ status: 'cancelled', responded_at: new Date().toISOString() })
    .eq('id', meetGreetId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/bookings/${bookingId}`);
  return { error: null };
}

export async function submitReviewAction(
  bookingId: string,
  revieweeId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const rating = Number(formData.get('rating'));
  if (!rating || rating < 1 || rating > 5) {
    return { error: 'Please choose a rating from 1 to 5.' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('reviews') as any).insert({
    booking_id: bookingId,
    reviewer_id: profile.id,
    reviewee_id: revieweeId,
    rating,
    punctuality: Number(formData.get('punctuality')) || null,
    communication: Number(formData.get('communication')) || null,
    pet_care: Number(formData.get('petCare')) || null,
    body: text(formData, 'body'),
  });

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/bookings/${bookingId}`);
  return { error: null };
}

/**
 * Called every few seconds by the Havener's browser during an in-progress
 * dog walk. No error surfaces to the UI for a single failed ping — the RLS
 * policy already only allows this while the walk is actually in progress,
 * so a rejected write just means the walk ended or was never this
 * sitter's, and retrying isn't useful.
 */
export async function logWalkLocationAction(
  bookingId: string,
  latitude: number,
  longitude: number
): Promise<void> {
  await requireProfile();
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('walk_locations') as any).insert({
    booking_id: bookingId,
    latitude,
    longitude,
  });
}
