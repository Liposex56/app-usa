'use client';

import { useState } from 'react';

import {
  IconCheck,
  IconMapPin,
  IconPaw,
  IconShield,
  IconStar,
} from '@/components/icons';
import type { PublicSitterRow, Skill, SitterServiceRow } from '@/lib/database.types';
import { serviceName } from '@/lib/services';
import { cn, formatCents } from '@/lib/utils';

const SKILL_LABELS: Record<Skill, string> = {
  first_aid_cpr: 'First aid and/or CPR',
  oral_medication: 'Oral medication administration',
  injectable_medication: 'Injectable medication administration',
  senior_care: 'Senior care',
  special_needs_care: 'Special needs care',
  daily_exercise_high_energy: 'Daily exercise for high-energy dogs',
};

const POTTY_LABELS: Record<string, string> = {
  '0-2h': 'Potty breaks every 0–2 hours',
  '2-4h': 'Potty breaks every 2–4 hours',
  '4-8h': 'Potty breaks every 4–8 hours',
  '8+h': 'Potty breaks every 8+ hours',
};

function HomeFacts({ sitter }: { sitter: PublicSitterRow }) {
  const facts: string[] = [];
  if (sitter.home_type) {
    facts.push(`Lives in a ${sitter.home_type}`);
  }
  if (sitter.has_yard) {
    facts.push(sitter.yard_is_fenced ? 'Has a fenced yard' : 'Has an unfenced yard');
  } else {
    facts.push('No yard');
  }
  facts.push(sitter.allows_smoking ? 'Smoking household' : 'Non-smoking household');
  facts.push(sitter.has_kids_at_home ? 'Children at home' : 'No children at home');
  facts.push(sitter.hosts_multiple_families
    ? 'Can host pets from different families at once'
    : 'Hosts one family at a time');
  facts.push(
    sitter.accepts_unfixed
      ? 'Unspayed/unneutered pets accepted'
      : 'Spayed/neutered pets only'
  );
  if (!sitter.accepts_in_heat) facts.push('No females in heat');
  facts.push(sitter.dogs_on_bed ? 'Dogs allowed on bed' : 'Dogs not allowed on bed');
  facts.push(
    sitter.dogs_on_furniture
      ? 'Dogs allowed on furniture'
      : 'Dogs not allowed on furniture'
  );
  if (sitter.potty_break_frequency) {
    facts.push(POTTY_LABELS[sitter.potty_break_frequency] ?? '');
  }

  return (
    <ul className="space-y-2.5">
      {facts.filter(Boolean).map((fact) => (
        <li
          key={fact}
          className="flex items-center gap-2.5 text-sm text-espresso-700"
        >
          <IconPaw className="h-4 w-4 shrink-0 text-olive-500" />
          {fact}
        </li>
      ))}
    </ul>
  );
}

function RateLine({ label, cents }: { label: string; cents: number | null }) {
  if (cents == null) return null;
  return (
    <div className="flex items-center justify-between border-t border-espresso-700/8 py-2.5 text-sm">
      <span className="text-espresso-600">{label}</span>
      <span className="font-medium text-espresso-700">{formatCents(cents)}</span>
    </div>
  );
}

