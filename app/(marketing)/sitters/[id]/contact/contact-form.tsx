'use client';

import Link from 'next/link';
import { useActionState, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';
import { Field, FormError, Input, Select } from '@/components/ui/field';
import type { ServiceType, Species } from '@/lib/database.types';
import { computeBookingTotals } from '@/lib/pricing';
import { formatCents } from '@/lib/utils';

import { contactHavenerAction, type ContactState } from './actions';

const INITIAL: ContactState = { error: null };

export type ContactService = {
  type: ServiceType;
  pickerLabel: string;
  verb: string;
  rateUnit: string;
  baseRateCents: number;
  additionalPetRateCents: number;
  pickupDropoffRateCents: number | null;
};

const UNIT_LABEL: Record<string, string> = {
  night: 'night',
  day: 'day',
  walk: 'walk',
  visit: 'visit',
};

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending || disabled}>
      {pending ? 'Sending…' : 'Contact Havener'}
    </Button>
  );
}

function shortDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function dateText(startDate: string, endDate: string): string {
  if (!startDate) return 'on the dates we’ve picked';
  if (!endDate || endDate === startDate) return `on ${shortDate(startDate)}`;
  const sameMonth = startDate.slice(0, 7) === endDate.slice(0, 7);
  return sameMonth
    ? `on ${shortDate(startDate)}–${new Date(`${endDate}T00:00:00`).getDate()}`
    : `from ${shortDate(startDate)} to ${shortDate(endDate)}`;
}

