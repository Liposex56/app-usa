import type { Metadata } from 'next';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { requireProfile } from '@/lib/auth';
import { dateInAppZone, timeInAppZone } from '@/lib/dates';
import type { NotificationRow } from '@/lib/database.types';
import { createClient } from '@/lib/supabase/server';
import { cn, formatDate } from '@/lib/utils';

import { markAllReadAction, openNotificationAction } from './actions';

export const metadata: Metadata = { title: 'Notifications' };

export default async function NotificationsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(60);
  const items = (data ?? []) as NotificationRow[];
  const unread = items.filter((item) => !item.read_at).length;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/dashboard" className="text-sm text-espresso-500 hover:text-espresso-700">
        ← Back to dashboard
      </Link>

      <div className="mb-6 mt-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[clamp(34px,3.4vw,46px)] leading-none">Notifications</h1>
        {unread > 0 && (
          <form action={markAllReadAction}>
            <Button type="submit" size="sm" variant="secondary">
              Mark all as read
            </Button>
          </form>
        )}
      </div>

      {items.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-espresso-700/15 bg-hv-paper p-10 text-center text-sm text-espresso-500">
          Nothing yet. New requests, messages, confirmations and reminders show
          up here.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <form action={openNotificationAction}>
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="href" value={item.href ?? ''} />
                <button
                  type="submit"
                  className={cn(
                    'flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors hover:border-hv-ink/40',
                    item.read_at
                      ? 'border-espresso-700/8 bg-hv-paper'
                      : 'border-hv-mustard/50 bg-hv-butter'
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'mt-2 h-2.5 w-2.5 shrink-0 rounded-full',
                      item.read_at ? 'bg-transparent' : 'bg-hv-mustard'
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[18px] font-semibold text-espresso-700">
                      {item.title}
                    </span>
                    {item.body && (
                      <span className="mt-0.5 block text-[16px] text-espresso-600">
                        {item.body}
                      </span>
                    )}
                    <span className="mt-1 block text-sm text-espresso-500">
                      {formatDate(dateInAppZone(item.created_at))} ·{' '}
                      {timeInAppZone(item.created_at)}
                    </span>
                  </span>
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