export function SitterProfileTabs({
  sitter,
  services,
}: {
  sitter: PublicSitterRow;
  services: SitterServiceRow[];
}) {
  const [tab, setTab] = useState<'info' | 'reviews' | 'services'>('info');
  const skills = (sitter.skills ?? []) as Skill[];

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        {/* ------------------------------------------------------- Header */}
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-sky-100">
            {sitter.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sitter.avatar_url}
                alt={sitter.display_name ?? 'Havener'}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-medium text-espresso-500">
                {(sitter.display_name ?? 'H').slice(0, 1)}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="text-2xl font-semibold text-espresso-700">
                {sitter.display_name ?? 'Havener'}
              </h1>
              {sitter.is_certified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gold-500/15 px-2.5 py-0.5 text-xs font-medium text-gold-700">
                  <IconStar className="h-3 w-3" /> Certified Havener
                </span>
              )}
            </div>
            {sitter.headline && (
              <p className="mt-1 text-espresso-600">{sitter.headline}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-espresso-500 sm:justify-start">
              {(sitter.service_city || sitter.service_state) && (
                <span className="inline-flex items-center gap-1">
                  <IconMapPin className="h-4 w-4" />
                  {[sitter.service_city, sitter.service_state]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              )}
              <span>
                {sitter.rating ? `★ ${sitter.rating.toFixed(1)}` : 'New Havener'} ·{' '}
                {sitter.review_count} review{sitter.review_count === 1 ? '' : 's'}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              {sitter.is_insured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  <IconShield className="h-3 w-3" /> Insured
                </span>
              )}
              {sitter.background_checked && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  <IconCheck className="h-3 w-3" /> Background checked
                </span>
              )}
            </div>
          </div>
        </div>

        {/* --------------------------------------------------------- Tabs */}
        <div className="mt-8 flex gap-6 border-b border-espresso-700/10">
          {(
            [
              ['info', 'Info'],
              ['reviews', 'Reviews'],
              ['services', 'Services'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                'border-b-2 pb-3 text-sm font-medium transition-colors',
                tab === key
                  ? 'border-gold-500 text-espresso-700'
                  : 'border-transparent text-espresso-500 hover:text-espresso-700'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ---------------------------------------------------------- Info */}
        {tab === 'info' && (
          <div className="mt-8 space-y-8">
            {sitter.bio && (
              <section>
                <h2 className="text-lg font-semibold text-espresso-700">
                  Pet care experience
                </h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-espresso-600">
                  {sitter.bio}
                </p>
              </section>
            )}

            {sitter.routine_description && (
              <section>
                <h2 className="text-lg font-semibold text-espresso-700">
                  A typical day with {sitter.display_name ?? 'this Havener'}
                </h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-espresso-600">
                  {sitter.routine_description}
                </p>
              </section>
            )}

            {sitter.schedule_description && (
              <section>
                <h2 className="text-lg font-semibold text-espresso-700">Schedule</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-espresso-600">
                  {sitter.schedule_description}
                </p>
              </section>
            )}

            {sitter.home_environment_description && (
              <section>
                <h2 className="text-lg font-semibold text-espresso-700">
                  Safety, trust &amp; environment
                </h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-espresso-600">
                  {sitter.home_environment_description}
                </p>
              </section>
            )}

            {skills.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-espresso-700">Skills</h2>
                <ul className="mt-3 space-y-2">
                  {skills.map((skill) => (
                    <li
                      key={skill}
                      className="flex items-center gap-2.5 text-sm text-espresso-700"
                    >
                      <IconCheck className="h-4 w-4 shrink-0 text-green-600" />
                      {SKILL_LABELS[skill] ?? skill}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {sitter.accepts_cats && sitter.cat_bio && (
              <section>
                <h2 className="text-lg font-semibold text-espresso-700">
                  Cat experience
                </h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-espresso-600">
                  {sitter.cat_bio}
                </p>
                {sitter.cat_years_experience != null && (
                  <p className="mt-1 text-xs text-espresso-500">
                    {sitter.cat_years_experience} year
                    {sitter.cat_years_experience === 1 ? '' : 's'} of experience with
                    cats
                  </p>
                )}
              </section>
            )}

            <section>
              <h2 className="text-lg font-semibold text-espresso-700">Home</h2>
              <div className="mt-3">
                <HomeFacts sitter={sitter} />
              </div>
            </section>

            {(sitter.service_city || sitter.service_state) && (
              <section>
                <h2 className="text-lg font-semibold text-espresso-700">Location</h2>
                <p className="mt-2 text-sm text-espresso-600">
                  {[sitter.service_city, sitter.service_state]
                    .filter(Boolean)
                    .join(', ')}{' '}
                  · works within {sitter.service_radius_miles} miles
                </p>
              </section>
            )}
          </div>
        )}

        {/* ------------------------------------------------------- Reviews */}
        {tab === 'reviews' && (
          <div className="mt-8">
            {sitter.review_count > 0 ? (
              <p className="text-sm text-espresso-500">
                Reviews are coming to Havenr soon.
              </p>
            ) : (
              <p className="rounded-2xl border border-espresso-700/10 bg-white p-8 text-center text-sm text-espresso-500">
                No reviews yet.
              </p>
            )}
          </div>
        )}

        {/* ------------------------------------------------------ Services */}
        {tab === 'services' && (
          <div className="mt-8 space-y-4">
            <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
              Prices include all fees.
            </p>
            {services.length === 0 && (
              <p className="rounded-2xl border border-espresso-700/10 bg-white p-8 text-center text-sm text-espresso-500">
                This Havener hasn&rsquo;t published any services yet.
              </p>
            )}
            {services.map((service) => (
              <div
                key={service.id}
                className="rounded-2xl border border-espresso-700/10 bg-white p-5"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-espresso-700">
                    {serviceName(service.service_type)}
                  </p>
                  <p className="font-semibold text-espresso-700">
                    {formatCents(service.base_rate_cents)}
                  </p>
                </div>
                <div>
                  <RateLine label="Holiday rate" cents={service.holiday_rate_cents} />
                  <RateLine
                    label="Additional pet"
                    cents={service.additional_pet_rate_cents || null}
                  />
                  <RateLine
                    label="Extended stay"
                    cents={service.extended_stay_rate_cents}
                  />
                  <RateLine
                    label="Bathing / grooming"
                    cents={service.bathing_rate_cents}
                  />
                  <RateLine
                    label="Pick-up and drop-off"
                    cents={service.pickup_dropoff_rate_cents}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
