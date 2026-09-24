'use server';

import { revalidatePath } from 'next/cache';

import type { MeetGreetRow, MessageRow } from '@/lib/database.types';
import { requireProfile } from '@/lib/auth';
import { filterChatMessage } from '@/lib/chat-filter';
import { createClient } from '@/lib/supabase/server';
import { text } from '@/lib/utils';

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
