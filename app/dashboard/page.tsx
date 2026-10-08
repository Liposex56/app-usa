import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { IconAlert, IconCheck, IconPaw, IconShield } from '@/components/icons';
import { Button, ButtonLink } from '@/components/ui/button';
import type {
  BookingCounterparty,
  BookingRow,
  CheckStatus,
  PetRow,
  PublicSitterRow,
  ServiceType,
  SitterProfileRow,
  SitterServiceRow,
} from '@/lib/database.types';
import { onboardingPath, requireProfile } from '@/lib/auth';
import { dateInAppZone, timeInAppZone, todayInAppZone } from '@/lib/dates';
import { availabilityLabel } from '@/lib/matching';
import { serviceName } from '@/lib/services';
import { siteOrigin } from '@/lib/site';
import { createClient } from '@/lib/supabase/server';
import { cn, formatCents, formatDate, petAge } from '@/lib/utils';

import { addPetProfileAction, becomeHavenerAction, confirmAvailabilityAction } from './actions';
import { PromoteCard } from './promote-card';

export const metadata: Metadata = { title: 'Dashboard' };

const STATUS_COPY: Record<string, { label: string; tone: string }> = {
  draft: { label: 'Draft — not submitted', tone: 'bg-espresso-700/8 text-espresso-600' },
  pending_review: { label: 'In review', tone: 'bg-cream text-olive-600' },
  approved: { label: 'Approved and live', tone: 'bg-green-100 text-green-800' },
  rejected: { label: 'Needs changes', tone: 'bg-red-100 text-red-800' },
  suspended: { label: 'Suspended', tone: 'bg-red-100 text-red-800' },
};

const CHECK_COPY: Record<CheckStatus, string> = {
  not_started: 'Not started',
  pending: 'In progress',
  approved: 'Complete',
  rejected: 'Action needed',
  expired: 'Expired',
};

const BOOKING_STATUS: Record<string, string> = {
  requested: 'Waiting for a reply',
  confirmed: 'Confirmed',
  in_progress: 'In progress',
};

type MeetGreetToday = {
  id: string;
  starts_at: string;
  status: string;
  location_note: string | null;
  booking_id: string;
  bookings: { owner_id: string; service_type: ServiceType } | null;
};

