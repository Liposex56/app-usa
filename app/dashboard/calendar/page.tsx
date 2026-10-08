import type { Metadata } from 'next';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import type {
  BookingRow,
  PublicSitterRow,
  ServiceType,
  SitterServiceRow,
} from '@/lib/database.types';
import { requireProfile } from '@/lib/auth';
import { dateInAppZone, timeInAppZone, todayInAppZone } from '@/lib/dates';
import { SERVICE_BY_TYPE, serviceName } from '@/lib/services';
import { createClient } from '@/lib/supabase/server';
import { cn } from '@/lib/utils';

import { saveCapacityAction, saveDefaultCapacityAction } from './actions';

export const metadata: Metadata = { title: 'Calendar' };

const DOT: Record<ServiceType, string> = {
  boarding: 'bg-orange-500',
  daycare: 'bg-teal-500',
  house_sitting: 'bg-purple-500',
  dog_walking: 'bg-blue-600',
  drop_in_visit: 'bg-yellow-400',
};

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

type MeetGreetCell = {
  id: string;
  booking_id: string;
  starts_at: string;
  status: string;
};

function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(y, m - 1, 1))
  );
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; day?: string; view?: string }>;
}) {
  const profile = await requireProfile();
  const query = await searchParams;
  const today = todayInAppZone();

  const view: 'havener' | 'owner' =
    query.view === 'owner' && profile.is_owner
      ? 'owner'
      : query.view === 'havener' && profile.is_havener
        ? 'havener'
        : profile.is_havener
          ? 'havener'
          : 'owner';

  const month = /^\d{4}-\d{2}$/.test(query.month ?? '') ? (query.month as string) : today.slice(0, 7);
  const selectedDay = /^\d{4}-\d{2}-\d{2}$/.test(query.day ?? '') ? (query.day as string) : null;

  const [year, monthNumber] = month.split('-').map(Number);
  const firstOfMonth = new Date(Date.UTC(year, monthNumber - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const rangeStart = `${month}-01`;
  const rangeEnd = `${month}-${String(daysInMonth).padStart(2, '0')}`;

  const cells: Array<string | null> = [
    ...Array<null>(firstOfMonth.getUTCDay()).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const supabase = await createClient();
  const asHavener = view === 'havener';

  // Shared: the bookings that touch this month, from whichever side we're viewing.
  const { data: bookingRows } = await supabase
    .from('bookings')
    .select('*')
    .eq(asHavener ? 'sitter_id' : 'owner_id', profile.id)
    .in(
      'status',
      asHavener ? ['confirmed', 'in_progress'] : ['requested', 'confirmed', 'in_progress']
    )
    .lte('start_date', rangeEnd)
    .or(`end_date.gte.${rangeStart},and(end_date.is.null,start_date.gte.${rangeStart})`);
  const bookings = (bookingRows ?? []) as BookingRow[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: meetRows } = await (supabase.from('meet_greets') as any)
    .select(
      `id, booking_id, starts_at, status, bookings!inner(${asHavener ? 'sitter_id' : 'owner_id'})`
    )
    .eq(asHavener ? 'bookings.sitter_id' : 'bookings.owner_id', profile.id)
    .in('status', ['proposed', 'accepted'])
    .gte('starts_at', `${rangeStart}T00:00:00Z`)
    .lte('starts_at', `${rangeEnd}T23:59:59Z`);
  const meetGreets = ((meetRows ?? []) as MeetGreetCell[]).filter((m) => {
    const day = dateInAppZone(m.starts_at);
    return day >= rangeStart && day <= rangeEnd;
  });
  const meetsByDay = new Map<string, MeetGreetCell[]>();
  meetGreets.forEach((m) => {
    const day = dateInAppZone(m.starts_at);
    meetsByDay.set(day, [...(meetsByDay.get(day) ?? []), m]);
  });

  const covers = (booking: BookingRow, day: string) =>
    booking.start_date <= day && (booking.end_date ?? booking.start_date) >= day;

  /* ------------------------------------------------------------- Havener view */
  let services: SitterServiceRow[] = [];
  let defaults = new Map<ServiceType, number>();
  let overrides = new Map<string, number>();
  let blocked = new Set<string>();
  let petsByBooking = new Map<string, number>();
  let generalMax = 2;

  /* --------------------------------------------------------------- Owner view */
  let sitterNames = new Map<string, string>();

  if (asHavener) {
    const [
      { data: serviceRows },
      { data: defaultRows },
      { data: overrideRows },
      { data: blockedRows },
      { data: sitterRow },
    ] = await Promise.all([
      supabase
        .from('sitter_services')
        .select('*')
        .eq('sitter_id', profile.id)
        .eq('is_active', true),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('sitter_service_capacity') as any).select('*').eq('sitter_id', profile.id),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('sitter_capacity_overrides') as any)
        .select('*')
        .eq('sitter_id', profile.id)
        .gte('date', rangeStart)
        .lte('date', rangeEnd),
      supabase
        .from('sitter_availability')
        .select('date')
        .eq('sitter_id', profile.id)
        .eq('is_available', false)
        .gte('date', rangeStart)
        .lte('date', rangeEnd),
      supabase.from('sitter_profiles').select('max_pets_per_day').eq('id', profile.id).maybeSingle(),
    ]);

    services = (serviceRows ?? []) as SitterServiceRow[];
    defaults = new Map(
      ((defaultRows ?? []) as Array<{ service_type: ServiceType; spaces: number }>).map((r) => [
        r.service_type,
        r.spaces,
      ])
    );
    overrides = new Map(
      ((overrideRows ?? []) as Array<{ date: string; service_type: ServiceType; spaces: number }>).map(
        (r) => [`${r.date}|${r.service_type}`, r.spaces]
      )
    );
    blocked = new Set((blockedRows ?? []).map((r) => r.date as string));
    generalMax = (sitterRow as { max_pets_per_day: number } | null)?.max_pets_per_day ?? 2;

    if (bookings.length > 0) {
      const { data: petRows } = await supabase
        .from('booking_pets')
        .select('booking_id')
        .in(
          'booking_id',
          bookings.map((b) => b.id)
        );
      petsByBooking = new Map();
      (petRows ?? []).forEach((r) => {
        const id = r.booking_id as string;
        petsByBooking.set(id, (petsByBooking.get(id) ?? 0) + 1);
      });
    }
  } else {
    const ids = [...new Set(bookings.map((b) => b.sitter_id))];
    if (ids.length > 0) {
      const { data: sitters } = await supabase
        .from('public_sitters')
        .select('id, display_name')
        .in('id', ids);
      sitterNames = new Map(
        ((sitters ?? []) as Array<Pick<PublicSitterRow, 'id' | 'display_name'>>).map((s) => [
          s.id,
          s.display_name ?? 'Havener',
        ])
      );
    }
  }

  const capacityFor = (service: ServiceType, day: string) => {
    if (blocked.has(day)) return { spaces: 0, overridden: true };
    const override = overrides.get(`${day}|${service}`);
    if (override !== undefined) return { spaces: override, overridden: true };
    return { spaces: defaults.get(service) ?? generalMax, overridden: false };
  };
  const bookedFor = (service: ServiceType, day: string) =>
    bookings
      .filter((b) => b.service_type === service && covers(b, day))
      .reduce((sum, b) => sum + Math.max(1, petsByBooking.get(b.id) ?? 1), 0);

  const baseQuery = (extra: Record<string, string>) => {
    const params = new URLSearchParams({ view, month, ...extra });
    return `/dashboard/calendar?${params.toString()}`;
  };

  return (
    <div>
      <Link href="/dashboard" className="text-sm text-espresso-500 hover:text-espresso-700">
        ← Back to dashboard
      </Link>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl">Calendar</h1>
        {profile.is_havener && profile.is_owner && (
          <div className="flex gap-1 rounded-full bg-white p-1 text-sm shadow-card">
            {(['havener', 'owner'] as const).map((option) => (
              <Link
                key={option}
                href={`/dashboard/calendar?view=${option}&month=${month}`}
                className={cn(
                  'rounded-full px-4 py-1.5 font-medium',
                  view === option ? 'bg-espresso-700 text-cream' : 'text-espresso-600'
                )}
              >
                {option === 'havener' ? 'As a Havener' : 'As an owner'}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[16rem_1fr]">
        {/* ---------------------------------------------------------------- Side */}
        <aside className="space-y-5">
          {asHavener ? (
            <>
              <form
                action={saveDefaultCapacityAction}
                className="rounded-2xl border border-espresso-700/8 bg-white p-4 shadow-card"
              >
                <input type="hidden" name="month" value={month} />
                <h2 className="text-sm font-semibold text-espresso-700">Default spaces</h2>
                <p className="mt-1 text-xs text-espresso-500">
                  How many pets you accept per day, for each service.
                </p>
                <div className="mt-3 space-y-2">
                  {services.map((service) => (
                    <label
                      key={service.service_type}
                      className="flex items-center justify-between gap-3 text-sm text-espresso-700"
                    >
                      <span className="flex items-center gap-2">
                        <span className={cn('h-2.5 w-2.5 rounded-sm', DOT[service.service_type])} />
                        {SERVICE_BY_TYPE[service.service_type].pickerName}
                      </span>
                      <input
                        type="number"
                        name={`spaces_${service.service_type}`}
                        min={0}
                        max={50}
                        defaultValue={defaults.get(service.service_type) ?? generalMax}
                        className="w-16 rounded-lg border border-espresso-700/15 bg-white px-2 py-1 text-right text-sm"
                      />
                    </label>
                  ))}
                </div>
                <Button type="submit" size="sm" className="mt-3 w-full">
                  Save defaults
                </Button>
              </form>

              <div className="space-y-2 rounded-2xl border border-espresso-700/8 bg-white p-4 text-sm shadow-card">
                <Link
                  href="/dashboard/havener/availability"
                  className="block text-gold-600 hover:text-gold-700"
                >
                  Block dates
                </Link>
                <Link
                  href="/dashboard/havener/services"
                  className="block text-gold-600 hover:text-gold-700"
                >
                  Manage services
                </Link>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-espresso-700/8 bg-white p-4 text-sm text-espresso-600 shadow-card">
              Your bookings and meet &amp; greets by day.
              <Link
                href="/search"
                className="mt-3 block font-medium text-gold-600 hover:text-gold-700"
              >
                Request a new booking →
              </Link>
            </div>
          )}
        </aside>

        {/* -------------------------------------------------------------- Month */}
        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl text-espresso-700">{monthLabel(month)}</h2>
            <div className="flex items-center gap-2 text-sm">
              <Link
                href={baseQuery({}).replace(`month=${month}`, `month=${today.slice(0, 7)}`)}
                className="rounded-full border border-espresso-700/15 px-3 py-1 text-espresso-700 hover:bg-white"
              >
                Today
              </Link>
              <Link
                href={baseQuery({}).replace(`month=${month}`, `month=${shiftMonth(month, -1)}`)}
                aria-label="Previous month"
                className="rounded-full border border-espresso-700/15 px-3 py-1 text-espresso-700 hover:bg-white"
              >
                ←
              </Link>
              <Link
                href={baseQuery({}).replace(`month=${month}`, `month=${shiftMonth(month, 1)}`)}
                aria-label="Next month"
                className="rounded-full border border-espresso-700/15 px-3 py-1 text-espresso-700 hover:bg-white"
              >
                →
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-espresso-700/10 bg-white shadow-card">
            <div className="grid min-w-[700px] grid-cols-7">
              {WEEKDAYS.map((weekday) => (
                <div
                  key={weekday}
                  className="border-b border-espresso-700/10 bg-bone px-2 py-2 text-center text-xs font-semibold tracking-wide text-espresso-600"
                >
                  {weekday}
                </div>
              ))}

              {cells.map((day, index) => {
                if (!day) {
                  return (
                    <div
                      key={`blank-${index}`}
                      className="min-h-[7rem] border-b border-r border-espresso-700/8 bg-espresso-700/[0.04]"
                    />
                  );
                }

                const isToday = day === today;
                const isSelected = day === selectedDay;
                const dayNumber = Number(day.slice(8));
                const dayBookings = bookings.filter((b) => covers(b, day));
                const dayMeets = meetsByDay.get(day) ?? [];

                return (
                  <Link
                    key={day}
                    href={baseQuery({ day })}
                    className={cn(
                      'min-h-[7rem] border-b border-r border-espresso-700/8 p-1.5 text-[11px] leading-snug transition-colors hover:bg-gold-50',
                      isSelected && 'bg-gold-50 ring-2 ring-inset ring-gold-500'
                    )}
                  >
                    <span
                      className={cn(
                        'mb-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-medium',
                        isToday ? 'bg-espresso-700 text-cream' : 'text-espresso-700'
                      )}
                    >
                      {dayNumber}
                    </span>

                    {asHavener
                      ? services.map((service) => {
                          const cap = capacityFor(service.service_type, day);
                          const booked = bookedFor(service.service_type, day);
                          return (
                            <div
                              key={service.service_type}
                              className={cn(
                                'flex items-center gap-1 text-espresso-600',
                                cap.spaces === 0 && 'opacity-50'
                              )}
                            >
                              <span
                                className={cn('h-2 w-2 shrink-0 rounded-sm', DOT[service.service_type])}
                              />
                              {booked}/{cap.spaces}
                              {cap.overridden ? '*' : ''} booked
                            </div>
                          );
                        })
                      : dayBookings.map((booking) => (
                          <div
                            key={booking.id}
                            className="mb-0.5 flex items-center gap-1 text-espresso-700"
                          >
                            <span
                              className={cn('h-2 w-2 shrink-0 rounded-sm', DOT[booking.service_type])}
                            />
                            <span className="truncate">
                              {serviceName(booking.service_type)} ·{' '}
                              {sitterNames.get(booking.sitter_id) ?? 'Havener'}
                              {booking.status === 'requested' ? ' (pending)' : ''}
                            </span>
                          </div>
                        ))}

                    {dayMeets.map((meet) => (
                      <div
                        key={meet.id}
                        className="mt-0.5 rounded bg-sky-100 px-1 py-0.5 text-sky-800"
                      >
                        Meet &amp; greet {timeInAppZone(meet.starts_at)}
                      </div>
                    ))}
                  </Link>
                );
              })}
            </div>
          </div>

          {asHavener && (
            <p className="mt-3 space-y-0.5 text-xs text-espresso-500">
              <span className="block">• Booked spaces exclude any pending requests.</span>
              <span className="block">• An asterisk (*) means this day overrides your defaults.</span>
            </p>
          )}

          {/* ------------------------------------------------ Manage availability */}
          {asHavener && selectedDay && (
            <form
              action={saveCapacityAction}
              className="mt-6 rounded-2xl border border-espresso-700/10 bg-white p-5 shadow-card"
            >
              <input type="hidden" name="month" value={month} />
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold text-espresso-700">Manage availability</h2>
                <Link
                  href={baseQuery({})}
                  className="text-sm text-espresso-500 hover:text-espresso-700"
                >
                  Close
                </Link>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="From" htmlFor="cap-start">
                  <Input id="cap-start" name="startDate" type="date" defaultValue={selectedDay} required />
                </Field>
                <Field label="To" htmlFor="cap-end">
                  <Input id="cap-end" name="endDate" type="date" defaultValue={selectedDay} required />
                </Field>
              </div>

              <div className="mt-4 divide-y divide-espresso-700/8">
                {services.map((service) => {
                  const cap = capacityFor(service.service_type, selectedDay);
                  const booked = bookedFor(service.service_type, selectedDay);
                  return (
                    <div
                      key={service.service_type}
                      className="flex items-center justify-between gap-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-espresso-700">
                          {SERVICE_BY_TYPE[service.service_type].pickerName}
                        </p>
                        <p className="text-xs text-espresso-500">{booked} of {cap.spaces} spaces booked</p>
                      </div>
                      <input
                        type="number"
                        name={`spaces_${service.service_type}`}
                        min={0}
                        max={50}
                        defaultValue={cap.spaces}
                        aria-label={`${SERVICE_BY_TYPE[service.service_type].pickerName} spaces`}
                        className="w-20 rounded-lg border border-espresso-700/15 bg-white px-3 py-1.5 text-right text-sm"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-bone px-4 py-3 text-sm">
                <button
                  type="submit"
                  name="intent"
                  value="unavailable"
                  className="font-medium text-gold-600 underline underline-offset-2 hover:text-gold-700"
                >
                  Mark all services as unavailable
                </button>
                <span className="text-espresso-500">or</span>
                <button
                  type="submit"
                  name="intent"
                  value="reset"
                  className="font-medium text-gold-600 underline underline-offset-2 hover:text-gold-700"
                >
                  reset to default
                </button>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Link href={baseQuery({})} className="inline-flex h-9 items-center px-4 text-sm text-espresso-600">
                  Cancel
                </Link>
                <Button type="submit" name="intent" value="save" size="sm">
                  Save
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
