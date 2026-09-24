'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';
import type { MessageRow } from '@/lib/database.types';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

import type { SendMessageState } from '../actions';

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Sending…' : 'Send'}
    </Button>
  );
}

export function Chat({
  bookingId,
  viewerId,
  initialMessages,
  sendAction,
  counterpartyName,
  counterpartyAvatarUrl,
}: {
  bookingId: string;
  viewerId: string;
  initialMessages: MessageRow[];
  sendAction: (formData: FormData) => Promise<SendMessageState>;
  counterpartyName: string;
  counterpartyAvatarUrl: string | null;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [sendError, setSendError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function start() {
      // The realtime socket authorizes postgres_changes per-connection using
      // whatever JWT it was given. supabase-js propagates the signed-in
      // user's token to it asynchronously (via onAuthStateChange), which
      // loses a race against channel.subscribe() firing immediately after
      // createClient() — the channel would join authenticated as anon, and
      // RLS would then silently drop every row for both participants. Wait
      // for the real session and hand its token to realtime explicitly
      // before subscribing, so the join always carries the right identity.
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        supabase.realtime.setAuth(data.session.access_token);
      }

      channel = supabase
        .channel(`booking-messages-${bookingId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `booking_id=eq.${bookingId}`,
          },
          (payload) => {
            const row = payload.new as MessageRow;
            // Our own messages are already added the moment sendAction
            // confirms them — only messages from the other side arrive here.
            if (row.sender_id === viewerId) return;
            setMessages((current) =>
              current.some((m) => m.id === row.id) ? current : [...current, row]
            );
          }
        )
        .subscribe();
    }

    start();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [bookingId, viewerId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  async function handleSubmit(formData: FormData) {
    setSendError(null);
    const result = await sendAction(formData);
    if (result.error) {
      setSendError(result.error);
      return;
    }
    if (result.message) {
      setMessages((current) => [...current, result.message as MessageRow]);
    }
    formRef.current?.reset();
  }

  return (
    <div className="rounded-3xl border border-espresso-700/8 bg-white shadow-card">
      <div className="flex items-center gap-2.5 border-b border-espresso-700/8 px-5 py-3">
        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-sky-100">
          {counterpartyAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={counterpartyAvatarUrl}
              alt={counterpartyName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-medium text-espresso-500">
              {counterpartyName.slice(0, 1)}
            </div>
          )}
        </div>
        <p className="text-sm font-medium text-espresso-700">{counterpartyName}</p>
      </div>
      <div
        ref={listRef}
        className="max-h-96 min-h-[10rem] space-y-3 overflow-y-auto p-5"
      >
        {messages.length === 0 ? (
          <p className="text-center text-sm text-espresso-500">
            No messages yet — say hello.
          </p>
        ) : (
          messages.map((message, index) => {
            const mine = message.sender_id === viewerId;
            // Only show the avatar on the last bubble of a consecutive run
            // from the other person — same "grouped" pattern as
            // Instagram/Messenger, instead of repeating it on every bubble.
            const nextIsSameSender = messages[index + 1]?.sender_id === message.sender_id;
            const showAvatar = !mine && !nextIsSameSender;

            return (
              <div
                key={message.id}
                className={cn(
                  'flex items-end gap-2',
                  mine ? 'justify-end' : 'justify-start'
                )}
              >
                {!mine && (
                  <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-sky-100">
                    {showAvatar &&
                      (counterpartyAvatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={counterpartyAvatarUrl}
                          alt={counterpartyName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-espresso-500">
                          {counterpartyName.slice(0, 1)}
                        </div>
                      ))}
                  </div>
                )}
                <p
                  className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-2 text-sm leading-relaxed',
                    mine
                      ? 'bg-gold-500 text-white'
                      : 'bg-bone text-espresso-700'
                  )}
                >
                  {message.body}
                </p>
              </div>
            );
          })
        )}
      </div>
      {sendError && (
        <p className="border-t border-espresso-700/8 bg-red-50 px-4 py-2 text-xs text-red-800">
          {sendError}
        </p>
      )}
      <form
        ref={formRef}
        action={handleSubmit}
        className="flex items-center gap-2 border-t border-espresso-700/8 p-3"
      >
        <input
          type="text"
          name="body"
          required
          maxLength={4000}
          placeholder="Message…"
          className="flex-1 rounded-full border border-espresso-700/15 px-4 py-2 text-sm text-espresso-700 placeholder:text-espresso-700/35 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/25"
        />
        <SendButton />
      </form>
    </div>
  );
}
