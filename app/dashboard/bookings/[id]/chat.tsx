'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';
import { CHAT_BUCKET } from '@/lib/booking-flow';
import { dateInAppZone, timeInAppZone } from '@/lib/dates';
import type { MessageRow } from '@/lib/database.types';
import { createClient } from '@/lib/supabase/client';
import { ACCEPTED_MEDIA, MAX_PHOTO_BYTES, MAX_VIDEO_BYTES } from '@/lib/service-reports';
import { cn, formatDate } from '@/lib/utils';

import type { SendMessageState } from '../actions';

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="md" disabled={pending}>
      {pending ? 'Sending…' : 'Send'}
    </Button>
  );
}

function dayLabel(iso: string): string {
  const day = dateInAppZone(iso);
  if (day === dateInAppZone(new Date())) return 'Today';
  return formatDate(day);
}

/**
 * The conversation: day separators, a timestamp under every bubble, and a
 * composer pinned to the bottom. It fills whatever height its parent gives it
 * (the booking page makes it a tall panel beside the request details).
 */
export function Chat({
  bookingId,
  viewerId,
  initialMessages,
  sendAction,
  counterpartyName,
  counterpartyAvatarUrl,
  readOnly = false,
  initialMediaUrls = {},
}: {
  bookingId: string;
  viewerId: string;
  initialMessages: MessageRow[];
  sendAction: (formData: FormData) => Promise<SendMessageState>;
  counterpartyName: string;
  counterpartyAvatarUrl: string | null;
  /** Staff reviewing a conversation can read it but not write in it. */
  readOnly?: boolean;
  /** Signed links for the photos and videos already in the conversation. */
  initialMediaUrls?: Record<string, string>;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>(initialMediaUrls);
  const [sendError, setSendError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // A photo that arrives (or that we just sent) needs a signed link to show.
  useEffect(() => {
    const missing = messages.filter((m) => m.media_path && !mediaUrls[m.id]);
    if (missing.length === 0) return;
    const supabase = createClient();
    let cancelled = false;
    (async () => {
      for (const message of missing) {
        const { data } = await supabase.storage
          .from(CHAT_BUCKET)
          .createSignedUrl(message.media_path as string, 60 * 60);
        if (cancelled || !data?.signedUrl) continue;
        setMediaUrls((current) => ({ ...current, [message.id]: data.signedUrl }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [messages, mediaUrls]);

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

    if (file) {
      if (!ACCEPTED_MEDIA.includes(file.type)) {
        setSendError('Use a JPG, PNG or WebP photo, or an MP4, MOV or WebM video.');
        return;
      }
      const isVideo = file.type.startsWith('video/');
      if (file.size > (isVideo ? MAX_VIDEO_BYTES : MAX_PHOTO_BYTES)) {
        setSendError('That file is too large — photos up to 10 MB and videos up to 50 MB.');
        return;
      }

      // Straight to the private bucket (server actions cap the request size).
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${viewerId}/${bookingId}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await createClient()
        .storage.from(CHAT_BUCKET)
        .upload(path, file, { upsert: false, contentType: file.type });
      if (uploadError) {
        setSendError(uploadError.message);
        return;
      }
      formData.set('mediaPath', path);
      formData.set('mediaType', isVideo ? 'video' : 'image');
    }

    const result = await sendAction(formData);
    if (result.error) {
      setSendError(result.error);
      return;
    }
    if (result.message) {
      setMessages((current) => [...current, result.message as MessageRow]);
    }
    formRef.current?.reset();
    setFile(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={listRef}
        className="min-h-0 flex-1 space-y-1 overflow-y-auto bg-bone/60 px-4 py-5 sm:px-6"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 py-10 text-center">
            <p className="text-lg font-semibold text-espresso-700">No messages yet</p>
            <p className="text-[17px] text-espresso-500">
              Say hello to {counterpartyName.split(' ')[0]} — questions about the
              routine, the yard or the other pets are all welcome.
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const mine = message.sender_id === viewerId;
            const previous = messages[index - 1];
            const next = messages[index + 1];
            const newDay =
              !previous || dateInAppZone(previous.created_at) !== dateInAppZone(message.created_at);
            // Same-sender runs are tucked together; the time shows on the last bubble.
            const endsRun = !next || next.sender_id !== message.sender_id ||
              dateInAppZone(next.created_at) !== dateInAppZone(message.created_at);
            const startsRun = newDay || !previous || previous.sender_id !== message.sender_id;

            return (
              <div key={message.id}>
                {newDay && (
                  <p className="mb-3 mt-4 text-center text-xs font-semibold uppercase tracking-[0.12em] text-espresso-500/70 first:mt-0">
                    {dayLabel(message.created_at)}
                  </p>
                )}
                <div
                  className={cn(
                    'flex items-end gap-2',
                    mine ? 'justify-end' : 'justify-start',
                    startsRun ? 'mt-3' : 'mt-0.5'
                  )}
                >
                  {!mine && (
                    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-sky-100">
                      {endsRun &&
                        (counterpartyAvatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={counterpartyAvatarUrl}
                            alt={counterpartyName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-espresso-500">
                            {counterpartyName.slice(0, 1)}
                          </div>
                        ))}
                    </div>
                  )}
                  <div className={cn('flex max-w-[78%] flex-col', mine ? 'items-end' : 'items-start')}>
                    <div
                      className={cn(
                        'overflow-hidden rounded-3xl text-[18px] leading-snug',
                        mine
                          ? 'rounded-br-lg bg-hv-ink text-hv-cream'
                          : 'rounded-bl-lg bg-hv-paper text-espresso-700 shadow-card'
                      )}
                    >
                      {message.media_path &&
                        (mediaUrls[message.id] ? (
                          message.media_type === 'video' ? (
                            <video
                              src={mediaUrls[message.id]}
                              controls
                              playsInline
                              preload="metadata"
                              className="max-h-72 w-full bg-espresso-700/10"
                            />
                          ) : (
                            <a href={mediaUrls[message.id]} target="_blank" rel="noopener noreferrer">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={mediaUrls[message.id]}
                                alt={message.body}
                                loading="lazy"
                                className="max-h-72 w-full object-cover"
                              />
                            </a>
                          )
                        ) : (
                          <div className="flex h-24 w-56 items-center justify-center text-sm opacity-70">
                            Loading…
                          </div>
                        ))}
                      {(!message.media_path ||
                        (message.body !== 'Photo' && message.body !== 'Video')) && (
                        <p className="whitespace-pre-line break-words px-4 py-2.5">
                          {message.body}
                        </p>
                      )}
                    </div>
                    {endsRun && (
                      <span className="mt-1 px-1 text-xs text-espresso-500/80">
                        {timeInAppZone(message.created_at)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {sendError && (
        <p className="border-t border-espresso-700/8 bg-red-50 px-5 py-2 text-sm text-red-800">
          {sendError}
        </p>
      )}

      {readOnly ? (
        <p className="border-t border-espresso-700/8 px-5 py-3 text-[17px] text-espresso-500">
          You’re reading this conversation as Havenr staff.
        </p>
      ) : (
        <form
          ref={formRef}
          action={handleSubmit}
          className="flex items-center gap-3 border-t border-espresso-700/8 bg-hv-paper p-3 sm:p-4"
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            aria-label="Attach a photo or video"
            title="Attach a photo or video"
            onClick={() => fileRef.current?.click()}
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors',
              file
                ? 'border-hv-ink bg-hv-sky text-hv-ink'
                : 'border-hv-ink/20 text-espresso-600 hover:bg-hv-sky'
            )}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m21 12-8.6 8.6a6 6 0 0 1-8.5-8.5l9-9a4 4 0 0 1 5.7 5.7l-9.1 9.1a2 2 0 0 1-2.8-2.8l8.5-8.5" />
            </svg>
          </button>
          <input
            type="text"
            name="body"
            required={!file}
            maxLength={4000}
            placeholder={
              file ? `Add a note to ${file.name} (optional)` : `Message ${counterpartyName.split(' ')[0]}…`
            }
            className="min-w-0 flex-1 rounded-full border border-hv-ink/20 bg-bone px-5 py-2.5 text-[18px] font-medium text-espresso-700 placeholder:text-espresso-700/40 focus:border-hv-ink focus:outline-none focus:ring-2 focus:ring-hv-mustard/40"
          />
          <SendButton />
        </form>
      )}
    </div>
  );
}
