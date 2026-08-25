/** Tiny className joiner. Keeps JSX readable without pulling in clsx. */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

/** 4500 -> "$45.00" */
export function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

/** "45" or "45.50" -> 4500 / 4550. Returns null if the input isn't a number. */
export function parseDollarsToCents(input: FormDataEntryValue | null): number | null {
  if (typeof input !== 'string') return null;
  const cleaned = input.replace(/[^0-9.]/g, '').trim();
  if (!cleaned) return null;
  const value = Number.parseFloat(cleaned);
  if (Number.isNaN(value)) return null;
  return Math.round(value * 100);
}

/** Reads a text field out of FormData, collapsing empty strings to null. */
export function text(form: FormData, key: string): string | null {
  const value = form.get(key);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

/** Checkbox helper: HTML omits unchecked boxes entirely. */
export function bool(form: FormData, key: string): boolean {
  return form.get(key) === 'on' || form.get(key) === 'true';
}

/** Numeric field helper. */
export function num(form: FormData, key: string): number | null {
  const value = text(form, key);
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Multi-select / checkbox-group helper. */
export function list(form: FormData, key: string): string[] {
  return form.getAll(key).filter((v): v is string => typeof v === 'string');
}

/** "2026-03-14T…" -> "Mar 14, 2026" */
export function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

/** Birthdate -> "3 yrs" / "7 mo" */
export function petAge(birthdate: string | null): string | null {
  if (!birthdate) return null;
  const born = new Date(birthdate);
  if (Number.isNaN(born.getTime())) return null;
  const months =
    (new Date().getFullYear() - born.getFullYear()) * 12 +
    (new Date().getMonth() - born.getMonth());
  if (months < 1) return 'Puppy';
  if (months < 24) return `${months} mo`;
  return `${Math.floor(months / 12)} yrs`;
}
