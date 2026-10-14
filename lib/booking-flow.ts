import type { ServiceType } from '@/lib/database.types';

/**
 * Services that run on the booked times: they start by themselves at the
 * drop-off time and finish by themselves at the pick-up time, so the Havener
 * has no Start / Complete buttons for them and photos go in the chat.
 * (Walks and visits are started and finished by the Havener, and can't be
 * completed until the required photos are in.)
 */
export const TIMED_SERVICES: ServiceType[] = ['boarding', 'daycare', 'house_sitting'];

/** Private bucket holding photos and videos sent in a booking's chat. */
export const CHAT_BUCKET = 'chat-media';

export function isTimedService(service: ServiceType | string | null | undefined): boolean {
  return TIMED_SERVICES.includes(service as ServiceType);
}

/** Wording of the two times for each timed service. */
export function timeLabels(service: ServiceType | string): { start: string; end: string } {
  return service === 'house_sitting'
    ? { start: 'Arrival time', end: 'Departure time' }
    : { start: 'Drop-off time', end: 'Pick-up time' };
}
