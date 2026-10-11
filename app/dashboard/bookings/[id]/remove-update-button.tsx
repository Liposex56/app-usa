'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { deleteServiceUpdateAction } from '../actions';

/** Lets the Havener take back a wrong entry while the service is running. */
export function RemoveUpdateButton({
  bookingId,
  updateId,
}: {
  bookingId: string;
  updateId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await deleteServiceUpdateAction(bookingId, updateId);
          router.refresh();
        })
      }
      className="text-sm font-semibold text-espresso-500 underline-offset-4 hover:text-red-700 hover:underline disabled:opacity-50"
    >
      {pending ? 'Removing…' : 'Remove'}
    </button>
  );
}
