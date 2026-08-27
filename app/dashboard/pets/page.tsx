import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { IconArrowRight, IconPaw } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import type { PetRow } from '@/lib/database.types';
import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { petAge } from '@/lib/utils';

function friendlyTag(subject: string, value: boolean | null): string | null {
  if (value === true) return subject;
  if (value === null) return `${subject} (Unsure)`;
  return null;
}

export const metadata: Metadata = { title: 'My pets' };

export default async function PetsPage() {
  const profile = await requireProfile();
  if (!profile.is_owner) redirect('/dashboard');

  const supabase = await createClient();
  const { data } = await supabase
    .from('pets')
    .select('*')
    .eq('owner_id', profile.id)
    .order('created_at', { ascending: true });

  const pets = (data ?? []) as PetRow[];

  return (
    <div>
      <Link
        href="/dashboard"
        className="text-sm text-espresso-500 hover:text-espresso-700"
      >
        ← Back to dashboard
      </Link>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">My pets</h1>
          <p className="mt-2 text-[15px] text-espresso-500">
            Keep these up to date — this is what Haveners are matched against.
          </p>
        </div>
        <ButtonLink href="/dashboard/pets/new" size="sm">
          Add a pet
        </ButtonLink>
      </div>

      {pets.length === 0 ? (
        <p className="mt-10 rounded-3xl border border-dashed border-espresso-700/15 bg-white p-10 text-center text-sm text-espresso-500">
          You haven’t added a pet yet.
        </p>
      ) : (
        <div className="mt-8 space-y-6">
          {pets.map((pet) => {
            const tags = [
              friendlyTag('Dogs', pet.good_with_dogs),
              friendlyTag('Cats', pet.good_with_cats),
              friendlyTag('Children', pet.good_with_kids),
            ].filter((tag): tag is string => Boolean(tag));

            return (
              <article
                key={pet.id}
                className="overflow-hidden rounded-3xl border border-espresso-700/8 bg-white shadow-card"
              >
                <div className="h-48 w-full bg-sky-100">
                  {pet.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pet.photo_url}
                      alt={pet.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <IconPaw className="h-9 w-9 text-espresso-500/30" />
                    </div>
                  )}
                </div>

                <div className="p-7">
                  <h2 className="text-xl text-espresso-700">{pet.name}</h2>
                  <p className="mt-1 text-sm text-espresso-500">
                    {[pet.species === 'dog' ? 'Dog' : 'Cat', pet.breed]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  <p className="text-sm text-espresso-500">
                    {[
                      pet.sex === 'female'
                        ? 'Female'
                        : pet.sex === 'male'
                          ? 'Male'
                          : null,
                      petAge(pet.birthdate),
                      pet.weight_lb ? `${pet.weight_lb} lb` : null,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  <p className="text-sm text-espresso-500">
                    {pet.is_fixed ? 'Spayed/neutered' : 'Not spayed/neutered'}
                  </p>

                  {tags.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-espresso-700">
                        Friendly with
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1.5 text-sm text-espresso-600"
                          >
                            <IconPaw className="h-3.5 w-3.5 text-olive-500" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {!pet.vaccinated_through && (
                    <p className="mt-4 rounded-xl bg-cream px-4 py-3 text-xs leading-relaxed text-olive-600">
                      Vaccination records are required before your first
                      booking.
                    </p>
                  )}

                  <Link
                    href={`/dashboard/pets/${pet.id}`}
                    className="mt-5 flex items-center justify-between rounded-xl bg-bone px-4 py-3 text-sm font-medium text-espresso-700 transition-colors hover:bg-cream"
                  >
                    View full profile
                    <IconArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
