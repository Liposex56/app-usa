import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import type {
  PublicSitterReviewRow,
  PublicSitterRow,
  SitterServiceRow,
} from '@/lib/database.types';
import { HOME_MEDIA_BUCKET, homeMediaKind } from '@/lib/home-media';
import { effectiveRates } from '@/lib/pricing';
import { loadRateContext } from '@/lib/rate-context';
import { createClient } from '@/lib/supabase/server';

import { SitterProfileTabs, type HomeMediaItem } from './sitter-profile-tabs';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: sitter } = await supabase
    .from('public_sitters')
    .select('display_name')
    .eq('id', id)
    .maybeSingle();
  return {
    title: sitter?.display_name
      ? sitter.display_name
      : 'Havener profile',
  };
}

export default async function SitterProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ startDate?: string; endDate?: string; service?: string }>;
}) {
  const { id } = await params;
  const { startDate, endDate, service } = await searchParams;
  const supabase = await createClient();

  const [{ data: sitter }, { data: services }, { data: { user } }, { data: reviews }] =
    await Promise.all([
      supabase.from('public_sitters').select('*').eq('id', id).maybeSingle(),
      supabase
        .from('sitter_services')
        .select('*')
        .eq('sitter_id', id)
        .eq('is_active', true),
      supabase.auth.getUser(),
      supabase.rpc('public_sitter_reviews', { p_sitter_id: id }),
    ]);

  if (!sitter) notFound();

  // With "automatic rates" on, the extra rates shown are Havenr's percentages
  // applied to the Havener's own rate.
  const { percents } = await loadRateContext(supabase);
  const pricedServices = ((services ?? []) as SitterServiceRow[]).map((row) => {
    const rates = effectiveRates(row, percents);
    return {
      ...row,
      additional_pet_rate_cents: rates.additional,
      holiday_rate_cents: rates.holiday,
      extended_stay_rate_cents: rates.extended,
    };
  });

  // The home photos/videos live in the public `sitter-photos` bucket under
  // <havener id>/home/ — no table to keep in sync, just list the folder.
  const { data: files } = await supabase.storage
    .from(HOME_MEDIA_BUCKET)
    .list(`${id}/home`, { limit: 24, sortBy: { column: 'created_at', order: 'asc' } });
  const homeMedia: HomeMediaItem[] = (files ?? [])
    .filter((file) => file.name && !file.name.startsWith('.'))
    .map((file) => ({
      url: supabase.storage.from(HOME_MEDIA_BUCKET).getPublicUrl(`${id}/home/${file.name}`).data
        .publicUrl,
      kind: homeMediaKind(file.name),
    }));

  return (
    <SitterProfileTabs
      sitter={sitter as PublicSitterRow}
      services={pricedServices}
      isOwnProfile={user?.id === id}
      startDate={startDate}
      endDate={endDate}
      service={service}
      reviews={(reviews ?? []) as PublicSitterReviewRow[]}
      homeMedia={homeMedia}
    />
  );
}
