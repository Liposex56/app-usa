import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import type {
  BookingCounterparty,
  BookingRow,
  MeetGreetRow,
  MessageRow,
  PetRow,
  ReviewRow,
  WalkLocationRow,
} from '@/lib/database.types';
import { requireProfile } from '@/lib/auth';
import { clockRange } from '@/lib/booking-notes';
import { CHAT_BUCKET, isTimedService, timeLabels } from '@/lib/booking-flow';
import { cancellationWindow } from '@/lib/cancellation';
import { bookingPhase } from '@/lib/booking-phase';
import { bookingQuantity } from '@/lib/pricing';
import { SERVICE_BY_TYPE, serviceName } from '@/lib/services';
import {
  SERVICE_BUCKET,
  completionRequirements,
  routeDistanceMiles,
  type ServiceUpdateRow,
} from '@/lib/service-reports';
import { createClient } from '@/lib/supabase/server';
import { formatCents, formatDate } from '@/lib/utils';

import { sendMessageAction } from '../actions';
import { PartnerShopCard } from '@/components/partner-shop-card';
import { BookingActions, type CancellationInfo } from './booking-actions';
import { BookingTabs, type BookingPanel } from './booking-tabs';
import { BookingToolbar } from './booking-toolbar';
import { CallWindow } from './call-window';
import { Chat } from './chat';
import { MeetGreetPanel } from './meet-greet';
import { PayButton } from './pay-button';
import { ReviewForm } from './review-form';
import { ServiceLog } from './service-log';
import { ServiceReport } from './service-report';
import { WalkMap } from './walk-map';
import { WalkTracker } from './walk-tracker';

export const metadata: Metadata = { title: 'Booking' };

const UNIT_LABEL: Record<string, string> = {
  night: 'night',
  day: 'day',
  walk: 'walk',
  visit: 'visit',
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-espresso-700/8 px-5 py-4 first:border-t-0">
      <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-olive-500">{title}</h3>
      <div className="mt-2 text-[18px] leading-snug text-espresso-700">{children}</div>
    </div>
  );
}

function ChargeRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className={strong ? 'font-semibold' : 'text-espresso-600'}>{label}</span>
      <span className={strong ? 'text-xl font-bold' : 'font-medium'}>{value}</span>
    </div>
  );
}

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  // Timed services start and finish by themselves; make sure this one is current.
  await supabase.rpc('advance_booking_statuses' as never);

  const { data: bookingRow } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!bookingRow) notFound();
  const booking = bookingRow as BookingRow;

  const viewerRole: 'owner' | 'sitter' =
    booking.owner_id === profile.id ? 'owner' : 'sitter';
  // Staff can open any booking (reports, disputes) but only read it.
  const isParticipant =
    booking.owner_id === profile.id || booking.sitter_id === profile.id;
  const phase = bookingPhase(booking, viewerRole);
  const archived =
    viewerRole === 'owner' ? booking.archived_by_owner : booking.archived_by_sitter;

  const [
    { data: counterpartyRows },
    { data: petLinks },
    { data: messageRows },
    { data: reviewRows },
    { data: meetGreetRows },
    { data: walkLocationRows },
    { data: updateRows },
    { data: serviceSettings },
  ] = await Promise.all([
    supabase.rpc('booking_counterparty', { p_booking_id: id }),
    supabase.from('booking_pets').select('pet_id').eq('booking_id', id),
    supabase
      .from('messages')
      .select('*')
      .eq('booking_id', id)
      .order('created_at', { ascending: true }),
    supabase.from('reviews').select('*').eq('booking_id', id),
    supabase
      .from('meet_greets')
      .select('*')
      .eq('booking_id', id)
      .order('created_at', { ascending: true }),
    booking.service_type === 'dog_walking'
      ? supabase
          .from('walk_locations')
          .select('*')
          .eq('booking_id', id)
          .order('recorded_at', { ascending: true })
      : Promise.resolve({ data: [] as WalkLocationRow[] }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('service_updates') as any)
      .select('*')
      .eq('booking_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('sitter_services')
      .select('cancellation_policy, extra_hour_rate_cents')
      .eq('sitter_id', booking.sitter_id)
      .eq('service_type', booking.service_type)
      .maybeSingle(),
  ]);

  const counterparty = (counterpartyRows as BookingCounterparty[] | null)?.[0] ?? null;
  const petIds = (petLinks ?? []).map((row) => row.pet_id as string);
  const { data: petRows } = petIds.length
    ? await supabase.from('pets').select('*').in('id', petIds)
    : { data: [] as PetRow[] };
  const pets = (petRows ?? []) as PetRow[];
  const messages = (messageRows ?? []) as MessageRow[];
  const reviews = (reviewRows ?? []) as ReviewRow[];
  const meetGreets = (meetGreetRows ?? []) as MeetGreetRow[];
  const walkLocations = (walkLocationRows ?? []) as WalkLocationRow[];
  const serviceUpdates = (updateRows ?? []) as ServiceUpdateRow[];
  const myReview = reviews.find((r) => r.reviewer_id === profile.id);
  const counterpartyId = viewerRole === 'owner' ? booking.sitter_id : booking.owner_id;

  const timed = isTimedService(booking.service_type);

  // Photos and videos sent in the chat (private bucket -> signed links).
  const chatMediaUrls: Record<string, string> = {};
  const chatMedia = messages.filter((m) => m.media_path);
  if (chatMedia.length > 0) {
    const { data: signedChat } = await supabase.storage
      .from(CHAT_BUCKET)
      .createSignedUrls(
        chatMedia.map((m) => m.media_path as string),
        60 * 60
      );
    for (const item of signedChat ?? []) {
      const message = chatMedia.find((m) => m.media_path === item.path);
      if (message && item.signedUrl) chatMediaUrls[message.id] = item.signedUrl;
    }
  }

  // Boarding, daycare and house sitting: the Havener's photos go in the chat,
  // and the report is built from them.
  const reportUpdates: ServiceUpdateRow[] = timed
    ? [
        ...serviceUpdates,
        ...chatMedia
          .filter((m) => m.sender_id === booking.sitter_id)
          .map((m) => ({
            id: m.id,
            booking_id: m.booking_id,
            author_id: m.sender_id,
            kind: 'photo' as const,
            body: m.body === 'Photo' || m.body === 'Video' ? null : m.body,
            media_path: m.media_path,
            media_type: m.media_type,
            created_at: m.created_at,
          })),
      ]
    : serviceUpdates;

  // Photos and videos of the service log live in a private bucket too.
  const logMediaUrls: Record<string, string> = {};
  const withMedia = serviceUpdates.filter((u) => u.media_path);
  if (withMedia.length > 0) {
    const { data: signed } = await supabase.storage
      .from(SERVICE_BUCKET)
      .createSignedUrls(
        withMedia.map((u) => u.media_path as string),
        60 * 60
      );
    for (const item of signed ?? []) {
      const update = withMedia.find((u) => u.media_path === item.path);
      if (update && item.signedUrl) logMediaUrls[update.id] = item.signedUrl;
    }
  }
  const requirements = completionRequirements(
    booking.service_type,
    serviceUpdates,
    walkLocations.length
  );
  const reportMediaUrls = timed ? { ...logMediaUrls, ...chatMediaUrls } : logMediaUrls;

  // Cancelling: inside the Havener's window (counted from when it was booked),
  // never during the service, and Havenr confirms it.
  const policy = (serviceSettings as { cancellation_policy: string } | null)?.cancellation_policy;
  const extraHourCents =
    (serviceSettings as { extra_hour_rate_cents: number | null } | null)?.extra_hour_rate_cents ??
    null;
  const windowInfo = cancellationWindow(
    policy,
    booking.confirmed_at ?? booking.created_at
  );
  const cancellation: CancellationInfo | null =
    booking.status === 'confirmed'
      ? {
          requested: Boolean(booking.cancellation_requested_at),
          open: windowInfo.open,
          lastDayLabel: formatDate(windowInfo.lastDay),
          policyLabel: windowInfo.policyLabel,
        }
      : null;

  const backHref =
    viewerRole === 'owner' ? '/dashboard/bookings' : '/dashboard/havener/bookings';
  const counterpartyName = counterparty?.display_name ?? '—';
  const firstName = counterpartyName.split(' ')[0];

  // ---- the request, laid out like a receipt ---------------------------------
  const definition = SERVICE_BY_TYPE[booking.service_type];
  const quantity = bookingQuantity(definition.rateUnit, booking.start_date, booking.end_date);
  const unit = UNIT_LABEL[definition.rateUnit] ?? definition.rateUnit;
  const baseCents = booking.base_rate_cents * quantity;
  const extraPetsCents =
    Math.max(0, pets.length - 1) * booking.additional_pet_rate_cents * quantity;
  const transportCents = Math.max(0, booking.extra_fees_cents - extraPetsCents);
  const dropoff = clockRange(booking.dropoff_from, booking.dropoff_to);
  const pickup = clockRange(booking.pickup_from, booking.pickup_to);

  // Until a booking is confirmed a Havener can't open the pet's profile, so
  // fall back to the line the request itself carried.
  const petsLine =
    pets.length > 0
      ? pets
          .map((p) =>
            [p.name, p.species === 'dog' ? 'Dog' : 'Cat', p.breed].filter(Boolean).join(' · ')
          )
          .join('; ')
      : (booking.owner_notes
          ?.split('\n')
          .find((line) => line.startsWith('Pets:'))
          ?.replace('Pets: ', '') ?? '—');

  const showUpdates =
    booking.status === 'in_progress' ||
    booking.status === 'completed' ||
    reportUpdates.length > 0;
  const walking = booking.service_type === 'dog_walking';

  const panels: BookingPanel[] = [
    {
      id: 'messages',
      label: 'Messages',
      badge: undefined,
      content: (
        <Chat
          bookingId={booking.id}
          viewerId={profile.id}
          initialMessages={messages}
          sendAction={sendMessageAction.bind(null, booking.id, counterpartyId)}
          counterpartyName={counterpartyName}
          counterpartyAvatarUrl={counterparty?.avatar_url ?? null}
          readOnly={!isParticipant}
          initialMediaUrls={chatMediaUrls}
        />
      ),
    },
  ];

  if (showUpdates) {
    panels.push({
      id: 'updates',
      label: 'Service updates',
      badge: reportUpdates.length || undefined,
      content: (
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-bone/60 p-4 sm:p-6">
          {walking && (booking.status === 'in_progress' || walkLocations.length > 0) && (
            <div className="space-y-3">
              <h2 className="text-lg text-espresso-700">Walk route</h2>
              {viewerRole === 'sitter' && isParticipant && booking.status === 'in_progress' && (
                <WalkTracker bookingId={booking.id} />
              )}
              <WalkMap
                bookingId={booking.id}
                initialLocations={walkLocations}
                live={booking.status === 'in_progress'}
              />
            </div>
          )}

          {viewerRole === 'sitter' && isParticipant && booking.status === 'in_progress' && !timed && (
            <ServiceLog
              bookingId={booking.id}
              sitterId={profile.id}
              service={booking.service_type}
              requirements={requirements}
            />
          )}

          {(booking.status === 'in_progress' || booking.status === 'completed') && (
            <ServiceReport
              bookingId={booking.id}
              updates={reportUpdates}
              mediaUrls={reportMediaUrls}
              status={booking.status}
              startedAt={booking.started_at}
              completedAt={booking.completed_at}
              walkMiles={
                walking && walkLocations.length > 1 ? routeDistanceMiles(walkLocations) : null
              }
              canRemove={
                viewerRole === 'sitter' &&
                isParticipant &&
                booking.status === 'in_progress' &&
                !timed
              }
            />
          )}
        </div>
      ),
    });
  }

  const modifyDefaults = {
    startDate: booking.start_date,
    endDate: booking.end_date,
    dropoffFrom: booking.dropoff_from,
    dropoffTo: booking.dropoff_to,
    pickupFrom: booking.pickup_from,
    pickupTo: booking.pickup_to,
    wantsPickupDropoff: booking.wants_pickup_dropoff,
    allowsTransport: booking.service_type === 'boarding' || booking.service_type === 'daycare',
    timed: isTimedService(booking.service_type),
    serviceType: booking.service_type,
  };

  return (
    <div className="mx-auto max-w-6xl">
      <Link href={backHref} className="text-[17px] font-semibold text-espresso-500 hover:text-espresso-700">
        ← Back to bookings
      </Link>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)] lg:items-start">
        {/* ------------------------------------------------ Request details */}
        <aside className="overflow-hidden rounded-3xl border border-espresso-700/8 bg-hv-paper shadow-card lg:col-start-1 lg:row-start-1">
          <div className="px-5 py-5">
            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${phase.tone}`}>
              {phase.label}
            </span>
            <h1 className="mt-3 text-[clamp(28px,2.4vw,34px)] leading-[1.05]">
              {serviceName(booking.service_type)}
            </h1>
            {phase.hint && <p className="mt-2 text-[17px] text-olive-600">{phase.hint}</p>}
          </div>

          <Section title="Service schedule">
            <p className="font-semibold">
              {formatDate(booking.start_date)}
              {booking.end_date && booking.end_date !== booking.start_date
                ? ` – ${formatDate(booking.end_date)}`
                : ''}
            </p>
            {dropoff && (
              <p className="text-espresso-600">
                {timed ? timeLabels(booking.service_type).start : 'Preferred time'} {dropoff}
              </p>
            )}
            {pickup && (
              <p className="text-espresso-600">
                {timed ? timeLabels(booking.service_type).end : 'Pick-up'} {pickup}
              </p>
            )}
            <p className="text-espresso-600">{definition.where}</p>
            {timed && (
              <p className="mt-1 text-[16px] text-espresso-500">
                It starts and finishes by itself at these times.
              </p>
            )}
            {timed && extraHourCents ? (
              <p className="text-[16px] text-espresso-500">
                Extra time: {formatCents(extraHourCents)} per hour.
              </p>
            ) : null}
          </Section>

          <Section title="Pets">
            <p>{petsLine}</p>
          </Section>

          <Section title="Services & charges">
            <div className="space-y-1.5">
              <ChargeRow
                label={`${serviceName(booking.service_type)} · ${quantity} ${unit}${quantity === 1 ? '' : 's'} × ${formatCents(booking.base_rate_cents)}`}
                value={formatCents(baseCents)}
              />
              {extraPetsCents > 0 && (
                <ChargeRow label="Additional pets" value={formatCents(extraPetsCents)} />
              )}
              {transportCents > 0 && (
                <ChargeRow label="Pick-up and drop-off" value={formatCents(transportCents)} />
              )}
              <div className="border-t border-espresso-700/10 pt-2">
                <ChargeRow label="Total" value={formatCents(booking.total_cents)} strong />
              </div>
              {/* The platform fee isn't part of the booking details; owners only
                  see it as a percentage at the moment they pay. */}
              {viewerRole === 'sitter' && (
                <ChargeRow label="Your earnings" value={formatCents(booking.sitter_payout_cents)} />
              )}
            </div>
          </Section>

          {(booking.decline_reason || booking.cancellation_reason) && (
            <Section title="Reason">
              {booking.decline_reason && (
                <p className="rounded-xl bg-red-50 p-3 text-[17px] text-red-800">
                  Declined: {booking.decline_reason}
                </p>
              )}
              {booking.cancellation_reason && (
                <p className="rounded-xl bg-red-50 p-3 text-[17px] text-red-800">
                  Cancelled: {booking.cancellation_reason}
                </p>
              )}
            </Section>
          )}

          {viewerRole === 'owner' &&
            booking.payment_status !== 'paid' &&
            ['confirmed', 'in_progress', 'completed'].includes(booking.status) && (
              <Section title="Payment">
                <p className="text-[17px]">
                  {booking.payment_status === 'processing'
                    ? 'Payment is processing…'
                    : 'This booking is confirmed but not paid yet.'}
                </p>
                {booking.payment_status !== 'processing' && (
                  <div className="mt-3">
                    <PayButton bookingId={booking.id} totalCents={booking.total_cents} />
                    <p className="mt-2 text-sm text-espresso-500">
                      Includes a {booking.commission_percent}% Havenr service fee.
                    </p>
                  </div>
                )}
              </Section>
            )}
          {viewerRole === 'owner' && booking.payment_status === 'paid' && (
            <Section title="Payment">
              <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-[16px] font-semibold text-green-800">
                Paid
              </span>
            </Section>
          )}

          {isParticipant && (
            <div className="space-y-3 border-t border-espresso-700/8 px-5 py-5">
              <BookingToolbar
                parts="book"
                bookingId={booking.id}
                viewerRole={viewerRole}
                status={booking.status}
                ownerBooked={Boolean(booking.owner_booked_at)}
                sitterBooked={Boolean(booking.sitter_booked_at)}
                archived={archived}
                modifyDefaults={modifyDefaults}
              />
              <BookingActions
                bookingId={booking.id}
                status={booking.status}
                viewerRole={viewerRole}
                serviceType={booking.service_type}
                cancellation={cancellation}
              />
            </div>
          )}
        </aside>

        {/* ------------------------------------------------- Conversation */}
        <section className="flex h-[80vh] min-h-[34rem] flex-col overflow-hidden rounded-3xl border border-espresso-700/8 bg-hv-paper shadow-card lg:sticky lg:top-20 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-[calc(100vh-7.5rem)]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-espresso-700/8 px-4 py-3 sm:px-6">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-sky-100">
              {counterparty?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={counterparty.avatar_url}
                  alt={counterpartyName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-espresso-500">
                  {counterpartyName.slice(0, 1)}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xl font-bold text-espresso-700">
                {isParticipant ? (
                  <Link
                    // A Havener opens the owner's profile; an owner opens the
                    // Havener's public profile.
                    href={
                      viewerRole === 'sitter'
                        ? `/dashboard/bookings/${booking.id}/owner`
                        : `/sitters/${booking.sitter_id}`
                    }
                    className="hover:underline"
                  >
                    {counterpartyName}
                  </Link>
                ) : (
                  counterpartyName
                )}
              </p>
              <p className="truncate text-[16px] text-espresso-500">
                {serviceName(booking.service_type)} · {phase.label}
              </p>
            </div>
            {isParticipant && (
              <div className="w-full shrink-0 sm:ml-auto sm:w-auto">
                <BookingToolbar
                  parts="chat"
                  bookingId={booking.id}
                  viewerRole={viewerRole}
                  status={booking.status}
                  ownerBooked={Boolean(booking.owner_booked_at)}
                  sitterBooked={Boolean(booking.sitter_booked_at)}
                  archived={archived}
                  modifyDefaults={modifyDefaults}
                />
              </div>
            )}
          </div>

          <BookingTabs
            panels={panels}
            initial={booking.status === 'in_progress' && viewerRole === 'sitter' ? 'updates' : 'messages'}
            className="flex-1"
          />
        </section>

        {/* ---------------------------------------------------- Below it */}
        <div className="space-y-4 lg:col-start-1 lg:row-start-2">
          {isParticipant && (
            <div className="rounded-3xl border border-espresso-700/8 bg-hv-paper shadow-card">
              <MeetGreetPanel
                bookingId={booking.id}
                viewerId={profile.id}
                initialMeetGreets={meetGreets}
              />
            </div>
          )}

          {isParticipant && (
            <div className="rounded-3xl border border-espresso-700/8 bg-hv-paper p-5 shadow-card">
              <CallWindow
                bookingId={booking.id}
                counterpartyName={firstName === '—' ? 'them' : counterpartyName}
                initialValue={booking.call_window}
              />
            </div>
          )}

          {viewerRole === 'owner' &&
            isParticipant &&
            ['confirmed', 'in_progress', 'completed'].includes(booking.status) && (
              <PartnerShopCard petNames={pets.map((p) => p.name).join(' and ')} />
            )}

          {isParticipant && booking.status === 'completed' && (
            <div className="rounded-3xl border border-espresso-700/8 bg-hv-paper p-6 shadow-card">
              <h2 className="text-xl text-espresso-700">Review</h2>
              {myReview ? (
                <p className="mt-2 text-[17px] text-espresso-500">
                  You submitted your review.{' '}
                  {myReview.published_at
                    ? 'Both reviews are now visible.'
                    : 'It will publish once the other side reviews too.'}
                </p>
              ) : (
                <div className="mt-4">
                  <ReviewForm
                    bookingId={booking.id}
                    revieweeId={counterpartyId}
                    revieweeLabel={counterpartyName}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
