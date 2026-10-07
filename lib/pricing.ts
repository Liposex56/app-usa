import type { SitterServiceRow } from '@/lib/database.types';

/** Whole days between two 'YYYY-MM-DD' strings (end - start), never negative. */
function daysBetween(startDate: string, endDate: string): number {
  const ms = Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`);
  return Math.max(0, Math.round(ms / 86_400_000));
}

/**
 * How many billable units a booking covers. Nightly services (boarding,
 * house sitting) bill per night, daycare bills per calendar day, and walks
 * and visits are a single unit per booking.
 */
export function bookingQuantity(
  rateUnit: string,
  startDate: string,
  endDate: string | null | undefined
): number {
  const gap = daysBetween(startDate, endDate || startDate);
  if (rateUnit === 'night') return Math.max(1, gap);
  if (rateUnit === 'day') return gap + 1;
  return 1;
}

export type BookingTotals = {
  quantity: number;
  baseCents: number;
  extraFeesCents: number;
  totalCents: number;
};

export function computeBookingTotals(input: {
  service: Pick<SitterServiceRow, 'base_rate_cents' | 'additional_pet_rate_cents' | 'pickup_dropoff_rate_cents'>;
  rateUnit: string;
  startDate: string;
  endDate: string | null | undefined;
  petCount: number;
  wantsPickupDropoff: boolean;
}): BookingTotals {
  const { service, rateUnit, startDate, endDate, petCount, wantsPickupDropoff } = input;
  const quantity = bookingQuantity(rateUnit, startDate, endDate);
  const baseCents = service.base_rate_cents * quantity;
  const extraPetsCents =
    Math.max(0, petCount - 1) * service.additional_pet_rate_cents * quantity;
  const pickupCents = wantsPickupDropoff ? (service.pickup_dropoff_rate_cents ?? 0) : 0;
  const extraFeesCents = extraPetsCents + pickupCents;
  return { quantity, baseCents, extraFeesCents, totalCents: baseCents + extraFeesCents };
}
