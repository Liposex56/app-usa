import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { IconAlert } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import type { PetRow } from '@/lib/database.types';
import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatDate, petAge } from '@/lib/utils';

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
        <div className="mt-8 space-y-4">
          {pets.map((pet) => (
            <article
              key={pet.id}
              className="rounded-3xl border border-espresso-700/8 bg-white p-7 shadow-card"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl text-espresso-700">{pet.name}</h2>
                  <p className="mt-1 text-sm text-espresso-500">
                    {[
                      pet.species === 'dog' ? 'Dog' : 'Cat',
                      pet.breed,
                      petAge(pet.birthdate),
                      pet.size,
                      pet.weight_lb ? `${pet.weight_lb} lb` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <span className="text-xs text-espresso-500/70">
                  Added {formatDate(pet.created_at)}
                </span>
              </div>

              <dl className="mt-6 grid gap-5 border-t border-espresso-700/8 pt-5 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs uppercase tracking-wider text-espresso-500/60">
                    Medications
                  </dt>
                  <dd className="mt-1 text-espresso-700">
                    {pet.medications ?? 'None'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-espresso-500/60">
                    Energy
                  </dt>
                  <dd className="mt-1 capitalize text-espresso-700">
                    {pet.energy_level ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-espresso-500/60">
                    Vaccines valid through
                  </dt>
                  <dd className="mt-1 text-espresso-700">
                    {pet.vaccinated_through
                      ? formatDate(pet.vaccinated_through)
                      : 'Not on file'}
                  </dd>
                </div>
              </dl>

              {!pet.vaccinated_through && (
                <p className="mt-5 flex items-start gap-2 rounded-xl bg-cream p-4 text-xs leading-relaxed text-olive-600">
                  <IconAlert width={15} height={15} className="mt-px shrink-0" />
                  Vaccination records are required before your first booking.
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
