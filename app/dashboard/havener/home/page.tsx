import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { requireProfile } from '@/lib/auth';
import { HOME_MEDIA_BUCKET, homeMediaKind } from '@/lib/home-media';
import { createClient } from '@/lib/supabase/server';

import { HomeMediaManager, type HomeMediaFile } from './home-media-manager';

export const metadata: Metadata = { title: 'Your home' };

export default async function HavenerHomeMediaPage() {
  const profile = await requireProfile();
  if (!profile.is_havener) redirect('/dashboard');

  const supabase = await createClient();
  const { data } = await supabase.storage
    .from(HOME_MEDIA_BUCKET)
    .list(`${profile.id}/home`, { limit: 24, sortBy: { column: 'created_at', order: 'asc' } });

  const files: HomeMediaFile[] = (data ?? [])
    .filter((file) => file.name && !file.name.startsWith('.'))
    .map((file) => ({
      name: file.name,
      kind: homeMediaKind(file.name),
      url: supabase.storage
        .from(HOME_MEDIA_BUCKET)
        .getPublicUrl(`${profile.id}/home/${file.name}`).data.publicUrl,
    }));

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/havener"
        className="text-sm text-espresso-500 hover:text-espresso-700"
      >
        ← Back to Havener profile
      </Link>

      <h1 className="mt-6 text-3xl">Meet the home</h1>
      <p className="mt-2 mb-8 text-[15px] text-espresso-500">
        If you offer boarding or daycare, owners want to see where their pet
        will stay. Add photos and a short video — they show on your public
        profile.
      </p>

      <HomeMediaManager userId={profile.id} initial={files} />
    </div>
  );
}
