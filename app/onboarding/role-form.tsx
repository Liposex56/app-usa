'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { OnboardingHeading, Steps } from '@/components/onboarding/steps';
import { Button } from '@/components/ui/button';
import { FormError, RadioCard } from '@/components/ui/field';

import { selectRoleAction, type ActionState } from './actions';

const INITIAL: ActionState = { error: null };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? 'Saving…' : 'Continue'}
    </Button>
  );
}

export function RoleForm({ firstName }: { firstName: string | null }) {
  const [state, formAction] = useActionState(selectRoleAction, INITIAL);

  return (
    <div>
      <Steps current="role" sequence={['role', 'owner_profile', 'pet']} />

      <OnboardingHeading
        title={firstName ? `Welcome, ${firstName}` : 'Welcome to Havenr'}
        description="First, tell us how you plan to use Havenr. You can change this later — plenty of people do both."
      />

      <form action={formAction} className="space-y-6">
        <FormError message={state.error} />

        <div className="space-y-3">
          <RadioCard
            name="role"
            value="owner"
            label="I need care for my pet"
            description="Book boarding, daycare, house sitting, walks or drop-in visits."
            defaultChecked
            required
          />
          <RadioCard
            name="role"
            value="havener"
            label="I want to offer care as a Havener"
            description="Set your rates and calendar. You’ll need to pass verification before taking bookings."
          />
          <RadioCard
            name="role"
            value="both"
            label="Both"
            description="Book care for your own pets and care for others."
          />
        </div>

        <Submit />
      </form>
    </div>
  );
}
