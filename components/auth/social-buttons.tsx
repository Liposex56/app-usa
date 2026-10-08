'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { oauthSignInAction, type AuthState } from '@/app/(auth)/actions';
import { FormError } from '@/components/ui/field';

const INITIAL: AuthState = { error: null };

const BASE =
  'flex h-12 w-full items-center justify-center gap-3 rounded-lg px-4 text-[15px] font-semibold ' +
  'transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60';

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden fill="currentColor">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.69.24 2.69.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path
        fill="#fff"
        d="M21.35 11.1H12v2.98h5.35c-.23 1.5-1.74 4.4-5.35 4.4-3.22 0-5.85-2.67-5.85-5.96S8.78 6.56 12 6.56c1.83 0 3.06.78 3.76 1.45l2.56-2.47C16.68 3.99 14.55 3 12 3 6.98 3 2.9 7.03 2.9 12.02S6.98 21.04 12 21.04c5.79 0 9.6-4.07 9.6-9.8 0-.66-.07-1.16-.25-1.64Z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden fill="currentColor">
      <path d="M16.37 1.43c0 1.14-.46 2.22-1.2 3-.78.83-2.05 1.47-3.08 1.39-.13-1.1.4-2.26 1.14-3.03.82-.86 2.2-1.5 3.14-1.36ZM20.5 17.1c-.55 1.27-.82 1.84-1.53 2.96-.99 1.57-2.39 3.52-4.12 3.53-1.54.02-1.94-1-4.03-.99-2.09.01-2.53 1.01-4.07.99-1.73-.02-3.05-1.78-4.04-3.35C.01 16.07-.28 10.9 1.43 8.27c1.2-1.86 3.1-2.95 4.88-2.95 1.82 0 2.96 1 4.46 1 1.46 0 2.35-1 4.45-1 1.58 0 3.26.86 4.46 2.35-3.92 2.15-3.28 7.74.82 9.43Z" />
    </svg>
  );
}

function ProviderButton({
  provider,
  className,
  children,
}: {
  provider: 'facebook' | 'google' | 'apple';
  className: string;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="provider"
      value={provider}
      disabled={pending}
      className={`${BASE} ${className}`}
    >
      {children}
    </button>
  );
}

/** "Continue with Facebook / Google / Apple" — the quick way in, ahead of the email form. */
export function SocialButtons() {
  const [state, formAction] = useActionState(oauthSignInAction, INITIAL);

  return (
    <form action={formAction} className="space-y-3">
      <FormError message={state.error} />
      <ProviderButton provider="facebook" className="bg-[#4267B2] text-white">
        <FacebookIcon />
        Continue with Facebook
      </ProviderButton>
      <ProviderButton provider="google" className="bg-[#1A73E8] text-white">
        <GoogleIcon />
        Continue with Google
      </ProviderButton>
      <ProviderButton provider="apple" className="bg-black text-white">
        <AppleIcon />
        Continue with Apple
      </ProviderButton>
    </form>
  );
}
