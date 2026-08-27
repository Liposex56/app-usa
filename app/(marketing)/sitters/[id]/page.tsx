import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import type { PublicSitterRow, SitterServiceRow } from '@/lib/database.types';
import { createClient } from '@/lib/supabase/server';

import { SitterProfileTabs } from './sitter-profile-tabs';

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
      ? `${sitter.display_name} · Havenr`
      : 'Havener profile · Havenr',
  };
}

export default async function SitterProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: sitter }, { data: services }] = await Promise.all([
    supabase.from('public_sitters').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('sitter_services')
      .select('*')
      .eq('sitter_id', id)
      .eq('is_active', true),
  ]);

  if (!sitter) notFound();

  return (
    <SitterProfileTabs
      sitter={sitter as PublicSitterRow}
      services={(services ?? []) as SitterServiceRow[]}
    />
  );
}
