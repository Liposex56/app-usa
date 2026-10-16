'use client';

import { AddressAutocomplete } from '@/components/ui/address-autocomplete';
import { Button } from '@/components/ui/button';
import { CheckboxCard, Field, Input, Select } from '@/components/ui/field';
import { FILTER_GROUPS, SORT_OPTIONS } from '@/lib/search-options';
import { SERVICES, servicePickerLabel } from '@/lib/services';

export type SearchDefaults = {
  startDate: string;
  endDate: string;
  service: string;
  species: string;
  address: string;
  lat: number | null;
  lng: number | null;
  filters: string[];
  sort: string;
};

export function SearchFilters({ defaults }: { defaults: SearchDefaults }) {
  const today = new Date().toISOString().slice(0, 10);
  const activeCount = defaults.filters.length;

  return (
    <form className="mt-8 grid gap-4 rounded-3xl border border-espresso-700/8 bg-hv-paper p-6 shadow-card sm:grid-cols-2 lg:grid-cols-4">
      <Field
        label="Start date"
        htmlFor="startDate"
        required
        hint="Only Haveners free for these dates are shown."
      >
        <Input
          id="startDate"
          name="startDate"
          type="date"
          min={today}
          required
          defaultValue={defaults.startDate}
        />
      </Field>
      <Field label="End date" htmlFor="endDate" hint="Leave blank for a single day.">
        <Input
          id="endDate"
          name="endDate"
          type="date"
          min={today}
          defaultValue={defaults.endDate}
        />
      </Field>
      <Field label="Service" htmlFor="service" required>
        <Select id="service" name="service" required defaultValue={defaults.service}>
          <option value="" disabled>
            Choose a service
          </option>
          {SERVICES.map((s) => (
            <option key={s.type} value={s.type}>
              {servicePickerLabel(s)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Pet" htmlFor="species">
        <Select id="species" name="species" defaultValue={defaults.species}>
          <option value="">Dog or cat</option>
          <option value="dog">Dog</option>
          <option value="cat">Cat</option>
        </Select>
      </Field>

      <Field
        label="Address"
        htmlFor="address"
        required
        hint="Pick your address from the list so we can show Haveners near you."
        className="sm:col-span-2 lg:col-span-4"
      >
        <AddressAutocomplete
          id="address"
          name="address"
          latName="lat"
          lngName="lng"
          required
          defaultAddress={defaults.address}
          defaultLat={defaults.lat}
          defaultLng={defaults.lng}
        />
      </Field>

      <details
        className="group rounded-2xl border border-hv-ink/15 px-5 py-3 sm:col-span-2 lg:col-span-4"
        open={activeCount > 0}
      >
        <summary className="cursor-pointer select-none text-[18px] font-semibold text-espresso-700">
          More filters{activeCount > 0 ? ` (${activeCount})` : ''}
        </summary>
        <div className="mt-4 grid gap-6 pb-2 lg:grid-cols-3">
          {FILTER_GROUPS.map((group) => (
            <fieldset key={group.title} className="space-y-2">
              <legend className="mb-2 text-sm font-semibold uppercase tracking-[0.06em] text-espresso-700">
                {group.title}
              </legend>
              {group.filters.map((filter) => (
                <CheckboxCard
                  key={filter.key}
                  name="f"
                  value={filter.key}
                  label={filter.label}
                  defaultChecked={defaults.filters.includes(filter.key)}
                />
              ))}
            </fieldset>
          ))}
        </div>
      </details>

      <div className="flex flex-wrap items-end gap-4 sm:col-span-2 lg:col-span-4">
        <Button type="submit" className="w-full sm:w-auto sm:min-w-[12rem]">
          Search
        </Button>
        <Field label="Sort by" htmlFor="sort" className="w-full sm:w-56">
          <Select id="sort" name="sort" defaultValue={defaults.sort}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </form>
  );
}
