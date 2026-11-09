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

/** Walks and drop-in visits are priced by length; the rest are stays. */
export function isVisitUnit(rateUnit: string): boolean {
  return rateUnit === 'walk' || rateUnit === 'visit';
}

/**
 * Havenr's rules behind "automatic rates" (Admin → Rates & holidays), one set
 * for stays (boarding, house sitting, daycare) and one for visits (walks,
 * drop-in). `null` means Havenr hasn't set that one yet.
 */
export type AutoRatePercents = {
  /** Stays: added to the rate in a holiday period (on top of the puppy rate). */
  stayHoliday: number | null;
  /** Stays: change to the rate from `stayExtendedMinUnits` nights on (negative = discount). */
  stayExtended: number | null;
  stayExtendedMinUnits: number | null;
  /** Stays: added to the first dog's rate when the stay includes a puppy. */
  stayPuppy: number | null;
  /** Stays: dollars (in cents) taken off the rate for each additional pet. */
  stayAdditionalLessCents: number | null;
  /** Visits: added to the 30-minute rate for a 60-minute visit. */
  visitSixty: number | null;
  /** Visits: share taken off the rate for each additional pet. */
  visitAdditionalLess: number | null;
  /** Visits: added to the rate when the visit includes a puppy. */
  visitPuppy: number | null;
};

type RateSource = Pick<
  SitterServiceRow,
  | 'base_rate_cents'
  | 'additional_pet_rate_cents'
  | 'holiday_rate_cents'
  | 'extended_stay_rate_cents'
  | 'pickup_dropoff_rate_cents'
> & {
  puppy_rate_cents?: number | null;
  sixty_minute_rate_cents?: number | null;
  auto_rates?: boolean;
};

/** Rates are whole dollars: results are rounded to the nearest dollar. */
export const roundToDollars = (cents: number) => Math.round(cents / 100) * 100;

export type EffectiveRates = {
  base: number;
  additional: number;
  holiday: number | null;
  extended: number | null;
  puppy: number | null;
  /** Visits only: the 60-minute rate. */
  sixty: number | null;
  pickup: number | null;
};

/**
 * The rates a booking is priced with. With "automatic rates" on, the holiday,
 * extended-stay, puppy, additional-pet and 60-minute rates come from Havenr's
 * rules (whole dollars); everything else is the Havener's own. Mirrors
 * `stay_price()` in the database, which is what actually prices a booking.
 */
export function effectiveRates(
  service: RateSource,
  percents: AutoRatePercents | null | undefined,
  rateUnit: string
): EffectiveRates {
  const base = service.base_rate_cents;
  const visit = isVisitUnit(rateUnit);
  const auto = Boolean(service.auto_rates && percents);

  const sixtyAuto =
    percents?.visitSixty != null ? roundToDollars(base * (1 + percents.visitSixty / 100)) : base;

  if (visit) {
    return {
      base,
      additional:
        auto && percents?.visitAdditionalLess != null
          ? roundToDollars(base * (1 - percents.visitAdditionalLess / 100))
          : service.additional_pet_rate_cents,
      holiday: null,
      extended: null,
      puppy:
        auto && percents?.visitPuppy != null
          ? roundToDollars(base * (1 + percents.visitPuppy / 100))
          : null,
      sixty: auto ? sixtyAuto : (service.sixty_minute_rate_cents ?? sixtyAuto),
      pickup: service.pickup_dropoff_rate_cents,
    };
  }

  return {
    base,
    additional:
      auto && percents?.stayAdditionalLessCents != null
        ? Math.max(0, base - percents.stayAdditionalLessCents)
        : service.additional_pet_rate_cents,
    holiday:
      auto && percents?.stayHoliday != null
        ? roundToDollars(base * (1 + percents.stayHoliday / 100))
        : service.holiday_rate_cents,
    // Unless the Havener sets their own, an extended stay costs the regular rate.
    extended:
      auto && percents?.stayExtended != null
        ? roundToDollars(base * (1 + percents.stayExtended / 100))
        : (service.extended_stay_rate_cents ?? base),
    puppy:
      auto && percents?.stayPuppy != null
        ? roundToDollars(base * (1 + percents.stayPuppy / 100))
        : (service.puppy_rate_cents ?? null),
    sixty: null,
    pickup: service.pickup_dropoff_rate_cents,
  };
}

/** A holiday period as whole days ('YYYY-MM-DD', both included). */
export type HolidayPeriod = { start: string; end: string };

/** True when any day from start to end (inclusive) falls in one of the periods. */
export function stayIncludesHoliday(
  periods: Iterable<HolidayPeriod>,
  startDate: string,
  endDate: string | null | undefined
): boolean {
  const last = endDate || startDate;
  for (const period of periods) {
    if (startDate <= period.end && last >= period.start) return true;
  }
  return false;
}

