'use server';

import { revalidatePath } from 'next/cache';

import type { BookingRow, MeetGreetRow, MessageRow } from '@/lib/database.types';
import { requireProfile } from '@/lib/auth';
import { sitterIdsWithConflict } from '@/lib/availability';
import { isTimedService } from '@/lib/booking-flow';
import { rebuildNotes } from '@/lib/booking-notes';
import { getStripe } from '@/lib/stripe';
import { filterChatMessage } from '@/lib/chat-filter';
import { refundBookingPayment, type RefundResult } from '@/lib/refunds';
import {
  SERVICE_BUCKET,
  completionRequirements,
  type ServiceUpdateRow,
  type UpdateKind,
} from '@/lib/service-reports';
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

/** A refund that failed must not look like success: say so, the booking itself is already changed. */
function withRefundNote(refund: RefundResult, what: string): ActionState {
  if (refund.error) {
    return {
      error: `${what}, but the automatic refund didn’t go through (${refund.error}). Havenr will refund it by hand.`,
    };
  }
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

  const supabase = await createClient();
  const { data } = await supabase
    .from('bookings')
    .select('status')
    .eq('id', bookingId)
    .maybeSingle();
  if (data?.status !== 'requested') {
    return {
      error:
        'A confirmed booking is cancelled by asking Havenr — use “Request cancellation”.',
    };
  }

  const result = await updateBooking(bookingId, {
    status: 'cancelled',
    cancellation_reason: reason,
  });
  if (result.error) return result;

  // A request the owner already paid (paying is their "Book") is refunded.
  return withRefundNote(await refundBookingPayment(bookingId), 'Request withdrawn');
}

/**
 * A confirmed booking is cancelled by asking: the request goes to Havenr
 * (staff queue), which confirms it according to the Havener's cancellation
 * policy. It is only accepted inside that policy's window, counted from the
 * day the booking was made, and never during the service — the database
 * enforces that, this just gives it a clean message.
 */
export async function requestCancellationAction(
  bookingId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireProfile();
  const reason = text(formData, 'reason');
  if (!reason) return { error: 'Please tell us why you are cancelling.' };

  const supabase = await createClient();
  const { data } = await supabase
    .from('bookings')
    .select('owner_id, sitter_id, status, cancellation_requested_at')
    .eq('id', bookingId)
    .maybeSingle();
  if (!data || (data.owner_id !== profile.id && data.sitter_id !== profile.id)) {
    return { error: 'Booking not found.' };
  }
  if (data.status === 'in_progress') {
    return { error: 'A service that is already in progress can’t be cancelled.' };
  }
  if (data.status !== 'confirmed') {
    return { error: 'Only a confirmed booking can have a cancellation requested.' };
  }
  if (data.cancellation_requested_at) {
    return { error: 'A cancellation has already been requested.' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('bookings') as any)
    .update({
      cancellation_requested_at: new Date().toISOString(),
      cancellation_request_reason: reason,
    })
    .eq('id', bookingId);
  if (error) return { error: error.message };

  // Tell the other side in the chat so nothing happens silently.
  const otherId = data.owner_id === profile.id ? data.sitter_id : data.owner_id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('messages') as any).insert({
    booking_id: bookingId,
    sender_id: profile.id,
    recipient_id: otherId,
    body: 'I asked to cancel this booking. Havenr will review the request and confirm it.',
  });

  revalidatePath('/dashboard/bookings');
  revalidatePath('/dashboard/havener/bookings');
  revalidatePath('/dashboard/admin/cancellations');
  revalidatePath(`/dashboard/bookings/${bookingId}`);
  return { error: null };
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
    await updateBooking(bookingId, {
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
    });
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

  const timed = isTimedService(booking.service_type);
  const dropoffFrom = text(formData, 'dropoffFrom');
  const pickupFrom = text(formData, 'pickupFrom');
  if (timed && (!dropoffFrom || !pickupFrom)) {
    return { error: 'Please choose both times — the service starts and ends at them.' };
  }
  // Timed services use one exact time each; others an optional preferred range.
  const dropoffTo = timed ? null : text(formData, 'dropoffTo');
  const pickupTo = null;
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

  // The price was recomputed and both "Book" clicks were cleared, so a payment
  // already made for the old terms is refunded; the owner pays again on Book.
  const refund = await refundBookingPayment(bookingId);

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
  return withRefundNote(refund, 'Request updated');
}

export async function declineBookingAction(
  bookingId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireProfile();
  const result = await updateBooking(bookingId, {
    status: 'declined',
    decline_reason: text(formData, 'reason'),
  });
  if (result.error) return result;

  // If the owner had already paid, they get it back.
  return withRefundNote(await refundBookingPayment(bookingId), 'Request declined');
}

export async function startServiceAction(bookingId: string): Promise<ActionState> {
  await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from('bookings')
    .select('service_type')
    .eq('id', bookingId)
    .maybeSingle();
  if (data && isTimedService(data.service_type)) {
    return { error: 'This service starts by itself at the drop-off time.' };
  }
  return updateBooking(bookingId, {
    status: 'in_progress',
    started_at: new Date().toISOString(),
  });
}

/**
 * A service can only be closed once the evidence it promises is there —
 * photos, the potty break and GPS route of a walk, the wellbeing check of a
 * visit (see lib/service-reports.ts). The Havener's screen shows the same
 * checklist; this is the check that can't be skipped.
 */
