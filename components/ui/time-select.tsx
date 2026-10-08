import type { SelectHTMLAttributes } from 'react';

import { Select } from '@/components/ui/field';

/** Every half hour from 5:00 AM to 11:30 PM, as value 'HH:MM' + a readable label. */
const OPTIONS: Array<{ value: string; label: string }> = [];
for (let minutes = 5 * 60; minutes <= 23 * 60 + 30; minutes += 30) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  OPTIONS.push({
    value: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    label: `${hour % 12 === 0 ? 12 : hour % 12}:${String(minute).padStart(2, '0')} ${
      hour >= 12 ? 'PM' : 'AM'
    }`,
  });
}

/**
 * A pick-from-a-list time field, so nobody has to type "07:30 PM" digit by
 * digit. Submits 'HH:MM' like <input type="time"> does.
 */
export function TimeSelect({
  placeholder = 'Select time',
  ...props
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> & { placeholder?: string }) {
  return (
    <Select defaultValue="" {...props}>
      <option value="">{placeholder}</option>
      {OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}