function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-3xl border border-espresso-700/8 bg-white p-6 shadow-card', className)}>
      {children}
    </div>
  );
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-sm text-espresso-500">{children}</p>;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const profile = await requireProfile();
  const { welcome } = await searchParams;

  // Send half-finished accounts back to where they stopped.
  if (profile.onboarding_step !== 'done') {
    redirect(onboardingPath(profile));
  }

  const supabase = await createClient();
  const today = todayInAppZone();

  const [{ data: pets }, { data: sitter }, { data: services }] = await Promise.all([
    supabase
      .from('pets')
      .select('*')
      .eq('owner_id', profile.id)
      .order('created_at', { ascending: true }),
    supabase.from('sitter_profiles').select('*').eq('id', profile.id).maybeSingle(),
    supabase.from('sitter_services').select('*').eq('sitter_id', profile.id),
  ]);

  const petList = (pets ?? []) as PetRow[];
  const sitterProfile = sitter as SitterProfileRow | null;
  const serviceList = (services ?? []) as SitterServiceRow[];

  /** The other party's name on each booking, via the same narrow RPC the bookings pages use. */
  async function counterpartNames(bookings: BookingRow[]) {
    const entries = await Promise.all(
      bookings.map(async (booking) => {
        const { data } = await supabase.rpc('booking_counterparty', {
          p_booking_id: booking.id,
        });
        const row = (data as BookingCounterparty[] | null)?.[0];
        return [booking.id, row?.display_name ?? null] as const;
      })
    );
    return new Map(entries);
  }

  /* ----------------------------------------------------------- Havener data */
  let todaysBookings: BookingRow[] = [];
  let newRequests: BookingRow[] = [];
  let todaysMeetGreets: MeetGreetToday[] = [];
  let meetGreetNames = new Map<string, string | null>();
  let ownerNamesByBooking = new Map<string, string | null>();

  if (profile.is_havener) {
    const [{ data: todayRows }, { data: requestRows }, { data: meetRows }] = await Promise.all([
      supabase
        .from('bookings')
        .select('*')
        .eq('sitter_id', profile.id)
        .in('status', ['confirmed', 'in_progress'])
        .lte('start_date', today)
        .or(`end_date.gte.${today},and(end_date.is.null,start_date.eq.${today})`)
        .order('start_date', { ascending: true }),
      supabase
        .from('bookings')
        .select('*')
        .eq('sitter_id', profile.id)
        .eq('status', 'requested')
        .order('created_at', { ascending: false })
        .limit(5),
      // meet_greets has no direct sitter column; the booking it hangs off does.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('meet_greets') as any)
        .select('id, starts_at, status, location_note, booking_id, bookings!inner(owner_id, service_type, sitter_id)')
        .eq('bookings.sitter_id', profile.id)
        .in('status', ['proposed', 'accepted'])
        .gte('starts_at', new Date(Date.now() - 14 * 36e5).toISOString())
        .lte('starts_at', new Date(Date.now() + 38 * 36e5).toISOString())
        .order('starts_at', { ascending: true }),
    ]);

    todaysBookings = (todayRows ?? []) as BookingRow[];
    newRequests = (requestRows ?? []) as BookingRow[];
    todaysMeetGreets = ((meetRows ?? []) as MeetGreetToday[]).filter(
      (meet) => dateInAppZone(meet.starts_at) === today
    );
    ownerNamesByBooking = await counterpartNames([...todaysBookings, ...newRequests]);
    meetGreetNames = await (async () => {
      const meetBookings = todaysMeetGreets.map((meet) => ({ id: meet.booking_id }) as BookingRow);
      return counterpartNames(meetBookings);
    })();
  }

  const updatedToday =
    sitterProfile?.calendar_updated_at != null &&
    dateInAppZone(sitterProfile.calendar_updated_at) === today;
  const referralCode = `HAVEN-${profile.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
  const referralLink = `${await siteOrigin()}/signup?ref=${referralCode}`;

  /* -------------------------------------------------------------- Owner data */
  let upcoming: BookingRow[] = [];
  let upcomingNames = new Map<string, string | null>();
  let recentSitters: Array<
    Pick<PublicSitterRow, 'id' | 'display_name' | 'avatar_url' | 'service_city' | 'service_state'>
  > = [];

  if (profile.is_owner) {
    const [{ data: upcomingRows }, { data: pastRows }] = await Promise.all([
      supabase
        .from('bookings')
        .select('*')
        .eq('owner_id', profile.id)
        .in('status', ['requested', 'confirmed', 'in_progress'])
        .or(`end_date.gte.${today},start_date.gte.${today}`)
        .order('start_date', { ascending: true })
        .limit(5),
      supabase
        .from('bookings')
        .select('sitter_id')
        .eq('owner_id', profile.id)
        .in('status', ['confirmed', 'in_progress', 'completed', 'pending_payout', 'paid_out'])
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    upcoming = (upcomingRows ?? []) as BookingRow[];
    upcomingNames = await counterpartNames(upcoming);

    const recentIds = [...new Set((pastRows ?? []).map((row) => row.sitter_id as string))].slice(0, 4);
    if (recentIds.length > 0) {
      // Only Haveners who are still live — an unapproved profile has no public row.
      const { data: sitterRows } = await supabase
        .from('public_sitters')
        .select('id, display_name, avatar_url, service_city, service_state')
        .in('id', recentIds);
      const byId = new Map((sitterRows ?? []).map((row) => [row.id as string, row]));
      recentSitters = recentIds.flatMap((id) => {
        const row = byId.get(id);
        return row ? [row as (typeof recentSitters)[number]] : [];
      });
    }
  }

  return (
    <div className="space-y-8">
      {welcome && (
        <div className="flex items-start gap-4 rounded-3xl border border-gold-200 bg-cream p-6">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-500 text-white">
            <IconCheck width={20} height={20} />
          </span>
          <div>
            <h2 className="text-lg text-espresso-700">You’re all set up</h2>
            <p className="mt-1 text-sm leading-relaxed text-espresso-600">
              You can now search for a Havener, contact them, and chat — right
              from here.
            </p>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-3xl">
          {profile.first_name ? `Hi, ${profile.first_name}` : 'Your dashboard'}
        </h1>
        <p className="mt-2 text-[15px] text-espresso-500">
          {profile.is_owner && profile.is_havener
            ? 'You’re set up as both a pet owner and a Havener.'
            : profile.is_havener
              ? 'Your Havener workspace.'
              : 'Everything about your pets and your bookings.'}
        </p>
      </div>

      {/* ------------------------------------------------------ Havener today */}
      {profile.is_havener && (
        <section className="space-y-4">
          <h2 className="text-xl">Today as a Havener</h2>

          {!updatedToday ? (
            <SectionCard className="flex flex-wrap items-center justify-between gap-4 border-gold-500/40 bg-gold-50">
              <div className="min-w-0">
                <h3 className="text-lg text-espresso-700">Update your availability</h3>
                <p className="mt-1 text-sm leading-relaxed text-espresso-600">
                  Confirm you’re available today. Owners see how recently you
                  updated, and Haveners who do it every day show up first in
                  search.
                </p>
              </div>
              <form action={confirmAvailabilityAction}>
                <Button type="submit">Update availability</Button>
              </form>
            </SectionCard>
          ) : (
            <p className="flex items-center gap-2 rounded-2xl bg-green-50 px-5 py-3 text-sm text-green-800">
              <IconCheck width={16} height={16} />
              {availabilityLabel(sitterProfile?.calendar_updated_at ?? null) ??
                'Availability updated today'}
              . You’ll be asked again tomorrow.{' '}
              <Link
                href="/dashboard/havener/availability"
                className="font-medium underline underline-offset-2"
              >
                Block dates
              </Link>
            </p>
          )}

          {newRequests.length > 0 && (
            <SectionCard>
              <h3 className="text-lg text-espresso-700">New requests</h3>
              <ul className="mt-3 divide-y divide-espresso-700/8">
                {newRequests.map((booking) => (
                  <li key={booking.id}>
                    <Link
                      href={`/dashboard/bookings/${booking.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm hover:text-gold-700"
                    >
                      <span className="text-espresso-700">
                        {serviceName(booking.service_type)} for{' '}
                        {ownerNamesByBooking.get(booking.id) ?? 'a pet owner'}
                      </span>
                      <span className="text-espresso-500">
                        {formatDate(booking.start_date)}
                        {booking.end_date ? ` – ${formatDate(booking.end_date)}` : ''}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <SectionCard>
              <h3 className="text-lg text-espresso-700">Your services today</h3>
              {todaysBookings.length === 0 ? (
                <EmptyLine>Nothing scheduled for today.</EmptyLine>
              ) : (
                <ul className="mt-3 divide-y divide-espresso-700/8">
                  {todaysBookings.map((booking) => (
                    <li key={booking.id}>
                      <Link
                        href={`/dashboard/bookings/${booking.id}`}
                        className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm hover:text-gold-700"
                      >
                        <span className="text-espresso-700">
                          {serviceName(booking.service_type)} for{' '}
                          {ownerNamesByBooking.get(booking.id) ?? 'a pet owner'}
                        </span>
                        <span className="text-espresso-500">
                          {BOOKING_STATUS[booking.status] ?? booking.status}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            <SectionCard>
              <h3 className="text-lg text-espresso-700">Meet &amp; greets today</h3>
              {todaysMeetGreets.length === 0 ? (
                <EmptyLine>No meet &amp; greets today.</EmptyLine>
              ) : (
                <ul className="mt-3 divide-y divide-espresso-700/8">
                  {todaysMeetGreets.map((meet) => (
                    <li key={meet.id}>
                      <Link
                        href={`/dashboard/bookings/${meet.booking_id}`}
                        className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm hover:text-gold-700"
                      >
                        <span className="text-espresso-700">
                          {timeInAppZone(meet.starts_at)} ·{' '}
                          {meetGreetNames.get(meet.booking_id) ?? 'a pet owner'}
                        </span>
                        <span className="text-espresso-500">
                          {meet.status === 'accepted' ? 'Confirmed' : 'Awaiting reply'}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>

          <PromoteCard code={referralCode} link={referralLink} />
        </section>
      )}

      {/* ------------------------------------------------------------ Owner */}
      {profile.is_owner && (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-xl">My pets</h2>
            <Link
              href="/dashboard/pets/new"
              className="text-sm font-medium text-gold-600 underline underline-offset-4 hover:text-gold-700"
            >
              Add a pet
            </Link>
          </div>

          {petList.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-espresso-700/15 bg-white p-10 text-center">
              <IconPaw width={32} height={32} className="mx-auto text-espresso-700/25" />
              <p className="mt-4 text-sm text-espresso-500">
                No pets yet. Add one so we can start matching you.
              </p>
              <ButtonLink href="/dashboard/pets/new" size="sm" className="mt-5">
                Add your first pet
              </ButtonLink>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {petList.map((pet) => (
                <article
                  key={pet.id}
                  className="rounded-3xl border border-espresso-700/8 bg-white p-6 shadow-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg text-espresso-700">{pet.name}</h3>
                    <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-800">
                      {pet.species === 'dog' ? 'Dog' : 'Cat'}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-espresso-500">
                    {[pet.breed, petAge(pet.birthdate), pet.species === 'dog' ? pet.size : null]
                      .filter(Boolean)
                      .join(' · ') || 'Profile started'}
                  </p>

                  {!pet.vaccinated_through && (
                    <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-olive-600">
                      <IconAlert width={15} height={15} className="mt-px shrink-0" />
                      Add vaccination records before your first booking.
                    </p>
                  )}

                  <div className="mt-5 flex gap-2">
                    <ButtonLink
                      href={`/dashboard/pets/${pet.id}/edit`}
                      size="sm"
                      variant="secondary"
                    >
                      Edit profile
                    </ButtonLink>
                    <ButtonLink href={`/dashboard/pets/${pet.id}`} size="sm" variant="ghost">
                      View
                    </ButtonLink>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <SectionCard>
              <h3 className="text-lg text-espresso-700">Upcoming bookings</h3>
              {upcoming.length === 0 ? (
                <EmptyLine>No bookings scheduled yet.</EmptyLine>
              ) : (
                <ul className="mt-3 divide-y divide-espresso-700/8">
                  {upcoming.map((booking) => (
                    <li key={booking.id}>
                      <Link
                        href={`/dashboard/bookings/${booking.id}`}
                        className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm hover:text-gold-700"
                      >
                        <span className="text-espresso-700">
                          {serviceName(booking.service_type)} with{' '}
                          {upcomingNames.get(booking.id) ?? 'a Havener'}
                        </span>
                        <span className="text-espresso-500">
                          {formatDate(booking.start_date)} ·{' '}
                          {BOOKING_STATUS[booking.status] ?? booking.status}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <ButtonLink href="/search" size="sm" className="mt-4">
                Request a new booking
              </ButtonLink>
            </SectionCard>

            <SectionCard>
              <h3 className="text-lg text-espresso-700">Havener you’ve used</h3>
              {recentSitters.length === 0 ? (
                <EmptyLine>
                  Haveners you book will show up here so you can contact them
                  again in one tap.
                </EmptyLine>
              ) : (
                <ul className="mt-3 divide-y divide-espresso-700/8">
                  {recentSitters.map((recent) => (
                    <li
                      key={recent.id}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-sky-100">
                          {recent.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={recent.avatar_url}
                              alt={recent.display_name ?? 'Havener'}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm font-medium text-espresso-500">
                              {(recent.display_name ?? 'H').slice(0, 1)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-espresso-700">
                            {recent.display_name ?? 'Havener'}
                          </p>
                          <p className="truncate text-xs text-espresso-500">
                            {[recent.service_city, recent.service_state].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      </div>
                      <ButtonLink
                        href={`/sitters/${recent.id}/contact?rebook=1`}
                        size="sm"
                        variant="secondary"
                      >
                        Contact again
                      </ButtonLink>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------- Havener */}
      {profile.is_havener && (
        <section>
          <h2 className="mb-4 text-xl">Havener profile</h2>

          <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <div className="rounded-3xl border border-espresso-700/8 bg-white p-7 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg text-espresso-700">Listing status</h3>
                <span
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium',
                    STATUS_COPY[sitterProfile?.status ?? 'draft']?.tone
                  )}
                >
                  {STATUS_COPY[sitterProfile?.status ?? 'draft']?.label}
                </span>
              </div>

              {sitterProfile?.status === 'pending_review' && (
                <p className="mt-3 text-sm leading-relaxed text-espresso-500">
                  Our team is reviewing your profile. We’ll email you as soon as
                  there’s an update, and we’ll reach out to schedule your
                  interview.
                </p>
              )}
              {sitterProfile?.status === 'rejected' && sitterProfile.rejection_reason && (
                <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-red-800">
                  {sitterProfile.rejection_reason}
                </p>
              )}

              {serviceList.length > 0 && (
                <div className="mt-6 border-t border-espresso-700/8 pt-5">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-olive-500">
                    Your services
                  </h4>
                  <ul className="mt-4 space-y-2.5">
                    {serviceList.map((service) => (
                      <li
                        key={service.id}
                        className="flex items-center justify-between gap-4 text-sm"
                      >
                        <span className="text-espresso-700">
                          {serviceName(service.service_type)}
                        </span>
                        <span className="font-medium text-espresso-700">
                          {formatCents(service.base_rate_cents)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-2">
                <ButtonLink href="/dashboard/havener/edit" variant="secondary" size="sm">
                  Edit profile
                </ButtonLink>
                <ButtonLink href="/dashboard/havener/home" variant="secondary" size="sm">
                  Photos &amp; video of my home
                </ButtonLink>
              </div>
            </div>

            <div className="rounded-3xl bg-espresso-700 p-7 text-cream">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-cream/10 text-gold-400">
                <IconShield width={20} height={20} />
              </span>
              <h3 className="mt-4 text-lg text-cream">Verification</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-cream/60">
                All four must be complete before you can take bookings.
              </p>

              <ul className="mt-5 space-y-3">
                {(
                  [
                    ['Background check', sitterProfile?.background_check_status],
                    ['Interview', sitterProfile?.interview_status],
                    ['Home verification', sitterProfile?.home_check_status],
                    ['Insurance', sitterProfile?.insurance_status],
                  ] as Array<[string, CheckStatus | undefined]>
                ).map(([label, status]) => {
                  const value = status ?? 'not_started';
                  return (
                    <li
                      key={label}
                      className="flex items-center justify-between gap-4 text-sm"
                    >
                      <span className="text-cream/80">{label}</span>
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-0.5 text-xs',
                          value === 'approved'
                            ? 'bg-gold-500 text-white'
                            : 'bg-cream/10 text-cream/60'
                        )}
                      >
                        {CHECK_COPY[value]}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------- Add the other side */}
      {profile.is_owner && !profile.is_havener && (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-espresso-700/8 bg-white p-6 shadow-card">
          <div className="min-w-0">
            <h2 className="text-lg text-espresso-700">Want to care for pets too?</h2>
            <p className="mt-1 text-sm leading-relaxed text-espresso-500">
              Become a Havener from your own profile — set your rates and
              calendar, then get verified.
            </p>
          </div>
          <form action={becomeHavenerAction}>
            <Button type="submit" variant="secondary">
              Become a Havener
            </Button>
          </form>
        </section>
      )}
      {profile.is_havener && !profile.is_owner && (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-espresso-700/8 bg-white p-6 shadow-card">
          <div className="min-w-0">
            <h2 className="text-lg text-espresso-700">Need care for your own pet?</h2>
            <p className="mt-1 text-sm leading-relaxed text-espresso-500">
              Add your pet’s profile and you can book other Haveners from the
              same account.
            </p>
          </div>
          <form action={addPetProfileAction}>
            <Button type="submit" variant="secondary">
              Add a pet profile
            </Button>
          </form>
        </section>
      )}

      {/* --------------------------------------------------------- Roadmap */}
      <section className="rounded-3xl border border-sky-200 bg-sky-50 p-7">
        <h2 className="text-lg text-espresso-700">Coming next</h2>
        <p className="mt-2 text-sm leading-relaxed text-espresso-600">
          Search, bookings, in-app chat and reviews are live. Payments through
          Havenr and GPS-tracked walks with service reports are next.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <ButtonLink href="/dashboard/calendar" variant="secondary" size="sm">
            Calendar
          </ButtonLink>
          {profile.is_owner && (
            <ButtonLink href="/search" variant="secondary" size="sm">
              Find a Havener
            </ButtonLink>
          )}
          {profile.is_owner && (
            <ButtonLink href="/dashboard/bookings" variant="secondary" size="sm">
              My bookings
            </ButtonLink>
          )}
          {profile.is_havener && (
            <ButtonLink href="/dashboard/havener/bookings" variant="secondary" size="sm">
              Booking requests
            </ButtonLink>
          )}
        </div>
      </section>
    </div>
  );
}
