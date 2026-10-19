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

/**
 * Havenr's percentages behind "automatic rates" (Admin → Settings). `null`
 * means Havenr hasn't set that one yet.
 */
export type AutoRatePercents = {
  holiday: number | null;
  additionalPet: number | null;
  extendedStay: number | null;
};

type RateSource = Pick<
  SitterServiceRow,
  | 'base_rate_cents'
  | 'additional_pet_rate_cents'
  | 'holiday_rate_cents'
  | 'extended_stay_rate_cents'
  | 'pickup_dropoff_rate_cents'
> & { auto_rates?: boolean };

const roundToDollars = (cents: number) => Math.round(cents / 100) * 100;

export type EffectiveRates = {
  base: number;
  additional: number;
  holiday: number | null;
  extended: number | null;
  pickup: number | null;
};

/**
 * The rates a booking is priced with. With "automatic rates" on, the holiday,
 * additional-pet and extended-stay rates come from Havenr's percentages (whole
 * dollars); everything else is the Havener's own. Mirrors `stay_price()` in
 * the database, which is what actually prices a booking.
 */
export function effectiveRates(
  service: RateSource,
  percents: AutoRatePercents | null | undefined
): EffectiveRates {
  const base = service.base_rate_cents;
  let additional = service.additional_pet_rate_cents;
  let holiday = service.holiday_rate_cents;
  let extended = service.extended_stay_rate_cents;

  if (service.auto_rates && percents) {
    if (percents.holiday != null) holiday = roundToDollars(base * (1 + percents.holiday / 100));
    if (percents.additionalPet != null) {
      additional = roundToDollars((base * percents.additionalPet) / 100);
    }
    if (percents.extendedStay != null) {
      extended = roundToDollars(base * (1 + percents.extendedStay / 100));
    }
  }

  return { base, additional, holiday, extended, pickup: service.pickup_dropoff_rate_cents };
}

/** True when any day from start to end (inclusive) is one of the holidays. */
export function stayIncludesHoliday(
  holidayDays: Iterable<string>,
  startDate: string,
  endDate: string | null | undefined
): boolean {
  const last = endDate || startDate;
  for (const day of holidayDays) {
    if (day >= startDate && day <= last) return true;
  }
  return false;
}

export type BookingTotals = {
  quantity: number;
  /** Price of one unit (night, day, walk or visit) with the rate that applied. */
  unitCents: number;
  rateKind: 'standard' | 'holiday' | 'extended';
  additionalCents: number;
  baseCents: number;
  extraFeesCents: number;
  totalCents: number;
};

/**
 * A stay that touches a holiday is charged at the holiday rate for the whole
 * stay; otherwise a stay of more than one unit can use the extended-stay
 * rate; otherwise the base rate. Each extra pet adds the additional-pet rate
 * per unit, and pick-up and drop-off adds its flat rate.
 */
export function computeBookingTotals(input: {
  service: RateSource;
  percents?: AutoRatePercents | null;
  holidayDays?: Iterable<string>;
  rateUnit: string;
  startDate: string;
  endDate: string | null | undefined;
  petCount: number;
  wantsPickupDropoff: boolean;
}): BookingTotals {
  const { service, rateUnit, startDate, endDate, petCount, wantsPickupDropoff } = input;
  const rates = effectiveRates(service, input.percents);
  const quantity = bookingQuantity(rateUnit, startDate, endDate);

  let unitCents = rates.base;
  let rateKind: BookingTotals['rateKind'] = 'standard';
  if (
    rates.holiday != null &&
    rates.holiday > 0 &&
    input.holidayDays &&
    stayIncludesHoliday(input.holidayDays, startDate, endDate)
  ) {
    unitCents = rates.holiday;
    rateKind = 'holiday';
  } else if (quantity > 1 && rates.extended != null && rates.extended > 0) {
    unitCents = rates.extended;
    rateKind = 'extended';
  }

  const baseCents = unitCents * quantity;
  const extraPetsCents = Math.max(0, petCount - 1) * rates.additional * quantity;
  const pickupCents = wantsPickupDropoff ? (rates.pickup ?? 0) : 0;
  const extraFeesCents = extraPetsCents + pickupCents;
  return {
    quantity,
    unitCents,
    rateKind,
    additionalCents: rates.additional,
    baseCents,
    extraFeesCents,
    totalCents: baseCents + extraFeesCents,
  };
}

export const RATE_KIND_LABEL: Record<BookingTotals['rateKind'], string | null> = {
  standard: null,
  holiday: 'Holiday rate',
  extended: 'Extended stay rate',
};
