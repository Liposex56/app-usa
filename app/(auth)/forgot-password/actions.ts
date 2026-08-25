'use server';

import { headers } from 'next/headers';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

export type ResetState = { error: string | null; sent: boolean };

const schema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
});

export async function requestPasswordResetAction(
  _prev: ResetState,
  formData: FormData
): Promise<ResetState> {
  const parsed = schema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Please check the form.',
      sent: false,
    };
  }

  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  let origin = configured?.replace(/\/$/, '');
  if (!origin) {
    const headerList = await headers();
    const host = headerList.get('x-forwarded-host') ?? headerList.get('host');
    const proto = headerList.get('x-forwarded-proto') ?? 'http';
    origin = host ? `${proto}://${host}` : 'http://localhost:3000';
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/account/password`,
  });

  // Always report success — telling the user whether an address exists is an
  // account-enumeration leak.
  return { error: null, sent: true };
}
