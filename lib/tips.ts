/** The tips an owner can choose after a service, as a share of what they paid. */
export const TIP_PERCENTS = [10, 15, 20, 25] as const;

/** The exact tip, in cents, for a percentage of the booking total. */
export function tipCents(totalCents: number, percent: number): number {
  return Math.round((totalCents * percent) / 100);
}
