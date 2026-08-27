'use client';

import { useState } from 'react';

import {
  IconAlert,
  IconChat,
  IconCheck,
  IconClipboard,
  IconClock,
  IconHome,
  IconPaw,
} from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import type { AloneTimeHours, EnergyLevel, PetRow } from '@/lib/database.types';
import { cn, formatDate, petAge } from '@/lib/utils';

const ALONE_TIME_LABELS: Record<AloneTimeHours, string> = {
  '0-1h': 'Can be left alone for 0–1 hours',
  '1-4h': 'Can be left alone for 1–4 hours',
  '4-8h': 'Can be left alone for 4–8 hours',
  '8+h': 'Can be left alone for 8+ hours',
};

const ENERGY_LABELS: Record<EnergyLevel, string> = {
  low: 'Low energy level',
  moderate: 'Moderate energy level',
  high: 'High energy level',
};

function socialLabel(subject: string, value: boolean | null): string {
  if (value === true) return `Friendly with ${subject}`;
  if (value === false) return `Not friendly with ${subject}`;
  return `Unsure if friendly with ${subject}`;
}

function Row({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-espresso-700">
      <span className="mt-0.5 shrink-0 text-olive-500">{icon}</span>
      <span>{children}</span>
    </li>
  );
}

export function PetProfileTabs({ pet }: { pet: PetRow }) {
  const [tab, setTab] = useState<'about' | 'feedback' | 'summary' | 'health'>(
    'about'
  );

  const headerLine1 = [
    pet.species === 'dog' ? 'Dog' : 'Cat',
    pet.breed,
  ]
    .filter(Boolean)
    .join(' · ');
  const headerLine2 = [
    pet.sex === 'female' ? 'Female' : pet.sex === 'male' ? 'Male' : null,
    petAge(pet.birthdate),
    pet.weight_lb ? `${pet.weight_lb} lb` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="mx-auto max-w-2xl">
      <div className="h-64 w-full overflow-hidden rounded-3xl bg-sky-100">
        {pet.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pet.photo_url}
            alt={pet.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <IconPaw className="h-10 w-10 text-espresso-500/30" />
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-espresso-700">
            {pet.name}
          </h1>
          {headerLine1 && (
            <p className="mt-1 text-sm text-espresso-500">{headerLine1}</p>
          )}
          {headerLine2 && (
            <p className="text-sm text-espresso-500">{headerLine2}</p>
          )}
        </div>
        <ButtonLink href={`/dashboard/pets/${pet.id}/edit`} variant="secondary" size="sm">
          Edit profile
        </ButtonLink>
      </div>

      <div className="mt-6 flex gap-6 overflow-x-auto border-b border-espresso-700/10">
        {(
          [
            ['about', 'About'],
            ['feedback', 'Feedback'],
            ['summary', 'Summary'],
            ['health', 'Health'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'shrink-0 border-b-2 pb-3 text-sm font-medium transition-colors',
              tab === key
                ? 'border-gold-500 text-espresso-700'
                : 'border-transparent text-espresso-500 hover:text-espresso-700'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'about' && (
        <div className="mt-8">
          {pet.behavior_notes ? (
            <p className="whitespace-pre-line text-sm leading-relaxed text-espresso-600">
              {pet.behavior_notes}
            </p>
          ) : (
            <p className="rounded-2xl border border-espresso-700/10 bg-white p-8 text-center text-sm text-espresso-500">
              Nothing added yet. Add a note about {pet.name} from the edit
              screen.
            </p>
          )}
        </div>
      )}

      {tab === 'feedback' && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-espresso-700">
            Sitter feedback (0)
          </h2>
          <p className="mt-1 text-sm text-espresso-500">
            Read feedback from past Haveners who watched {pet.name}.
          </p>
          <p className="mt-4 flex items-center gap-2.5 rounded-2xl border border-espresso-700/10 bg-white p-6 text-sm text-espresso-500">
            <IconChat className="h-4 w-4 shrink-0" />
            No sitter feedback yet.
          </p>
        </div>
      )}

      {tab === 'summary' && (
        <div className="mt-8 space-y-8">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-espresso-500/70">
              Socialization
            </h2>
            <ul className="mt-3 space-y-2.5">
              <Row icon={<IconPaw className="h-4 w-4" />}>
                {socialLabel('dogs', pet.good_with_dogs)}
              </Row>
              <Row icon={<IconPaw className="h-4 w-4" />}>
                {socialLabel('cats', pet.good_with_cats)}
              </Row>
              <Row icon={<IconPaw className="h-4 w-4" />}>
                {socialLabel('children', pet.good_with_kids)}
              </Row>
              <Row icon={<IconPaw className="h-4 w-4" />}>
                {socialLabel('new people', pet.good_with_strangers)}
              </Row>
              <Row icon={<IconAlert className="h-4 w-4" />}>
                {pet.is_fixed ? 'Spayed/neutered' : 'Not spayed/neutered'}
              </Row>
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-espresso-500/70">
              Care
            </h2>
            <ul className="mt-3 space-y-2.5">
              {pet.house_trained && (
                <Row icon={<IconHome className="h-4 w-4" />}>House trained</Row>
              )}
              {pet.is_crate_trained && (
                <Row icon={<IconHome className="h-4 w-4" />}>Crate trained</Row>
              )}
              {pet.potty_instructions && (
                <Row icon={<IconClipboard className="h-4 w-4" />}>
                  Special instructions for potty breaks
                  <p className="mt-1 text-espresso-500">
                    {pet.potty_instructions}
                  </p>
                </Row>
              )}
              {pet.alone_time_hours && (
                <Row icon={<IconClock className="h-4 w-4" />}>
                  {ALONE_TIME_LABELS[pet.alone_time_hours]}
                </Row>
              )}
              {pet.feeding_schedule && (
                <Row icon={<IconClipboard className="h-4 w-4" />}>
                  {pet.feeding_schedule}
                </Row>
              )}
              {pet.energy_level && (
                <Row icon={<IconAlert className="h-4 w-4" />}>
                  {ENERGY_LABELS[pet.energy_level]}
                </Row>
              )}
              {pet.special_needs && (
                <Row icon={<IconAlert className="h-4 w-4" />}>
                  {pet.special_needs}
                </Row>
              )}
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-espresso-500/70">
              Other info
            </h2>
            <ul className="mt-3 space-y-2.5">
              {pet.is_microchipped && (
                <Row icon={<IconCheck className="h-4 w-4" />}>Microchipped</Row>
              )}
              {pet.adopted_at && (
                <Row icon={<IconCheck className="h-4 w-4" />}>
                  Adopted {formatDate(pet.adopted_at)}
                </Row>
              )}
              {!pet.is_microchipped && !pet.adopted_at && (
                <p className="text-sm text-espresso-500">Nothing on file yet.</p>
              )}
            </ul>
          </section>
        </div>
      )}

      {tab === 'health' && (
        <div className="mt-8 space-y-6">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-espresso-500/70">
              Veterinary info
            </h2>
            {pet.vet_name || pet.vet_phone ? (
              <p className="mt-2 text-sm text-espresso-700">
                {[pet.vet_name, pet.vet_phone].filter(Boolean).join(' · ')}
              </p>
            ) : (
              <p className="mt-2 text-sm text-espresso-500">Not on file.</p>
            )}
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-espresso-500/70">
              Pet insurance provider
            </h2>
            <p className="mt-2 text-sm text-espresso-700">
              {pet.insurance_provider ?? 'Not on file.'}
            </p>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-espresso-500/70">
              Vaccinations
            </h2>
            <p className="mt-2 text-sm text-espresso-700">
              {pet.vaccinated_through
                ? `Valid through ${formatDate(pet.vaccinated_through)}`
                : 'Not on file — required before your first booking.'}
            </p>
          </section>

          {(pet.allergies || pet.medical_conditions || pet.medications) && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-espresso-500/70">
                Medical
              </h2>
              <ul className="mt-3 space-y-2.5">
                {pet.allergies && (
                  <Row icon={<IconAlert className="h-4 w-4" />}>
                    Allergies: {pet.allergies}
                  </Row>
                )}
                {pet.medical_conditions && (
                  <Row icon={<IconAlert className="h-4 w-4" />}>
                    {pet.medical_conditions}
                  </Row>
                )}
                {pet.medications && (
                  <Row icon={<IconClipboard className="h-4 w-4" />}>
                    {pet.medications}
                  </Row>
                )}
              </ul>
            </section>
          )}

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-espresso-500/70">
              Photo gallery
            </h2>
            <p className="mt-2 rounded-2xl border border-espresso-700/10 bg-white p-6 text-center text-sm text-espresso-500">
              No photos yet.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
