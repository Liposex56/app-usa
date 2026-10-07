import type { PetSize } from '@/lib/database.types';

/** Dog size bands, with the weight range spelled out so nobody has to guess. */
export const DOG_SIZE_OPTIONS: Array<{ value: PetSize; label: string }> = [
  { value: 'small', label: 'Small dog (0-15 lbs)' },
  { value: 'medium', label: 'Medium dog (16-40 lbs)' },
  { value: 'large', label: 'Large dog (41-100 lbs)' },
  { value: 'giant', label: 'Giant dog (101+ lbs)' },
];
