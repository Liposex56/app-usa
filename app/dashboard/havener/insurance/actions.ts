'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { text } from '@/lib/utils';

export type InsuranceState = { error: string | null };

export async function saveInsuranceAction(
  _prev: InsuranceState,
  formData: FormData
): Promise<InsuranceState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const provider = text(formData, 'provider');
  const policyNumber = text(formData, 'policyNumber');
  const coverageType = text(formData, 'coverageType');
  const effectiveDate = text(formData, 'effectiveDate');
  const expiresAt = text(formData, 'expiresAt');

  if (!provider || !policyNumber || !expiresAt) {
    return {
      error: 'Indica al menos la aseguradora, el número de póliza y la fecha de vencimiento.',
    };
  }

  let documentPath: string | undefined;
  const file = formData.get('document');
  if (file instanceof File && file.size > 0) {
    const ext = file.name.split('.').pop() ?? 'pdf';
    documentPath = `${user.id}/insurance-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('verification-docs')
      .upload(documentPath, file, { upsert: false });
    if (uploadError) return { error: uploadError.message };
  }

  const { error } = await supabase.from('sitter_insurance').upsert(
    {
      sitter_id: user.id,
      provider,
      policy_number: policyNumber,
      coverage_type: coverageType,
      effective_date: effectiveDate,
      expires_at: expiresAt,
      status: 'pending',
      ...(documentPath ? { document_path: documentPath } : {}),
    },
    { onConflict: 'sitter_id' }
  );

  if (error) return { error: error.message };

  revalidatePath('/dashboard/havener/insurance');
  revalidatePath('/dashboard');
  return { error: null };
}
