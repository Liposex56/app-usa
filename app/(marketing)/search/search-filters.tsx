'use client';

import { AddressAutocomplete } from '@/components/ui/address-autocomplete';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import { SERVICES, servicePickerLabel } from '@/lib/services';

export type SearchDefaults = {
  startDate: string;
  endDate: string;
  service: string;
  species: string;
  address: string;
  lat: number | null;
  lng: number | null;
};

export function SearchFilters({ defaults }: { defaults: SearchDefaults }) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form className="mt-8 grid gap-4 rounded-3xl border border-espresso-700/8 bg-white p-6 shadow-card sm:grid-cols-2 lg:grid-cols-4">
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

      <div className="flex items-end sm:col-span-2 lg:col-span-4">
        <Button type="submit" className="w-full sm:w-auto sm:min-w-[12rem]">
          Search
        </Button>
      </div>
    </form>
  );
}
