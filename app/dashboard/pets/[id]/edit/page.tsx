import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PetForm } from '@/app/onboarding/pet/pet-form';
import type { PetRow } from '@/lib/database.types';
import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Edit pet · Havenr' };

export default async function EditPetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();

  const supabase = await createClient();
  const { data } = await supabase
    .from('pets')
    .select('*')
    .eq('id', id)
    .eq('owner_id', profile.id)
    .maybeSingle();

  if (!data) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/dashboard/pets/${id}`}
        className="text-sm text-espresso-500 hover:text-espresso-700"
      >
        ← Back to {data.name}&rsquo;s profile
      </Link>
      <div className="mt-6">
        <PetForm
          isHavener={profile.is_havener}
          hideSteps
          existing={data as PetRow}
        />
      </div>
    </div>
  );
}
