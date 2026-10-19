import { NextResponse } from 'next/server';

import { emailConfigured, notificationEmail, sendEmail } from '@/lib/email';
import { siteOrigin } from '@/lib/site';
import { createServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PendingNotification = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  href: string | null;
};

/**
 * Sends the notifications that haven't been emailed yet. Called by the cron
 * in vercel.json with `Authorization: Bearer $CRON_SECRET`. It does nothing —
 * quietly — until the email provider (RESEND_API_KEY, EMAIL_FROM), the
 * service-role key and CRON_SECRET are all set.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!emailConfigured()) {
    return NextResponse.json({ skipped: 'email_not_configured' });
  }
  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ skipped: 'no_service_role_key' });

  const since = new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('notifications') as any)
    .select('id, user_id, title, body, href')
    .is('emailed_at', null)
    .is('read_at', null)
    .gte('created_at', since)
    .order('created_at', { ascending: true })
    .limit(100);
  const pending = (data ?? []) as PendingNotification[];
  if (pending.length === 0) return NextResponse.json({ sent: 0 });

  const userIds = [...new Set(pending.map((row) => row.user_id))];
  const { data: profiles } = await supabase.from('profiles').select('id, email').in('id', userIds);
  const emailById = new Map(
    (profiles ?? []).map((row) => [row.id as string, row.email as string | null])
  );

  const origin = await siteOrigin();
  let sent = 0;
  for (const row of pending) {
    const to = emailById.get(row.user_id);
    let delivered = false;
    if (to) {
      const message = notificationEmail({
        title: row.title,
        body: row.body,
        link: row.href ? `${origin}${row.href}` : null,
      });
      delivered = (await sendEmail({ to, ...message })).ok;
    } else {
      // Nobody to write to: don't try again.
      delivered = true;
    }
    if (delivered) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('notifications') as any)
        .update({ emailed_at: new Date().toISOString() })
        .eq('id', row.id);
      if (to) sent += 1;
    }
  }

  return NextResponse.json({ sent });
}