function joinNames(names: string[]): string {
  if (names.length === 0) return 'my pet';
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export function ContactForm({
  sitterId,
  sitterFirstName,
  services,
  pets,
  initialService,
  initialStartDate,
  initialEndDate,
  rebook,
}: {
  sitterId: string;
  sitterFirstName: string;
  services: ContactService[];
  pets: Array<{ id: string; name: string; species: Species }>;
  initialService?: string;
  initialStartDate?: string;
  initialEndDate?: string;
  rebook: boolean;
}) {
  const action = contactHavenerAction.bind(null, sitterId);
  const [state, formAction] = useActionState(action, INITIAL);

  const defaultService =
    services.find((s) => s.type === initialService)?.type ??
    (services.length === 1 ? services[0].type : '');

  const [serviceType, setServiceType] = useState<string>(defaultService);
  const [startDate, setStartDate] = useState(initialStartDate ?? '');
  const [endDate, setEndDate] = useState(initialEndDate ?? '');
  const [petIds, setPetIds] = useState<string[]>(pets.length === 1 ? [pets[0].id] : []);
  const [wantsPickup, setWantsPickup] = useState(false);
  const [messageEdited, setMessageEdited] = useState<string | null>(null);

  const service = services.find((s) => s.type === serviceType) ?? null;
  const selectedPets = pets.filter((pet) => petIds.includes(pet.id));

  // The message is pre-written from what's been chosen so far and keeps
  // updating until the owner types in it themselves.
  const suggestedMessage = useMemo(() => {
    const verb = service?.verb ?? 'care for';
    const names = joinNames(selectedPets.map((pet) => pet.name));
    const opener = rebook
      ? `Hi ${sitterFirstName}! We loved having you take care of us — `
      : `Hi ${sitterFirstName}! `;
    return `${opener}Will you be available to ${verb} ${names} ${dateText(startDate, endDate)}?`;
  }, [service, selectedPets, startDate, endDate, rebook, sitterFirstName]);
  const message = messageEdited ?? suggestedMessage;

  const totals =
    service && startDate && petIds.length > 0
      ? computeBookingTotals({
          service: {
            base_rate_cents: service.baseRateCents,
            additional_pet_rate_cents: service.additionalPetRateCents,
            pickup_dropoff_rate_cents: service.pickupDropoffRateCents,
          },
          rateUnit: service.rateUnit,
          startDate,
          endDate: endDate || null,
          petCount: petIds.length,
          wantsPickupDropoff: wantsPickup,
        })
      : null;

  const offersPickup = Boolean(service?.pickupDropoffRateCents);
  const today = new Date().toISOString().slice(0, 10);

  // Where "+ Add a pet" sends the owner back to, with their choices intact.
  const returnQuery = new URLSearchParams();
  if (serviceType) returnQuery.set('service', serviceType);
  if (startDate) returnQuery.set('startDate', startDate);
  if (endDate) returnQuery.set('endDate', endDate);
  const returnQueryString = returnQuery.toString();
  const returnPath = `/sitters/${sitterId}/contact${
    returnQueryString ? `?${returnQueryString}` : ''
  }`;

  function togglePet(id: string) {
    setPetIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  }

  return (
    <form action={formAction} className="mt-5 pb-24">
      <FormError message={state.error} />

      {/* Everything lives in one compact card so the whole request — and the
          send button — fit in the first view. */}
      <div className="space-y-3.5 rounded-3xl border border-espresso-700/8 bg-white p-5 shadow-card">
        <Field label="Service" htmlFor="serviceType" required>
          <Select
            id="serviceType"
            name="serviceType"
            required
            value={serviceType}
            onChange={(event) => setServiceType(event.target.value)}
          >
            <option value="" disabled>
              Select…
            </option>
            {services.map((s) => (
              <option key={s.type} value={s.type}>
                {s.pickerLabel}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Start date" htmlFor="startDate" required>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              min={today}
              required
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </Field>
          <Field label="End date" htmlFor="endDate">
            <Input
              id="endDate"
              name="endDate"
              type="date"
              min={startDate || today}
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-espresso-700">
              Drop-off window <span className="text-espresso-500/60">(optional)</span>
            </legend>
            <div className="flex items-center gap-2">
              <Input name="dropoffFrom" type="time" aria-label="Drop-off from" />
              <span className="text-xs text-espresso-500">to</span>
              <Input name="dropoffTo" type="time" aria-label="Drop-off until" />
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-espresso-700">
              Pick-up window <span className="text-espresso-500/60">(optional)</span>
            </legend>
            <div className="flex items-center gap-2">
              <Input name="pickupFrom" type="time" aria-label="Pick-up from" />
              <span className="text-xs text-espresso-500">to</span>
              <Input name="pickupTo" type="time" aria-label="Pick-up until" />
            </div>
          </fieldset>
        </div>

        <fieldset>
          <legend className="mb-1.5 flex items-center justify-between text-sm font-medium text-espresso-700">
            <span>
              Pets <span className="text-gold-600">*</span>
            </span>
            <Link
              href={`/dashboard/pets/new?returnTo=${encodeURIComponent(returnPath)}`}
              className="text-xs font-medium text-gold-600 hover:text-gold-700"
            >
              + Add a pet
            </Link>
          </legend>
          <div className="flex flex-wrap gap-2">
            {pets.map((pet) => (
              <label
                key={pet.id}
                className="flex cursor-pointer items-center gap-2 rounded-full border border-espresso-700/12 bg-white px-3.5 py-1.5 text-sm text-espresso-700 hover:border-gold-500/50 has-[:checked]:border-gold-500 has-[:checked]:bg-gold-50"
              >
                <input
                  type="checkbox"
                  name="petIds"
                  value={pet.id}
                  checked={petIds.includes(pet.id)}
                  onChange={() => togglePet(pet.id)}
                  className="accent-gold-500"
                />
                {pet.name}
                <span className="text-espresso-500">
                  ({pet.species === 'dog' ? 'Dog' : 'Cat'})
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {offersPickup && (
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-espresso-700/12 bg-bone px-4 py-3 has-[:checked]:border-gold-500 has-[:checked]:bg-gold-50">
            <span className="min-w-0">
              <span className="block text-sm font-medium text-espresso-700">
                Havener pick-up and drop-off{' '}
                <span className="text-espresso-500">
                  (+{formatCents(service!.pickupDropoffRateCents!)})
                </span>
              </span>
              <span className="block text-xs text-espresso-500">
                Your Havener collects your pet at the start of the stay and brings
                them back at the end.
              </span>
            </span>
            <input
              type="checkbox"
              name="wantsPickupDropoff"
              checked={wantsPickup}
              onChange={(event) => setWantsPickup(event.target.checked)}
              className="h-5 w-5 shrink-0 accent-gold-500"
            />
          </label>
        )}

        <Field
          label="Message"
          htmlFor="message"
          required
          hint="Pre-written for you — edit it however you like."
        >
          <textarea
            id="message"
            name="message"
            required
            rows={2}
            maxLength={500}
            value={message}
            onChange={(event) => setMessageEdited(event.target.value)}
            className="max-h-24 min-h-[64px] w-full resize-none overflow-y-auto rounded-xl border border-espresso-700/15 bg-white px-4 py-2.5 text-[15px] text-espresso-700 hover:border-espresso-700/25 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/25"
          />
        </Field>
      </div>

      {/* Pinned so the button is always on screen, however long the message. */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-espresso-700/10 bg-bone/95 backdrop-blur">
        <div className="container-page flex max-w-2xl items-center justify-between gap-4 py-3">
          <div className="min-w-0 text-sm">
            {totals && service ? (
              <>
                <p className="font-semibold text-espresso-700">
                  Estimated total {formatCents(totals.totalCents)}
                </p>
                <p className="truncate text-xs text-espresso-500">
                  {totals.quantity} × {UNIT_LABEL[service.rateUnit] ?? service.rateUnit} ·
                  prices include all fees
                </p>
              </>
            ) : (
              <p className="text-xs text-espresso-500">
                Pick a service, dates and pet to see the total.
              </p>
            )}
          </div>
          <Submit disabled={!service || !startDate || petIds.length === 0} />
        </div>
      </div>
    </form>
  );
}
