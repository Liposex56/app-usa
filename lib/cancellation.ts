import { dateInAppZone, todayInAppZone } from '@/lib/dates';

/**
 * A Havener's cancellation policy is how long, counting from the day the
 * booking was made, a cancellation can still be requested. Booked on the 10th
 * with a 3-day policy: the 10th, 11th and 12th. After that — and once the
 * service has started — it can't be cancelled. Inside the window the request
 * goes to Havenr, which confirms it. (Mirrored in the database trigger.)
 */
export const POLICY_DAYS: Record<string, number> = {
  same_day: 1,
  one_day: 1,
  three_day: 3,
  seven_day: 7,
};

export const POLICY_LABEL: Record<string, string> = {
  same_day: 'same-day',
  one_day: '1-day',
  three_day: '3-day',
  seven_day: '7-day',
};

export type CancellationWindow = {
  days: number;
  policyLabel: string;
  /** Last day (YYYY-MM-DD) a cancellation can be requested. */
  lastDay: string;
  open: boolean;
};

function addDays(day: string, amount: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + amount);
  return d.toISOString().slice(0, 10);
}

export function cancellationWindow(
  policy: string | null | undefined,
  reservedAtIso: string
): CancellationWindow {
  const key = policy && policy in POLICY_DAYS ? policy : 'three_day';
  const days = POLICY_DAYS[key];
  const lastDay = addDays(dateInAppZone(reservedAtIso), days - 1);
  return {
    days,
    policyLabel: POLICY_LABEL[key],
    lastDay,
    open: todayInAppZone() <= lastDay,
  };
}
