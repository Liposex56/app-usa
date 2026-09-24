'use client';

import { useTransition } from 'react';

import { Button } from '@/components/ui/button';

import { unblockDatesAction } from './actions';

export function UnblockButton({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      disabled={isPending}
      onClick={() =>
        startTransition(() => {
          void unblockDatesAction(startDate, endDate);
        })
      }
    >
      Quitar bloqueo
    </Button>
  );
}
