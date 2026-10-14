import { formatCents } from '@/lib/utils';

/** '19:30' or '19:30:00' -> '7:30 PM'. */
export function formatClock(value: string | null | undefined): string | null {
  if (!value) return null;
  const [hourText, minute] = value.split(':');
  const hour = Number(hourText);
  if (Number.isNaN(hour) || minute === undefined) return null;
  return `${hour % 12 === 0 ? 12 : hour % 12}:${minute.slice(0, 2)} ${hour >= 12 ? 'PM' : 'AM'}`;
}

export function clockRange(from: string | null, to: string | null): string | null {
  const start = formatClock(from);
  const end = formatClock(to);
  if (start && end) return `${start} – ${end}`;
  return start ?? end;
}

const OWNED_PREFIXES = [
  'Drop-off window:',
  'Pick-up window:',
  'Drop-off time:',
  'Pick-up time:',
  'Arrival time:',
  'Departure time:',
  'Preferred time:',
  'Extras:',
];

type ScheduleLines = {
  dropoffFrom: string | null;
  dropoffTo: string | null;
  pickupFrom: string | null;
  pickupTo: string | null;
  wantsPickupDropoff: boolean;
  pickupDropoffRateCents: number | null;
};

/** The schedule part of the request summary a Havener reads before deciding. */
export function scheduleLines(input: ScheduleLines): string[] {
  const dropoff = clockRange(input.dropoffFrom, input.dropoffTo);
  const pickup = clockRange(input.pickupFrom, input.pickupTo);
  // One exact time = a timed service (it starts and ends then); a from–to
  // range is just the time the owner would prefer.
  const dropoffLabel = input.dropoffFrom && input.dropoffTo ? 'Preferred time' : 'Drop-off time';
  const pickupLabel = input.pickupFrom && input.pickupTo ? 'Pick-up window' : 'Pick-up time';
  return [
    dropoff ? `${dropoffLabel}: ${dropoff}` : null,
    pickup ? `${pickupLabel}: ${pickup}` : null,
    input.wantsPickupDropoff
      ? input.pickupDropoffRateCents
        ? `Extras: Havener pick-up and drop-off (+${formatCents(input.pickupDropoffRateCents)})`
        : 'Extras: Havener pick-up and drop-off requested'
      : null,
  ].filter((line): line is string => Boolean(line));
}

/**
 * Keeps everything in an existing summary (like the pets line) and swaps in
 * fresh schedule lines — used when a request is modified.
 */
export function rebuildNotes(existing: string | null, input: ScheduleLines): string {
  const kept = (existing ?? '')
    .split('\n')
    .filter((line) => line.trim() && !OWNED_PREFIXES.some((prefix) => line.startsWith(prefix)));
  return [...kept, ...scheduleLines(input)].join('\n');
}
