import type { ServiceType } from '@/lib/database.types';
import { distanceMiles } from '@/lib/geo';

/**
 * Service reports — the evidence left during a service and what a Havener
 * has to have logged before it can be marked completed. This is the promise
 * made on the landing ("walks you can actually verify", "visits with a real
 * checklist"), kept in one place so the Havener's screen, the server action
 * and the owner's report all agree.
 */

export const SERVICE_BUCKET = 'service-updates';
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const ACCEPTED_MEDIA = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/quicktime',
  'video/webm',
];

export type UpdateKind =
  | 'photo'
  | 'note'
  | 'potty'
  | 'feeding'
  | 'water'
  | 'play'
  | 'medication'
  | 'litter'
  | 'wellbeing';

export type ServiceUpdateRow = {
  id: string;
  booking_id: string;
  author_id: string;
  kind: UpdateKind;
  body: string | null;
  media_path: string | null;
  media_type: 'image' | 'video' | null;
  created_at: string;
};

export const KIND_LABEL: Record<UpdateKind, string> = {
  photo: 'Photo',
  note: 'Note',
  potty: 'Potty break',
  feeding: 'Fed',
  water: 'Fresh water',
  play: 'Playtime',
  medication: 'Medication given',
  litter: 'Litter cleaned',
  wellbeing: 'Wellbeing check',
};

/** Which kinds of pet are on the booking — cats get a litter box, dogs potty breaks. */
export type PetMix = { hasDog: boolean; hasCat: boolean };

/** A one-tap entry in the service log. */
export type QuickEntry = { id: string; kind: UpdateKind; label: string; body?: string };

const PEE: QuickEntry = { id: 'pee', kind: 'potty', label: 'Pee', body: 'Pee' };
const POOP: QuickEntry = { id: 'poop', kind: 'potty', label: 'Poop', body: 'Poop' };
const plain = (kind: UpdateKind): QuickEntry => ({ id: kind, kind, label: KIND_LABEL[kind] });

/**
 * One-tap entries offered to the Havener. Walks, drop-in visits and daycare
 * keep a summary (potty, food, water — and the litter box for cats); boarding
 * and house sitting have no log at all, only the chat.
 */
export function quickEntries(service: ServiceType, pets: PetMix): QuickEntry[] {
  const dogs = pets.hasDog || !pets.hasCat;
  const potty = dogs ? [PEE, POOP] : [];
  const litter = pets.hasCat ? [plain('litter')] : [];
  switch (service) {
    case 'dog_walking':
      return [PEE, POOP, plain('water'), plain('play')];
    case 'drop_in_visit':
      return [
        plain('feeding'),
        plain('water'),
        ...potty,
        ...litter,
        plain('play'),
        plain('medication'),
        plain('wellbeing'),
      ];
    case 'daycare':
      return [
        plain('feeding'),
        plain('water'),
        ...potty,
        ...litter,
        plain('play'),
        plain('medication'),
        plain('wellbeing'),
      ];
    default:
      return [];
  }
}

/** "Pee" / "Poop" entries read as their own name in the report. */
export function entryTitle(update: Pick<ServiceUpdateRow, 'kind' | 'body'>): string {
  if (update.kind === 'potty' && (update.body === 'Pee' || update.body === 'Poop')) {
    return `${KIND_LABEL.potty} · ${update.body}`;
  }
  return KIND_LABEL[update.kind];
}

export function entryNote(update: Pick<ServiceUpdateRow, 'kind' | 'body'>): string | null {
  if (update.kind === 'potty' && (update.body === 'Pee' || update.body === 'Poop')) return null;
  return update.body;
}

export type Requirement = { key: string; label: string; met: boolean };

const isMedia = (u: ServiceUpdateRow) => Boolean(u.media_path);
const count = (updates: ServiceUpdateRow[], kind: UpdateKind) =>
  updates.filter((u) => u.kind === kind).length;

export type CompletionContext = {
  gpsPoints: number;
  pets: PetMix;
  /** The booked length of a walk or a visit, and when the Havener started it. */
  durationMinutes: number | null;
  startedAt: string | null;
  now?: number;
};

/**
 * What still has to be logged before the service can be marked completed:
 * the photos for the summary cards, the summary itself (potty, food, water,
 * the litter box for cats) and — for walks and visits — the booked time.
 */
export function completionRequirements(
  service: ServiceType,
  updates: ServiceUpdateRow[],
  context: CompletionContext
): Requirement[] {
  const hasMedia = updates.some(isMedia);
  const dogs = context.pets.hasDog || !context.pets.hasCat;
  const cats = context.pets.hasCat;
  const now = context.now ?? Date.now();

  const summary: Requirement[] = [
    { key: 'feeding', label: 'Log their meal', met: count(updates, 'feeding') >= 1 },
    { key: 'water', label: 'Log fresh water', met: count(updates, 'water') >= 1 },
    ...(dogs
      ? [{ key: 'potty', label: 'Log a potty break (pee or poop)', met: count(updates, 'potty') >= 1 }]
      : []),
    ...(cats
      ? [{ key: 'litter', label: 'Log the litter box cleaning', met: count(updates, 'litter') >= 1 }]
      : []),
  ];

  const length: Requirement[] =
    context.durationMinutes && context.startedAt
      ? [
          {
            key: 'duration',
            label: `Stay the booked ${context.durationMinutes} minutes`,
            met: now >= Date.parse(context.startedAt) + context.durationMinutes * 60_000,
          },
        ]
      : [];

  switch (service) {
    case 'dog_walking':
      return [
        { key: 'media', label: 'Send at least one photo of the walk', met: hasMedia },
        { key: 'potty', label: 'Log a potty break (pee or poop)', met: count(updates, 'potty') >= 1 },
        {
          key: 'gps',
          label: 'Share your GPS location during the walk',
          met: context.gpsPoints >= 2,
        },
        ...length,
      ];
    case 'drop_in_visit':
      return [
        { key: 'media', label: 'Send at least one photo of the visit', met: hasMedia },
        ...summary,
        {
          key: 'wellbeing',
          label: 'Do the wellbeing check',
          met: count(updates, 'wellbeing') >= 1,
        },
        ...length,
      ];
    case 'daycare':
      return [
        { key: 'media', label: 'Send at least one photo of the day', met: hasMedia },
        ...summary,
      ];
    default:
      return [
        {
          key: 'media',
          label: 'Share at least one photo or video update',
          met: hasMedia,
        },
      ];
  }
}

/** Time left until a walk or visit may be finished, e.g. "12 min". */
export function minutesLeft(
  startedAt: string | null,
  durationMinutes: number | null,
  now = Date.now()
): number {
  if (!startedAt || !durationMinutes) return 0;
  return Math.max(0, Math.ceil((Date.parse(startedAt) + durationMinutes * 60_000 - now) / 60_000));
}

/** Length of the recorded GPS route, in miles. */
export function routeDistanceMiles(
  points: Array<{ latitude: number; longitude: number }>
): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += distanceMiles(
      { lat: points[i - 1].latitude, lng: points[i - 1].longitude },
      { lat: points[i].latitude, lng: points[i].longitude }
    );
  }
  return total;
}

export function formatDuration(startIso: string | null, endIso: string | null): string | null {
  if (!startIso || !endIso) return null;
  const minutes = Math.max(0, Math.round((Date.parse(endIso) - Date.parse(startIso)) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'}`;
  }
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}
