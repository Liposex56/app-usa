'use client';

import { useState } from 'react';

import {
  IconCheck,
  IconMapPin,
  IconPaw,
  IconShield,
  IconStar,
} from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import type {
  PublicSitterReviewRow,
  PublicSitterRow,
  Skill,
  SitterServiceRow,
} from '@/lib/database.types';
import { SERVICE_BY_TYPE, serviceName } from '@/lib/services';
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
          className="flex items-center gap-2.5 text-[18px] text-espresso-700"
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

export type HomeMediaItem = { url: string; kind: 'photo' | 'video' };

/** Photos and clips of the home a boarding Havener hosts pets in. */
function HomeGallery({ media }: { media: HomeMediaItem[] }) {
  return (
    <section>
      <h2 className="text-2xl text-espresso-700">Meet the home</h2>
      <p className="mt-1 text-sm text-espresso-500">
        Where your pet would stay while you&rsquo;re away.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {media.map((item) =>
          item.kind === 'video' ? (
            <video
              key={item.url}
              src={item.url}
              controls
              preload="metadata"
              className="aspect-square w-full rounded-2xl bg-espresso-700/5 object-cover"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={item.url}
              src={item.url}
              alt="Inside the Havener’s home"
              loading="lazy"
              className="aspect-square w-full rounded-2xl object-cover"
            />
          )
        )}
      </div>
    </section>
  );
}

