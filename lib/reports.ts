/** What a conversation can be reported for (Jessica's list). */
export const REPORT_CATEGORIES = [
  { value: 'inappropriate_behavior', label: 'Inappropriate behavior' },
  { value: 'fraud', label: 'Fraud' },
  { value: 'off_platform_payment', label: 'Asking to pay outside Havenr' },
  { value: 'threats', label: 'Threats' },
  { value: 'other', label: 'Something else' },
] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number]['value'];

export function reportCategoryLabel(value: string | null | undefined): string {
  return REPORT_CATEGORIES.find((category) => category.value === value)?.label ?? 'Something else';
}

/** Reasons offered when archiving a request that won't go ahead. */
export const ARCHIVE_REASONS = [
  'Not a good fit',
  'The dates don’t work',
  'I found someone else',
  'No longer needed',
  'Other',
] as const;
