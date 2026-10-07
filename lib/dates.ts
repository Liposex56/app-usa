/** Havenr operates in the Boston area, so "today" means today there. */
export const APP_TIME_ZONE = 'America/New_York';

/** 'YYYY-MM-DD' for the given instant in the app's time zone. */
export function dateInAppZone(value: Date | string = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

export function todayInAppZone(): string {
  return dateInAppZone();
}

/** "3:30 PM" in the app's time zone. */
export function timeInAppZone(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}
