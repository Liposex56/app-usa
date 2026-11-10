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
  /** Boarding and daycare: dollars (in cents) taken off the rate for each additional pet. */
  stayAdditionalLessCents: number | null;
  /** House sitting: share taken off the rate for each additional pet. */
  houseAdditionalLess: number | null;
  /** Visits: added to the 30-minute rate for a 60-minute visit. */
  visitSixty: number | null;
  /** Visits: share taken off the rate for each additional pet. */
  visitAdditionalLess: number | null;
  /** Visits: added to the rate when the visit includes a puppy. */
  visitPuppy: number | null;
  /** Visits: added to the rate in a holiday period. */
  visitHoliday: number | null;
  /** Drop-in visits for cats: share taken off the regular rate. */
  visitCatLess: number | null;
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

/** Extended care: hours past the 24-hour cycle before anything is charged, and where it doubles. */
export const EXTENDED_CARE = { graceHours: 2, fullHours: 8, partialPercent: 50, fullPercent: 100 };

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

/** Which service a rate belongs to, for the rules that differ by service. */
type ServiceKind = { rateUnit: string; serviceType?: string };

/**
 * The rates shown for a service (a Havener's settings and public profile).
 * With "automatic rates" on, the holiday, extended-stay, puppy, additional-pet
 * and 60-minute rates come from Havenr's rules (whole dollars); everything
 * else is the Havener's own. `computeBookingTotals` prices an actual booking.
 */
