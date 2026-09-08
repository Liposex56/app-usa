'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';
import type { MessageRow } from '@/lib/database.types';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

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
  sendAction: (formData: FormData) => void;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const listRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const supabase = createClient();
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
          const row = payload.new as MessageRow;
          setMessages((current) =>
            current.some((m) => m.id === row.id) ? current : [...current, row]
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

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
      <form
        ref={formRef}
        action={(formData) => {
          sendAction(formData);
          formRef.current?.reset();
        }}
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
