'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { bool, text } from '@/lib/utils';

export type AccountState = { error: string | null; saved: boolean };

/** Update the person's own contact details. Roles and onboarding are untouched. */
export async function saveAccountAction(
  _prev: AccountState,
  formData: FormData
): Promise<AccountState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const firstName = text(formData, 'firstName');
  const lastName = text(formData, 'lastName');
  if (!firstName || !lastName) {
    return { error: 'Please enter your first and last name.', saved: false };
  }

  const state = text(formData, 'state');
  if (state && !/^[A-Za-z]{2}$/.test(state)) {
    return { error: 'Use the two-letter state code, like MA.', saved: false };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('profiles') as any)
    .update({
      first_name: firstName,
      last_name: lastName,
      display_name: text(formData, 'displayName') ?? `${firstName} ${lastName}`,
      phone: text(formData, 'phone'),
      address_line1: text(formData, 'addressLine1'),
      address_line2: text(formData, 'addressLine2'),
      city: text(formData, 'city'),
      state: state ? state.toUpperCase() : null,
      postal_code: text(formData, 'postalCode'),
      emergency_contact_name: text(formData, 'emergencyName'),
      emergency_contact_phone: text(formData, 'emergencyPhone'),
      marketing_opt_in: bool(formData, 'marketingOptIn'),
    })
    .eq('id', user.id);

  if (error) return { error: error.message, saved: false };

  revalidatePath('/dashboard', 'layout');
  return { error: null, saved: true };
}
