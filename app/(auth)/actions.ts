'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

export type AuthState = { error: string | null };

const signUpSchema = z.object({
  firstName: z.string().trim().min(1, 'Please enter your first name.'),
  lastName: z.string().trim().min(1, 'Please enter your last name.'),
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z
    .string()
    .min(8, 'Your password needs at least 8 characters.')
    .max(72, 'Passwords can be at most 72 characters.'),
  role: z.enum(['owner', 'havener']).default('owner'),
  ref: z.string().trim().max(40).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Please enter your password.'),
});

/** Where Supabase should send the user back to after they confirm their email. */
async function siteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, '');

  const headerList = await headers();
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host');
  const proto = headerList.get('x-forwarded-proto') ?? 'http';
  return host ? `${proto}://${host}` : 'http://localhost:3000';
}

export async function signUpAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role') ?? 'owner',
    ref: formData.get('ref') ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please check the form.' };
  }

  const { firstName, lastName, email, password, role, ref } = parsed.data;
  const supabase = await createClient();
  const origin = await siteOrigin();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
      data: {
        first_name: firstName,
        last_name: lastName,
        intended_role: role,
        ...(ref ? { referral_code: ref } : {}),
      },
    },
  });

  if (error) return { error: error.message };

  // With email confirmation enabled, there is no session yet.
  if (!data.session) {
    redirect(`/signup/check-email?email=${encodeURIComponent(email)}`);
  }

  revalidatePath('/', 'layout');
  redirect('/onboarding');
}

const OAUTH_PROVIDERS = ['google', 'facebook', 'apple'] as const;
type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

const PROVIDER_NAMES: Record<OAuthProvider, string> = {
  google: 'Google',
  facebook: 'Facebook',
  apple: 'Apple',
};

/**
 * "Continue with Google / Facebook / Apple". Each provider has to be turned
 * on in Supabase (Authentication → Providers) with credentials from that
 * provider; until it is, the user gets a plain message and can use email.
 * Whoever comes back lands on /dashboard, which routes brand-new accounts
 * into onboarding (role first) and finished ones straight in.
 */
export async function oauthSignInAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const provider = formData.get('provider');
  if (typeof provider !== 'string' || !OAUTH_PROVIDERS.includes(provider as OAuthProvider)) {
    return { error: 'Please choose a sign-in option.' };
  }

  const supabase = await createClient();
  const origin = await siteOrigin();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as OAuthProvider,
    options: { redirectTo: `${origin}/auth/callback?next=/dashboard` },
  });

  if (error || !data.url) {
    return {
      error: `Signing in with ${PROVIDER_NAMES[provider as OAuthProvider]} isn’t available yet — please use your email for now.`,
    };
  }

  redirect(data.url);
}

export async function loginAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please check the form.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Don't leak whether the address exists.
    return { error: 'That email and password don’t match. Please try again.' };
  }

  const nextParam = formData.get('next');
  const next =
    typeof nextParam === 'string' && nextParam.startsWith('/')
      ? nextParam
      : '/dashboard';

  revalidatePath('/', 'layout');
  redirect(next);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}