export function SitterProfileTabs({
  sitter,
  services,
  isOwnProfile = false,
  startDate,
  endDate,
  service,
  reviews = [],
  homeMedia = [],
}: {
  sitter: PublicSitterRow;
  services: SitterServiceRow[];
  isOwnProfile?: boolean;
  startDate?: string;
  endDate?: string;
  service?: string;
  reviews?: PublicSitterReviewRow[];
  homeMedia?: HomeMediaItem[];
}) {
  const [tab, setTab] = useState<'info' | 'reviews' | 'services'>('info');
  const skills = (sitter.skills ?? []) as Skill[];

  // The lowest rate across the services this Havener offers, for the card.
  const cheapestRow = [...services].sort((a, b) => a.base_rate_cents - b.base_rate_cents)[0];
  const cheapest = cheapestRow
    ? {
        cents: cheapestRow.base_rate_cents,
        unit: SERVICE_BY_TYPE[cheapestRow.service_type]?.rateUnit ?? 'visit',
      }
    : null;

  // Coming from a search, the card leads with the service that was searched.
  const searchedRow = services.find((row) => row.service_type === service);
  const headline = searchedRow
    ? {
        label: serviceName(searchedRow.service_type),
        cents: searchedRow.base_rate_cents,
        unit: SERVICE_BY_TYPE[searchedRow.service_type]?.rateUnit ?? 'visit',
      }
    : cheapest
      ? { label: 'From', cents: cheapest.cents, unit: cheapest.unit }
      : null;

  // Carries the search (dates + service) forward into the contact summary.
  const contactQuery = new URLSearchParams();
  if (startDate) {
    contactQuery.set('startDate', startDate);
    contactQuery.set('endDate', endDate || startDate);
  }
  if (service) contactQuery.set('service', service);
  const contactQueryString = contactQuery.toString();
  const contactHref = `/sitters/${sitter.id}/contact${contactQueryString ? `?${contactQueryString}` : ''}`;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-10 sm:py-14">
      <div>
        {/* ------------------------------------------------------- Header */}
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:text-left">
          <div className="h-28 w-28 shrink-0 overflow-hidden rounded-full bg-sky-100 shadow-card sm:h-32 sm:w-32">
            {sitter.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sitter.avatar_url}
                alt={sitter.display_name ?? 'Havener'}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl font-semibold text-espresso-500">
                {(sitter.display_name ?? 'H').slice(0, 1)}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              <h1 className="text-[clamp(34px,4vw,52px)] leading-none">
                {sitter.display_name ?? 'Havener'}
              </h1>
              {sitter.is_certified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gold-500/15 px-3 py-1 text-[15px] font-semibold text-gold-700">
                  <IconStar className="h-3.5 w-3.5" /> Certified Havener
                </span>
              )}
            </div>
            {sitter.headline && (
              <p className="mt-2 text-xl text-espresso-600">{sitter.headline}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[17px] font-medium text-espresso-500 sm:justify-start">
              {(sitter.service_city || sitter.service_state) && (
                <span className="inline-flex items-center gap-1.5">
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
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              {sitter.is_insured && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-[15px] font-semibold text-green-800">
                  <IconShield className="h-3.5 w-3.5" /> Insured
                </span>
              )}
              {sitter.background_checked && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-[15px] font-semibold text-green-800">
                  <IconCheck className="h-3.5 w-3.5" /> Background checked
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] lg:items-start">
        {/* The booking card comes first on phones, to the side on desktop. */}
        <aside className="order-first rounded-3xl border border-espresso-700/8 bg-hv-paper p-6 shadow-card lg:order-last lg:sticky lg:top-20">
          {headline ? (
            <p className="text-espresso-600">
              <span className="text-sm font-bold uppercase tracking-[0.12em] text-olive-500">
                {headline.label}{' '}
              </span>
              <span className="text-4xl font-bold text-espresso-700">
                {formatCents(headline.cents)}
              </span>
              <span className="text-[17px]"> / {headline.unit}</span>
            </p>
          ) : (
            <p className="text-[17px] text-espresso-500">No services published yet.</p>
          )}

          {services.length > 0 && (
            <ul className="mt-4 space-y-2 border-t border-espresso-700/8 pt-4">
              {services.map((row) => (
                <li
                  key={row.id}
                  className={`flex items-baseline justify-between gap-3 rounded-xl px-2 py-1 text-[17px] ${
                    row.service_type === service ? 'bg-hv-butter' : ''
                  }`}
                >
                  <span className="text-espresso-700">{serviceName(row.service_type)}</span>
                  <span className="font-semibold text-espresso-700">
                    {formatCents(row.base_rate_cents)}
                    <span className="font-medium text-espresso-500">
                      {' '}
                      / {SERVICE_BY_TYPE[row.service_type]?.rateUnit ?? 'visit'}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}

          {isOwnProfile ? (
            <div className="mt-5 space-y-3">
              <p className="rounded-2xl bg-hv-butter p-3 text-[16px] text-olive-700">
                This is how owners see your profile.
              </p>
              <ButtonLink href="/dashboard/havener/edit" size="lg" className="w-full">
                Edit my profile
              </ButtonLink>
            </div>
          ) : (
            <div className="mt-5">
              <ButtonLink href={contactHref} size="lg" className="w-full">
                Contact this Havener
              </ButtonLink>
              <p className="mt-3 text-center text-[15px] text-espresso-500">
                You won’t be charged yet — send a request and agree on the
                details first.
              </p>
            </div>
          )}
        </aside>

        <div className="min-w-0">
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
                'border-b-2 pb-3 text-[19px] font-semibold transition-colors',
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
                <h2 className="text-2xl text-espresso-700">
                  Pet care experience
                </h2>
                <p className="mt-2 whitespace-pre-line text-[18px] leading-relaxed text-espresso-600">
                  {sitter.bio}
                </p>
              </section>
            )}

            {sitter.routine_description && (
              <section>
                <h2 className="text-2xl text-espresso-700">
                  A typical day with {sitter.display_name ?? 'this Havener'}
                </h2>
                <p className="mt-2 whitespace-pre-line text-[18px] leading-relaxed text-espresso-600">
                  {sitter.routine_description}
                </p>
              </section>
            )}

            {sitter.schedule_description && (
              <section>
                <h2 className="text-2xl text-espresso-700">Schedule</h2>
                <p className="mt-2 whitespace-pre-line text-[18px] leading-relaxed text-espresso-600">
                  {sitter.schedule_description}
                </p>
              </section>
            )}

            {sitter.home_environment_description && (
              <section>
                <h2 className="text-2xl text-espresso-700">
                  Safety, trust &amp; environment
                </h2>
                <p className="mt-2 whitespace-pre-line text-[18px] leading-relaxed text-espresso-600">
                  {sitter.home_environment_description}
                </p>
              </section>
            )}

            {skills.length > 0 && (
              <section>
                <h2 className="text-2xl text-espresso-700">Skills</h2>
                <ul className="mt-3 space-y-2">
                  {skills.map((skill) => (
                    <li
                      key={skill}
                      className="flex items-center gap-2.5 text-[18px] text-espresso-700"
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
                <h2 className="text-2xl text-espresso-700">
                  Cat experience
                </h2>
                <p className="mt-2 whitespace-pre-line text-[18px] leading-relaxed text-espresso-600">
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

            {homeMedia.length > 0 && <HomeGallery media={homeMedia} />}
            {homeMedia.length === 0 && isOwnProfile && (
              <section className="rounded-2xl border border-dashed border-espresso-700/15 bg-hv-paper p-5">
                <h2 className="text-2xl text-espresso-700">Meet the home</h2>
                <p className="mt-1 text-sm text-espresso-500">
                  Owners choosing boarding want to see where their pet will
                  stay. Add photos or a short video of your home.
                </p>
                <ButtonLink
                  href="/dashboard/havener/home"
                  size="sm"
                  variant="secondary"
                  className="mt-3"
                >
                  Add photos or video
                </ButtonLink>
              </section>
            )}

            <section>
              <h2 className="text-2xl text-espresso-700">Home</h2>
              <div className="mt-3">
                <HomeFacts sitter={sitter} />
              </div>
            </section>

            {(sitter.service_city || sitter.service_state) && (
              <section>
                <h2 className="text-2xl text-espresso-700">Location</h2>
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
          <div className="mt-8 space-y-4">
            {reviews.length === 0 ? (
              <p className="rounded-2xl border border-espresso-700/10 bg-hv-paper p-8 text-center text-sm text-espresso-500">
                No reviews yet.
              </p>
            ) : (
              reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-2xl border border-espresso-700/8 bg-hv-paper p-5"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-sky-100">
                      {review.reviewer_avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={review.reviewer_avatar_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-medium text-espresso-500">
                          {review.reviewer_first_name.slice(0, 1)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-espresso-700">
                        {review.reviewer_first_name}
                      </p>
                      <p className="text-xs text-espresso-500">
                        {'★'.repeat(review.rating)}
                        {'☆'.repeat(5 - review.rating)}
                        {' · '}
                        {new Date(review.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  {review.body && (
                    <p className="mt-3 text-[18px] leading-relaxed text-espresso-600">
                      {review.body}
                    </p>
                  )}
                </div>
              ))
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
              <p className="rounded-2xl border border-espresso-700/10 bg-hv-paper p-8 text-center text-sm text-espresso-500">
                This Havener hasn&rsquo;t published any services yet.
              </p>
            )}
            {services.map((service) => (
              <div
                key={service.id}
                className="rounded-2xl border border-espresso-700/10 bg-hv-paper p-5"
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
      </div>
    </div>
  );
}
