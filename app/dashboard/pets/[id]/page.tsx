import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import type { PetRow } from '@/lib/database.types';
import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

import { PetProfileTabs } from './pet-profile-tabs';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: pet } = await supabase
    .from('pets')
    .select('name')
    .eq('id', id)
    .maybeSingle();
  return { title: pet?.name ? `${pet.name} · Havenr` : 'Pet profile · Havenr' };
}

export default async function PetProfilePage({
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
    <div>
      <Link
        href="/dashboard/pets"
        className="text-sm text-espresso-500 hover:text-espresso-700"
      >
        ← Back to my pets
      </Link>
      <div className="mt-6">
        <PetProfileTabs pet={data as PetRow} />
      </div>
    </div>
  );
}