export function effectiveRates(
  service: RateSource,
  percents: AutoRatePercents | null | undefined,
  rateUnit: string,
  serviceType?: string
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
      holiday:
        auto && percents?.visitHoliday != null
          ? roundToDollars(base * (1 + percents.visitHoliday / 100))
          : service.holiday_rate_cents,
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
    additional: stayAdditional(service, percents, auto, base, { rateUnit, serviceType }),
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

/** Additional pet on a stay: $10 less for boarding and daycare, 50 % less for house sitting. */
function stayAdditional(
  service: RateSource,
  percents: AutoRatePercents | null | undefined,
  auto: boolean,
  base: number,
  kind: ServiceKind
): number {
  if (auto && kind.serviceType === 'house_sitting' && percents?.houseAdditionalLess != null) {
    return roundToDollars(base * (1 - percents.houseAdditionalLess / 100));
  }
  if (auto && percents?.stayAdditionalLessCents != null) {
    return Math.max(0, base - percents.stayAdditionalLessCents);
  }
  return service.additional_pet_rate_cents;
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

/** 'HH:MM' → hours as a number; null when it isn't a time. */
function clockHours(value: string | null | undefined): number | null {
  if (!value) return null;
  const [h, m] = value.split(':').map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h + m / 60 : null;
}

/**
 * Share of a night charged for extended care: pick-up later in the day than
 * drop-off by more than the grace period.
 */
export function extendedCarePercent(
  dropoffTime: string | null | undefined,
  pickupTime: string | null | undefined
): number {
  const from = clockHours(dropoffTime);
  const to = clockHours(pickupTime);
  if (from == null || to == null) return 0;
  const hours = to - from;
  if (hours >= EXTENDED_CARE.fullHours) return EXTENDED_CARE.fullPercent;
  if (hours > EXTENDED_CARE.graceHours) return EXTENDED_CARE.partialPercent;
  return 0;
}

export type BookingTotals = {
  quantity: number;
  /** Price of one unit (night, day, walk or visit) with the rate that applied. */
  unitCents: number;
  rateKind: 'standard' | 'holiday' | 'extended' | 'puppy';
  additionalCents: number;
  baseCents: number;
  /** Additional pets, for the whole booking. */
  extraPetsCents: number;
  pickupCents: number;
  /** Extended care, already inside extraFeesCents. */
  careCents: number;
  extraFeesCents: number;
  totalCents: number;
};

/**
 * Prices a booking the way `stay_price()` does in the database (which is what
 * actually charges): see the rules there.
 */
export function computeBookingTotals(input: {
  service: RateSource;
  serviceType?: string;
  percents?: AutoRatePercents | null;
  holidayPeriods?: Iterable<HolidayPeriod>;
  rateUnit: string;
  startDate: string;
  endDate: string | null | undefined;
  petCount: number;
  /** True when the booking includes a puppy. */
  hasPuppy?: boolean;
  /** True when every pet on the booking is a cat. */
  allCats?: boolean;
  /** 30 or 60 for walks and drop-in visits. */
  durationMinutes?: number | null;
  /** 'HH:MM' drop-off and pick-up times, for extended care. */
  dropoffTime?: string | null;
  pickupTime?: string | null;
  wantsPickupDropoff: boolean;
}): BookingTotals {
  const { service, rateUnit, startDate, endDate, petCount, wantsPickupDropoff } = input;
  const percents = input.percents ?? null;
  const auto = Boolean(service.auto_rates && percents);
  const quantity = bookingQuantity(rateUnit, startDate, endDate);
  const extras = Math.max(0, petCount - 1);
  const pickupCents = wantsPickupDropoff ? (service.pickup_dropoff_rate_cents ?? 0) : 0;
  const holiday =
    input.holidayPeriods != null &&
    stayIncludesHoliday(input.holidayPeriods, startDate, endDate);

  let base = service.base_rate_cents;
  let unitCents = base;
  let additional: number;
  let rateKind: BookingTotals['rateKind'] = 'standard';
  let careCents = 0;

  if (isVisitUnit(rateUnit)) {
    if (
      auto &&
      input.allCats &&
      input.serviceType === 'drop_in_visit' &&
      percents?.visitCatLess != null
    ) {
      base = roundToDollars(base * (1 - percents.visitCatLess / 100));
    }
    if (input.durationMinutes === 60) {
      const sixty =
        percents?.visitSixty != null ? roundToDollars(base * (1 + percents.visitSixty / 100)) : base;
      base = auto ? sixty : (service.sixty_minute_rate_cents ?? sixty);
    }
    unitCents = base;
    if (input.hasPuppy && auto && percents?.visitPuppy != null) {
      unitCents = roundToDollars(base * (1 + percents.visitPuppy / 100));
      rateKind = 'puppy';
    }
    additional =
      auto && percents?.visitAdditionalLess != null
        ? roundToDollars(base * (1 - percents.visitAdditionalLess / 100))
        : service.additional_pet_rate_cents;
    if (holiday) {
      if (auto && percents?.visitHoliday != null) {
        unitCents = roundToDollars(unitCents * (1 + percents.visitHoliday / 100));
        additional = roundToDollars(additional * (1 + percents.visitHoliday / 100));
        rateKind = 'holiday';
      } else if (
        !auto &&
        (service.holiday_rate_cents ?? 0) > 0 &&
        (input.durationMinutes ?? 30) !== 60
      ) {
        unitCents = service.holiday_rate_cents as number;
        rateKind = 'holiday';
      }
    }
  } else {
    // A puppy raises the first dog's rate…
    if (input.hasPuppy) {
      if (auto && percents?.stayPuppy != null) {
        unitCents = roundToDollars(base * (1 + percents.stayPuppy / 100));
        rateKind = 'puppy';
      } else if (!auto && (service.puppy_rate_cents ?? 0) > 0) {
        unitCents = service.puppy_rate_cents as number;
        rateKind = 'puppy';
      }
    }

    additional = stayAdditional(service, percents, auto, base, {
      rateUnit,
      serviceType: input.serviceType,
    });

    // …a holiday raises it again (and the additional dogs with it), or a long
    // stay uses the extended-stay rate.
    const minUnits = percents?.stayExtendedMinUnits ?? 3;
    if (holiday) {
      if (auto && percents?.stayHoliday != null) {
        unitCents = roundToDollars(unitCents * (1 + percents.stayHoliday / 100));
        additional = roundToDollars(additional * (1 + percents.stayHoliday / 100));
        rateKind = 'holiday';
      } else if (!auto && (service.holiday_rate_cents ?? 0) > 0) {
        unitCents = service.holiday_rate_cents as number;
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

    // Extended care: time past the 24-hour cycle on the last day.
    const nights = daysBetween(startDate, endDate || startDate);
    if (
      (input.serviceType === 'boarding' || input.serviceType === 'house_sitting') &&
      nights >= 1
    ) {
      const percent = extendedCarePercent(input.dropoffTime, input.pickupTime);
      if (percent > 0) {
        careCents = roundToDollars(((unitCents + extras * additional) * percent) / 100);
      }
    }
  }

  const baseCents = unitCents * quantity;
  const extraPetsCents = extras * additional * quantity;
  const extraFeesCents = extraPetsCents + pickupCents + careCents;
  return {
    quantity,
    unitCents,
    rateKind,
    additionalCents: additional,
    baseCents,
    extraPetsCents,
    pickupCents,
    careCents,
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

/** The "what is extended care?" explanation shown next to that charge. */
export const EXTENDED_CARE_HELP =
  'Nightly rates are based on a 24-hour period from drop-off to pick-up. Extended care applies for each pet when the pick-up time on the last day is more than 2 hours later than the drop-off time on the first day, so Haveners are paid for their additional time. 2–8 additional hours: +50% of the nightly rate. 8+ additional hours: +100% of the nightly rate.';