export async function completeServiceAction(bookingId: string): Promise<ActionState> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: booking } = await supabase
    .from('bookings')
    .select('service_type, sitter_id, status, duration_minutes, started_at')
    .eq('id', bookingId)
    .maybeSingle();
  if (!booking || booking.sitter_id !== profile.id) {
    return { error: 'Only the Havener on this booking can complete it.' };
  }
  if (isTimedService(booking.service_type)) {
    return { error: 'This service finishes by itself at the pick-up time.' };
  }

  const [{ data: updateRows }, { count: gpsPoints }, { data: petLinks }] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('service_updates') as any).select('*').eq('booking_id', bookingId),
    supabase
      .from('walk_locations')
      .select('id', { count: 'exact', head: true })
      .eq('booking_id', bookingId),
    supabase.from('booking_pets').select('pet_id').eq('booking_id', bookingId),
  ]);
  const petIds = (petLinks ?? []).map((row) => row.pet_id as string);
  const { data: petRows } = petIds.length
    ? await supabase.from('pets').select('species').in('id', petIds)
    : { data: [] as Array<{ species: string }> };

  const missing = completionRequirements(
    booking.service_type,
    (updateRows ?? []) as ServiceUpdateRow[],
    {
      gpsPoints: gpsPoints ?? 0,
      pets: {
        hasDog: (petRows ?? []).some((pet) => pet.species === 'dog'),
        hasCat: (petRows ?? []).some((pet) => pet.species === 'cat'),
      },
      durationMinutes: (booking.duration_minutes as number | null) ?? null,
      startedAt: (booking.started_at as string | null) ?? null,
    }
  ).filter((requirement) => !requirement.met);

  if (missing.length > 0) {
    return {
      error: `Before you can complete this service: ${missing
        .map((requirement) => requirement.label.charAt(0).toLowerCase() + requirement.label.slice(1))
        .join('; ')}.`,
    };
  }

  return updateBooking(bookingId, {
    status: 'completed',
    completed_at: new Date().toISOString(),
  });
}

const UPDATE_KINDS: UpdateKind[] = [
  'photo',
  'note',
  'potty',
  'feeding',
  'water',
  'play',
  'medication',
  'litter',
  'wellbeing',
];

/**
 * Adds one entry to the service log. Photos and videos are uploaded by the
 * browser straight to the private bucket (server actions cap the body size);
 * this only records the entry. RLS limits it to the Havener on the booking
 * while the service is in progress.
 */
export async function logServiceUpdateAction(
  bookingId: string,
  input: {
    kind: UpdateKind;
    body?: string | null;
    mediaPath?: string | null;
    mediaType?: 'image' | 'video' | null;
  }
): Promise<ActionState> {
  const profile = await requireProfile();
  if (!UPDATE_KINDS.includes(input.kind)) return { error: 'Invalid request.' };

  let body = input.body?.trim() || null;
  if (body) {
    if (body.length > 600) return { error: 'Keep the note under 600 characters.' };
    const filtered = filterChatMessage(body);
    if (filtered.blocked) return { error: filtered.blockedReason };
    body = filtered.body;
  }

  const mediaPath = input.mediaPath ?? null;
  if (mediaPath && !mediaPath.startsWith(`${profile.id}/${bookingId}/`)) {
    return { error: 'Invalid request.' };
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('service_updates') as any).insert({
    booking_id: bookingId,
    author_id: profile.id,
    kind: input.kind,
    body,
    media_path: mediaPath,
    media_type: mediaPath ? (input.mediaType ?? 'image') : null,
  });
  if (error) {
    return {
      error: error.message.includes('row-level security')
        ? 'You can only log updates while the service is in progress.'
        : error.message,
    };
  }

  revalidatePath(`/dashboard/bookings/${bookingId}`);
  return { error: null };
}

/** Takes back a wrong entry (and its file) while the service is in progress. */
export async function deleteServiceUpdateAction(
  bookingId: string,
  updateId: string
): Promise<ActionState> {
  const profile = await requireProfile();
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row } = await (supabase.from('service_updates') as any)
    .select('media_path, author_id')
    .eq('id', updateId)
    .eq('booking_id', bookingId)
    .maybeSingle();
  if (!row || row.author_id !== profile.id) return { error: 'Entry not found.' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('service_updates') as any)
    .delete()
    .eq('id', updateId);
  if (error) return { error: error.message };

  if (row.media_path) {
    await supabase.storage.from(SERVICE_BUCKET).remove([row.media_path as string]);
  }

  revalidatePath(`/dashboard/bookings/${bookingId}`);
  return { error: null };
}

export async function sendMessageAction(
  bookingId: string,
  recipientId: string,
  formData: FormData
): Promise<SendMessageState> {
  const profile = await requireProfile();
  const rawBody = text(formData, 'body');

  // A photo or video was uploaded straight to the private bucket by the
  // browser; only the path is recorded here, and only if it is this sender's.
  const mediaPath = text(formData, 'mediaPath');
  const mediaTypeRaw = text(formData, 'mediaType');
  const mediaType = mediaTypeRaw === 'video' ? 'video' : mediaTypeRaw === 'image' ? 'image' : null;
  if (mediaPath && (!mediaType || !mediaPath.startsWith(`${profile.id}/${bookingId}/`))) {
    return { error: 'Invalid attachment.', message: null };
  }
  if (!rawBody && !mediaPath) return { error: null, message: null };

  const caption = rawBody ?? (mediaType === 'video' ? 'Video' : 'Photo');
  const filtered = filterChatMessage(caption);
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
      media_path: mediaPath,
      media_type: mediaPath ? mediaType : null,
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
