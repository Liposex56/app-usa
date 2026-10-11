'use client';

import { useState } from 'react';

import { IconCheck, IconMapPin, IconPaw } from '@/components/icons';
import type {
  BookingOwnerFeedbackRow,
  BookingOwnerProfile,
  PetRow,
} from '@/lib/database.types';
import { formatDate, petAge } from '@/lib/utils';

function VerificationRow({ verified, label }: { verified: boolean; label: string }) {
  return (
    <p className="flex items-center gap-2 text-[18px] text-espresso-600">
      {verified ? (
        <IconCheck className="h-4 w-4 text-green-600" />
      ) : (
        <span className="h-4 w-4 shrink-0 rounded-full border border-espresso-700/20" />
      )}
      {verified ? `Verified ${label}` : `No verified ${label}`}
    </p>
  );
}

export function OwnerProfileTabs({
  owner,
  feedback,
  pets,
}: {
  owner: BookingOwnerProfile;
  feedback: BookingOwnerFeedbackRow[];
  pets: PetRow[];
}) {
  const [tab, setTab] = useState<'about' | 'feedback' | 'pets'>('about');

  return (
    <div className="py-4">
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-espresso-700/8 bg-hv-paper p-6 text-center shadow-card sm:flex-row sm:p-8 sm:text-left">
        <div className="h-28 w-28 shrink-0 overflow-hidden rounded-full bg-sky-100">
          {owner.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={owner.avatar_url}
              alt={owner.display_name ?? 'Pet owner'}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-medium text-espresso-500">
              {(owner.display_name ?? 'O').slice(0, 1)}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h1 className="text-[clamp(30px,3vw,42px)] leading-none">
            {owner.display_name ?? 'Pet owner'}
          </h1>
          {(owner.city || owner.state) && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-[17px] font-medium text-espresso-500">
              <IconMapPin className="h-4 w-4" />
              {[owner.city, owner.state].filter(Boolean).join(', ')}
            </p>
          )}
          <p className="mt-2 text-[17px] text-espresso-600">
            Joined Havenr {formatDate(owner.joined_at)} · {owner.past_bookings_count} past booking
            {owner.past_bookings_count === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div className="mt-8 flex gap-6 border-b border-espresso-700/8">
        {(['about', 'feedback', 'pets'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`border-b-2 px-1 pb-3 text-[19px] font-semibold capitalize transition-colors ${
              tab === t
                ? 'border-gold-500 text-espresso-700'
                : 'border-transparent text-espresso-500 hover:text-espresso-700'
            }`}
          >
            {t === 'about' ? 'About' : t === 'feedback' ? 'Feedback' : 'Pets'}
          </button>
        ))}
      </div>

      {tab === 'about' && (
        <div className="mt-8 space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-espresso-500/60">
              Verification
            </p>
            <VerificationRow verified={owner.phone_verified} label="phone" />
            <VerificationRow verified={owner.email_verified} label="email" />
          </div>
        </div>
      )}

      {tab === 'feedback' && (
        <div className="mt-8 space-y-4">
          <p className="text-xs font-medium uppercase tracking-wider text-espresso-500/60">
            Havener feedback ({feedback.length})
          </p>
          {feedback.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-espresso-700/15 bg-hv-paper p-8 text-center text-sm text-espresso-500">
              No Havener feedback yet.
            </p>
          ) : (
            feedback.map((review) => (
              <div
                key={review.id}
                className="rounded-2xl border border-espresso-700/8 bg-hv-paper p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[18px] font-semibold text-espresso-700">
                    {review.reviewer_first_name}
                  </p>
                  <p className="text-xs text-espresso-500">
                    {'★'.repeat(review.rating)}
                    {'☆'.repeat(5 - review.rating)}
                  </p>
                </div>
                {review.body && (
                  <p className="mt-2 text-[18px] leading-relaxed text-espresso-600">
                    {review.body}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'pets' && (
        <div className="mt-8 space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-espresso-500/60">
            Pets ({pets.length})
          </p>
          {pets.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-espresso-700/15 bg-hv-paper p-8 text-center text-sm text-espresso-500">
              No pets on file yet.
            </p>
          ) : (
            pets.map((pet) => {
              const age = petAge(pet.birthdate);
              return (
                <div
                  key={pet.id}
                  className="flex items-center gap-4 rounded-2xl border border-espresso-700/8 bg-hv-paper p-4"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-sky-100">
                    {pet.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={pet.photo_url}
                        alt={pet.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-espresso-400">
                        <IconPaw className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-espresso-700">{pet.name}</p>
                    <p className="text-sm text-espresso-500">
                      {[pet.breed || (pet.species === 'dog' ? 'Dog' : 'Cat')]
                        .concat(pet.sex ? [pet.sex === 'male' ? 'Male' : 'Female'] : [])
                        .concat(age ? [age] : [])
                        .concat(pet.weight_lb ? [`${pet.weight_lb} lbs`] : [])
                        .join(', ')}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
