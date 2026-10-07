'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import { DOG_SIZE_OPTIONS } from '@/lib/pet-options';
import { SERVICES, servicePickerLabel } from '@/lib/services';

export type SearchDefaults = {
  startDate: string;
  endDate: string;
  service: string;
  species: string;
  size: string;
  energy: string;
  city: string;
  state: string;
};

export function SearchFilters({ defaults }: { defaults: SearchDefaults }) {
  const [species, setSpecies] = useState(defaults.species);
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
        <Select
          id="species"
          name="species"
          value={species}
          onChange={(event) => setSpecies(event.target.value)}
        >
          <option value="">Dog or cat</option>
          <option value="dog">Dog</option>
          <option value="cat">Cat</option>
        </Select>
      </Field>

      {species !== 'cat' && (
        <Field label="Size" htmlFor="size">
          <Select id="size" name="size" defaultValue={defaults.size}>
            <option value="">Any size</option>
            {DOG_SIZE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Field label="Energy level" htmlFor="energy">
        <Select id="energy" name="energy" defaultValue={defaults.energy}>
          <option value="">Any energy</option>
          <option value="low">Low</option>
          <option value="moderate">Moderate</option>
          <option value="high">High</option>
        </Select>
      </Field>
      <Field label="City" htmlFor="city">
        <Input id="city" name="city" defaultValue={defaults.city} placeholder="Boston" />
      </Field>
      <Field label="State" htmlFor="state">
        <Input id="state" name="state" defaultValue={defaults.state} placeholder="MA" />
      </Field>
      <div className="flex items-end sm:col-span-2 lg:col-span-4">
        <Button type="submit" className="w-full sm:w-auto sm:min-w-[12rem]">
          Search
        </Button>
      </div>
    </form>
  );
}
