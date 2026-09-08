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
}: {
  bookingId: string;
  viewerId: string;
  initialMessages: MessageRow[];
  sendAction: (formData: FormData) => Promise<SendMessageState>;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [sendError, setSendError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const supabase = createClient();
    // eslint-disable-next-line no-console
    console.log('[chat-debug] mounting channel for booking', bookingId, 'viewer', viewerId);
    const channel = supabase
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
          // eslint-disable-next-line no-console
          console.log('[chat-debug] postgres_changes payload', payload);
          const row = payload.new as MessageRow;
          // Our own messages are already added the moment sendAction
          // confirms them — only messages from the other side arrive here.
          if (row.sender_id === viewerId) return;
          setMessages((current) =>
            current.some((m) => m.id === row.id) ? current : [...current, row]
          );
        }
      )
      .subscribe((status, err) => {
        // eslint-disable-next-line no-console
        console.log('[chat-debug] subscribe status', status, err);
      });

    return () => {
      // eslint-disable-next-line no-console
      console.log('[chat-debug] unmounting channel for booking', bookingId);
      supabase.removeChannel(channel);
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
      <div
        ref={listRef}
        className="max-h-96 min-h-[10rem] space-y-3 overflow-y-auto p-5"
      >
        {messages.length === 0 ? (
          <p className="text-center text-sm text-espresso-500">
            No messages yet — say hello.
          </p>
        ) : (
          messages.map((message) => {
            const mine = message.sender_id === viewerId;
            return (
              <div
                key={message.id}
                className={cn('flex', mine ? 'justify-end' : 'justify-start')}
              >
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