/** A dog younger than a year on the first day of the booking is a puppy. */
export function isPuppy(
  pet: { species: string; birthdate: string | null },
  onDate: string
): boolean {
  if (pet.species !== 'dog' || !pet.birthdate || !onDate) return false;
  const limit = new Date(`${onDate}T00:00:00Z`);
  limit.setUTCFullYear(limit.getUTCFullYear() - 1);
  return pet.birthdate > limit.toISOString().slice(0, 10);
}

export type BookingTotals = {
  quantity: number;
  /** Price of one unit (night, day, walk or visit) with the rate that applied. */
  unitCents: number;
  rateKind: 'standard' | 'holiday' | 'extended' | 'puppy';
  additionalCents: number;
  baseCents: number;
  extraFeesCents: number;
  totalCents: number;
};

/**
 * Stays: the first dog pays the regular rate; a puppy raises it, and a holiday
 * raises it again on top of that (or, with no holiday, a stay of enough nights
 * gets the extended-stay change). Visits: 30 minutes is the regular rate, 60
 * minutes has its own, and a puppy raises it. Each extra pet adds the
 * additional rate per unit, and pick-up and drop-off adds its flat rate.
 */
export function computeBookingTotals(input: {
  service: RateSource;
  percents?: AutoRatePercents | null;
  holidayPeriods?: Iterable<HolidayPeriod>;
  rateUnit: string;
  startDate: string;
  endDate: string | null | undefined;
  petCount: number;
  /** True when the booking includes a puppy. */
  hasPuppy?: boolean;
  /** 30 or 60 for walks and drop-in visits. */
  durationMinutes?: number | null;
  wantsPickupDropoff: boolean;
}): BookingTotals {
  const { service, rateUnit, startDate, endDate, petCount, wantsPickupDropoff } = input;
  const percents = input.percents ?? null;
  const auto = Boolean(service.auto_rates && percents);
  const rates = effectiveRates(service, percents, rateUnit);
  const quantity = bookingQuantity(rateUnit, startDate, endDate);

  let unitCents = rates.base;
  let rateKind: BookingTotals['rateKind'] = 'standard';

  if (isVisitUnit(rateUnit)) {
    const base = input.durationMinutes === 60 && rates.sixty != null ? rates.sixty : rates.base;
    unitCents = base;
    if (input.hasPuppy && auto && percents?.visitPuppy != null) {
      unitCents = roundToDollars(base * (1 + percents.visitPuppy / 100));
      rateKind = 'puppy';
    }
    // Every additional pet pays the 60-minute share too.
    const additional =
      auto && percents?.visitAdditionalLess != null
        ? roundToDollars(base * (1 - percents.visitAdditionalLess / 100))
        : rates.additional;
    const extraFeesCents =
      Math.max(0, petCount - 1) * additional * quantity +
      (wantsPickupDropoff ? (rates.pickup ?? 0) : 0);
    return {
      quantity,
      unitCents,
      rateKind,
      additionalCents: additional,
      baseCents: unitCents * quantity,
      extraFeesCents,
      totalCents: unitCents * quantity + extraFeesCents,
    };
  }

  // A puppy raises the first dog's rate…
  if (input.hasPuppy) {
    if (auto && percents?.stayPuppy != null) {
      unitCents = roundToDollars(rates.base * (1 + percents.stayPuppy / 100));
      rateKind = 'puppy';
    } else if (!auto && (service.puppy_rate_cents ?? 0) > 0) {
      unitCents = service.puppy_rate_cents as number;
      rateKind = 'puppy';
    }
  }

  // …a holiday raises it again (on top of the puppy rate), or a long stay
  // gets the extended-stay change.
  const holiday =
    input.holidayPeriods != null &&
    stayIncludesHoliday(input.holidayPeriods, startDate, endDate);
  const minUnits = percents?.stayExtendedMinUnits ?? 3;
  if (holiday) {
    if (auto && percents?.stayHoliday != null) {
      unitCents = roundToDollars(unitCents * (1 + percents.stayHoliday / 100));
      rateKind = 'holiday';
    } else if (!auto && (rates.holiday ?? 0) > 0) {
      unitCents = rates.holiday as number;
      rateKind = 'holiday';
    }
  } else if (quantity >= minUnits) {
    // Only labelled "extended" when it actually changes the price.
    if (auto && percents?.stayExtended != null) {
      const extended = roundToDollars(unitCents * (1 + percents.stayExtended / 100));
      if (extended !== unitCents) {
        unitCents = extended;
        rateKind = 'extended';
      }
    } else if (
      !auto &&
      (service.extended_stay_rate_cents ?? 0) > 0 &&
      service.extended_stay_rate_cents !== unitCents
    ) {
      unitCents = service.extended_stay_rate_cents as number;
      rateKind = 'extended';
    }
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
  puppy: 'Puppy rate',
};
