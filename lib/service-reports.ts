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

const DAY_CARE: UpdateKind[] = ['feeding', 'water', 'potty', 'play', 'medication', 'wellbeing'];

/** One-tap entries offered to the Havener for each service. */
export const QUICK_KINDS: Record<ServiceType, UpdateKind[]> = {
  dog_walking: ['potty', 'water', 'play'],
  drop_in_visit: ['feeding', 'water', 'litter', 'play', 'medication', 'wellbeing'],
  boarding: DAY_CARE,
  daycare: DAY_CARE,
  house_sitting: DAY_CARE,
};

export type Requirement = { key: string; label: string; met: boolean };

const isMedia = (u: ServiceUpdateRow) => Boolean(u.media_path);
const count = (updates: ServiceUpdateRow[], kind: UpdateKind) =>
  updates.filter((u) => u.kind === kind).length;

/** What still has to be logged before the service can be marked completed. */
export function completionRequirements(
  service: ServiceType,
  updates: ServiceUpdateRow[],
  gpsPoints: number
): Requirement[] {
  const hasMedia = updates.some(isMedia);

  switch (service) {
    case 'dog_walking':
      return [
        { key: 'media', label: 'Send at least one photo of the walk', met: hasMedia },
        { key: 'potty', label: 'Log a potty break', met: count(updates, 'potty') >= 1 },
        {
          key: 'gps',
          label: 'Share your GPS location during the walk',
          met: gpsPoints >= 2,
        },
      ];
    case 'drop_in_visit':
      return [
        { key: 'media', label: 'Send at least one photo of the visit', met: hasMedia },
        {
          key: 'wellbeing',
          label: 'Do the wellbeing check',
          met: count(updates, 'wellbeing') >= 1,
        },
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
