import type { PublicSitterRow } from '@/lib/database.types';

/**
 * The extra filters of the Havener search. Everything here comes from what a
 * Havener already tells us about their home and care, so no new data is needed.
 */
export type FilterKey =
  | 'house'
  | 'fenced'
  | 'noPets'
  | 'oneFamily'
  | 'noKids'
  | 'exercise'
  | 'meds'
  | 'anxious'
  | 'reactive'
  | 'puppies'
  | 'seniors'
  | 'unfixed'
  | 'transport'
  | 'insured'
  | 'certified'
  | 'topRated';

type FilterDef = { key: FilterKey; label: string; test: (sitter: PublicSitterRow) => boolean };

export const FILTER_GROUPS: Array<{ title: string; filters: FilterDef[] }> = [
  {
    title: 'Their home',
    filters: [
      {
        key: 'house',
        label: 'Lives in a house (not an apartment)',
        test: (s) => s.home_type === 'house' || s.home_type === 'townhouse',
      },
      { key: 'fenced', label: 'Has a fenced yard', test: (s) => s.yard_is_fenced },
      { key: 'noPets', label: 'No pets of their own', test: (s) => !s.has_own_pets },
      {
        key: 'oneFamily',
        label: 'Hosts one family at a time',
        test: (s) => !s.hosts_multiple_families,
      },
      { key: 'noKids', label: 'No children at home', test: (s) => !s.has_kids_at_home },
    ],
  },
  {
    title: 'Care they offer',
    filters: [
      {
        key: 'exercise',
        label: 'Daily exercise included',
        test: (s) => s.provides_daily_exercise,
      },
      { key: 'meds', label: 'Gives medication', test: (s) => s.comfortable_with_meds },
      {
        key: 'anxious',
        label: 'Comfortable with anxious pets',
        test: (s) => s.comfortable_with_anxiety,
      },
      {
        key: 'reactive',
        label: 'Comfortable with reactive dogs',
        test: (s) => s.comfortable_with_reactive,
      },
      { key: 'puppies', label: 'Cares for puppies', test: (s) => s.accepts_puppies },
      { key: 'seniors', label: 'Cares for senior pets', test: (s) => s.accepts_seniors },
      {
        key: 'unfixed',
        label: 'Accepts unspayed / un-neutered pets',
        test: (s) => s.accepts_unfixed,
      },
      { key: 'transport', label: 'Offers pick-up and drop-off', test: (s) => s.provides_transport },
    ],
  },
  {
    title: 'Trust',
    filters: [
      { key: 'insured', label: 'Insured', test: (s) => s.is_insured },
      { key: 'certified', label: 'Certified', test: (s) => s.is_certified },
      {
        key: 'topRated',
        label: 'Rated 4.8 or higher',
        test: (s) => (s.rating ?? 0) >= 4.8 && s.review_count >= 3,
      },
    ],
  },
];

const ALL_FILTERS = FILTER_GROUPS.flatMap((group) => group.filters);

export function parseFilterKeys(value: string | string[] | undefined): FilterKey[] {
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  const wanted = new Set(raw.flatMap((item) => item.split(',')));
  return ALL_FILTERS.filter((filter) => wanted.has(filter.key)).map((filter) => filter.key);
}

export function applyFilters(sitters: PublicSitterRow[], keys: FilterKey[]): PublicSitterRow[] {
  const active = ALL_FILTERS.filter((filter) => keys.includes(filter.key));
  return sitters.filter((sitter) => active.every((filter) => filter.test(sitter)));
}

export type SortKey = 'recommended' | 'distance' | 'rating' | 'price';

export const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: 'recommended', label: 'Best match' },
  { key: 'distance', label: 'Nearest' },
  { key: 'rating', label: 'Top rated' },
  { key: 'price', label: 'Lowest price' },
];

export function parseSort(value: string | undefined): SortKey {
  return SORT_OPTIONS.find((option) => option.key === value)?.key ?? 'recommended';
}

/** "Best match" keeps the order the matcher already produced. */
export function sortSitters(
  sitters: PublicSitterRow[],
  sort: SortKey,
  distances: Map<string, number>,
  rates: Map<string, number>
): PublicSitterRow[] {
  if (sort === 'recommended') return sitters;
  const far = Number.POSITIVE_INFINITY;
  return [...sitters].sort((a, b) => {
    if (sort === 'distance') return (distances.get(a.id) ?? far) - (distances.get(b.id) ?? far);
    if (sort === 'price') return (rates.get(a.id) ?? far) - (rates.get(b.id) ?? far);
    return (b.rating ?? -1) - (a.rating ?? -1) || b.review_count - a.review_count;
  });
}
